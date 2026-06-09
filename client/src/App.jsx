import React, { useState, useMemo } from 'react';
import axios from 'axios';
import FileUpload from './components/FileUpload';
import OverviewTable from './components/OverviewTable';
import DetailedTable from './components/DetailedTable';
import VisualOverview from './components/VisualOverview';
import { AlertCircle, CheckCircle2, Filter, FileText, Download } from 'lucide-react';
import { generateDispatchLetter } from './utils/pdfGenerator';
import { exportToExcel } from './utils/excelGenerator';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAgency, setSelectedAgency] = useState('');

  const handleUpload = async (file) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setPayload(null);
    setStartDate('');
    setEndDate('');
    setSelectedAgency('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/reports/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setPayload(response.data.data);
        setSuccessMsg(response.data.message || 'Attendance report processed successfully');
      } else {
        setError(response.data.message || 'An error occurred.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while uploading the file.');
    } finally {
      setLoading(false);
    }
  };

  const { overviewData, detailedViewData, availableDates, availableAgencies } = useMemo(() => {
    if (!payload || !payload.data) return { overviewData: [], detailedViewData: [], availableDates: [], availableAgencies: [] };

    if (payload.type === 'summary') {
      const agencies = [...new Set(payload.data.map(item => item.agency))].sort();
      const filtered = selectedAgency ? payload.data.filter(item => item.agency === selectedAgency) : payload.data;
      return { overviewData: filtered, detailedViewData: [], availableDates: [], availableAgencies: agencies };
    }

    // payload.type === 'detailed'
    const records = payload.data;
    
    const datesSet = new Set();
    const agenciesSet = new Set();
    
    records.forEach(r => {
      agenciesSet.add(r.agency);
      if (r.attendance) {
        Object.keys(r.attendance).forEach(d => datesSet.add(d));
      }
    });

    const dates = Array.from(datesSet).sort((a, b) => parseInt(a) - parseInt(b));
    const agencies = Array.from(agenciesSet).sort();

    const overviewMap = {};
    records.forEach(r => {
      if (!overviewMap[r.agency]) {
        overviewMap[r.agency] = { agency: r.agency, total: 0, present: 0, absent: 0 };
      }
      
      overviewMap[r.agency].total += 1;

      if (startDate && endDate) {
        let pCount = 0;
        let aCount = 0;
        if (r.attendance) {
          const startIdx = dates.indexOf(startDate);
          const endIdx = dates.indexOf(endDate);
          if (startIdx !== -1 && endIdx !== -1) {
            const s = Math.min(startIdx, endIdx);
            const e = Math.max(startIdx, endIdx);
            for (let i = s; i <= e; i++) {
              const stat = r.attendance[dates[i]];
              if (stat === 'P') pCount++;
              else if (stat === 'A') aCount++;
            }
          }
        }
        overviewMap[r.agency].present += pCount;
        overviewMap[r.agency].absent += aCount;
      } else {
        if (r.attendance) {
          Object.values(r.attendance).forEach(s => {
            if (s === 'P') overviewMap[r.agency].present += 1;
            else if (s === 'A') overviewMap[r.agency].absent += 1;
          });
        }
      }
    });

    const ovData = Object.values(overviewMap);

    let detData = [];
    if (startDate || endDate || selectedAgency) {
      detData = records.filter(r => {
        if (selectedAgency && r.agency !== selectedAgency) return false;
        return true;
      }).map(r => {
        let pCount = 0, aCount = 0, oCount = 0, nuCount = 0;
        if (r.attendance) {
           let dArray = Object.keys(r.attendance);
           if (startDate && endDate) {
             const startIdx = dates.indexOf(startDate);
             const endIdx = dates.indexOf(endDate);
             if (startIdx !== -1 && endIdx !== -1) {
               const s = Math.min(startIdx, endIdx);
               const e = Math.max(startIdx, endIdx);
               dArray = dates.slice(s, e + 1);
             }
           }
           dArray.forEach(d => {
             const stat = r.attendance[d];
             if (stat === 'P') pCount++;
             else if (stat === 'A') aCount++;
             else if (stat === '(-)') nuCount++;
             else oCount++;
           });
        }
        return {
          employeeName: r.employeeName,
          agency: r.agency,
          pCount, aCount, oCount, nuCount
        };
      });
    }

    return { overviewData: ovData, detailedViewData: detData, availableDates: dates, availableAgencies: agencies };
  }, [payload, startDate, endDate, selectedAgency]);

  const handleGenerateNotice = () => {
    if (!selectedAgency || !startDate || !endDate) {
      alert("Please select an Agency and a Date Range (Start Date & End Date) to generate the notice.");
      return;
    }
    
    // Find agency in overview data
    const agencyStats = overviewData.find(a => a.agency === selectedAgency);
    if (!agencyStats) return;

    const startIdx = availableDates.indexOf(startDate);
    const endIdx = availableDates.indexOf(endDate);
    if (startIdx === -1 || endIdx === -1) return;
    
    const daysCount = Math.max(startIdx, endIdx) - Math.min(startIdx, endIdx) + 1;

    generateDispatchLetter({
      agencyName: selectedAgency,
      startDate,
      endDate,
      totalEmployees: agencyStats.total * daysCount,
      totalPresentDays: agencyStats.present,
      totalAbsentDays: agencyStats.absent
    });
  };

  return (
    <div className="h-screen bg-gray-50 overflow-hidden flex flex-col">
      {/* Top Navbar Row */}
      <div className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0 z-10 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-4">
          
          {/* Minimized Header */}
          <div className="flex-shrink-0 flex flex-col items-start mr-4">
            <h1 className="text-xl font-bold text-gray-900">
              MCF SWM Reports
            </h1>
            <p className="text-xs text-gray-500">
              Attendance overview & details
            </p>
          </div>

          {/* Controls: Upload & Filters in one row */}
          <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto flex-1 justify-end">
            
            <div className="w-full md:w-auto">
              <FileUpload onUpload={handleUpload} isLoading={loading} />
            </div>

            {payload && payload.type === 'detailed' && (
              <div className="flex items-center space-x-3 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                <div className="flex items-center text-gray-600 font-medium px-2">
                  <Filter className="w-4 h-4 mr-1 text-blue-600" />
                  <span className="text-sm">Filters</span>
                </div>
                
                <select 
                  className="block w-32 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-2 py-1.5 border bg-white"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                >
                  <option value="">Start Date</option>
                  {availableDates.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select 
                  className="block w-32 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-2 py-1.5 border bg-white"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                >
                  <option value="">End Date</option>
                  {availableDates.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select 
                  className="block w-48 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-2 py-1.5 border bg-white"
                  value={selectedAgency}
                  onChange={(e) => setSelectedAgency(e.target.value)}
                >
                  <option value="">All Agencies</option>
                  {availableAgencies.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>

                <button 
                  onClick={handleGenerateNotice}
                  disabled={!selectedAgency || !startDate || !endDate}
                  className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                  title="Select Date Range and Agency to generate Notice"
                >
                  <FileText className="w-4 h-4 mr-1.5" />
                  Notice
                </button>
                <button 
                  onClick={() => exportToExcel({ overviewData, detailedViewData, startDate, endDate, selectedAgency })}
                  className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors"
                  title="Export to Excel"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area: Split View */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Tables */}
        <div className="w-full lg:w-1/2 p-4 sm:p-6 lg:p-8 bg-gray-50 flex flex-col h-full overflow-hidden">
          {error && (
            <div className="w-full mb-6 bg-red-50 border border-red-200 p-4 rounded-lg flex items-start space-x-3 text-red-700 flex-shrink-0">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {successMsg && !error && payload && (
            <div className="w-full mb-6 bg-green-50 border border-green-200 p-4 rounded-lg flex items-start space-x-3 text-green-700 flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{successMsg}</p>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            {!selectedAgency && payload && <OverviewTable data={overviewData} />}

            {(startDate || endDate || selectedAgency) && payload && payload.type === 'detailed' && (
              <DetailedTable data={detailedViewData} startDate={startDate} endDate={endDate} />
            )}
          </div>
        </div>

        {/* Right Side: Visualizations */}
        <div className="hidden lg:block w-1/2 bg-white">
          <VisualOverview 
            payload={payload} 
            startDate={startDate}
            endDate={endDate}
            selectedAgency={selectedAgency}
            overviewData={overviewData}
            detailedViewData={detailedViewData}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
