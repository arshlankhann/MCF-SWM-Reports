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
