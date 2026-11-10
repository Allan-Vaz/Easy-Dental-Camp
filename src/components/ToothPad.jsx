import React, { useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { getToothLabels, evaluateClinicalState } from '../utils/clinicalEvaluator';
import { ADVICE_TEMPLATES } from '../data/defaultData';

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
  diagnosesList = []
}) => {
  const [activeToothPopover, setActiveToothPopover] = useState(null);

  const teethPerQuad = activeGroup?.teethPerQuad || 6;
  const labels = getToothLabels(teethPerQuad);

  const setToothStatus = (toothKey, statusValue) => {
    if (!activePatient) return;
    updateActivePatientExam((exam) => {
      const nextTeeth = { ...(exam.teeth || {}) };
      if (!statusValue || statusValue === 'CLEAR') {
        delete nextTeeth[toothKey];
      } else {
        nextTeeth[toothKey] = statusValue;
      }
      const autoEval = evaluateClinicalState(nextTeeth, exam.flags || []);
      return {
        ...exam,
        teeth: nextTeeth,
        flags: autoEval.flags,
        severity: autoEval.severity,
        noteCode: autoEval.noteCode
      };
    });
    setActiveToothPopover(null);
  };

  const toggleDiagnosisFlag = (flagId) => {
    if (!activePatient) return;
    updateActivePatientExam((exam) => {
      const cur = exam.flags || [];
      const nextFlags = cur.includes(flagId) ? cur.filter((f) => f !== flagId) : [...cur, flagId];
      const autoEval = evaluateClinicalState(exam.teeth || {}, nextFlags);
      return {
        ...exam,
        flags: nextFlags,
        severity: autoEval.severity,
        noteCode: autoEval.noteCode
      };
    });
  };

  const handleSaveAndNext = () => {
    if (!activePatient) return;
    updateActivePatientExam((ex) => ex, true);
    showToast(`Saved #${activePatient.rollNo} ${activePatient.name}`);

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

              {/* Severity Override */}
              <div className="flex items-center gap-1.5">
                {[
                  { code: 'G', labelEn: 'Healthy', labelMr: 'उत्तम', color: 'bg-emerald-600' },
                  { code: 'Y', labelEn: 'Medium Care', labelMr: 'मध्यम', color: 'bg-amber-500' },
                  { code: 'R', labelEn: 'Urgent', labelMr: 'तत्काळ', color: 'bg-[#E52629]' }
                ].map((sObj) => {
                  const isCurrent = (activePatient.exam?.severity || 'G') === sObj.code;
                  return (
                    <button
                      key={sObj.code}
                      type="button"
                      onClick={() => updateActivePatientExam((ex) => ({ ...ex, severity: sObj.code }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition border ${
                        isCurrent
                          ? `${sObj.color} text-white border-transparent shadow`
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {sObj.labelEn} / {sObj.labelMr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4-Quadrant Tooth Boxes (Palmer Anatomical View) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-[#1B2F5A]">
                  1. Tap Tooth Box ({teethPerQuad} Teeth per Quadrant • Anatomical View)
                </label>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-[#E52629]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E52629] inline-block"></span>
                    Deep Cavity (Red)
                  </span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                    Early Decay (Yellow)
                  </span>
                  <span className="flex items-center gap-1 text-[#1B2F5A]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1B2F5A] inline-block"></span>
                    Missing (Navy)
                  </span>
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

                          const badgeStyle =
                            st === 'C_R'
                              ? 'bg-[#E52629] text-white border-[#E52629] ring-2 ring-red-300'
                              : st === 'C_Y'
                              ? 'bg-amber-400 text-slate-950 border-amber-500 ring-2 ring-amber-200'
                              : st === 'M'
                              ? 'bg-[#1B2F5A] text-white border-[#1B2F5A] ring-2 ring-slate-300'
                              : st === 'R'
                              ? 'bg-orange-500 text-white border-orange-600'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300';

                          return (
                            <div key={tKey} className="relative flex-1">
                              <button
                                type="button"
                                onClick={() => setActiveToothPopover(isPopOpen ? null : tKey)}
                                className={`w-full py-2.5 rounded-lg border-2 font-black text-xs transition flex flex-col items-center justify-center ${badgeStyle}`}
                              >
                                <span>{lbl}</span>
                                <span className="text-[9px] leading-none mt-0.5 opacity-90">
                                  {st === 'C_R'
                                    ? 'CAV-R'
                                    : st === 'C_Y'
                                    ? 'CAV-Y'
                                    : st === 'M'
                                    ? 'MISS'
                                    : st === 'R'
                                    ? 'MILK'
                                    : '•'}
                                </span>
                              </button>

                              {isPopOpen && (
                                <div className="absolute z-40 top-full mt-1 left-0 w-44 bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 space-y-1">
                                  <div className="text-[10px] font-black text-slate-400 px-2 py-0.5">
                                    Tooth {tKey} Diagnosis
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setToothStatus(tKey, 'C_R')}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-50 hover:bg-[#E52629] hover:text-white text-[#E52629] flex items-center gap-2"
                                  >
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#E52629]"></span>
                                    <span>Deep Cavity (Red)</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setToothStatus(tKey, 'C_Y')}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-800 flex items-center gap-2"
                                  >
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                    <span>Early Cavity (Yellow)</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setToothStatus(tKey, 'M')}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-[#1B2F5A] hover:text-white text-[#1B2F5A] flex items-center gap-2"
                                  >
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#1B2F5A]"></span>
                                    <span>Missing Tooth (Navy)</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setToothStatus(tKey, 'R')}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-800 flex items-center gap-2"
                                  >
                                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                                    <span>Retained Milk Tooth</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setToothStatus(tKey, 'CLEAR')}
                                    className="w-full text-left px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:bg-slate-100"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Advice Template (Printed on Card)
                </label>
                <select
                  value={activePatient.exam?.noteCode || 'HEALTHY'}
                  onChange={(e) =>
                    updateActivePatientExam((ex) => ({ ...ex, noteCode: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                >
                  {Object.values(ADVICE_TEMPLATES).map((tpl) => (
                    <option key={tpl.code} value={tpl.code}>
                      {tpl.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Optional Custom Note Override
                </label>
                <input
                  type="text"
                  value={activePatient.exam?.customNote || ''}
                  onChange={(e) =>
                    updateActivePatientExam((ex) => ({ ...ex, customNote: e.target.value }))
                  }
                  placeholder="Leave blank to use standard Marathi advice..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  updateActivePatientExam(
                    () => ({
                      teeth: {},
                      flags: [],
                      severity: 'G',
                      noteCode: 'HEALTHY',
                      customNote: ''
                    }),
                    true
                  );
                  showToast(`Marked #${activePatient.rollNo} ${activePatient.name} as Healthy`);
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black text-xs border border-emerald-300"
              >
                ✓ All Clear (Healthy Smile)
              </button>

              <button
                type="button"
                onClick={handleSaveAndNext}
                className="px-6 py-3 rounded-xl bg-[#1B2F5A] hover:bg-slate-800 text-white font-black text-xs shadow-md flex items-center gap-2"
              >
                <span>Save & Load Next Student</span>
                <ChevronRight className="w-4 h-4" />
              </button>
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
