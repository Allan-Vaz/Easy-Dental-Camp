import { DEFAULT_RULE_GROUPS, DEFAULT_TOOTH_DIAGNOSES, DEFAULT_DIAGNOSES } from '../data/defaultData';

/**
 * Returns tooth labels from midline outward.
 * 5 teeth (Primary/Milk): A, B, C, D, E (Incisor to 2nd Molar)
 * 6-8 teeth (Permanent/Mixed): 1 to 8 (Central Incisor to 3rd Molar)
 */
export const getToothLabels = (count) => {
  const num = Number(count) || 6;
  if (num === 5) return ['A', 'B', 'C', 'D', 'E'];
  return Array.from({ length: num }, (_, i) => String(i + 1));
};

export const formatDisplayDate = (isoDate) => {
  if (!isoDate) return '10 Nov 2026';
  const d = new Date(isoDate + 'T00:00:00');
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const resolveClassRules = (camp, classId) => {
  const ruleGroups = camp?.ruleGroups || DEFAULT_RULE_GROUPS;
  const matchedRG = ruleGroups.find((rg) => (rg.classes || []).includes(classId));
  if (matchedRG) {
    return {
      ruleGroupId: matchedRG.id,
      ruleGroupName: matchedRG.name,
      teethPerQuad: Number(matchedRG.teethPerQuad) || 6,
      activeToothDiagnoses: matchedRG.activeToothDiagnoses || ['C_R', 'C_Y', 'M', 'R'],
      activeChecks: matchedRG.activeChecks || ['cavities', 'tartar', 'alignment']
    };
  }
  const fallbackGrp = (camp?.groups || []).find((g) => g.id === classId);
  return {
    ruleGroupId: 'UNASSIGNED',
    ruleGroupName: 'Default Class Rules',
    teethPerQuad: Number(fallbackGrp?.teethPerQuad) || 6,
    activeToothDiagnoses: fallbackGrp?.activeToothDiagnoses || ['C_R', 'C_Y', 'M', 'R'],
    activeChecks: fallbackGrp?.activeChecks || ['cavities', 'tartar', 'alignment']
  };
};

export const evaluateClinicalState = (teethMap = {}, flags = [], isAllClear = false) => {
  const toothValues = Object.values(teethMap || {});
  const hasRedCavity = toothValues.includes('C_R');
  const yellowCavityCount = toothValues.filter((v) => v === 'C_Y').length;
  const hasAnyCavity = hasRedCavity || yellowCavityCount > 0;
  const hasRetained = toothValues.includes('R');

  const nextFlags = new Set(flags || []);
  if (hasAnyCavity) nextFlags.add('cavities');
  if (hasRetained) nextFlags.add('milk_tooth');

  let severity = '';
  let noteCode = '';

  if (hasRedCavity || yellowCavityCount >= 2) {
    severity = 'R';
    noteCode = 'C_R';
  } else if (yellowCavityCount === 1) {
    severity = 'Y';
    noteCode = 'C_Y';
  } else if (nextFlags.has('cavities')) {
    severity = 'R';
    noteCode = 'cavities';
  } else if (hasRetained) {
    severity = 'Y';
    noteCode = 'R';
  } else if (nextFlags.has('milk_tooth')) {
    severity = 'Y';
    noteCode = 'milk_tooth';
  } else if (nextFlags.has('alignment')) {
    severity = 'Y';
    noteCode = 'alignment';
  } else if (nextFlags.has('gums')) {
    severity = 'Y';
    noteCode = 'gums';
  } else if (nextFlags.has('tartar')) {
    severity = 'Y';
    noteCode = 'tartar';
  } else if (nextFlags.has('stains')) {
    severity = 'Y';
    noteCode = 'stains';
  } else if (nextFlags.size > 0) {
    severity = 'Y';
    noteCode = Array.from(nextFlags)[0];
  } else if (isAllClear) {
    severity = 'G';
    noteCode = 'healthy';
  }

  return {
    flags: Array.from(nextFlags),
    severity,
    noteCode
  };
};

/**
 * Resolves the advice object (with adviceEn, adviceMr, labelEn, labelMr) from the master tables.
 */
export const resolveMasterAdvice = (noteCode, toothDiagnosesList = [], diagnosesList = []) => {
  if (!noteCode) return null;

  // Normalized legacy code mapping for backwards compatibility with any existing saved patient
  const legacyMap = {
    URG_FILL: 'cavities',
    CLEAN_ALIGN: 'tartar',
    BRACES_ALIGN: 'alignment',
    MILK_CARE: 'milk_tooth',
    GUM_CARE: 'gums',
    HEALTHY: 'healthy'
  };
  const targetId = legacyMap[noteCode] || noteCode;

  const safeToothDiags = Array.isArray(toothDiagnosesList) && toothDiagnosesList.length > 0
    ? toothDiagnosesList
    : DEFAULT_TOOTH_DIAGNOSES;
  const safeChecks = Array.isArray(diagnosesList) && diagnosesList.length > 0
    ? diagnosesList
    : DEFAULT_DIAGNOSES;

  // 1. Check Table 1: Master Tooth Diagnoses
  const toothMatch = safeToothDiags.find((d) => d.id === targetId || d.id === noteCode);
  if (toothMatch) {
    return {
      code: toothMatch.id,
      source: 'tooth',
      labelEn: toothMatch.name,
      labelMr: toothMatch.name,
      adviceEn: toothMatch.adviceEn || '',
      adviceMr: toothMatch.adviceMr || ''
    };
  }

  // 2. Check Table 2: Master Checklist Diagnoses
  const checkMatch = safeChecks.find((d) => d.id === targetId || d.id === noteCode);
  if (checkMatch) {
    return {
      code: checkMatch.id,
      source: 'checklist',
      labelEn: checkMatch.labelEn,
      labelMr: checkMatch.labelMr || checkMatch.labelEn,
      adviceEn: checkMatch.adviceEn || '',
      adviceMr: checkMatch.adviceMr || ''
    };
  }

  // 3. Fallback for healthy
  if (targetId === 'healthy' || targetId === 'HEALTHY') {
    const fallbackHealthy = safeChecks.find((d) => d.id === 'healthy') || DEFAULT_DIAGNOSES.find((d) => d.id === 'healthy');
    if (fallbackHealthy) {
      return {
        code: 'healthy',
        source: 'healthy',
        labelEn: fallbackHealthy.labelEn,
        labelMr: fallbackHealthy.labelMr || fallbackHealthy.labelEn,
        adviceEn: fallbackHealthy.adviceEn || '',
        adviceMr: fallbackHealthy.adviceMr || ''
      };
    }
  }

  return null;
};

/**
 * Returns strictly the advice options matching detected issues or healthy state,
 * picked directly from Master Table 1 (tooth diagnoses) and Master Table 2 (checklist).
 */
export const getRelevantAdviceOptions = (
  teethMap = {},
  flags = [],
  isAllClear = false,
  toothDiagnosesList = [],
  diagnosesList = []
) => {
  const toothValues = Object.values(teethMap || {});
  const flagSet = new Set(flags || []);
  const safeToothDiags = Array.isArray(toothDiagnosesList) && toothDiagnosesList.length > 0
    ? toothDiagnosesList
    : DEFAULT_TOOTH_DIAGNOSES;
  const safeChecks = Array.isArray(diagnosesList) && diagnosesList.length > 0
    ? diagnosesList
    : DEFAULT_DIAGNOSES;

  const options = [];

  // If marked explicitly All Clear / Healthy Smile
  if (isAllClear) {
    const healthyDiag = safeChecks.find((d) => d.id === 'healthy') || DEFAULT_DIAGNOSES.find((d) => d.id === 'healthy');
    if (healthyDiag) {
      options.push({
        code: 'healthy',
        source: 'healthy',
        label: healthyDiag.labelEn,
        labelEn: healthyDiag.labelEn,
        labelMr: healthyDiag.labelMr || healthyDiag.labelEn,
        adviceEn: healthyDiag.adviceEn || '',
        adviceMr: healthyDiag.adviceMr || '',
        textEn: healthyDiag.adviceEn || '',
        textMr: healthyDiag.adviceMr || ''
      });
    }
    return options;
  }

  // 1. From Table 1: Gather all tooth diagnoses detected on the tooth chart
  const distinctToothDiagIds = Array.from(new Set(toothValues));
  distinctToothDiagIds.forEach((diagId) => {
    const matched = safeToothDiags.find((d) => d.id === diagId);
    if (matched && (matched.adviceEn || matched.adviceMr)) {
      options.push({
        code: matched.id,
        source: 'tooth',
        label: `${matched.name} (Tooth Chart)`,
        labelEn: matched.name,
        labelMr: matched.name,
        adviceEn: matched.adviceEn || '',
        adviceMr: matched.adviceMr || '',
        textEn: matched.adviceEn || '',
        textMr: matched.adviceMr || ''
      });
    }
  });

  // 2. From Table 2: Gather all checklist diagnoses detected in checklist flags
  flagSet.forEach((flagId) => {
    const matched = safeChecks.find((d) => d.id === flagId);
    if (matched && (matched.adviceEn || matched.adviceMr)) {
      if (!options.some((o) => o.code === matched.id)) {
        options.push({
          code: matched.id,
          source: 'checklist',
          label: `${matched.labelEn} (Checklist)`,
          labelEn: matched.labelEn,
          labelMr: matched.labelMr || matched.labelEn,
          adviceEn: matched.adviceEn || '',
          adviceMr: matched.adviceMr || '',
          textEn: matched.adviceEn || '',
          textMr: matched.adviceMr || ''
        });
      }
    }
  });

  return options;
};

/**
 * Auto-generates standard Camp Code: [Initials]-[MMM][YY]
 * Example: "Ashok Dada Sable Vidyalaya" in Nov 2026 -> "ADSV-NOV26"
 */
export const generateCampCode = (instituteName = '', dateStr = '') => {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthAbbr = months[isNaN(d.getMonth()) ? new Date().getMonth() : d.getMonth()];
  const yearSuffix = String(isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear()).slice(-2);

  const cleanName = (instituteName || '').trim();
  if (!cleanName) {
    return `CAMP-${monthAbbr}${yearSuffix}`;
  }

  const hasLatin = /[a-zA-Z]/.test(cleanName);
  let prefix = '';

  if (hasLatin) {
    const ignoreWords = new Set(['and', 'of', 'the', 'in', 'at', 'for', 'school', 'vidyalaya', 'college', 'high']);
    const words = cleanName.split(/[\s,.-]+/).filter((w) => w.length > 0);

    prefix = words
      .filter((w) => !ignoreWords.has(w.toLowerCase()) || words.length <= 2)
      .map((w) => w[0].toUpperCase())
      .join('')
      .slice(0, 5);

    if (!prefix || prefix.length < 2) {
      prefix = cleanName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
    }
  } else {
    const words = cleanName.split(/[\s,.-]+/).filter((w) => w.length > 0);
    prefix = words.map((w) => w[0]).join('').slice(0, 4);
    if (!prefix) prefix = 'CAMP';
  }

  return `${prefix || 'CAMP'}-${monthAbbr}${yearSuffix}`;
};

/**
 * Auto-calculates Voucher Expiry Date = Camp Date + N Days (Default: 30 days)
 */
export const calculateVoucherExpiry = (campDate, days = 30) => {
  const base = campDate ? new Date(campDate + 'T00:00:00') : new Date();
  if (isNaN(base.getTime())) return '';
  base.setDate(base.getDate() + Number(days || 30));
  return base.toISOString().slice(0, 10);
};

/**
 * Harmonizes class names (e.g. "IV A", "4-a", "4th A" -> "4th-A")
 */
export const normalizeClassName = (rawClass = '') => {
  let s = String(rawClass || '').trim();
  if (!s) return 'General';

  if (/staff|teacher|faculty|शिक्षक/i.test(s)) {
    return 'Staff & Teachers';
  }

  if (/nursery|nur|शिशु/i.test(s)) return 'Nursery';
  if (/jr\.?\s*kg|lkg|कनिष्ठ/i.test(s)) return 'JRKG';
  if (/sr\.?\s*kg|ukg|वरिष्ठ/i.test(s)) return 'SRKG';

  const romanMap = {
    XII: '12th', XI: '11th', X: '10th', IX: '9th', VIII: '8th',
    VII: '7th', VI: '6th', V: '5th', IV: '4th', III: '3rd', II: '2nd', I: '1st'
  };

  for (const [rom, num] of Object.entries(romanMap)) {
    const reg = new RegExp(`^(${rom})([\\s-_]*)([a-zA-Z]?)$`, 'i');
    if (reg.test(s)) {
      return s.replace(reg, (_, r, sep, sec) => `${num}${sec ? '-' + sec.toUpperCase() : ''}`);
    }
  }

  const digitMatch = s.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s-_]*([a-zA-Z]?)$/i);
  if (digitMatch) {
    const num = digitMatch[1];
    const sec = digitMatch[2] ? `-${digitMatch[2].toUpperCase()}` : '';
    const suffix = (n) => {
      if (n === '1') return '1st';
      if (n === '2') return '2nd';
      if (n === '3') return '3rd';
      return `${n}th`;
    };
    return `${suffix(num)}${sec}`;
  }

  return s;
};

