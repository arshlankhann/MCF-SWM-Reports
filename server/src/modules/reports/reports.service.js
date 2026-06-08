import xlsx from 'xlsx';

export const processAttendanceExcel = async (fileBuffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert sheet to JSON
  const rawData = xlsx.utils.sheet_to_json(sheet);
  
  if (!rawData || rawData.length === 0) {
    const error = new Error('The uploaded Excel file is empty.');
    error.statusCode = 400;
    throw error;
  }

  // Find column names case-insensitively
  const sampleRow = rawData[0];
  const keys = Object.keys(sampleRow);
  
  // Pivot table format detection
  const isPivotTable = keys.some(k => String(k).includes('Sum of Total Present')) && keys.some(k => String(k).includes('Row Labels'));

  if (isPivotTable) {
    const overview = {};
    rawData.forEach((row) => {
      let agency = row['Row Labels'];
      if (!agency || String(agency).toLowerCase().includes('grand total')) return;
      agency = String(agency).trim();

      const present = row['Sum of Total Present'] || 0;
      const absent = row['Sum of Total Absent'] || 0;
      const notMarked = row['Sum of Not Maked'] || row['Sum of Not Marked'] || 0;
      const leaves = (row['Sum of Medical Leave'] || 0) + (row['Sum of Casual Leave'] || 0) + (row['Sum of Earned Leave'] || 0);
      const other = (row['Sum of Compo Off'] || 0) + (row['Sum of Week Off'] || 0) + (row['Sum of Holiday'] || 0);

      const total = present + absent + notMarked + leaves + other;

      overview[agency] = {
        agency,
        total: total,
        present: present,
        absent: absent
      };
    });
    return { type: 'summary', data: Object.values(overview) };
  } else {
    const agencyKey = keys.find(k => {
      const lower = String(k).toLowerCase();
      return lower.includes('agency') || lower.includes('department') || lower.includes('company') || lower.includes('vendor') || lower.includes('team');
    });

    const employeeNameKey = keys.find(k => {
      const lower = String(k).toLowerCase();
      return lower.includes('employee name') || lower.includes('name') || lower.includes('staff');
    });

    if (!agencyKey) {
      const error = new Error(`Could not find an "Agency" column. Available columns are: [${keys.join(', ')}]`);
      error.statusCode = 400;
      throw error;
    }

    const detailedData = [];

    rawData.forEach((row) => {
      let agency = row[agencyKey];
      if (!agency) agency = 'Unknown';
      agency = String(agency).trim();

      let employeeName = employeeNameKey ? row[employeeNameKey] : 'Unknown Employee';
      if (!employeeName) employeeName = 'Unknown Employee';
      employeeName = String(employeeName).trim();

      const attendance = {};

      // Iterate through day columns (01 to 31)
      keys.forEach(k => {
        const keyStr = String(k).trim();
        if (/^0?[1-9]$|^[12]\d$|^3[01]$/.test(keyStr)) {
          let status = row[k];
          if (status) {
            status = String(status).trim().toUpperCase();
            // Map the statuses according to the exact codes provided:
            // P, A, ML, CL, EL, CO, WO, H, (-)
            // We just store the code exactly as is, so the frontend can display or count it.
            // But we can standardize it a bit.
            if (status.includes('PRESENT')) status = 'P';
            else if (status.includes('ABSENT')) status = 'A';
            else if (status === '-') status = '(-)';
            attendance[keyStr] = status;
          } else {
            attendance[keyStr] = '(-)';
          }
        }
      });

      detailedData.push({
        employeeName,
        agency,
        attendance
      });
    });

    return { type: 'detailed', data: detailedData };
  }
};
