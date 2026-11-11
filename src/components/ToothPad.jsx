import React, { useState, useMemo } from 'react';
import { ChevronRight, Search, Check, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getToothLabels, evaluateClinicalState, getRelevantAdviceOptions } from '../utils/clinicalEvaluator';
import { ADVICE_TEMPLATES, DEFAULT_TOOTH_DIAGNOSES } from '../data/defaultData';

export const ToothPad = ({
  activeCamp,
  activeGroup,
  groupPatients = [],
  filteredGroupPatients = [],
  activePatient,
  setSelectedPatientId,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  updateActivePatientExam,
  savePatientRecord,
  showToast,
  diagnosesList = [],
  toothDiagnosesList = []
}) => {
  const [activeToothPopover, setActiveToothPopover] = useState(null);
  const [validationError, setValidationError] = useState('');

  const teethPerQuad = activeGroup?.teethPerQuad || 6;
  const labels = getToothLabels(teethPerQuad);

  const allToothDiags = toothDiagnosesList && toothDiagnosesList.length > 0
    ? toothDiagnosesList
    : DEFAULT_TOOTH_DIAGNOSES;
  const activeToothDiagIds = activeGroup?.activeToothDiagnoses || allToothDiags.map((d) => d.id);
  const visibleToothDiagnoses = allToothDiags.filter((d) => activeToothDiagIds.includes(d.id));

  // Examination Status Flags for Current Active Student
  const currentTeeth = activePatient?.exam?.teeth || {};
  const currentFlags = activePatient?.exam?.flags || [];
  const isAllClear = Boolean(activePatient?.exam?.isAllClear);
  const hasToothIssues = Object.keys(currentTeeth).length > 0;
  const hasFlagIssues = currentFlags.length > 0;
  const hasAnyIssues = hasToothIssues || hasFlagIssues;
  const isExamined = hasAnyIssues || isAllClear;
  const hasSelectedAdvice = Boolean(activePatient?.exam?.noteCode && activePatient.exam.noteCode.trim());
  const adviceLang = activePatient?.exam?.adviceLanguage || 'mr';

  // Compute strictly matching advice options for detected issues or healthy state
  const relevantAdviceOptions = useMemo(() => {
    return getRelevantAdviceOptions(
      currentTeeth,
      currentFlags,
      isAllClear,
      allToothDiags,
      diagnosesList
    );
  }, [currentTeeth, currentFlags, isAllClear, allToothDiags, diagnosesList]);

  const setToothStatus = (toothKey, statusValue) => {
    if (!activePatient) return;
    setValidationError('');
    updateActivePatientExam((exam) => {
      const nextTeeth = { ...(exam.teeth || {}) };
      if (!statusValue || statusValue === 'CLEAR') {
        delete nextTeeth[toothKey];
      } else {
        nextTeeth[toothKey] = statusValue;
      }
      const autoEval = evaluateClinicalState(nextTeeth, exam.flags || [], false);
      const isStillHealthy = Object.keys(nextTeeth).length === 0 && (exam.flags || []).length === 0 && exam.isAllClear;

      let nextNoteCode = exam.noteCode;
      if (!isStillHealthy && nextNoteCode === 'HEALTHY') {
        nextNoteCode = autoEval.noteCode || '';
      } else if (!nextNoteCode) {
        nextNoteCode = autoEval.noteCode || '';
      }

      return {
        ...exam,
        isAllClear: false,
        teeth: nextTeeth,
        flags: autoEval.flags,
        severity: autoEval.severity || '',
        noteCode: nextNoteCode
      };
    });
    setActiveToothPopover(null);
  };

  const toggleDiagnosisFlag = (flagId) => {
    if (!activePatient) return;
    setValidationError('');
    updateActivePatientExam((exam) => {
      const cur = exam.flags || [];
      const nextFlags = cur.includes(flagId) ? cur.filter((f) => f !== flagId) : [...cur, flagId];
      const autoEval = evaluateClinicalState(exam.teeth || {}, nextFlags, false);

      let nextNoteCode = exam.noteCode;
      if (nextNoteCode === 'HEALTHY' && (nextFlags.length > 0 || Object.keys(exam.teeth || {}).length > 0)) {
        nextNoteCode = autoEval.noteCode || '';
      } else if (!nextNoteCode) {
        nextNoteCode = autoEval.noteCode || '';
      }

      return {
        ...exam,
        isAllClear: false,
        flags: nextFlags,
        severity: autoEval.severity || '',
        noteCode: nextNoteCode
      };
    });
  };

  const toggleAllClearHealthy = () => {
    if (!activePatient) return;
    setValidationError('');
    updateActivePatientExam((exam) => {
      if (exam.isAllClear) {
        return {
          ...exam,
          isAllClear: false,
          severity: '',
          noteCode: ''
        };
      }
      return {
        ...exam,
        isAllClear: true,
        teeth: {},
        flags: [],
        severity: 'G',
        noteCode: 'HEALTHY'
      };
    });
  };

  const handleSaveAndNext = () => {
    if (!activePatient) return;

    if (!isExamined) {
      setValidationError('⚠️ Examination Required: Please record dental issues or tap "All Clear / Healthy Smile" before saving.');
      showToast('⚠️ Examination incomplete! Mark issues or click All Clear.');
      return;
    }

    if (!activePatient.exam?.noteCode) {
      setValidationError('⚠️ Advice Required: Please select an advice template from the dropdown before saving.');
      showToast('⚠️ Please select an advice template.');
      return;
    }

    setValidationError('');
    updateActivePatientExam((ex) => ex, true);
    showToast(`✅ Saved #${activePatient.rollNo} ${activePatient.name}`);

    const currentIndex = groupPatients.findIndex((p) => p.id === activePatient.id);
    if (currentIndex >= 0 && currentIndex + 1 < groupPatients.length) {
      setSelectedPatientId(groupPatients[currentIndex + 1].id);
    }
  };

  /**
   * Anatomically Correct Palmer Quadrants:
   * Top-Left: UR (Upper Right / वरचे-उजवे) - labels reversed so 1/A is at midline (inner right)
   * Top-Right: UL (Upper Left / वरचे-डावे) - labels normal so 1/A is at midline (inner left)
   * Bottom-Left: LR (Lower Right / खालचे-उजवे) - labels reversed so 1/A is at midline (inner right)
   * Bottom-Right: LL (Lower Left / खालचे-डावे) - labels normal so 1/A is at midline (inner left)
   */
  const quadrants = [
    { q: 'UR', title: 'Upper Right (वरचे-उजवे)', reverse: true },
    { q: 'UL', title: 'Upper Left (वरचे-डावे)', reverse: false },
    { q: 'LR', title: 'Lower Right (खालचे-उजवे)', reverse: true },
    { q: 'LL', title: 'Lower Left (खालचे-डावे)', reverse: false }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left Column: Student Queue (4 Cols) */}
      <div className="lg:col-span-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col h-[680px]">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-black text-[#1B2F5A]">Class {activeGroup?.id} Roster</h3>
            <p className="text-[11px] text-slate-500 font-semibold">
              Rule Group: {activeGroup?.ruleGroupName} ({teethPerQuad} Teeth/Quad)
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="space-y-2 mb-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Roll No or Name..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B2F5A]"
            />
          </div>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
            {['all', 'pending', 'checked'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`py-1 rounded-lg capitalize ${
                  statusFilter === st ? 'bg-white text-[#1B2F5A] shadow-sm' : 'text-slate-500'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Student List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filteredGroupPatients.map((p) => {
            const isSelected = activePatient?.id === p.id;
            const sev = p.exam?.severity || 'G';
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPatientId(p.id)}
                className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#1B2F5A] text-white border-[#1B2F5A] shadow'
                    : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#E52629] text-white'
                        : 'bg-white border border-slate-300 text-[#1B2F5A]'
                    }`}
                  >
                    {p.rollNo}
                  </span>
                  <div className="truncate">
                    <div className="text-xs font-extrabold truncate">{p.name}</div>
                    <div className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      Age: {p.age} • {p.gender}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {p.status === 'checked' ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        sev === 'R'
                          ? 'bg-[#E52629] text-white'
                          : sev === 'Y'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {sev === 'R' ? 'URGENT' : sev === 'Y' ? 'CARE' : 'OK'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                      Pending
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Checkup Pad (8 Cols) */}
      <div className="lg:col-span-8 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
        {activePatient ? (
          <div className="space-y-5">
            {/* Student Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f4f7fb] p-3.5 rounded-xl border border-[#1B2F5A]/20">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#1B2F5A] text-white font-black text-base flex items-center justify-center shadow">
                  #{activePatient.rollNo}
                </div>
                <div>
                  <h2 className="text-base font-black text-[#1B2F5A]">{activePatient.name}</h2>
                  <p className="text-xs text-slate-600 font-semibold">
                    Class: <span className="font-bold">{activePatient.groupId}</span> • Age:{' '}
                    {activePatient.age} • Rule Group:{' '}
                    <span className="text-[#E52629] font-bold">{activeGroup?.ruleGroupName}</span>
                  </p>
                </div>
              </div>

              {/* Examination Gate Controls & Status Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Prominent All Clear Button */}
                <button
                  type="button"
                  onClick={toggleAllClearHealthy}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border shadow-sm ${
                    isAllClear
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow ring-2 ring-emerald-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
                  }`}
                  title="Mark student as healthy after physical examination"
                >
                  <span className="text-sm">⭐</span>
                  <span>All Clear / Healthy Smile</span>
                  <span className="text-[10.5px] opacity-90 font-bold">(कोणतीही समस्या नाही)</span>
                  {isAllClear && <Check className="w-4 h-4 text-white ml-0.5" />}
                </button>

                {/* Clinical Status Badge */}
                {isAllClear ? (
                  <span className="px-3 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white shadow flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verified Healthy Smile</span>
                  </span>
                ) : hasAnyIssues ? (
                  <div className="flex items-center gap-1">
                    <span
                      className={`px-3 py-2 rounded-xl text-xs font-black text-white shadow flex items-center gap-1.5 ${
                        activePatient.exam?.severity === 'R'
                          ? 'bg-[#E52629]'
                          : 'bg-amber-500 text-slate-950 font-black'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>
                        {activePatient.exam?.severity === 'R'
                          ? '🚨 URGENT CARE (तत्काळ)'
                          : '⚠️ MEDIUM CARE (मध्यम)'}
                      </span>
                    </span>
                    <div className="flex bg-white/90 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => updateActivePatientExam((ex) => ({ ...ex, severity: 'Y' }))}
                        className={`px-2 py-0.5 rounded ${
                          activePatient.exam?.severity === 'Y'
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'text-slate-500'
                        }`}
                        title="Medium Care"
                      >
                        MED
                      </button>
                      <button
                        type="button"
                        onClick={() => updateActivePatientExam((ex) => ({ ...ex, severity: 'R' }))}
                        className={`px-2 py-0.5 rounded ${
                          activePatient.exam?.severity === 'R'
                            ? 'bg-[#E52629] text-white font-black'
                            : 'text-slate-500'
                        }`}
                        title="Urgent Care"
                      >
                        URG
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="px-3 py-2 rounded-xl text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>⚠️ Examination Pending</span>
                  </span>
                )}
              </div>
            </div>

            {/* 4-Quadrant Tooth Boxes (Palmer Anatomical View) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-[#1B2F5A]">
                  1. Tap Tooth Box ({teethPerQuad} Teeth per Quadrant • Anatomical View)
                </label>
                <div className="flex items-center gap-2.5 text-[11px] font-bold flex-wrap">
                  {visibleToothDiagnoses.map((td) => (
                    <span key={td.id} className="flex items-center gap-1 text-slate-700">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: td.colorHex || '#E52629' }}
                      ></span>
                      <span>{td.name}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                {quadrants.map((quad) => {
                  const orderedLabels = quad.reverse ? [...labels].reverse() : labels;
                  return (
                    <div key={quad.q} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-[11px] font-black text-[#1B2F5A] mb-2 flex justify-between">
                        <span>{quad.title}</span>
                        <span className="text-slate-400 font-mono">{quad.q}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1.5">
                        {orderedLabels.map((lbl) => {
                          const tKey = `${quad.q}${lbl}`;
                          const st = activePatient.exam?.teeth?.[tKey];
                          const isPopOpen = activeToothPopover === tKey;
                          const matchedTd = allToothDiags.find((d) => d.id === st);

                          const badgeStyle = matchedTd
                            ? matchedTd.id === 'M'
                              ? 'bg-[#1B2F5A] text-white border-[#1B2F5A] ring-2 ring-slate-300'
                              : matchedTd.id === 'C_R'
                              ? 'bg-[#E52629] text-white border-[#E52629] ring-2 ring-red-300'
                              : matchedTd.id === 'C_Y'
                              ? 'bg-amber-400 text-slate-950 border-amber-500 ring-2 ring-amber-200'
                              : matchedTd.id === 'R'
                              ? 'bg-orange-500 text-white border-orange-600'
                              : 'text-white'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300';

                          const customStyle = matchedTd && !['M', 'C_R', 'C_Y', 'R'].includes(matchedTd.id)
                            ? { backgroundColor: matchedTd.colorHex, borderColor: matchedTd.colorHex }
                            : undefined;

                          const shortLabel = matchedTd
                            ? matchedTd.id === 'C_R'
                              ? 'CAV-R'
                              : matchedTd.id === 'C_Y'
                              ? 'CAV-Y'
                              : matchedTd.id === 'M'
                              ? 'MISS'
                              : matchedTd.id === 'R'
                              ? 'MILK'
                              : matchedTd.name.slice(0, 4).toUpperCase()
                            : '•';

                          return (
                            <div key={tKey} className="relative flex-1">
                              <button
                                type="button"
                                onClick={() => setActiveToothPopover(isPopOpen ? null : tKey)}
                                style={customStyle}
                                className={`w-full py-2.5 rounded-lg border-2 font-black text-xs transition flex flex-col items-center justify-center ${badgeStyle}`}
                              >
                                <span>{lbl}</span>
                                <span className="text-[9px] leading-none mt-0.5 opacity-90">
                                  {shortLabel}
                                </span>
                              </button>

                              {isPopOpen && (
                                <div className="absolute z-40 top-full mt-1 left-0 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 space-y-1">
                                  <div className="text-[10px] font-black text-slate-400 px-2 py-0.5">
                                    Tooth {tKey} Diagnosis
                                  </div>
                                  {visibleToothDiagnoses.map((td) => (
                                    <button
                                      key={td.id}
                                      type="button"
                                      onClick={() => setToothStatus(tKey, td.id)}
                                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-100 flex items-center justify-between transition"
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <span
                                          className="w-2.5 h-2.5 rounded-full shrink-0"
                                          style={{ backgroundColor: td.colorHex || '#E52629' }}
                                        />
                                        <span className="truncate text-slate-800">{td.name}</span>
                                      </div>
                                      <span
                                        className={`text-[8.5px] px-1.5 py-0.2 rounded font-black shrink-0 ${
                                          td.severity === 'Urgent'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}
                                      >
                                        {td.severity === 'Urgent' ? 'URG' : 'MED'}
                                      </span>
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => setToothStatus(tKey, 'CLEAR')}
                                    className="w-full text-left px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:bg-slate-100 border-t border-slate-100 mt-1"
                                  >
                                    ✕ Clear / Healthy
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Diagnosis Checklist */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#1B2F5A] mb-2">
                2. Diagnosis Checklist for {activeGroup?.ruleGroupName} (English / मराठी)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {(activeGroup?.activeChecks || []).map((chkId) => {
                  const diag =
                    diagnosesList.find((d) => d.id === chkId) || {
                      id: chkId,
                      labelEn: chkId,
                      labelMr: chkId
                    };
                  const isChecked = (activePatient.exam?.flags || []).includes(chkId);
                  return (
                    <button
                      key={chkId}
                      type="button"
                      onClick={() => toggleDiagnosisFlag(chkId)}
                      className={`p-3 rounded-xl border-2 text-left transition flex items-center gap-2.5 ${
                        isChecked
                          ? 'bg-red-50 border-[#E52629] text-[#1B2F5A] shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-xs shrink-0 ${
                          isChecked
                            ? 'bg-[#E52629] text-white'
                            : 'bg-slate-100 text-transparent border border-slate-300'
                        }`}
                      >
                        ✓
                      </div>
                      <div className="leading-tight min-w-0">
                        <div className="text-xs font-black text-[#1B2F5A] truncate">
                          {diag.labelEn}
                        </div>
                        <div className="text-[11px] font-bold text-slate-600 truncate">
                          {diag.labelMr}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advice Template & Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Advice Template (Printed on Card)
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() =>
                        updateActivePatientExam((ex) => ({ ...ex, adviceLanguage: 'en' }))
                      }
                      className={`px-2 py-0.5 rounded text-[10px] font-black transition ${
                        (activePatient.exam?.adviceLanguage || 'mr') === 'en'
                          ? 'bg-[#1B2F5A] text-white shadow'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🇬🇧 EN
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateActivePatientExam((ex) => ({ ...ex, adviceLanguage: 'mr' }))
                      }
                      className={`px-2 py-0.5 rounded text-[10px] font-black transition ${
                        (activePatient.exam?.adviceLanguage || 'mr') === 'mr'
                          ? 'bg-[#1B2F5A] text-white shadow'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🇮🇳 MR
                    </button>
                  </div>
                </div>

                <select
                  value={activePatient.exam?.noteCode || ''}
                  onChange={(e) => {
                    setValidationError('');
                    updateActivePatientExam((ex) => ({ ...ex, noteCode: e.target.value }));
                  }}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold bg-white text-[#1B2F5A] transition ${
                    !activePatient.exam?.noteCode
                      ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/20'
                      : 'border-slate-300'
                  }`}
                >
                  <option value="">
                    {relevantAdviceOptions.length === 0
                      ? '⚠️ Examine patient first to unlock advice options'
                      : '-- Please Select Advice Template --'}
                  </option>
                  {relevantAdviceOptions.map((tpl) => (
                    <option key={tpl.code} value={tpl.code}>
                      {tpl.label} ({(activePatient.exam?.adviceLanguage || 'mr') === 'en' ? 'English' : 'मराठी'})
                    </option>
                  ))}
                </select>

                {activePatient.exam?.noteCode && ADVICE_TEMPLATES[activePatient.exam.noteCode] ? (
                  <p className="text-[10.5px] text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1.5 font-medium leading-relaxed italic">
                    "{activePatient.exam?.customNote ||
                      ((activePatient.exam?.adviceLanguage || 'mr') === 'en'
                        ? (ADVICE_TEMPLATES[activePatient.exam.noteCode]?.textEn || ADVICE_TEMPLATES[activePatient.exam.noteCode]?.adviceEn)
                        : (ADVICE_TEMPLATES[activePatient.exam.noteCode]?.textMr || ADVICE_TEMPLATES[activePatient.exam.noteCode]?.adviceMr))}"
                  </p>
                ) : (
                  <p className="text-[10.5px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1.5 font-semibold">
                    {isExamined
                      ? '👉 Please select an advice template above for this student.'
                      : 'ℹ️ Record dental issues or tap "All Clear" to unlock relevant advice templates.'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Optional Custom Note Override
                </label>
                <textarea
                  rows={3}
                  value={activePatient.exam?.customNote || ''}
                  onChange={(e) =>
                    updateActivePatientExam((ex) => ({ ...ex, customNote: e.target.value }))
                  }
                  placeholder={`Leave blank to use selected ${(activePatient.exam?.adviceLanguage || 'mr') === 'en' ? 'English' : 'Marathi'} advice...`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white resize-none"
                />
              </div>
            </div>

            {/* Validation Banner if Doctor Tries to Save Prematurely */}
            {validationError && (
              <div className="p-3 rounded-xl bg-red-50 border-2 border-red-300 text-[#E52629] text-xs font-bold flex items-center gap-2 shadow-sm animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#E52629]" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {!isExamined ? (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>⚠️ Examination Incomplete (Mark issues or tap All Clear)</span>
                  </span>
                ) : !hasSelectedAdvice ? (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>⚠️ Advice Selection Pending (Select template above)</span>
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>✅ Ready to Save (#{activePatient.rollNo} {activePatient.name})</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAndNext}
                  className={`px-6 py-3 rounded-xl font-black text-xs shadow-md flex items-center gap-2 transition ${
                    isExamined && hasSelectedAdvice
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300'
                      : 'bg-[#1B2F5A] hover:bg-slate-800 text-white'
                  }`}
                >
                  <span>Save & Load Next Student</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            No students in this class yet. Click &ldquo;+ Quick Add&rdquo; or import via Excel.
          </div>
        )}
      </div>
    </div>
  );
};
