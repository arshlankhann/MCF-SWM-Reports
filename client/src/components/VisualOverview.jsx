import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';

const COLORS = {
  P: '#22c55e', // green-500
  A: '#ef4444', // red-500
  ML: '#eab308', // yellow-500
  CL: '#f59e0b', // amber-500
  EL: '#d97706', // amber-600
  CO: '#3b82f6', // blue-500
  WO: '#6366f1', // indigo-500
  H: '#8b5cf6', // violet-500
  '(-)': '#9ca3af', // gray-400
  Unknown: '#d1d5db' // gray-300
};

export default function VisualOverview({ payload, startDate, endDate, selectedAgency, overviewData, detailedViewData }) {
  
  const { pieData, barData } = useMemo(() => {
    if (!payload) return { pieData: [], barData: [] };

    let pData = [];
    let bData = [];

    // If no specific filters applied (or pivot table), use overviewData
    if (!startDate && !endDate && !selectedAgency) {
      let totalP = 0;
      let totalA = 0;
      overviewData.forEach(d => {
        totalP += d.present;
        totalA += d.absent;
      });
      pData = [
        { name: 'Present', value: totalP, color: COLORS.P },
        { name: 'Absent', value: totalA, color: COLORS.A }
      ];

      // Bar data: top 10 agencies by total employees
      bData = [...overviewData].sort((a, b) => b.total - a.total).slice(0, 10).map(d => ({
        name: d.agency.length > 15 ? d.agency.substring(0, 15) + '...' : d.agency,
        Present: d.present,
        Absent: d.absent
      }));
    } else {
      // Detailed view filters applied
      let totalP = 0, totalA = 0, totalO = 0, totalNU = 0;
      detailedViewData.forEach(d => {
        totalP += d.pCount || 0;
        totalA += d.aCount || 0;
        totalO += d.oCount || 0;
        totalNU += d.nuCount || 0;
      });

      pData = [
        { name: 'P', value: totalP, color: COLORS.P },
        { name: 'A', value: totalA, color: COLORS.A },
        { name: 'Other', value: totalO, color: COLORS.H },
        { name: 'Not Updated', value: totalNU, color: COLORS['(-)'] }
      ];

      // Bar data: if filtered by date but not agency, show agency-wise status for that date
      if ((startDate || endDate) && !selectedAgency) {
        const agencyMap = {};
        detailedViewData.forEach(d => {
          if (!agencyMap[d.agency]) {
            agencyMap[d.agency] = { name: d.agency.length > 15 ? d.agency.substring(0, 15) + '...' : d.agency, P: 0, A: 0, Other: 0, NU: 0 };
          }
          agencyMap[d.agency].P += d.pCount || 0;
          agencyMap[d.agency].A += d.aCount || 0;
          agencyMap[d.agency].Other += d.oCount || 0;
          agencyMap[d.agency].NU += d.nuCount || 0;
        });
        bData = Object.values(agencyMap).sort((a, b) => (b.P + b.A + b.NU) - (a.P + a.A + a.NU)).slice(0, 10);
      }
    }

    return { pieData: pData.filter(d => d.value > 0), barData: bData };
  }, [payload, startDate, endDate, selectedAgency, overviewData, detailedViewData]);

  if (!payload) return null;

  return (
    <div className="h-full w-full flex flex-col p-6 bg-gray-50 border-l border-gray-200 overflow-hidden">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex-shrink-0">Visual Overview</h2>
      
      {/* Pie Chart Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 flex-1 min-h-0 flex flex-col">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 text-center flex-shrink-0">Status Distribution</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="70%"
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '10px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart Section */}
      {barData.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-1 min-h-0 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 text-center flex-shrink-0">
            {(!startDate && !endDate && !selectedAgency) ? 'Top 10 Agencies' : 'Agency Status Breakdown'}
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{fontSize: 10}} interval={0} />
                <YAxis tick={{fontSize: 11}} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '10px' }}/>
                {(!startDate && !endDate && !selectedAgency) ? (
                  <>
                    <Bar dataKey="Present" stackId="a" fill={COLORS.P} />
                    <Bar dataKey="Absent" stackId="a" fill={COLORS.A} />
                  </>
                ) : (
                  <>
                    <Bar dataKey="P" stackId="a" fill={COLORS.P} name="Present" />
                    <Bar dataKey="A" stackId="a" fill={COLORS.A} name="Absent" />
                    <Bar dataKey="Other" stackId="a" fill={COLORS.H} name="Leaves/Other" />
                    <Bar dataKey="NU" stackId="a" fill={COLORS['(-)']} name="Not Updated (-)" />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
