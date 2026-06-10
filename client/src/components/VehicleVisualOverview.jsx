import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';
import { Truck } from 'lucide-react';

const COLORS = {
  P: '#22c55e',    // green-500
  A: '#ef4444',    // red-500
  '(-)': '#9ca3af' // gray-400
};

export default function VehicleVisualOverview({ vehiclePayload, selectedVehicleType = '', selectedVehicleAgency = '' }) {
  const { pieData, barData, summaryStats, vehicleTypeData } = useMemo(() => {
    if (!vehiclePayload || !vehiclePayload.data) {
      return { pieData: [], barData: [], summaryStats: null, vehicleTypeData: [] };
    }

    // Apply filters
    let records = vehiclePayload.data;
    if (selectedVehicleAgency) {
      records = records.filter(v => String(v.agency || '').toLowerCase().trim() === selectedVehicleAgency.toLowerCase().trim());
    }
    if (selectedVehicleType) {
      records = records.filter(v => String(v.vehicleType || '').toLowerCase().trim() === selectedVehicleType.toLowerCase().trim());
    }

    // Agency-wise totals
    const agencyMap = {};
    let grandPresent = 0;
    let grandAbsent = 0;
    let grandNU = 0;

    records.forEach(v => {
      if (!agencyMap[v.agency]) {
        agencyMap[v.agency] = { name: v.agency, total: 0, present: 0, absent: 0, nu: 0 };
      }
      agencyMap[v.agency].total += 1;

      if (v.attendance) {
        Object.values(v.attendance).forEach(s => {
          if (s === 'P') {
            agencyMap[v.agency].present += 1;
            grandPresent++;
          } else if (s === 'A') {
            agencyMap[v.agency].absent += 1;
            grandAbsent++;
          } else {
            agencyMap[v.agency].nu += 1;
            grandNU++;
          }
        });
      }
    });

    const totalVehicles = records.length;
    const totalAgencies = Object.keys(agencyMap).length;

    const pData = [
      { name: 'Present / Deployed', value: grandPresent, color: COLORS.P },
      { name: 'Absent', value: grandAbsent, color: COLORS.A },
      { name: 'Not Marked (-)', value: grandNU, color: COLORS['(-)'] }
    ].filter(d => d.value > 0);

    // Top agencies by vehicle count
    const bData = Object.values(agencyMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(d => ({
        name: d.name.length > 14 ? d.name.substring(0, 14) + '…' : d.name,
        Present: d.present,
        Absent: d.absent,
        'Not Marked': d.nu,
        Total: d.total
      }));

    // Vehicle type breakdown
    const typeMap = {};
    records.forEach(v => {
      const t = v.vehicleType || 'Unknown';
      typeMap[t] = (typeMap[t] || 0) + 1;
    });
    const vehicleTypeData = Object.entries(typeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));

    return {
      pieData: pData,
      barData: bData,
      vehicleTypeData,
      summaryStats: { totalVehicles, totalAgencies, grandPresent, grandAbsent }
    };
  }, [vehiclePayload, selectedVehicleType, selectedVehicleAgency]);

  if (!vehiclePayload) return null;

  return (
    <div className="h-full w-full flex flex-col p-6 bg-gray-50 border-l border-gray-200 overflow-y-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex-shrink-0 flex items-center gap-2">
        <Truck className="w-5 h-5 text-blue-600" />
        Vehicle Visual Overview
      </h2>

      {/* Summary Cards */}
      {summaryStats && (
        <div className="grid grid-cols-2 gap-3 mb-4 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{summaryStats.totalVehicles}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium uppercase tracking-wide">Total Vehicles</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-center">
            <p className="text-2xl font-bold text-gray-700">{summaryStats.totalAgencies}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium uppercase tracking-wide">Total Agencies</p>
          </div>
          <div className="bg-white rounded-xl border border-green-100 shadow-sm px-4 py-3 text-center">
            <p className="text-2xl font-bold text-green-600">{summaryStats.grandPresent}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium uppercase tracking-wide">Vehicle-Days Present</p>
          </div>
          <div className="bg-white rounded-xl border border-red-100 shadow-sm px-4 py-3 text-center">
            <p className="text-2xl font-bold text-red-500">{summaryStats.grandAbsent}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium uppercase tracking-wide">Vehicle-Days Absent</p>
          </div>
        </div>
      )}

      {/* Vehicle Type Breakdown */}
      {vehicleTypeData && vehicleTypeData.length > 0 && (
        <div className="bg-white rounded-xl border border-indigo-100 shadow-sm px-4 py-3 mb-4 flex-shrink-0">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Vehicle Type Breakdown</p>
          <div className="flex flex-wrap gap-2">
            {vehicleTypeData.map(({ type, count }) => (
              <div key={type} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5">
                <Truck className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-indigo-800">{type}</span>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-100 rounded-full px-1.5 py-0.5 ml-1">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pie Chart */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 h-[380px] flex-shrink-0 flex flex-col">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 text-center flex-shrink-0">
          Deployment Status Distribution
        </h3>
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
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      {barData.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-[380px] flex-shrink-0 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 text-center flex-shrink-0">
            Top Agencies — Vehicle Count
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-40} textAnchor="end" height={60} tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '8px' }} />
                <Bar dataKey="Present" stackId="a" fill={COLORS.P} name="Present" />
                <Bar dataKey="Absent" stackId="a" fill={COLORS.A} name="Absent" />
                <Bar dataKey="Not Marked" stackId="a" fill={COLORS['(-)']} name="Not Marked" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
