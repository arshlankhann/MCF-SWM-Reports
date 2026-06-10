import React, { useMemo, useState } from 'react';
import { Truck, Users, ChevronDown, ChevronUp, AlertCircle, Filter } from 'lucide-react';


function normalize(str) {
  return String(str || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export default function CombinedView({ vehiclePayload, manpowerPayload, selectedVehicleType = '', selectedVehicleAgency = '' }) {
  const [expandedAgency, setExpandedAgency] = useState(null);

  const combinedData = useMemo(() => {
    if (!vehiclePayload || !vehiclePayload.data) return [];

    // Apply agency + type filters to raw records
    let vehicleRecords = vehiclePayload.data;
    if (selectedVehicleAgency) {
      vehicleRecords = vehicleRecords.filter(v => normalize(v.agency) === normalize(selectedVehicleAgency));
    }
    if (selectedVehicleType) {
      vehicleRecords = vehicleRecords.filter(v => normalize(v.vehicleType) === normalize(selectedVehicleType));
    }

    // Build agency-wise vehicle map
    const vehicleAgencyMap = {};
    vehicleRecords.forEach(v => {
      const key = normalize(v.agency);
      if (!vehicleAgencyMap[key]) {
        vehicleAgencyMap[key] = {
          agencyDisplayName: v.agency,
          vehicles: [],
          vehicleDates: new Set()
        };
      }
      vehicleAgencyMap[key].vehicles.push(v);
      if (v.attendance) {
        Object.keys(v.attendance).forEach(d => vehicleAgencyMap[key].vehicleDates.add(d));
      }
    });

    // Build manpower agency map if available
    const manpowerAgencyMap = {};
    if (manpowerPayload && manpowerPayload.data && manpowerPayload.type === 'detailed') {
      manpowerPayload.data.forEach(m => {
        const key = normalize(m.agency);
        if (!manpowerAgencyMap[key]) {
          manpowerAgencyMap[key] = {
            agencyDisplayName: m.agency,
            employees: [],
            totalPresent: 0,
            totalAbsent: 0,
            totalOther: 0,
            totalNU: 0
          };
        }
        manpowerAgencyMap[key].employees.push(m);
        if (m.attendance) {
          Object.values(m.attendance).forEach(s => {
            if (s === 'P') manpowerAgencyMap[key].totalPresent++;
            else if (s === 'A') manpowerAgencyMap[key].totalAbsent++;
            else if (s === '(-)') manpowerAgencyMap[key].totalNU++;
            else manpowerAgencyMap[key].totalOther++;
          });
        }
      });
    }

    // Combine by agency key
    return Object.keys(vehicleAgencyMap).map(key => {
      const vData = vehicleAgencyMap[key];
      const mData = manpowerAgencyMap[key] || null;

      // Vehicle stats
      const totalVehicles = vData.vehicles.length;
      let vehiclePresent = 0, vehicleAbsent = 0;
      vData.vehicles.forEach(v => {
        if (v.attendance) {
          Object.values(v.attendance).forEach(s => {
            if (s === 'P') vehiclePresent++;
            else if (s === 'A') vehicleAbsent++;
          });
        }
      });

      // Distinct vehicle types for this agency
      const vehicleTypes = [...new Set(
        vData.vehicles.map(v => v.vehicleType).filter(Boolean)
      )].sort();

      // Count per vehicle type
      const typeCounts = {};
      vData.vehicles.forEach(v => {
        const type = v.vehicleType || 'Unknown';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      const vehicleTypeCounts = Object.entries(typeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => a.type.localeCompare(b.type));

      const dates = Array.from(vData.vehicleDates).sort((a, b) => parseInt(a) - parseInt(b));

      return {
        agencyKey: key,
        agencyName: vData.agencyDisplayName,
        // Vehicle info
        totalVehicles,
        vehiclePresent,
        vehicleAbsent,
        vehicleRecords: vData.vehicles,
        vehicleDates: dates,
        vehicleTypes,
        vehicleTypeCounts,
        // Manpower info
        hasManpower: !!mData,
        totalEmployees: mData ? mData.employees.length : 0,
        manpowerPresent: mData ? mData.totalPresent : 0,
        manpowerAbsent: mData ? mData.totalAbsent : 0,
        manpowerOther: mData ? mData.totalOther : 0,
        manpowerNU: mData ? mData.totalNU : 0,
      };
    }).sort((a, b) => a.agencyName.localeCompare(b.agencyName));
  }, [vehiclePayload, manpowerPayload, selectedVehicleType, selectedVehicleAgency]);

  if (!vehiclePayload) return null;

  const matchedCount = combinedData.filter(d => d.hasManpower).length;
  const unmatchedCount = combinedData.filter(d => !d.hasManpower).length;
  const isFiltered = selectedVehicleAgency || selectedVehicleType;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-white z-20">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            {manpowerPayload ? 'Vehicle + Manpower Combined View' : 'Vehicle Report'}
          </h2>
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1">
              <Truck className="w-3 h-3" /> {combinedData.length} {isFiltered ? 'Filtered' : ''} Agencies
            </span>
            {manpowerPayload && (
              <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                matchedCount > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <Users className="w-3 h-3" /> {matchedCount} Matched
              </span>
            )}
            {unmatchedCount > 0 && manpowerPayload && (
              <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {unmatchedCount} No Manpower Data
              </span>
            )}
          </div>
        </div>
        {!manpowerPayload && (
          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Please upload the Manpower Attendance file to view the combined report.
          </p>
        )}
        {isFiltered && (
          <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Filtered by: {selectedVehicleAgency && <strong>{selectedVehicleAgency}</strong>}
            {selectedVehicleAgency && selectedVehicleType && ' · '}
            {selectedVehicleType && <strong>{selectedVehicleType}</strong>}
          </p>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-8"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Agency Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                Vehicle Type(s)
              </th>
              {/* Vehicle columns */}
              <th className="px-3 py-3 text-center text-xs font-semibold text-blue-600 uppercase tracking-wider border-l border-blue-100">
                <div className="flex items-center justify-center gap-1">
                  <Truck className="w-3 h-3" /> Total Vehicles
                </div>
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-green-600 uppercase tracking-wider">
                Vehicle Present
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-red-600 uppercase tracking-wider">
                Vehicle Absent
              </th>
              {/* Manpower columns */}
              {manpowerPayload && (
                <>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-purple-600 uppercase tracking-wider border-l border-purple-100">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="w-3 h-3" /> Total Staff
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-green-600 uppercase tracking-wider">
                    Staff Present
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-red-600 uppercase tracking-wider">
                    Staff Absent
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Other / Leave
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {combinedData.map((row) => (
              <React.Fragment key={row.agencyKey}>
                <tr
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                    expandedAgency === row.agencyKey ? 'bg-blue-50' : ''
                  } ${!row.hasManpower && manpowerPayload ? 'opacity-70' : ''}`}
                  onClick={() => setExpandedAgency(expandedAgency === row.agencyKey ? null : row.agencyKey)}
                >
                  <td className="px-4 py-3 text-center text-gray-400">
                    {expandedAgency === row.agencyKey
                      ? <ChevronUp className="w-4 h-4 mx-auto" />
                      : <ChevronDown className="w-4 h-4 mx-auto" />
                    }
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {row.agencyName}
                      {!row.hasManpower && manpowerPayload && (
                        <span className="text-xs text-amber-500 font-normal">(no manpower match)</span>
                      )}
                    </div>
                  </td>
                  {/* Vehicle Types badges */}
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {row.vehicleTypeCounts && row.vehicleTypeCounts.length > 0
                        ? row.vehicleTypeCounts.map(({ type, count }) => (
                            <span key={type} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap gap-1">
                              <span>{type}</span>
                              <span className="bg-indigo-200 text-indigo-900 px-1 py-0.2 rounded text-[10px] font-bold">
                                {count}
                              </span>
                            </span>
                          ))
                        : <span className="text-xs text-gray-400">—</span>
                      }
                    </div>
                  </td>
                  {/* Vehicle stats */}
                  <td className="px-3 py-3 text-center border-l border-blue-50">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                      {row.totalVehicles}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      {row.vehiclePresent}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                      {row.vehicleAbsent}
                    </span>
                  </td>
                  {/* Manpower stats */}
                  {manpowerPayload && (
                    <>
                      <td className="px-3 py-3 text-center border-l border-purple-50">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                          {row.hasManpower ? row.totalEmployees : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                          {row.hasManpower ? row.manpowerPresent : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                          {row.hasManpower ? row.manpowerAbsent : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                          {row.hasManpower ? row.manpowerOther : '—'}
                        </span>
                      </td>
                    </>
                  )}
                </tr>

                {/* Expanded: Vehicle-wise breakdown */}
                {expandedAgency === row.agencyKey && (
                  <tr>
                    <td colSpan={manpowerPayload ? 10 : 6} className="px-0 py-0 bg-gray-50">
                      <div className="px-8 py-4">
                        <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          Vehicle-wise Attendance — {row.agencyName}
                          {selectedVehicleType && (
                            <span className="text-xs font-normal text-gray-500 ml-1">({selectedVehicleType})</span>
                          )}
                        </h4>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="min-w-full text-xs">
                            <thead className="bg-blue-50">
                              <tr>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600">Vehicle No.</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600">Vehicle Type</th>
                                {row.vehicleDates.map(d => (
                                  <th key={d} className="px-2 py-2 text-center font-semibold text-gray-600 w-8">{d}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {row.vehicleRecords.map((v, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 font-medium text-gray-800">{v.vehicleNo || '—'}</td>
                                  <td className="px-3 py-2 text-gray-500">{v.vehicleType || '—'}</td>
                                  {row.vehicleDates.map(d => {
                                    const status = v.attendance?.[d];
                                    let cls = 'bg-gray-100 text-gray-500';
                                    if (status === 'P') cls = 'bg-green-100 text-green-700 font-semibold';
                                    else if (status === 'A') cls = 'bg-red-100 text-red-700 font-semibold';
                                    return (
                                      <td key={d} className="px-2 py-2 text-center">
                                        <span className={`inline-block rounded px-1 py-0.5 text-xs ${cls}`}>
                                          {status || '—'}
                                        </span>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {combinedData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Truck className="w-10 h-10 mb-3" />
            <p className="text-sm">
              {isFiltered ? 'No vehicles match the selected filters.' : 'No vehicle data found.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
