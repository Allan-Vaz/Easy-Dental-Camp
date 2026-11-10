import React, { useState, useEffect } from 'react';
import {
  Building2, Calendar, Upload, FileSpreadsheet, Check,
  ChevronRight, ChevronLeft, AlertTriangle, Layers, Users, Sparkles
} from 'lucide-react';
import {
  generateCampCode,
  calculateVoucherExpiry
} from '../utils/clinicalEvaluator';
import { parseRosterFile } from '../utils/rosterParser';

export const OnboardingWizard = ({
  clinicProfile,
  onCreateCamp,
  showToast,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Institute Basics State
  const [instituteName, setInstituteName] = useState('');
  const [campDate, setCampDate] = useState(new Date().toISOString().slice(0, 10));
  const [campCode, setCampCode] = useState('');
  const [isManualCampCode, setIsManualCampCode] = useState(false);
  const [voucherExpiryDate, setVoucherExpiryDate] = useState('');
  const [schoolLogoData, setSchoolLogoData] = useState('');
  const [includeStaffSection, setIncludeStaffSection] = useState(true);

  // Auto-generate Camp Code unless manually edited
  useEffect(() => {
    if (!isManualCampCode) {
      setCampCode(generateCampCode(instituteName, campDate));
    }
  }, [instituteName, campDate, isManualCampCode]);

  // Auto-calculate Voucher Expiry Date when Camp Date changes
  useEffect(() => {
    setVoucherExpiryDate(calculateVoucherExpiry(campDate, clinicProfile?.defaultVoucherDays || 30));
  }, [campDate, clinicProfile?.defaultVoucherDays]);

  // Step 2: Roster Ingestion State
  const [parsedRoster, setParsedRoster] = useState(null); // { students, classes, duplicateRollWarnings }
  const [isParsingRoster, setIsParsingRoster] = useState(false);

  // Step 3: Admin-Controlled Pediatric Mapping State
  // Map of className -> teethPerQuad (5, 6, 7, 8)
  const [dentitionRules, setDentitionRules] = useState({});

  // Helper to suggest default teeth per quad based on class name
  const getDefaultDentition = (className) => {
    const s = String(className || '').toLowerCase();
    if (s.includes('staff') || s.includes('teacher') || s.includes('faculty')) return 8;
    if (s.includes('11') || s.includes('12') || s.includes('college')) return 8;
    if (s.includes('8') || s.includes('9') || s.includes('10')) return 7;
    if (s.includes('3') || s.includes('4') || s.includes('5') || s.includes('6') || s.includes('7')) return 6;
    if (s.includes('nursery') || s.includes('kg') || s.includes('1st') || s.includes('2nd') || s.includes('1-') || s.includes('2-')) return 5;
    return 6;
  };

  // When roster is parsed or staff section toggled, initialize dentition rules
  useEffect(() => {
    if (parsedRoster?.classes) {
      const initialRules = {};
      parsedRoster.classes.forEach((cls) => {
        initialRules[cls] = getDefaultDentition(cls);
      });
      if (includeStaffSection) {
        initialRules['Staff & Teachers'] = 8;
      }
      setDentitionRules(initialRules);
    }
  }, [parsedRoster, includeStaffSection]);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setSchoolLogoData(evt.target.result);
      showToast('Uploaded School Logo!');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingRoster(true);
    try {
      const result = await parseRosterFile(file);
      setParsedRoster(result);
      showToast(`Parsed ${result.students.length} students across ${result.classes.length} classes!`);
    } catch (err) {
      console.error(err);
      showToast('Error reading roster file: ' + err.message);
    } finally {
      setIsParsingRoster(false);
      e.target.value = '';
    }
  };

  const handleFinishOnboarding = () => {
    if (!instituteName.trim()) {
      showToast('Please enter School / Institute Name.');
      setCurrentStep(1);
      return;
    }

    const finalClasses = Array.from(new Set([
      ...(parsedRoster?.classes || []),
      ...(includeStaffSection ? ['Staff & Teachers'] : [])
    ]));

    const finalGroups = finalClasses.map((cls) => {
      const teeth = dentitionRules[cls] || getDefaultDentition(cls);
      const isAdultOrStaff = teeth === 8;
      const isKids = teeth === 5;
      return {
        id: cls,
        name: cls,
        teethPerQuad: teeth,
        activeChecks: isKids
          ? ['cavities', 'milk_tooth', 'gums']
          : isAdultOrStaff
          ? ['cavities', 'tartar', 'gums', 'stains']
          : ['cavities', 'tartar', 'alignment', 'milk_tooth', 'gums']
      };
    });

    const newCampObj = {
      id: `CMP_${campCode}_${Date.now().toString().slice(-4)}`,
      campCode: campCode.trim().toUpperCase(),
      instituteName: instituteName.trim(),
      campDate,
      voucherExpiryDate,
      schoolLogoData,
      groups: finalGroups,
      status: 'active'
    };

    onCreateCamp(newCampObj, parsedRoster?.students || []);
  };

  return (
    <div className="max-w-4xl w-full mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden no-print">
      {/* Wizard Header & Progress Bar */}
      <div className="bg-[#1B2F5A] p-6 text-white border-b-4 border-[#E52629]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
              New Institute Setup Wizard
            </span>
            <h1 className="text-xl font-black tracking-tight mt-0.5">
              Onboard School, College or Institute
            </h1>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-white/10 rounded-full border border-white/20">
            Step {currentStep} of 3
          </span>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-3 gap-2 mt-5 text-xs font-bold">
          {[
            { num: 1, label: '1. Institute Basics' },
            { num: 2, label: '2. Student Roster' },
            { num: 3, label: '3. Pediatric Dentition' }
          ].map((st) => (
            <div
              key={st.num}
              className={`py-2 px-3 rounded-xl border text-center transition ${
                currentStep === st.num
                  ? 'bg-white text-[#1B2F5A] border-white shadow'
                  : currentStep > st.num
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                  : 'bg-white/5 text-slate-300 border-white/10'
              }`}
            >
              {st.label}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* ========================================================= */}
        {/* STEP 1: INSTITUTE BASICS                                 */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase text-[#1B2F5A] mb-1.5">
                1. School / Institute Name (English or मराठी) *
              </label>
              <input
                type="text"
                required
                value={instituteName}
                onChange={(e) => setInstituteName(e.target.value)}
                placeholder="e.g. अशोक दादा साबळे विद्यालय, माणगाव or KES English School"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-sm font-bold focus:border-[#1B2F5A] focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Enter either English or Marathi. This exact title prints on student report cards & audit reports.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Camp Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Camp Screening Date *
                </label>
                <input
                  type="date"
                  required
                  value={campDate}
                  onChange={(e) => setCampDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              {/* Auto Camp Code */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">Auto Camp Code *</label>
                  <button
                    type="button"
                    onClick={() => setIsManualCampCode(!isManualCampCode)}
                    className="text-[10px] text-teal-700 font-extrabold hover:underline"
                  >
                    {isManualCampCode ? 'Reset to Auto' : 'Edit Manually'}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={campCode}
                  readOnly={!isManualCampCode}
                  onChange={(e) => {
                    setIsManualCampCode(true);
                    setCampCode(e.target.value.toUpperCase());
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-mono font-black text-xs uppercase ${
                    isManualCampCode
                      ? 'border-[#1B2F5A] bg-white'
                      : 'border-slate-300 bg-slate-50 text-[#1B2F5A]'
                  }`}
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Format: [Initials]-[MonthYear]. Used for voucher codes (e.g. {campCode}-4B-12).
                </p>
              </div>

              {/* Voucher Expiry Date */}
              <div>
                <label className="block text-xs font-bold text-[#E52629] mb-1">
                  Voucher Expiry Date (+30 Days Auto-Urgency) *
                </label>
                <input
                  type="date"
                  required
                  value={voucherExpiryDate}
                  onChange={(e) => setVoucherExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-red-300 bg-red-50/40 text-xs font-bold text-red-900"
                />
              </div>

              {/* School Staff & Teachers Toggle */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                <input
                  type="checkbox"
                  id="staffToggle"
                  checked={includeStaffSection}
                  onChange={(e) => setIncludeStaffSection(e.target.checked)}
                  className="w-5 h-5 accent-[#1B2F5A] rounded cursor-pointer"
                />
                <label htmlFor="staffToggle" className="cursor-pointer select-none">
                  <div className="text-xs font-black text-[#1B2F5A]">
                    Include School Staff & Teachers Section
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Auto-creates an adult examination group (8 teeth/quad) for faculty checkups.
                  </div>
                </label>
              </div>
            </div>

            {/* School Logo Upload */}
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-white border-2 border-[#E52629] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {schoolLogoData ? (
                    <img src={schoolLogoData} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[#1B2F5A] font-black text-xs">शाळा</span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-black text-[#1B2F5A]">School / College Logo</div>
                  <div className="text-[11px] text-slate-500">
                    Upload PNG/JPG emblem to print on the top-left of the A5 report card.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="px-3.5 py-2 rounded-xl bg-[#1B2F5A] text-white text-xs font-bold cursor-pointer hover:bg-slate-800 shadow">
                  Upload Logo
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                {schoolLogoData && (
                  <button
                    type="button"
                    onClick={() => setSchoolLogoData('')}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!instituteName.trim()) {
                    showToast('Please enter the School / Institute Name.');
                    return;
                  }
                  setCurrentStep(2);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#1B2F5A] hover:bg-slate-800 text-white font-black text-xs shadow flex items-center gap-2"
              >
                <span>Next: Upload Student Roster</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: SMART ROSTER INGESTION                          */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-black text-[#1B2F5A]">
                Batch Student Roster Upload for &ldquo;{instituteName}&rdquo;
              </h3>
              <p className="text-xs text-slate-500">
                Upload the school spreadsheet (.xlsx, .xls, or .csv). Column headers like Class, Roll No, Student Name, Age, and Gender are automatically matched.
              </p>
            </div>

            <label className="border-2 border-dashed border-teal-500 bg-teal-50/50 hover:bg-teal-50 transition rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer text-center">
              <FileSpreadsheet className="w-10 h-10 text-teal-600 mb-2" />
              <span className="text-sm font-black text-teal-950">
                {isParsingRoster ? 'Parsing School Spreadsheet...' : 'Click to Upload School Roster (.XLSX / .CSV)'}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Supports Marathi Devanagari text, quoted names with commas, and Roman numerals (IV-A &rarr; 4th-A)
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                disabled={isParsingRoster}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Pre-Flight Inspection Summary */}
            {parsedRoster && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-[#1B2F5A] flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Pre-Flight Roster Inspection</span>
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    Total Students: <strong className="text-[#1B2F5A]">{parsedRoster.students.length}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-white rounded-lg border">
                    <div className="font-black text-base text-[#1B2F5A]">{parsedRoster.classes.length}</div>
                    <div className="text-[10px] text-slate-500">Classes Detected</div>
                  </div>
                  <div className="p-2 bg-white rounded-lg border">
                    <div className="font-black text-base text-emerald-600">{parsedRoster.students.filter(s => s.gender === 'M').length}</div>
                    <div className="text-[10px] text-slate-500">Boys (M)</div>
                  </div>
                  <div className="p-2 bg-white rounded-lg border">
                    <div className="font-black text-base text-teal-600">{parsedRoster.students.filter(s => s.gender === 'F').length}</div>
                    <div className="text-[10px] text-slate-500">Girls (F)</div>
                  </div>
                  <div className="p-2 bg-white rounded-lg border">
                    <div className="font-black text-base text-amber-600">{parsedRoster.duplicateRollWarnings}</div>
                    <div className="text-[10px] text-slate-500">Duplicates Auto-Fixed</div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-600 mb-1">Classes Recognized:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedRoster.classes.map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded-md bg-white border border-slate-300 text-xs font-bold text-[#1B2F5A]">
                        {c} ({parsedRoster.students.filter(s => s.groupId === c).length})
                      </span>
                    ))}
                    {includeStaffSection && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-xs font-bold text-amber-900">
                        + Staff & Teachers
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 flex justify-between gap-2 border-t">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!parsedRoster || parsedRoster.students.length === 0) {
                    showToast('Please upload a student roster spreadsheet to continue.');
                    return;
                  }
                  setCurrentStep(3);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#1B2F5A] hover:bg-slate-800 text-white font-black text-xs shadow flex items-center gap-2"
              >
                <span>Next: Configure Dentition Rules</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: ADMIN-CONTROLLED PEDIATRIC RULE MAPPING          */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#E52629]">
                Admin Dentition Control Matrix
              </span>
              <h3 className="text-base font-black text-[#1B2F5A]">
                Confirm Dentition & Teeth-Per-Quadrant Rules
              </h3>
              <p className="text-xs text-slate-500">
                You have full control. Confirm or adjust the tooth count for each class detected in this school.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {Array.from(new Set([
                ...(parsedRoster?.classes || []),
                ...(includeStaffSection ? ['Staff & Teachers'] : [])
              ])).map((cls) => {
                const curTeeth = dentitionRules[cls] || 6;
                const stuCount = (parsedRoster?.students || []).filter(s => s.groupId === cls).length;

                return (
                  <div
                    key={cls}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div>
                      <div className="text-xs font-black text-[#1B2F5A]">{cls}</div>
                      <div className="text-[10px] text-slate-500">
                        {cls === 'Staff & Teachers' ? 'Faculty & Non-Teaching Staff' : `${stuCount} Students Enrolled`}
                      </div>
                    </div>

                    <select
                      value={curTeeth}
                      onChange={(e) =>
                        setDentitionRules({ ...dentitionRules, [cls]: Number(e.target.value) })
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-black text-xs text-[#1B2F5A] focus:outline-none"
                    >
                      <option value={5}>5 Teeth/Quad (A–E) • Milk</option>
                      <option value={6}>6 Teeth/Quad (1–6) • Mixed</option>
                      <option value={7}>7 Teeth/Quad (1–7) • High School</option>
                      <option value={8}>8 Teeth/Quad (1–8) • Permanent</option>
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Launch Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#1B2F5A] to-[#233d73] text-white flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-black">Ready to Launch &ldquo;{instituteName}&rdquo;!</div>
                <div className="text-xs text-slate-200 mt-0.5">
                  Code: <strong className="font-mono text-amber-300">{campCode}</strong> • {parsedRoster?.students?.length || 0} Students ready on Doctor Pad
                </div>
              </div>
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="px-6 py-3 rounded-xl bg-[#E52629] hover:bg-red-700 text-white font-black text-xs shadow-lg transition flex items-center gap-2 shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Camp Workspace</span>
              </button>
            </div>

            <div className="pt-2 flex justify-start border-t">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
