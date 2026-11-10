import * as XLSX from 'xlsx';

/**
 * Robust School Roster Parser
 * Supports both Excel (.xlsx, .xls) and CSV (.csv) files.
 * Handles quoted names with commas, Marathi Unicode characters, and varying column names.
 */
export const parseRosterFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('Workbook contains no sheets.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length < 2) {
          throw new Error('File appears to be empty or has no data rows.');
        }

        // Find header row (first non-empty row)
        let headerRowIndex = 0;
        while (headerRowIndex < rawRows.length && rawRows[headerRowIndex].filter(Boolean).length < 2) {
          headerRowIndex++;
        }

        const headers = (rawRows[headerRowIndex] || []).map((h) =>
          String(h).trim().toLowerCase()
        );

        // Find column indices with bilingual/flexible matching
        const findColIndex = (keywords) => {
          return headers.findIndex((h) => keywords.some((kw) => h.includes(kw)));
        };

        const classIdx = findColIndex(['class', 'std', 'division', 'sec', 'वर्ग', 'इयत्ता', 'तुकडी']);
        const rollIdx = findColIndex(['roll', 'अनुक्रमांक', 'हजेरी']);
        const nameIdx = findColIndex(['name', 'student', 'विद्यार्थी', 'नाव']);
        const ageIdx = findColIndex(['age', 'वय']);
        const genderIdx = findColIndex(['gen', 'sex', 'लिंग']);

        const students = [];
        const detectedClasses = new Set();

        const dataRows = rawRows.slice(headerRowIndex + 1);

        dataRows.forEach((row, rowIdx) => {
          // If no content in row, skip
          if (!row || row.every((c) => !String(c).trim())) return;

          let rawClass = classIdx !== -1 ? String(row[classIdx] || '').trim() : '';
          let rawRoll = rollIdx !== -1 ? String(row[rollIdx] || '').trim() : '';
          let rawName = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : '';
          let rawAge = ageIdx !== -1 ? Number(row[ageIdx]) : null;
          let rawGender = genderIdx !== -1 ? String(row[genderIdx] || '').trim().toUpperCase() : '';

          // Fallback if header detection was ambiguous: treat col 0 as class, 1 as roll, 2 as name
          if (!rawClass && row[0]) rawClass = String(row[0]).trim();
          if (!rawRoll && row[1]) rawRoll = String(row[1]).trim();
          if (!rawName && row[2]) rawName = String(row[2]).trim();

          if (!rawClass) rawClass = 'General';
          if (!rawName) return; // Skip rows without student name

          detectedClasses.add(rawClass);

          // Standardize gender
          let gender = 'M';
          if (rawGender.startsWith('F') || rawGender.includes('स्त्री') || rawGender.includes('मुलगी')) {
            gender = 'F';
          }

          students.push({
            groupId: rawClass,
            rollNo: Number(rawRoll) || (rowIdx + 1),
            name: rawName,
            age: rawAge && !isNaN(rawAge) ? rawAge : 10,
            gender
          });
        });

        resolve({
          students,
          classes: Array.from(detectedClasses)
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
