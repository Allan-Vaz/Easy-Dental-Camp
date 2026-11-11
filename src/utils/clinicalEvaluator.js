import { DEFAULT_RULE_GROUPS, ADVICE_TEMPLATES } from '../data/defaultData';

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
    noteCode = 'URG_FILL';
  } else if (yellowCavityCount === 1 || nextFlags.has('cavities')) {
    severity = 'Y';
    noteCode = 'URG_FILL';
  } else if (nextFlags.has('milk_tooth') || hasRetained) {
    severity = 'Y';
    noteCode = 'MILK_CARE';
  } else if (nextFlags.has('alignment')) {
    severity = 'Y';
    noteCode = 'BRACES_ALIGN';
  } else if (nextFlags.has('gums')) {
    severity = 'Y';
    noteCode = 'GUM_CARE';
  } else if (nextFlags.has('tartar') || nextFlags.has('stains') || nextFlags.size > 0 || toothValues.length > 0) {
    severity = 'Y';
    noteCode = 'CLEAN_ALIGN';
  } else if (isAllClear) {
    severity = 'G';
    noteCode = 'HEALTHY';
  }

  return {
    flags: Array.from(nextFlags),
    severity,
    noteCode
  };
};

/**
 * Returns strictly the advice templates matching detected issues or healthy state.
 */
export const getRelevantAdviceOptions = (teethMap = {}, flags = [], isAllClear = false, toothDiagnosesList = [], diagnosesList = []) => {
  const toothValues = Object.values(teethMap || {});
  const flagSet = new Set(flags || []);
  const options = [];

  // If marked explicitly All Clear / Healthy Smile
  if (isAllClear) {
    if (ADVICE_TEMPLATES.HEALTHY) {
      options.push(ADVICE_TEMPLATES.HEALTHY);
    }
    return options;
  }

  const hasCavity = toothValues.includes('C_R') || toothValues.includes('C_Y') || flagSet.has('cavities');
  const hasCleaning = flagSet.has('tartar') || flagSet.has('stains');
  const hasAlignment = flagSet.has('alignment');
  const hasMilkTooth = toothValues.includes('R') || flagSet.has('milk_tooth');
  const hasGums = flagSet.has('gums');

  if (hasCavity && ADVICE_TEMPLATES.URG_FILL) {
    options.push(ADVICE_TEMPLATES.URG_FILL);
  }
  if (hasCleaning && ADVICE_TEMPLATES.CLEAN_ALIGN) {
    options.push(ADVICE_TEMPLATES.CLEAN_ALIGN);
  }
  if (hasAlignment && ADVICE_TEMPLATES.BRACES_ALIGN) {
    options.push(ADVICE_TEMPLATES.BRACES_ALIGN);
  }
  if (hasMilkTooth && ADVICE_TEMPLATES.MILK_CARE) {
    options.push(ADVICE_TEMPLATES.MILK_CARE);
  }
  if (hasGums && ADVICE_TEMPLATES.GUM_CARE) {
    options.push(ADVICE_TEMPLATES.GUM_CARE);
  }

  // Also check if any custom findings have advice
  if (Array.isArray(toothDiagnosesList)) {
    toothValues.forEach((tVal) => {
      const match = toothDiagnosesList.find((d) => d.id === tVal);
      if (match && (match.adviceMr || match.adviceEn)) {
        if (!options.some((o) => o.code === match.id)) {
          options.push({
            code: match.id,
            label: match.name,
            labelMr: match.name,
            labelEn: match.name,
            textMr: match.adviceMr,
            textEn: match.adviceEn
          });
        }
      }
    });
  }

  if (Array.isArray(diagnosesList)) {
    flags.forEach((fId) => {
      const match = diagnosesList.find((d) => d.id === fId);
      if (match && (match.adviceMr || match.adviceEn)) {
        if (!options.some((o) => o.code === match.id || o.code === match.labelEn)) {
          options.push({
            code: match.id,
            label: match.labelEn,
            labelMr: match.labelMr || match.labelEn,
            labelEn: match.labelEn,
            textMr: match.adviceMr,
            textEn: match.adviceEn
          });
        }
      }
    });
  }

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

