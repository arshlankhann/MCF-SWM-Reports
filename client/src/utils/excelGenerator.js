import * as XLSX from 'xlsx';

export const exportToExcel = ({ overviewData, detailedViewData, startDate, endDate, selectedAgency }) => {
  // 1. Format the Overview Data
  const overviewRows = overviewData.map(row => ({
    'Agency Name': row.agency,
    'Total Staff': row.total,
    'Present': row.present,
    'Absent': row.absent
  }));

  // 2. Format the Detailed Data
  const detailedRows = detailedViewData.map(row => ({
    'Employee Name': row.employeeName,
    'Agency Name': row.agency,
    'Present Days': row.pCount,
    'Absent Days': row.aCount,
    'Leaves/Other': row.oCount,
    'Not Updated (-)': row.nuCount
  }));

  // 3. Create Worksheets
  const overviewSheet = XLSX.utils.json_to_sheet(overviewRows);
  const detailedSheet = XLSX.utils.json_to_sheet(detailedRows);

  // Set column widths for better readability
  overviewSheet['!cols'] = [
    { wch: 40 }, // Agency Name
    { wch: 15 }, // Total Staff
    { wch: 15 }, // Present
    { wch: 15 }  // Absent
  ];

  detailedSheet['!cols'] = [
    { wch: 30 }, // Employee Name
    { wch: 40 }, // Agency Name
    { wch: 15 }, // Present Days
    { wch: 15 }, // Absent Days
    { wch: 15 }, // Leaves/Other
    { wch: 20 }  // Not Updated (-)
  ];

  // 4. Create Workbook and Append Sheets
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');
  XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Attendance');

  // 5. Generate Filename based on filters
  let filename = 'MCF_Attendance_Report';
  if (selectedAgency) {
    filename += `_${selectedAgency.replace(/[^a-zA-Z0-9]/g, '')}`;
  }
  if (startDate && endDate) {
    filename += `_${startDate}_to_${endDate}`;
  } else if (startDate) {
    filename += `_from_${startDate}`;
  } else if (endDate) {
    filename += `_until_${endDate}`;
  }
  filename += '.xlsx';

  // 6. Trigger Download
  XLSX.writeFile(workbook, filename);
};

export const exportVehicleToExcel = ({ vehicleData, startDate, endDate, selectedAgency }) => {
  // 1. Format the Overview Data
  const overviewRows = vehicleData.map(row => {
    const typesStr = row.vehicleTypeCounts
      ? row.vehicleTypeCounts.map(({ type, count }) => `${type} (${count})`).join(', ')
      : '';
    return {
      'Agency Name': row.agencyName,
      'Vehicle Type(s)': typesStr,
      'Total Vehicles': row.totalVehicles,
      'Vehicle Present (Days)': row.vehiclePresent,
      'Vehicle Absent (Days)': row.vehicleAbsent
    };
  });

  // 2. Format the Detailed Data
  const detailedRows = [];
  vehicleData.forEach(row => {
    row.vehicleRecords.forEach(v => {
      const rowData = {
        'Vehicle No': v.vehicleNo || '—',
        'Vehicle Type': v.vehicleType || '—',
        'Agency Name': row.agencyName
      };
      
      row.vehicleDates.forEach(d => {
        rowData[d] = v.attendance?.[d] || '—';
      });
      detailedRows.push(rowData);
    });
  });

  const overviewSheet = XLSX.utils.json_to_sheet(overviewRows);
  const detailedSheet = XLSX.utils.json_to_sheet(detailedRows);

  overviewSheet['!cols'] = [
    { wch: 40 }, // Agency Name
    { wch: 40 }, // Vehicle Type(s)
    { wch: 15 }, // Total Vehicles
    { wch: 22 }, // Vehicle Present (Days)
    { wch: 22 }  // Vehicle Absent (Days)
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Vehicle Overview');
  XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Vehicle Attendance Details');

  let filename = 'MCF_Vehicle_Report';
  if (selectedAgency) {
    filename += `_${selectedAgency.replace(/[^a-zA-Z0-9]/g, '')}`;
  }
  if (startDate && endDate) {
    filename += `_${startDate}_to_${endDate}`;
  } else if (startDate) {
    filename += `_from_${startDate}`;
  } else if (endDate) {
    filename += `_until_${endDate}`;
  }
  filename += '.xlsx';

  XLSX.writeFile(workbook, filename);
};

export const exportCombinedToExcel = ({ combinedData, startDate, endDate, selectedAgency }) => {
  const overviewRows = combinedData.map(row => {
    const typesStr = row.vehicleTypeCounts
      ? row.vehicleTypeCounts.map(({ type, count }) => `${type} (${count})`).join(', ')
      : '';
    return {
      'Agency Name': row.agencyName,
      'Vehicle Type(s)': typesStr,
      'Total Vehicles': row.totalVehicles,
      'Vehicle Present (Days)': row.vehiclePresent,
      'Vehicle Absent (Days)': row.vehicleAbsent,
      'Total Staff': row.totalEmployees,
      'Staff Present (Days)': row.manpowerPresent,
      'Staff Absent (Days)': row.manpowerAbsent,
      'Other / Leave': row.manpowerOther,
      'Not Updated (-)': row.manpowerNU
    };
  });

  const overviewSheet = XLSX.utils.json_to_sheet(overviewRows);
  overviewSheet['!cols'] = [
    { wch: 40 }, // Agency Name
    { wch: 40 }, // Vehicle Type(s)
    { wch: 15 }, // Total Vehicles
    { wch: 22 }, // Vehicle Present (Days)
    { wch: 22 }, // Vehicle Absent (Days)
    { wch: 15 }, // Total Staff
    { wch: 20 }, // Staff Present (Days)
    { wch: 20 }, // Staff Absent (Days)
    { wch: 15 }, // Other / Leave
    { wch: 18 }  // Not Updated (-)
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Combined Overview');

  let filename = 'MCF_Combined_Report';
  if (selectedAgency) {
    filename += `_${selectedAgency.replace(/[^a-zA-Z0-9]/g, '')}`;
  }
  if (startDate && endDate) {
    filename += `_${startDate}_to_${endDate}`;
  } else if (startDate) {
    filename += `_from_${startDate}`;
  } else if (endDate) {
    filename += `_until_${endDate}`;
  }
  filename += '.xlsx';

  XLSX.writeFile(workbook, filename);
};

