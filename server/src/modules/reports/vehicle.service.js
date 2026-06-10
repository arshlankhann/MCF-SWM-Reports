import xlsx from 'xlsx';

export const processVehicleExcel = async (fileBuffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rawData = xlsx.utils.sheet_to_json(sheet);

  if (!rawData || rawData.length === 0) {
    const error = new Error('The uploaded Vehicle Excel file is empty.');
    error.statusCode = 400;
    throw error;
  }

  const sampleRow = rawData[0];
  const keys = Object.keys(sampleRow);

  // Find Agency Name column
  const agencyKey = keys.find(k => {
    const lower = String(k).toLowerCase();
    return lower.includes('agency') || lower.includes('vendor') || lower.includes('company') || lower.includes('department');
  });

  // Find Vehicle Number column
  const vehicleNoKey = keys.find(k => {
    const lower = String(k).toLowerCase();
    return lower.includes('vehicle no') || lower.includes('vehicle number') || lower.includes('reg') || lower.includes('registration') || lower.includes('ph') || lower.includes('plate');
  });

  // Find Vehicle Type / Category column
  // NOTE: "Vehicle Capacity" contains "ty" (capaci-ty) - must NOT match it.
  // Use very specific rules: must start with or end with "type", not contain "capacity" / "cap".
  const vehicleTypeKey = keys.find(k => {
    const lower = String(k).toLowerCase().trim();
    // Explicitly skip capacity columns
    if (lower.includes('capac') || lower.includes('capacity') || lower.includes('cap')) return false;
    return (
      lower === 'type'                          ||  // exact "type"
      lower === 'vehicle type'                  ||  // exact full name
      lower.startsWith('vehicle type')          ||  // "Vehicle Type", "Vehicle Type xyz"
      lower.startsWith('veh type')              ||  // "Veh Type"
      /vehicle\s+ty(?:pe)?$/.test(lower)        ||  // "Vehicle Ty" or "Vehicle Type" at end
      /\bvehicle\s+type\b/.test(lower)          ||  // word boundary match
      lower.includes('category')
    );
  });


  if (!agencyKey) {
    const error = new Error(`Could not find an "Agency" column in vehicle file. Available columns: [${keys.join(', ')}]`);
    error.statusCode = 400;
    throw error;
  }

  // Debug: log detected columns
  console.log('[Vehicle Service] All columns:', keys);
  console.log('[Vehicle Service] Detected → Agency:', agencyKey, '| Vehicle No:', vehicleNoKey, '| Vehicle Type:', vehicleTypeKey);

  const vehicleData = [];

  rawData.forEach((row) => {
    let agency = row[agencyKey];
    if (!agency) agency = 'Unknown';
    agency = String(agency).trim();

    let vehicleNo = vehicleNoKey ? row[vehicleNoKey] : '';
    if (!vehicleNo) vehicleNo = '';
    vehicleNo = String(vehicleNo).trim();

    let vehicleType = vehicleTypeKey ? row[vehicleTypeKey] : '';
    if (!vehicleType) vehicleType = '';
    vehicleType = String(vehicleType).trim();

    const attendance = {};

    // Iterate through day columns (01 to 31) or single-digit 1-9
    keys.forEach(k => {
      const keyStr = String(k).trim();
      if (/^0?[1-9]$|^[12]\d$|^3[01]$/.test(keyStr)) {
        let status = row[k];
        if (status !== undefined && status !== null && String(status).trim() !== '' && String(status).trim() !== '-') {
          status = String(status).trim();
          const upperStatus = status.toUpperCase();
          // 0 = Present (vehicle deployed/on-site)
          // Any numeric value = Present
          // Y/YES/P/PRESENT/DEPLOYED = Present
          // N/NO/A/ABSENT = Absent
          if (!isNaN(Number(status))) {
            // Numeric value (including 0) means Present/Deployed
            attendance[keyStr] = 'P';
          } else if (upperStatus === 'Y' || upperStatus === 'YES' || upperStatus === 'P' || upperStatus === 'PRESENT' || upperStatus === 'DEPLOYED') {
            attendance[keyStr] = 'P';
          } else if (upperStatus === 'N' || upperStatus === 'NO' || upperStatus === 'A' || upperStatus === 'ABSENT') {
            attendance[keyStr] = 'A';
          } else {
            attendance[keyStr] = status;
          }
        } else {
          attendance[keyStr] = '(-)';
        }
      }
    });


    vehicleData.push({
      agency,
      vehicleNo,
      vehicleType,
      attendance
    });
  });

  return { type: 'vehicle', data: vehicleData };
};
