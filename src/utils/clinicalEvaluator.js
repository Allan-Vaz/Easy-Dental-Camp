import { DEFAULT_RULE_GROUPS } from '../data/defaultData';

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
      activeChecks: matchedRG.activeChecks || ['cavities', 'tartar', 'alignment']
    };
  }
  const fallbackGrp = (camp?.groups || []).find((g) => g.id === classId);
  return {
    ruleGroupId: 'UNASSIGNED',
    ruleGroupName: 'Default Class Rules',
    teethPerQuad: Number(fallbackGrp?.teethPerQuad) || 6,
    activeChecks: fallbackGrp?.activeChecks || ['cavities', 'tartar', 'alignment']
  };
};

export const evaluateClinicalState = (teethMap = {}, flags = []) => {
  const toothValues = Object.values(teethMap || {});
  const hasRedCavity = toothValues.includes('C_R');
  const yellowCavityCount = toothValues.filter((v) => v === 'C_Y').length;
  const hasAnyCavity = hasRedCavity || yellowCavityCount > 0;
  const hasRetained = toothValues.includes('R');

  const nextFlags = new Set(flags || []);
  if (hasAnyCavity) nextFlags.add('cavities');
  if (hasRetained) nextFlags.add('milk_tooth');

  let severity = 'G';
  let noteCode = 'HEALTHY';

  if (hasRedCavity || yellowCavityCount >= 2) {
    severity = 'R';
    noteCode = 'URG_FILL';
  } else if (yellowCavityCount === 1 || nextFlags.has('cavities')) {
    severity = 'Y';
    noteCode = 'URG_FILL';
  } else if (nextFlags.has('milk_tooth') || hasRetained) {
    severity = 'Y';
    noteCode = 'MILK_CARE';
  } else if (nextFlags.size > 0 || toothValues.length > 0) {
    severity = 'Y';
    noteCode = 'CLEAN_ALIGN';
  }

  return {
    flags: Array.from(nextFlags),
    severity,
    noteCode
  };
};
