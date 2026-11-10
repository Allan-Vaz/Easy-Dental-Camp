import * as XLSX from 'xlsx';
import { normalizeClassName } from './clinicalEvaluator';

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
        const rollTracker = new Map(); // Map<className, Set<rollNo>>
        let duplicateRollWarnings = 0;

        const dataRows = rawRows.slice(headerRowIndex + 1);

        dataRows.forEach((row, rowIdx) => {
          if (!row || row.every((c) => !String(c).trim())) return;

          let rawClass = classIdx !== -1 ? String(row[classIdx] || '').trim() : '';
          let rawRoll = rollIdx !== -1 ? String(row[rollIdx] || '').trim() : '';
          let rawName = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : '';
          let rawAge = ageIdx !== -1 ? Number(row[ageIdx]) : null;
          let rawGender = genderIdx !== -1 ? String(row[genderIdx] || '').trim().toUpperCase() : '';

          if (!rawClass && row[0]) rawClass = String(row[0]).trim();
          if (!rawRoll && row[1]) rawRoll = String(row[1]).trim();
          if (!rawName && row[2]) rawName = String(row[2]).trim();

          if (!rawName) return; // Skip rows without student name

          // Harmonize class name
          const standardizedClass = normalizeClassName(rawClass);
          detectedClasses.add(standardizedClass);

          // Standardize gender
          let gender = 'M';
          if (rawGender.startsWith('F') || rawGender.includes('स्त्री') || rawGender.includes('मुलगी')) {
            gender = 'F';
          }

          // Track and auto-correct duplicate or missing rolls
          if (!rollTracker.has(standardizedClass)) {
            rollTracker.set(standardizedClass, new Set());
          }
          const existingRolls = rollTracker.get(standardizedClass);

          let rollNo = Number(rawRoll);
          if (!rollNo || isNaN(rollNo) || rollNo <= 0) {
            rollNo = existingRolls.size + 1;
          } else if (existingRolls.has(rollNo)) {
            duplicateRollWarnings++;
            // Find next available roll number in this class
            let nextAvailable = 1;
            while (existingRolls.has(nextAvailable)) {
              nextAvailable++;
            }
            rollNo = nextAvailable;
          }
          existingRolls.add(rollNo);

          students.push({
            groupId: standardizedClass,
            rollNo,
            name: rawName,
            age: rawAge && !isNaN(rawAge) ? rawAge : 10,
            gender
          });
        });

        resolve({
          students,
          classes: Array.from(detectedClasses).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
          duplicateRollWarnings
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

