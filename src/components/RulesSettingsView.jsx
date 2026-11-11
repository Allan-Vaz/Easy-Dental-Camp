import React, { useState, useMemo } from 'react';
import {
  Layers, Plus, Trash2, Check, Edit2, AlertCircle,
  Palette, Sparkles, X, CheckCircle2, ChevronRight,
  ShieldAlert, RefreshCw, FileText
} from 'lucide-react';
import { DEFAULT_RULE_GROUPS, DEFAULT_TOOTH_DIAGNOSES, DEFAULT_DIAGNOSES } from '../data/defaultData';

export const RulesSettingsView = ({
  activeCamp,
  campPatients = [],
  updateCampRuleGroups,
  toothDiagnosesList = [],
  saveToothDiagnosis,
  deleteToothDiagnosis,
  diagnosesList = [],
  saveMasterDiagnosisItem,
  deleteMasterDiagnosisItem,
  showToast
}) => {
  // Navigation sub-tab or unified scroll view
  const [activeSection, setActiveSection] = useState('all'); // 'all' | 'groups' | 'tooth' | 'checklist'

  // New Rule Group form state
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupTeeth, setNewGroupTeeth] = useState(6);

  // Group editing state: { [groupId]: { name, teethPerQuad, newClassInput } }
  const [classInputMap, setClassInputMap] = useState({});

  // New Tooth Diagnosis Form State
  const [showAddToothDiag, setShowAddToothDiag] = useState(false);
  const [newToothDiag, setNewToothDiag] = useState({
    name: '',
    severity: 'Medium',
    colorHex: '#ea580c',
    adviceEn: '',
    adviceMr: ''
  });

  // New Checklist Diagnosis Form State
  const [showAddChecklistDiag, setShowAddChecklistDiag] = useState(false);
  const [newChecklistDiag, setNewChecklistDiag] = useState({
    labelEn: '',
    labelMr: '',
    defaultSeverity: 'Medium',
    adviceEn: '',
    adviceMr: ''
  });

  // Safe Arrays (guaranteed to be arrays even if local storage has corrupt data)
  const safeToothDiagnoses = useMemo(() => {
    return Array.isArray(toothDiagnosesList) && toothDiagnosesList.length > 0
      ? toothDiagnosesList
      : DEFAULT_TOOTH_DIAGNOSES;
  }, [toothDiagnosesList]);

  const safeDiagnosesList = useMemo(() => {
    const list = Array.isArray(diagnosesList) && diagnosesList.length > 0
      ? diagnosesList
      : DEFAULT_DIAGNOSES;
    if (!list.some((d) => d.id === 'healthy')) {
      const defaultHealthy = DEFAULT_DIAGNOSES.find((d) => d.id === 'healthy');
      return defaultHealthy ? [defaultHealthy, ...list] : list;
    }
    return list;
  }, [diagnosesList]);

  const ruleGroups = useMemo(() => {
    return Array.isArray(activeCamp?.ruleGroups) && activeCamp.ruleGroups.length > 0
      ? activeCamp.ruleGroups
      : DEFAULT_RULE_GROUPS;
  }, [activeCamp]);

  // Compute all unique classes from camp roster/patients
  const allKnownClasses = useMemo(() => {
    const classSet = new Set();
    // From camp groups
    if (Array.isArray(activeCamp?.groups)) {
      activeCamp.groups.forEach((g) => {
        if (g && g.id) classSet.add(g.id);
      });
    }
    // From patients
    if (Array.isArray(campPatients)) {
      campPatients.forEach((p) => {
        if (p && p.groupId) classSet.add(p.groupId);
      });
    }
    // From current rule groups
    ruleGroups.forEach((rg) => {
      if (Array.isArray(rg?.classes)) {
        rg.classes.forEach((c) => classSet.add(c));
      }
    });
    return Array.from(classSet).sort();
  }, [activeCamp, campPatients, ruleGroups]);

  // Compute which classes are currently unassigned to any rule group
  const unassignedClasses = useMemo(() => {
    const assigned = new Set(ruleGroups.flatMap((rg) => (Array.isArray(rg?.classes) ? rg.classes : [])));
    return allKnownClasses.filter((c) => !assigned.has(c));
  }, [allKnownClasses, ruleGroups]);

  // Handler: Strict 1-group-per-class assignment
  const handleAssignClass = (targetGroupId, className) => {
    const cleanName = String(className || '').trim();
    if (!cleanName) return;

    const nextGroups = ruleGroups.map((rg) => {
      // Strip class from all other groups
      const stripped = (Array.isArray(rg.classes) ? rg.classes : []).filter(
        (c) => String(c).toLowerCase() !== cleanName.toLowerCase()
      );
      if (rg.id === targetGroupId) {
        return {
          ...rg,
          classes: [...stripped, cleanName]
        };
      }
      return {
        ...rg,
        classes: stripped
      };
    });

    updateCampRuleGroups(nextGroups, [cleanName]);
    showToast(`Assigned "${cleanName}" to group.`);
  };

  // Handler: Remove class from group
  const handleRemoveClass = (groupId, className) => {
    const nextGroups = ruleGroups.map((rg) => {
      if (rg.id === groupId) {
        return {
          ...rg,
          classes: (Array.isArray(rg.classes) ? rg.classes : []).filter((c) => c !== className)
        };
      }
      return rg;
    });

    updateCampRuleGroups(nextGroups);
    showToast(`Removed "${className}" from group.`);
  };

  // Handler: Update group name or teeth per quadrant
  const handleUpdateGroupMeta = (groupId, field, value) => {
    const nextGroups = ruleGroups.map((rg) => {
      if (rg.id === groupId) {
        return {
          ...rg,
          [field]: field === 'teethPerQuad' ? Number(value) : value
        };
      }
      return rg;
    });
    updateCampRuleGroups(nextGroups);
  };

  // Handler: Toggle active Table 1 Tooth Box Diagnosis for a group
  const handleToggleToothDiagForGroup = (groupId, toothDiagId) => {
    const nextGroups = ruleGroups.map((rg) => {
      if (rg.id === groupId) {
        const current = Array.isArray(rg.activeToothDiagnoses)
          ? rg.activeToothDiagnoses
          : safeToothDiagnoses.map((d) => d.id);
        const next = current.includes(toothDiagId)
          ? current.filter((id) => id !== toothDiagId)
          : [...current, toothDiagId];
        return {
          ...rg,
          activeToothDiagnoses: next
        };
      }
      return rg;
    });
    updateCampRuleGroups(nextGroups);
  };

  // Handler: Toggle active Table 2 Checklist Diagnosis for a group
  const handleToggleChecklistDiagForGroup = (groupId, chkId) => {
    const nextGroups = ruleGroups.map((rg) => {
      if (rg.id === groupId) {
        const current = Array.isArray(rg.activeChecks)
          ? rg.activeChecks
          : safeDiagnosesList.map((d) => d.id);
        const next = current.includes(chkId)
          ? current.filter((id) => id !== chkId)
          : [...current, chkId];
        return {
          ...rg,
          activeChecks: next
        };
      }
      return rg;
    });
    updateCampRuleGroups(nextGroups);
  };

  // Handler: Add new Rule Group
  const handleAddNewGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup = {
      id: `RG_${Date.now().toString().slice(-5)}`,
      name: newGroupName.trim(),
      teethPerQuad: Number(newGroupTeeth) || 6,
      classes: [],
      activeToothDiagnoses: safeToothDiagnoses.map((d) => d.id),
      activeChecks: safeDiagnosesList.map((d) => d.id)
    };

    updateCampRuleGroups([...ruleGroups, newGroup]);
    setNewGroupName('');
    setShowAddGroup(false);
    showToast(`Added Rule Group: ${newGroup.name}`);
  };

  // Handler: Delete Rule Group
  const handleDeleteGroup = (groupId, groupName) => {
    if (ruleGroups.length <= 1) {
      alert('You must have at least one active rule group for the camp.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete rule group "${groupName}"? Classes inside will become unassigned.`)) {
      const nextGroups = ruleGroups.filter((rg) => rg.id !== groupId);
      updateCampRuleGroups(nextGroups);
      showToast(`Deleted rule group: ${groupName}`);
    }
  };

  // Preset color swatches for tooth findings
  const PRESET_COLORS = [
    { label: 'Crimson Red', hex: '#E52629' },
    { label: 'Amber Yellow', hex: '#f59e0b' },
    { label: 'Navy Blue', hex: '#1B2F5A' },
    { label: 'Orange', hex: '#ea580c' },
    { label: 'Emerald Green', hex: '#059669' },
    { label: 'Purple', hex: '#7c3aed' },
    { label: 'Cyan Teal', hex: '#0891b2' },
    { label: 'Slate Gray', hex: '#475569' }
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner & Section Navigation */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E52629] text-white">
              Camp Rules & Master Diagnoses
            </span>
            <span className="text-xs font-bold text-slate-500">
              Institute: <strong className="text-[#1B2F5A]">{activeCamp?.instituteName || 'Dental Camp'}</strong>
            </span>
          </div>
          <h1 className="text-xl font-black text-[#1B2F5A] mt-1">
            Rules, Pediatric Groups & Diagnosis Masters
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Configure class dentition (5-8 teeth), assign classes strictly to one group, select active findings, and edit diagnosis master tables.
          </p>
        </div>

        {/* Section Jump Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveSection('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSection === 'all' ? 'bg-[#1B2F5A] text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Sections
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('groups')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSection === 'groups' ? 'bg-[#1B2F5A] text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Rule Groups ({ruleGroups.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('tooth')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSection === 'tooth' ? 'bg-[#1B2F5A] text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Tooth Findings ({safeToothDiagnoses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('checklist')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSection === 'checklist' ? 'bg-[#1B2F5A] text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Checklist Master ({safeDiagnosesList.length})
          </button>
        </div>
      </div>

      {/* SECTION 1: PEDIATRIC RULE GROUPS */}
      {(activeSection === 'all' || activeSection === 'groups') && (
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#E52629]" />
                <h2 className="text-base font-black text-[#1B2F5A]">
                  1. Pediatric Rule Groups & Class Dentition
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Each class can belong to <strong>only one group</strong>. Pre-select which tooth box findings and screening checklist items are active for that group.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddGroup(!showAddGroup)}
              className="px-3.5 py-2 rounded-xl bg-[#1B2F5A] hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Add New Rule Group</span>
            </button>
          </div>

          {/* Unassigned Classes Quick Shelf */}
          {unassignedClasses.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-bold text-amber-900">
                  Unassigned Classes ({unassignedClasses.length}):
                </span>
                <span className="text-[11px] text-amber-700">
                  Click a class below to quickly assign it to a group:
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {unassignedClasses.map((cls) => (
                  <span
                    key={cls}
                    className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-black shadow-sm"
                  >
                    {cls}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Add Group Inline Form */}
          {showAddGroup && (
            <form onSubmit={handleAddNewGroup} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="text-xs font-black text-[#1B2F5A] uppercase tracking-wider">
                Create New Pediatric Rule Group
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Early Childhood & Kindergarten"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teeth per Quadrant
                  </label>
                  <select
                    value={newGroupTeeth}
                    onChange={(e) => setNewGroupTeeth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white text-[#1B2F5A]"
                  >
                    <option value={5}>5 Teeth/Quad (Primary / Milk Teeth A-E)</option>
                    <option value={6}>6 Teeth/Quad (Mixed Dentition 1-6)</option>
                    <option value={7}>7 Teeth/Quad (Permanent Dentition 1-7)</option>
                    <option value={8}>8 Teeth/Quad (Full Adult Dentition 1-8)</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#1B2F5A] text-white text-xs font-black shadow hover:bg-slate-800"
                  >
                    Save Group
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddGroup(false)}
                    className="px-3 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Rule Groups Cards List */}
          <div className="grid grid-cols-1 gap-5">
            {ruleGroups.map((rg) => {
              const currentTeeth = Number(rg?.teethPerQuad) || 6;
              const groupClasses = Array.isArray(rg?.classes) ? rg.classes : [];
              const groupActiveToothDiags = Array.isArray(rg?.activeToothDiagnoses)
                ? rg.activeToothDiagnoses
                : safeToothDiagnoses.map((d) => d.id);
              const groupActiveChecks = Array.isArray(rg?.activeChecks)
                ? rg.activeChecks
                : safeDiagnosesList.map((d) => d.id);

              return (
                <div
                  key={rg.id}
                  className="p-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-[#1B2F5A]/40 transition space-y-4 shadow-sm"
                >
                  {/* Card Header: Group Name & Teeth Pill Selector & Delete */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                      <div className="w-8 h-8 rounded-xl bg-[#1B2F5A] text-white font-black text-xs flex items-center justify-center shrink-0">
                        {currentTeeth}T
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          Rule Group Name:
                        </label>
                        <input
                          type="text"
                          value={rg.name || ''}
                          onChange={(e) => handleUpdateGroupMeta(rg.id, 'name', e.target.value)}
                          className="font-black text-sm text-[#1B2F5A] border-b border-dashed border-slate-300 focus:border-[#1B2F5A] bg-transparent outline-none w-full"
                          placeholder="Group Name..."
                        />
                      </div>
                    </div>

                    {/* Teeth per Quadrant Radio Pills */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                      {[
                        { val: 5, label: '5T Primary (A-E)' },
                        { val: 6, label: '6T Mixed (1-6)' },
                        { val: 7, label: '7T Perm (1-7)' },
                        { val: 8, label: '8T Full (1-8)' }
                      ].map((t) => (
                        <button
                          key={t.val}
                          type="button"
                          onClick={() => handleUpdateGroupMeta(rg.id, 'teethPerQuad', t.val)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition ${
                            currentTeeth === t.val
                              ? 'bg-[#1B2F5A] text-white shadow'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(rg.id, rg.name)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Delete Group"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Assigned Classes Area */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                        <span>Assigned Classes ({groupClasses.length})</span>
                        <span className="text-[10px] font-bold text-slate-400">
                          (Each class can be in only 1 group)
                        </span>
                      </div>
                      {unassignedClasses.length > 0 && (
                        <div className="text-[11px] font-bold text-[#1B2F5A]">
                          Quick-Add Unassigned:
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Active Class Badges */}
                      {groupClasses.map((cls) => (
                        <span
                          key={cls}
                          className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-300 text-xs font-extrabold text-[#1B2F5A] flex items-center gap-1.5 shadow-sm group"
                        >
                          <span>{cls}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveClass(rg.id, cls)}
                            className="text-slate-400 hover:text-red-600 font-bold ml-1 transition"
                            title={`Remove ${cls} from ${rg.name}`}
                          >
                            ✕
                          </button>
                        </span>
                      ))}

                      {groupClasses.length === 0 && (
                        <span className="text-xs italic text-slate-400">
                          No classes assigned yet. Add one below or click an unassigned class.
                        </span>
                      )}

                      {/* Quick-add unassigned class pills */}
                      {unassignedClasses.map((cls) => (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => handleAssignClass(rg.id, cls)}
                          className="px-2.5 py-1 rounded-xl border border-dashed border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-black flex items-center gap-1 transition"
                          title={`Assign ${cls} to this group`}
                        >
                          <Plus className="w-3 h-3 text-amber-600" />
                          <span>{cls}</span>
                        </button>
                      ))}

                      {/* Manual Class Input */}
                      <div className="flex items-center gap-1 ml-1">
                        <input
                          type="text"
                          placeholder="+ Class (e.g. 3rd-B)"
                          value={classInputMap[rg.id] || ''}
                          onChange={(e) =>
                            setClassInputMap({ ...classInputMap, [rg.id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = (classInputMap[rg.id] || '').trim();
                              if (val) {
                                handleAssignClass(rg.id, val);
                                setClassInputMap({ ...classInputMap, [rg.id]: '' });
                              }
                            }
                          }}
                          className="px-2.5 py-1 rounded-xl border border-slate-300 text-xs font-bold w-32 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = (classInputMap[rg.id] || '').trim();
                            if (val) {
                              handleAssignClass(rg.id, val);
                              setClassInputMap({ ...classInputMap, [rg.id]: '' });
                            }
                          }}
                          className="p-1 rounded-lg bg-[#1B2F5A] text-white hover:bg-slate-800 text-xs font-bold"
                          title="Add Class"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dual Diagnosis Pre-selection Area */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    {/* Column 1: Active Tooth Box Findings (Table 1) */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-black text-[#1B2F5A] flex items-center gap-1.5">
                          <span>🦷 Active Tooth Box Findings (Table 1)</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">
                          {groupActiveToothDiags.length} enabled
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 mb-2">
                        Only checked findings will appear when tapping a tooth for students in this group.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {safeToothDiagnoses.map((td) => {
                          const isActive = groupActiveToothDiags.includes(td.id);
                          return (
                            <button
                              key={td.id}
                              type="button"
                              onClick={() => handleToggleToothDiagForGroup(rg.id, td.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition flex items-center gap-1.5 ${
                                isActive
                                  ? 'bg-white text-[#1B2F5A] border-slate-400 shadow-sm'
                                  : 'bg-slate-200/60 text-slate-400 border-transparent hover:bg-slate-200'
                              }`}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: td.colorHex || '#E52629' }}
                              ></span>
                              <span>{td.name}</span>
                              {isActive && <Check className="w-3 h-3 text-emerald-600 font-black" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Column 2: Active Checklist Diagnoses (Table 2) */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-black text-[#1B2F5A] flex items-center gap-1.5">
                          <span>📋 Active Screening Checklist (Table 2)</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">
                          {groupActiveChecks.length} enabled
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 mb-2">
                        Only checked boxes will appear in the doctor's screening checklist for this group.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {safeDiagnosesList.map((diag) => {
                          const isActive = groupActiveChecks.includes(diag.id);
                          return (
                            <button
                              key={diag.id}
                              type="button"
                              onClick={() => handleToggleChecklistDiagForGroup(rg.id, diag.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition flex items-center gap-1.5 ${
                                isActive
                                  ? 'bg-white text-[#1B2F5A] border-slate-400 shadow-sm'
                                  : 'bg-slate-200/60 text-slate-400 border-transparent hover:bg-slate-200'
                              }`}
                            >
                              <span>{diag.labelEn}</span>
                              <span className="text-[10px] text-slate-500 font-semibold">({diag.labelMr})</span>
                              {isActive && <Check className="w-3 h-3 text-emerald-600 font-black" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 2: TABLE 1 - TOOTH BOX DIAGNOSIS MASTER */}
      {(activeSection === 'all' || activeSection === 'tooth') && (
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#E52629]" />
                <h2 className="text-base font-black text-[#1B2F5A]">
                  2. Table 1: Tooth Box Diagnosis Master (Tooth Diagram Findings)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Define findings that can be tagged to specific teeth. Diagram colors reflect directly on the 4-quadrant anatomical chart and printed student report cards.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddToothDiag(!showAddToothDiag)}
              className="px-3.5 py-2 rounded-xl bg-[#1B2F5A] hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Add Tooth Diagnosis</span>
            </button>
          </div>

          {/* Add Tooth Diagnosis Form */}
          {showAddToothDiag && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="text-xs font-black text-[#1B2F5A] uppercase tracking-wider">
                Create New Tooth Diagram Finding
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Diagnosis Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tooth Fracture / तुटलेला दात"
                    value={newToothDiag.name}
                    onChange={(e) => setNewToothDiag({ ...newToothDiag, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Severity</label>
                  <select
                    value={newToothDiag.severity}
                    onChange={(e) => setNewToothDiag({ ...newToothDiag, severity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white text-[#1B2F5A]"
                  >
                    <option value="Urgent">Urgent (तत्काळ / Red Alert)</option>
                    <option value="Medium">Medium (मध्यम / Yellow Alert)</option>
                  </select>
                </div>
                <div className="md:col-span-5">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Diagram Denoted Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newToothDiag.colorHex}
                      onChange={(e) => setNewToothDiag({ ...newToothDiag, colorHex: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={newToothDiag.colorHex}
                      onChange={(e) => setNewToothDiag({ ...newToothDiag, colorHex: e.target.value })}
                      className="w-24 px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                    />
                    <div className="flex items-center gap-1">
                      {PRESET_COLORS.slice(0, 5).map((pc) => (
                        <button
                          key={pc.hex}
                          type="button"
                          onClick={() => setNewToothDiag({ ...newToothDiag, colorHex: pc.hex })}
                          className="w-5 h-5 rounded-full border border-slate-300 shadow-sm transition hover:scale-110"
                          style={{ backgroundColor: pc.hex }}
                          title={pc.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Advice (English)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="English advice printed on report card..."
                    value={newToothDiag.adviceEn}
                    onChange={(e) => setNewToothDiag({ ...newToothDiag, adviceEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                  />
                </div>

                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Advice (मराठी)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="मराठी सल्ला (Printed on report card)..."
                    value={newToothDiag.adviceMr}
                    onChange={(e) => setNewToothDiag({ ...newToothDiag, adviceMr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddToothDiag(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newToothDiag.name.trim()) return;
                    const id = `TD_${Date.now().toString().slice(-5)}`;
                    saveToothDiagnosis({
                      id,
                      ...newToothDiag
                    });
                    setNewToothDiag({
                      name: '',
                      severity: 'Medium',
                      colorHex: '#ea580c',
                      adviceEn: '',
                      adviceMr: ''
                    });
                    setShowAddToothDiag(false);
                    showToast(`Added tooth finding: ${newToothDiag.name}`);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[#1B2F5A] text-white text-xs font-black shadow hover:bg-slate-800"
                >
                  Save Finding
                </button>
              </div>
            </div>
          )}

          {/* Tooth Diagnoses Master Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1B2F5A] text-white uppercase text-[10px] tracking-wider font-black">
                  <th className="py-3 px-3">Diagnosis Name</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Diagram Color</th>
                  <th className="py-3 px-3">English Advice</th>
                  <th className="py-3 px-3">मराठी सल्ला</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {safeToothDiagnoses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    {/* Diagnosis Name */}
                    <td className="py-2.5 px-3 font-bold text-slate-800 min-w-[150px]">
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) =>
                          saveToothDiagnosis({ ...item, name: e.target.value })
                        }
                        className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-[#1B2F5A] font-bold text-slate-900 bg-transparent"
                      />
                    </td>

                    {/* Severity */}
                    <td className="py-2.5 px-3 min-w-[110px]">
                      <select
                        value={item.severity || 'Medium'}
                        onChange={(e) =>
                          saveToothDiagnosis({ ...item, severity: e.target.value })
                        }
                        className={`px-2 py-1 rounded-lg text-xs font-black border ${
                          item.severity === 'Urgent'
                            ? 'bg-red-50 text-[#E52629] border-red-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="Urgent">Urgent</option>
                        <option value="Medium">Medium</option>
                      </select>
                    </td>

                    {/* Denoted Color */}
                    <td className="py-2.5 px-3 min-w-[130px]">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={item.colorHex || '#E52629'}
                          onChange={(e) =>
                            saveToothDiagnosis({ ...item, colorHex: e.target.value })
                          }
                          className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5"
                        />
                        <span className="font-mono text-[11px] font-bold text-slate-700">
                          {item.colorHex}
                        </span>
                      </div>
                    </td>

                    {/* English Advice */}
                    <td className="py-2.5 px-3 min-w-[200px]">
                      <textarea
                        rows={2}
                        value={item.adviceEn || ''}
                        onChange={(e) =>
                          saveToothDiagnosis({ ...item, adviceEn: e.target.value })
                        }
                        className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-[#1B2F5A] text-[11px] leading-tight text-slate-800 bg-transparent resize-y"
                        placeholder="English advice..."
                      />
                    </td>

                    {/* Marathi Advice */}
                    <td className="py-2.5 px-3 min-w-[200px]">
                      <textarea
                        rows={2}
                        value={item.adviceMr || ''}
                        onChange={(e) =>
                          saveToothDiagnosis({ ...item, adviceMr: e.target.value })
                        }
                        className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-[#1B2F5A] text-[11px] leading-tight text-slate-800 bg-transparent resize-y"
                        placeholder="मराठी सल्ला..."
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete diagnosis "${item.name}"?`)) {
                            deleteToothDiagnosis(item.id);
                            showToast(`Deleted ${item.name}`);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete Diagnosis"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 3: TABLE 2 - DIAGNOSIS CHECKLIST MASTER */}
      {(activeSection === 'all' || activeSection === 'checklist') && (
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#E52629]" />
                <h2 className="text-base font-black text-[#1B2F5A]">
                  3. Table 2: Diagnosis Checklist Master (Screening Flags)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Define screening checkboxes for general dental checkups. Both English and Marathi titles and advice are fully editable.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddChecklistDiag(!showAddChecklistDiag)}
              className="px-3.5 py-2 rounded-xl bg-[#1B2F5A] hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Add Checklist Diagnosis</span>
            </button>
          </div>

          {/* Add Checklist Diagnosis Form */}
          {showAddChecklistDiag && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="text-xs font-black text-[#1B2F5A] uppercase tracking-wider">
                Create New Screening Checklist Item
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    English Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dental Fluorosis"
                    value={newChecklistDiag.labelEn}
                    onChange={(e) =>
                      setNewChecklistDiag({ ...newChecklistDiag, labelEn: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    मराठी नाव (Marathi Name) *
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. फ्लोरोसिस / पांढरे डाग"
                    value={newChecklistDiag.labelMr}
                    onChange={(e) =>
                      setNewChecklistDiag({ ...newChecklistDiag, labelMr: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Severity
                  </label>
                  <select
                    value={newChecklistDiag.defaultSeverity}
                    onChange={(e) =>
                      setNewChecklistDiag({ ...newChecklistDiag, defaultSeverity: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white text-[#1B2F5A]"
                  >
                    <option value="Urgent">Urgent (तत्काळ / Red)</option>
                    <option value="Medium">Medium (मध्यम / Yellow)</option>
                  </select>
                </div>

                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    English Advice
                  </label>
                  <textarea
                    rows={2}
                    placeholder="English advice for report card..."
                    value={newChecklistDiag.adviceEn}
                    onChange={(e) =>
                      setNewChecklistDiag({ ...newChecklistDiag, adviceEn: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                  />
                </div>

                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    मराठी सल्ला (Marathi Advice)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="पालकांसाठी मराठी सल्ला..."
                    value={newChecklistDiag.adviceMr}
                    onChange={(e) =>
                      setNewChecklistDiag({ ...newChecklistDiag, adviceMr: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddChecklistDiag(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newChecklistDiag.labelEn.trim()) return;
                    const id = `diag_${Date.now().toString().slice(-5)}`;
                    saveMasterDiagnosisItem({
                      id,
                      ...newChecklistDiag
                    });
                    setNewChecklistDiag({
                      labelEn: '',
                      labelMr: '',
                      defaultSeverity: 'Medium',
                      adviceEn: '',
                      adviceMr: ''
                    });
                    setShowAddChecklistDiag(false);
                    showToast(`Added checklist item: ${newChecklistDiag.labelEn}`);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[#1B2F5A] text-white text-xs font-black shadow hover:bg-slate-800"
                >
                  Save Item
                </button>
              </div>
            </div>
          )}

          {/* Checklist Master Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1B2F5A] text-white uppercase text-[10px] tracking-wider font-black">
                  <th className="py-3 px-3">English Diagnosis</th>
                  <th className="py-3 px-3">मराठी नाव (Marathi)</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">English Advice</th>
                  <th className="py-3 px-3">मराठी सल्ला</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {safeDiagnosesList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    {/* English Name */}
                    <td className="py-2.5 px-3 font-bold text-slate-800 min-w-[150px]">
                      <input
                        type="text"
                        value={item.labelEn || ''}
                        onChange={(e) =>
                          saveMasterDiagnosisItem({ ...item, labelEn: e.target.value })
                        }
                        className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-[#1B2F5A] font-bold text-slate-900 bg-transparent"
                      />
                    </td>

                    {/* Marathi Name */}
                    <td className="py-2.5 px-3 font-bold text-slate-800 min-w-[150px]">
                      <input
                        type="text"
                        value={item.labelMr || ''}
                        onChange={(e) =>
                          saveMasterDiagnosisItem({ ...item, labelMr: e.target.value })
                        }
                        className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-[#1B2F5A] font-bold text-slate-900 bg-transparent"
                      />
                    </td>

                    {/* Severity */}
                    <td className="py-2.5 px-3 min-w-[110px]">
                      {item.id === 'healthy' ? (
                        <span className="px-2 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-300 inline-block">
                          Healthy
                        </span>
                      ) : (
                        <select
                          value={item.defaultSeverity || 'Medium'}
                          onChange={(e) =>
                            saveMasterDiagnosisItem({ ...item, defaultSeverity: e.target.value })
                          }
                          className={`px-2 py-1 rounded-lg text-xs font-black border ${
                            item.defaultSeverity === 'Urgent' || item.defaultSeverity === 'R'
                              ? 'bg-red-50 text-[#E52629] border-red-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="Urgent">Urgent</option>
                          <option value="Medium">Medium</option>
                        </select>
                      )}
                    </td>

                    {/* English Advice */}
                    <td className="py-2.5 px-3 min-w-[200px]">
                      <textarea
                        rows={2}
                        value={item.adviceEn || ''}
                        onChange={(e) =>
                          saveMasterDiagnosisItem({ ...item, adviceEn: e.target.value })
                        }
                        className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-[#1B2F5A] text-[11px] leading-tight text-slate-800 bg-transparent resize-y"
                        placeholder="English advice..."
                      />
                    </td>

                    {/* Marathi Advice */}
                    <td className="py-2.5 px-3 min-w-[200px]">
                      <textarea
                        rows={2}
                        value={item.adviceMr || ''}
                        onChange={(e) =>
                          saveMasterDiagnosisItem({ ...item, adviceMr: e.target.value })
                        }
                        className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-[#1B2F5A] text-[11px] leading-tight text-slate-800 bg-transparent resize-y"
                        placeholder="मराठी सल्ला..."
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      {item.id !== 'healthy' ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete diagnosis "${item.labelEn}"?`)) {
                              deleteMasterDiagnosisItem(item.id);
                              showToast(`Deleted ${item.labelEn}`);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete Diagnosis"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Core Default
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
