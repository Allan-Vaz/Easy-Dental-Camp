import React, { useState, useEffect, useMemo } from 'react';
import {
  Stethoscope, Users, Settings, Printer, Plus, CheckCircle2,
  FileSpreadsheet, Upload, Download, LogOut, Search,
  Building2, Image as ImageIcon, QrCode, Grid, UserPlus,
  Trash2, X, Layers, BarChart3, Lock
} from 'lucide-react';
import {
  db,
  auth,
  isFirebaseConfigured,
  signInAnonymously,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  loadLocalFallback,
  saveLocalFallback
} from './firebase';
import {
  DEFAULT_TOOTH_DIAGNOSES,
  DEFAULT_DIAGNOSES,
  DEFAULT_RULE_GROUPS,
  DEFAULT_STAFF,
  INITIAL_CAMPS,
  INITIAL_PATIENTS,
  DEFAULT_CLINIC_PROFILE
} from './data/defaultData';
import { resolveClassRules } from './utils/clinicalEvaluator';
import { parseRosterFile } from './utils/rosterParser';
import { ToothPad } from './components/ToothPad';
import { PaperGridEntry } from './components/PaperGridEntry';
import { A5ReportCard, DefaultAvmLogoBadge, DefaultCartoonMascotSVG } from './components/A5ReportCard';
import { PrincipalAuditView } from './components/PrincipalAuditView';
import { ClinicSettingsModal } from './components/ClinicSettingsModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { RulesSettingsView } from './components/RulesSettingsView';

export default function App() {
  const [fbUser, setFbUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState(isFirebaseConfigured ? 'syncing' : 'local');

  // Application Data State (Loaded from LocalStorage or pre-seeded defaults)
  const [clinicProfile, setClinicProfile] = useState(() => loadLocalFallback('CLINIC_PROFILE', DEFAULT_CLINIC_PROFILE));
  const [staffList, setStaffList] = useState(() => loadLocalFallback('STAFF', DEFAULT_STAFF));
  const [camps, setCamps] = useState(() => loadLocalFallback('CAMPS', INITIAL_CAMPS));
  const [patients, setPatients] = useState(() => loadLocalFallback('PATIENTS', INITIAL_PATIENTS));
  const [diagnosesList, setDiagnosesList] = useState(() => loadLocalFallback('DIAGNOSES', DEFAULT_DIAGNOSES));
  const [toothDiagnosesList, setToothDiagnosesList] = useState(() => loadLocalFallback('TOOTH_DIAGNOSES', DEFAULT_TOOTH_DIAGNOSES));
  const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);

  // Auto-save to LocalStorage on every change for 100% offline persistence
  useEffect(() => {
    try {
      localStorage.removeItem('undefined');
    } catch (e) {
      console.warn(e);
    }
  }, []);

  useEffect(() => {
    saveLocalFallback('CLINIC_PROFILE', clinicProfile);
  }, [clinicProfile]);

  useEffect(() => {
    saveLocalFallback('STAFF', staffList);
  }, [staffList]);

  useEffect(() => {
    saveLocalFallback('CAMPS', camps);
  }, [camps]);

  useEffect(() => {
    saveLocalFallback('PATIENTS', patients);
  }, [patients]);

  useEffect(() => {
    saveLocalFallback('DIAGNOSES', diagnosesList);
  }, [diagnosesList]);

  useEffect(() => {
    saveLocalFallback('TOOTH_DIAGNOSES', toothDiagnosesList);
  }, [toothDiagnosesList]);

  // Active User Session (PIN Auth)
  const [currentUser, setCurrentUser] = useState(null);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');

  // Navigation
  const [activeTab, setActiveTab] = useState('checkup'); // 'checkup' | 'print' | 'onboarding' | 'settings' | 'staff'
  const [selectedCampId, setSelectedCampId] = useState('CMP_ADSV_2026');
  const [selectedGroupId, setSelectedGroupId] = useState('4th-B');

  // Checkup Mode
  const [checkupMode, setCheckupMode] = useState('pad'); // 'pad' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPatientId, setSelectedPatientId] = useState('CMP_ADSV_2026_4th-B_12');
  const [toastMessage, setToastMessage] = useState('');

  // Quick Add Student
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({
    name: '',
    rollNo: '',
    age: '10',
    gender: 'M',
    groupId: '4th-B'
  });

  // Print Mode
  const [printMode, setPrintMode] = useState('cards'); // 'cards' | 'audit'
  const [onlyPrintChecked, setOnlyPrintChecked] = useState(false);

  // New Camp Form
  const [newCampForm, setNewCampForm] = useState({
    instituteName: '',
    campCode: '',
    campDate: new Date().toISOString().slice(0, 10),
    voucherExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    offerTextMarathi: 'मोफत कुटुंब तपासणी + ५०% सूट!',
    offerTextEnglish: 'FREE Family Consultation + 50% OFF Scaling & Cleaning for entire family',
    groupsInput: 'Nursery, JRKG, SRKG, 1st-A, 2nd-A, 4th-B, 9th-A'
  });

  // Rule Group Builder
  const [newRuleGroupName, setNewRuleGroupName] = useState('');
  const [newRuleGroupTeeth, setNewRuleGroupTeeth] = useState(5);
  const [newDiagForm, setNewDiagForm] = useState({ labelEn: '', labelMr: '', defaultSeverity: 'Y' });

  // Staff Form
  const [newStaffForm, setNewStaffForm] = useState({ username: '', pin: '', role: 'doctor', displayName: '' });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Firebase Real-time sync if configured
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.warn('Firebase Anonymous Auth error:', e);
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => setFbUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !fbUser || !db) return;
    setSyncStatus('syncing');

    const appId = 'avm-smiles-dental-camp';
    const campsCol = collection(db, 'camps');
    const patientsCol = collection(db, 'patients');
    const staffCol = collection(db, 'staff_users');
    const diagCol = collection(db, 'diagnoses');
    const toothDiagCol = collection(db, 'tooth_diagnoses');
    const clinicDoc = doc(db, 'clinic_settings', 'default_profile');

    const unsubClinic = onSnapshot(clinicDoc, (snap) => {
      if (snap.exists()) {
        setClinicProfile(snap.data());
      }
    });

    const unsubCamps = onSnapshot(campsCol, (snap) => {
      if (!snap.empty) {
        setCamps(snap.docs.map((d) => d.data()));
      }
      setSyncStatus('synced');
    });

    const unsubPatients = onSnapshot(patientsCol, (snap) => {
      if (!snap.empty) {
        setPatients(snap.docs.map((d) => d.data()));
      }
    });

    const unsubStaff = onSnapshot(staffCol, (snap) => {
      if (!snap.empty) {
        setStaffList(snap.docs.map((d) => d.data()));
      }
    });

    const unsubDiag = onSnapshot(diagCol, (snap) => {
      if (!snap.empty) {
        setDiagnosesList(snap.docs.map((d) => d.data()));
      }
    });

    const unsubToothDiag = onSnapshot(toothDiagCol, (snap) => {
      if (!snap.empty) {
        setToothDiagnosesList(snap.docs.map((d) => d.data()));
      }
    });

    return () => {
      unsubClinic();
      unsubCamps();
      unsubPatients();
      unsubStaff();
      unsubDiag();
      unsubToothDiag();
    };
  }, [fbUser]);

  // Persistence Helpers
  const saveClinicProfile = async (newProfile) => {
    setClinicProfile(newProfile);
    saveLocalFallback('CLINIC_PROFILE', newProfile);
    if (isFirebaseConfigured && fbUser && db) {
      try {
        await setDoc(doc(db, 'clinic_settings', 'default_profile'), newProfile);
      } catch (e) {
        console.warn('Firestore clinic profile save error:', e);
      }
    }
  };

  const saveCampRecord = async (campObj) => {
    setCamps((prev) => {
      const exists = prev.some((c) => c.id === campObj.id);
      return exists ? prev.map((c) => (c.id === campObj.id ? campObj : c)) : [...prev, campObj];
    });
    if (isFirebaseConfigured && fbUser && db) {
      try {
        await setDoc(doc(db, 'camps', campObj.id), campObj);
      } catch (e) {
        console.warn('Firestore camp save error:', e);
      }
    }
  };

  const savePatientRecord = async (patientObj) => {
    setPatients((prev) => {
      const exists = prev.some((p) => p.id === patientObj.id);
      return exists ? prev.map((p) => (p.id === patientObj.id ? patientObj : p)) : [...prev, patientObj];
    });
    if (isFirebaseConfigured && fbUser && db) {
      try {
        await setDoc(doc(db, 'patients', patientObj.id), patientObj);
      } catch (e) {
        console.warn('Firestore patient save error:', e);
      }
    }
  };

  const saveMasterDiagnosisItem = async (diagItem) => {
    setDiagnosesList((prev) => {
      const exists = prev.some((d) => d.id === diagItem.id);
      return exists ? prev.map((d) => (d.id === diagItem.id ? diagItem : d)) : [...prev, diagItem];
    });
    if (isFirebaseConfigured && fbUser && db) {
      try {
        await setDoc(doc(db, 'diagnoses', diagItem.id), diagItem);
      } catch (e) {
        console.warn('Firestore diagnosis save error:', e);
      }
    }
  };

  const deleteMasterDiagnosisItem = async (diagId) => {
    setDiagnosesList((prev) => prev.filter((d) => d.id !== diagId));
    if (isFirebaseConfigured && fbUser && db) {
      try {
        await deleteDoc(doc(db, 'diagnoses', diagId));
      } catch (e) {
        console.warn('Firestore diagnosis delete error:', e);
      }
    }
    showToast('Removed diagnosis from master list.');
  };

  const saveToothDiagnosis = async (diagItem) => {
    setToothDiagnosesList((prev) => {
      const exists = prev.some((d) => d.id === diagItem.id);
      return exists ? prev.map((d) => (d.id === diagItem.id ? diagItem : d)) : [...prev, diagItem];
    });
    if (isFirebaseConfigured && fbUser && db) {
      try {
        await setDoc(doc(db, 'tooth_diagnoses', diagItem.id), diagItem);
      } catch (e) {
        console.warn('Firestore tooth diagnosis save error:', e);
      }
    }
  };

  const deleteToothDiagnosis = async (diagId) => {
    setToothDiagnosesList((prev) => prev.filter((d) => d.id !== diagId));
    if (isFirebaseConfigured && fbUser && db) {
      try {
        await deleteDoc(doc(db, 'tooth_diagnoses', diagId));
      } catch (e) {
        console.warn('Firestore tooth diagnosis delete error:', e);
      }
    }
    showToast('Removed tooth diagnosis from master list.');
  };

  const updateCampRuleGroups = (nextRuleGroups, extraClassIds = []) => {
    if (!activeCamp) return;
    const allKnownClassIds = new Set([
      ...(activeCamp.groups || []).map((g) => g.id),
      ...nextRuleGroups.flatMap((rg) => rg.classes || []),
      ...extraClassIds
    ]);

    const syncedGroups = Array.from(allKnownClassIds).map((clsId) => {
      const matchedRG = nextRuleGroups.find((rg) => (rg.classes || []).includes(clsId));
      const existingGrp = (activeCamp.groups || []).find((g) => g.id === clsId);
      return {
        id: clsId,
        name: clsId,
        teethPerQuad: matchedRG ? Number(matchedRG.teethPerQuad) : Number(existingGrp?.teethPerQuad) || 6,
        activeToothDiagnoses: matchedRG
          ? matchedRG.activeToothDiagnoses || (toothDiagnosesList || DEFAULT_TOOTH_DIAGNOSES).map((d) => d.id)
          : existingGrp?.activeToothDiagnoses || ['C_R', 'C_Y', 'M', 'R'],
        activeChecks: matchedRG
          ? matchedRG.activeChecks || []
          : existingGrp?.activeChecks || ['cavities', 'tartar', 'alignment']
      };
    });

    saveCampRecord({
      ...activeCamp,
      ruleGroups: nextRuleGroups,
      groups: syncedGroups
    });
  };

  // Derived Active Camp, Group & Patient Lists
  const activeCamp = useMemo(
    () => camps.find((c) => c.id === selectedCampId) || camps[0],
    [camps, selectedCampId]
  );

  const activeGroup = useMemo(() => {
    if (!activeCamp?.groups?.length) return null;
    const rawGrp = activeCamp.groups.find((g) => g.id === selectedGroupId) || activeCamp.groups[0];
    const resolved = resolveClassRules(activeCamp, rawGrp.id);
    return {
      ...rawGrp,
      teethPerQuad: resolved.teethPerQuad,
      activeChecks: resolved.activeChecks,
      ruleGroupName: resolved.ruleGroupName
    };
  }, [activeCamp, selectedGroupId]);

  const campPatients = useMemo(() => {
    if (!activeCamp) return [];
    return patients
      .filter((p) => p.campId === activeCamp.id)
      .sort((a, b) => Number(a.rollNo) - Number(b.rollNo));
  }, [patients, activeCamp]);

  const groupPatients = useMemo(() => {
    if (!activeGroup) return [];
    return campPatients.filter((p) => p.groupId === activeGroup.id);
  }, [campPatients, activeGroup]);

  const filteredGroupPatients = useMemo(() => {
    return groupPatients.filter((p) => {
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.rollNo).includes(searchQuery.trim());
      return matchesStatus && matchesSearch;
    });
  }, [groupPatients, statusFilter, searchQuery]);

  const activePatient = useMemo(() => {
    return (
      groupPatients.find((p) => p.id === selectedPatientId) ||
      filteredGroupPatients[0] ||
      groupPatients[0] ||
      null
    );
  }, [groupPatients, filteredGroupPatients, selectedPatientId]);

  // Keep selected group & patient valid
  useEffect(() => {
    if (activeCamp?.groups?.length) {
      const exists = activeCamp.groups.some((g) => g.id === selectedGroupId);
      if (!exists) setSelectedGroupId(activeCamp.groups[0].id);
    }
  }, [activeCamp, selectedGroupId]);

  useEffect(() => {
    if (groupPatients.length > 0) {
      const exists = groupPatients.some((p) => p.id === selectedPatientId);
      if (!exists) setSelectedPatientId(groupPatients[0].id);
    }
  }, [groupPatients, selectedPatientId]);

  // Authentication
  const handleLogin = (uNameInput, pinInput) => {
    const uName = (uNameInput ?? loginUsername).trim().toLowerCase();
    const uPin = (pinInput ?? loginPin).trim();
    const matched = staffList.find((s) => s.username === uName && s.pin === uPin);
    if (!matched) {
      setLoginError('Invalid Username or PIN.');
      setLoginPin('');
      return;
    }
    setLoginError('');
    setCurrentUser(matched);
    setActiveTab('checkup');
  };

  const handlePinKeyPress = (digit) => {
    if (loginPin.length < 4) {
      const nextPin = loginPin + digit;
      setLoginPin(nextPin);
      if (nextPin.length === 4) {
        handleLogin(loginUsername, nextPin);
      }
    }
  };

  // Checkup Actions
  const updateActivePatientExam = (updaterFn, markChecked = false) => {
    if (!activePatient) return;
    const currentExam = activePatient.exam || {
      teeth: {},
      flags: [],
      severity: 'G',
      noteCode: 'HEALTHY',
      customNote: ''
    };
    const updatedExam = updaterFn(currentExam);
    const updatedPatient = {
      ...activePatient,
      status: markChecked ? 'checked' : activePatient.status,
      exam: {
        ...updatedExam,
        checkedBy: currentUser?.displayName || 'Dr. Kunal Shet',
        updatedAt: new Date().toISOString().slice(0, 10)
      }
    };
    savePatientRecord(updatedPatient);
  };

  // Quick Add Student
  const handleQuickAddSubmit = (e) => {
    e.preventDefault();
    if (!quickAddForm.name.trim() || !activeCamp) return;
    const targetGroupId = quickAddForm.groupId || activeGroup?.id || '4th-B';
    const existingInGroup = campPatients.filter((p) => p.groupId === targetGroupId);
    const nextRoll =
      quickAddForm.rollNo.trim() ||
      (existingInGroup.length > 0
        ? Math.max(...existingInGroup.map((p) => Number(p.rollNo) || 0)) + 1
        : 1);

    const newPatientId = `${activeCamp.id}_${targetGroupId}_${nextRoll}_${Date.now().toString().slice(-3)}`;
    const newPatient = {
      id: newPatientId,
      campId: activeCamp.id,
      groupId: targetGroupId,
      rollNo: nextRoll,
      name: quickAddForm.name.trim(),
      age: Number(quickAddForm.age) || 10,
      gender: quickAddForm.gender || 'M',
      status: 'pending',
      exam: { teeth: {}, flags: [], severity: 'G', noteCode: 'HEALTHY', customNote: '' }
    };

    savePatientRecord(newPatient);
    setSelectedGroupId(targetGroupId);
    setSelectedPatientId(newPatientId);
    setShowQuickAdd(false);
    setQuickAddForm({ name: '', rollNo: '', age: '10', gender: 'M', groupId: targetGroupId });
    showToast(`Added ${newPatient.name} & opened checkup pad!`);
  };

  // Robust Excel / CSV Roster Upload
  const handleRosterFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeCamp) return;

    try {
      const { students: parsedStudents, classes } = await parseRosterFile(file);
      if (!parsedStudents || parsedStudents.length === 0) {
        showToast('No student records found in file.');
        return;
      }

      // Synchronize class groups
      const existingGroupIds = new Set((activeCamp.groups || []).map((g) => g.id));
      const newGroups = [...(activeCamp.groups || [])];
      classes.forEach((cls) => {
        if (!existingGroupIds.has(cls)) {
          const isLower = cls.startsWith('1') || cls.startsWith('2') || cls.startsWith('3');
          newGroups.push({
            id: cls,
            name: cls,
            teethPerQuad: isLower ? 5 : 6,
            activeChecks: isLower
              ? ['cavities', 'milk_tooth', 'gums']
              : ['cavities', 'tartar', 'alignment', 'milk_tooth', 'gums']
          });
        }
      });

      const newPatientRecords = parsedStudents.map((stu, idx) => ({
        id: `${activeCamp.id}_${stu.groupId}_${stu.rollNo || idx + 1}_${Date.now().toString().slice(-4)}_${idx}`,
        campId: activeCamp.id,
        groupId: stu.groupId,
        rollNo: stu.rollNo || idx + 1,
        name: stu.name,
        age: stu.age || 10,
        gender: stu.gender || 'M',
        status: 'pending',
        exam: { teeth: {}, flags: [], severity: 'G', noteCode: 'HEALTHY', customNote: '' }
      }));

      // Update state & persist
      setPatients((prev) => [...prev, ...newPatientRecords]);
      newPatientRecords.forEach((p) => savePatientRecord(p));
      saveCampRecord({ ...activeCamp, groups: newGroups });
      showToast(`Imported ${newPatientRecords.length} students across ${classes.length} classes!`);
    } catch (err) {
      console.error(err);
      showToast('Error reading roster: ' + err.message);
    } finally {
      e.target.value = '';
    }
  };

  // Create Camp from Guided Onboarding Wizard
  const handleCreateCampFromWizard = async (newCampObj, parsedStudents = []) => {
    await saveCampRecord(newCampObj);

    const newPatientRecords = parsedStudents.map((stu, idx) => ({
      id: `${newCampObj.id}_${stu.groupId}_${stu.rollNo || idx + 1}_${Date.now().toString().slice(-4)}_${idx}`,
      campId: newCampObj.id,
      groupId: stu.groupId,
      rollNo: stu.rollNo || idx + 1,
      name: stu.name,
      age: stu.age || 10,
      gender: stu.gender || 'M',
      status: 'pending',
      exam: { teeth: {}, flags: [], severity: 'G', noteCode: 'HEALTHY', customNote: '' }
    }));

    setPatients((prev) => [...prev, ...newPatientRecords]);
    newPatientRecords.forEach((p) => savePatientRecord(p));

    setSelectedCampId(newCampObj.id);
    if (newCampObj.groups?.length > 0) {
      setSelectedGroupId(newCampObj.groups[0].id);
    }
    setActiveTab('checkup');
    showToast(`Successfully launched camp for "${newCampObj.instituteName}" with ${newPatientRecords.length} students!`);
  };

  // Create New Camp
  const handleCreateNewCamp = (e) => {
    e.preventDefault();
    if (!newCampForm.instituteName.trim() || !newCampForm.campCode.trim()) return;

    const parsedGroups = newCampForm.groupsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newCampId = `CMP_${newCampForm.campCode.trim().toUpperCase()}_${Date.now().toString().slice(-4)}`;
    const newCampObj = {
      id: newCampId,
      campCode: newCampForm.campCode.trim().toUpperCase(),
      instituteName: newCampForm.instituteName.trim(),
      instituteNameEn: newCampForm.instituteName.trim(),
      campDate: newCampForm.campDate,
      voucherExpiryDate: newCampForm.voucherExpiryDate,
      offerTextMarathi: newCampForm.offerTextMarathi,
      offerTextEnglish: newCampForm.offerTextEnglish,
      clinicPhone: '9545660336',
      clinicAddress: 'Trinity Plaza, Morba Road, Mangaon, Raigad',
      whatsappCustomUrl: '',
      schoolLogoData: '',
      avmLogoData: '',
      customQrData: '',
      mascotImageData: '',
      ruleGroups: DEFAULT_RULE_GROUPS,
      groups: parsedGroups.map((grpName) => {
        const isKids = grpName.toLowerCase().includes('nursery') || grpName.toLowerCase().includes('kg');
        return {
          id: grpName,
          name: grpName,
          teethPerQuad: isKids ? 5 : 6,
          activeChecks: isKids
            ? ['cavities', 'milk_tooth', 'gums']
            : ['cavities', 'tartar', 'alignment', 'milk_tooth', 'gums']
        };
      })
    };

    saveCampRecord(newCampObj);
    setSelectedCampId(newCampId);
    showToast(`Created camp for ${newCampObj.instituteName}!`);
  };

  const handleBrandImageUpload = (fieldKey, labelName) => (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeCamp) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target.result;
      if (typeof dataUrl === 'string') {
        saveCampRecord({ ...activeCamp, [fieldKey]: dataUrl });
        showToast(`Updated ${labelName} for ${activeCamp.campCode}!`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Pairs for 2-Up A4 Landscape Printing
  const printableGroupStudents = onlyPrintChecked
    ? groupPatients.filter((p) => p.status === 'checked')
    : groupPatients;

  const studentPrintPairs = [];
  for (let i = 0; i < printableGroupStudents.length; i += 2) {
    studentPrintPairs.push(printableGroupStudents.slice(i, i + 2));
  }

  // ==========================================
  // RENDER LOGIN SCREEN IF NOT AUTHENTICATED
  // ==========================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1B2F5A] to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-[#1B2F5A] p-6 text-white text-center border-b-4 border-[#E52629]">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-3 text-3xl shadow-inner border border-white/20">
              🦷
            </div>
            <h1 className="text-xl font-black tracking-tight">AVM SMILES DENTAL CLINIC</h1>
            <p className="text-xs text-slate-200 font-medium mt-0.5">
              Trinity Plaza, Morba Road, Mangaon • Camp & Report System
            </p>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                1-Tap Quick Login
              </label>
              <div className="grid grid-cols-3 gap-2">
                {staffList.map((stf) => (
                  <button
                    key={stf.id}
                    type="button"
                    onClick={() => handleLogin(stf.username, stf.pin)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-[#1B2F5A] hover:bg-slate-50 transition text-left group"
                  >
                    <div className="text-xs font-extrabold text-slate-800 capitalize">
                      {stf.role}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{stf.displayName}</div>
                    <div className="text-[10px] font-mono text-[#E52629] font-bold mt-1">
                      PIN: {stf.pin}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-xs text-slate-400 font-medium">
                OR ENTER PIN
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Staff Username</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="e.g. admin, drkunal"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B2F5A]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700">4-Digit Security PIN</label>
                {loginError && <span className="text-xs font-bold text-red-600">{loginError}</span>}
              </div>
              <div className="flex justify-center gap-3 my-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-black ${
                      loginPin.length > i
                        ? 'border-[#1B2F5A] bg-slate-50 text-[#1B2F5A]'
                        : 'border-slate-200 bg-slate-50 text-slate-300'
                    }`}
                  >
                    {loginPin.length > i ? '•' : ''}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handlePinKeyPress(digit)}
                  className="py-3 rounded-xl bg-slate-100 hover:bg-[#1B2F5A] hover:text-white active:scale-95 transition font-black text-lg text-slate-800 shadow-sm"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setLoginPin('')}
                className="py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handlePinKeyPress('0')}
                className="py-3 rounded-xl bg-slate-100 hover:bg-[#1B2F5A] hover:text-white active:scale-95 transition font-black text-lg text-slate-800 shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleLogin(loginUsername, loginPin)}
                className="py-3 rounded-xl bg-[#E52629] hover:bg-red-700 text-white font-bold text-xs shadow-md"
              >
                Enter
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-teal-400 flex items-center gap-2 text-sm font-semibold no-print animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-[#1B2F5A] text-white shadow-md no-print sticky top-0 z-30 border-b-2 border-[#E52629]">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-[#1B2F5A] flex items-center justify-center font-black text-xl shadow">
              🦷
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-tight">{clinicProfile?.clinicName || 'AVM SMILES DENTAL CAMP'}</h1>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    syncStatus === 'synced'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {isFirebaseConfigured ? (syncStatus === 'synced' ? '● Cloud Synced' : '○ Syncing...') : '● Offline Auto-Save'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wider">Active School:</span>
                <select
                  value={selectedCampId}
                  onChange={(e) => setSelectedCampId(e.target.value)}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-2 py-0.5 rounded border border-white/20 focus:outline-none cursor-pointer"
                >
                  {camps.map((c) => (
                    <option key={c.id} value={c.id} className="text-slate-900 font-bold">
                      {c.instituteName} ({c.campCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('checkup')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'checkup' ? 'bg-white text-[#1B2F5A] shadow' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Checkup Pad</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('print')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'print' ? 'bg-white text-[#1B2F5A] shadow' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Print & School Audit</span>
            </button>

            {currentUser.role === 'admin' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('onboarding')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    activeTab === 'onboarding'
                      ? 'bg-white text-[#1B2F5A] shadow'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Onboard School</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsClinicModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-300/30"
                  title="Configure Clinic Address, Phone, WhatsApp, Logo & Stamp"
                >
                  <Building2 className="w-4 h-4 text-amber-300" />
                  <span>Clinic Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    activeTab === 'settings'
                      ? 'bg-white text-[#1B2F5A] shadow'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Rules & Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('staff')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    activeTab === 'staff'
                      ? 'bg-white text-[#1B2F5A] shadow'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Staff</span>
                </button>
              </>
            )}

            <div className="h-6 w-px bg-white/20 mx-1"></div>

            <div className="flex items-center gap-2 pl-1">
              <div className="text-right leading-none">
                <div className="text-xs font-bold text-white">{currentUser.displayName}</div>
                <div className="text-[10px] text-slate-300 capitalize">{currentUser.role}</div>
              </div>
              <button
                type="button"
                onClick={() => setCurrentUser(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600 transition text-slate-200 hover:text-white"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* QUICK ADD MODAL */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-black text-[#1B2F5A] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#E52629]" />
                <span>Quick Add Student / Staff</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={quickAddForm.name}
                  onChange={(e) => setQuickAddForm({ ...quickAddForm, name: e.target.value })}
                  placeholder="e.g. Snehal Sachin Patil"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Class / Section
                  </label>
                  <select
                    value={quickAddForm.groupId}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, groupId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    {(activeCamp?.groups || []).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Roll No (Optional)
                  </label>
                  <input
                    type="number"
                    value={quickAddForm.rollNo}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, rollNo: e.target.value })}
                    placeholder="Auto-assign"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={quickAddForm.age}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, age: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={quickAddForm.gender}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#1B2F5A] hover:bg-slate-800 text-white font-black text-xs shadow mt-2"
              >
                Add & Open Checkup
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 1: CHECKUP SCREEN */}
      {activeTab === 'checkup' && (
        <main className="max-w-7xl w-full mx-auto p-4 space-y-4 no-print">
          {/* Class Selector Bar */}
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase text-[#1B2F5A] px-2">
                Class / Section:
              </span>
              {(activeCamp?.groups || []).map((g) => {
                const countInGrp = campPatients.filter((p) => p.groupId === g.id).length;
                const doneInGrp = campPatients.filter(
                  (p) => p.groupId === g.id && p.status === 'checked'
                ).length;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGroupId(g.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition flex items-center gap-1.5 ${
                      activeGroup?.id === g.id
                        ? 'bg-[#1B2F5A] text-white border-[#1B2F5A] shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{g.id}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        activeGroup?.id === g.id ? 'bg-[#E52629] text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {doneInGrp}/{countInGrp}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCheckupMode('pad')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    checkupMode === 'pad' ? 'bg-white text-[#1B2F5A] shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Doctor Tooth Pad</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCheckupMode('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    checkupMode === 'grid' ? 'bg-white text-[#1B2F5A] shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Fast Paper-to-Digital Grid</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setQuickAddForm((prev) => ({ ...prev, groupId: activeGroup?.id || '4th-B' }));
                  setShowQuickAdd(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#E52629] hover:bg-red-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Quick Add Student</span>
              </button>
            </div>
          </div>

          {checkupMode === 'pad' ? (
            <ToothPad
              activeCamp={activeCamp}
              activeGroup={activeGroup}
              groupPatients={groupPatients}
              filteredGroupPatients={filteredGroupPatients}
              activePatient={activePatient}
              setSelectedPatientId={setSelectedPatientId}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              updateActivePatientExam={updateActivePatientExam}
              savePatientRecord={savePatientRecord}
              showToast={showToast}
              diagnosesList={diagnosesList}
              toothDiagnosesList={toothDiagnosesList}
            />
          ) : (
            <PaperGridEntry
              activeGroup={activeGroup}
              groupPatients={groupPatients}
              diagnosesList={diagnosesList}
              savePatientRecord={savePatientRecord}
            />
          )}
        </main>
      )}

      {/* TAB 2: PRINT & PRINCIPAL AUDIT */}
      {activeTab === 'print' && (
        <main className="max-w-7xl w-full mx-auto p-4 space-y-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPrintMode('cards')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
                  printMode === 'cards' ? 'bg-[#1B2F5A] text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>2-Up A5 Student Report Cards ({printableGroupStudents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPrintMode('audit')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
                  printMode === 'audit' ? 'bg-[#1B2F5A] text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Consolidated Principal Health Audit</span>
              </button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {printMode === 'cards' && (
                <>
                  <select
                    value={activeGroup?.id || ''}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    {(activeCamp?.groups || []).map((g) => (
                      <option key={g.id} value={g.id}>
                        Class: {g.id}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlyPrintChecked}
                      onChange={(e) => setOnlyPrintChecked(e.target.checked)}
                      className="accent-[#1B2F5A] w-4 h-4"
                    />
                    <span>Only Examined Students</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2.5 rounded-xl bg-[#E52629] hover:bg-red-700 text-white text-xs font-black flex items-center gap-2 shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print 2-Up A5 on A4</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {printMode === 'cards' ? (
            <div className="space-y-8 flex flex-col items-center">
              {studentPrintPairs.map((pair, pageIdx) => (
                <div
                  key={pageIdx}
                  className="print-sheet-a4-landscape bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex flex-col xl:flex-row items-center justify-center gap-6"
                >
                  {pair.map((stu) => (
                    <A5ReportCard
                      key={stu.id}
                      student={stu}
                      camp={activeCamp}
                      group={activeGroup}
                      diagnosesList={diagnosesList}
                      toothDiagnosesList={toothDiagnosesList}
                      clinicProfile={clinicProfile}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <PrincipalAuditView
              activeCamp={activeCamp}
              campPatients={campPatients}
              diagnosesList={diagnosesList}
              clinicProfile={clinicProfile}
            />
          )}
        </main>
      )}

      {/* TAB 3: ONBOARDING WIZARD */}
      {activeTab === 'onboarding' && currentUser.role === 'admin' && (
        <main className="max-w-7xl w-full mx-auto p-4 no-print">
          <OnboardingWizard
            clinicProfile={clinicProfile}
            onCreateCamp={handleCreateCampFromWizard}
            showToast={showToast}
            onCancel={() => setActiveTab('checkup')}
          />
        </main>
      )}

      {/* TAB 4: SETTINGS & RULE GROUPS */}
      {activeTab === 'settings' && currentUser.role === 'admin' && (
        <main className="max-w-7xl w-full mx-auto p-4 no-print">
          <RulesSettingsView
            activeCamp={activeCamp}
            campPatients={campPatients}
            updateCampRuleGroups={updateCampRuleGroups}
            toothDiagnosesList={toothDiagnosesList}
            saveToothDiagnosis={saveToothDiagnosis}
            deleteToothDiagnosis={deleteToothDiagnosis}
            diagnosesList={diagnosesList}
            saveMasterDiagnosisItem={saveMasterDiagnosisItem}
            deleteMasterDiagnosisItem={deleteMasterDiagnosisItem}
            showToast={showToast}
          />
        </main>
      )}

      {/* TAB 5: STAFF */}
      {activeTab === 'staff' && currentUser.role === 'admin' && (
        <main className="max-w-4xl w-full mx-auto p-4 space-y-6 no-print">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-base font-black text-[#1B2F5A]">Clinic Staff Accounts</h2>
            <div className="divide-y divide-slate-200">
              {staffList.map((stf) => (
                <div key={stf.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{stf.displayName}</div>
                    <div className="text-xs text-slate-500">
                      Username: <span className="font-mono">{stf.username}</span> • Role:{' '}
                      <span className="capitalize">{stf.role}</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 rounded">
                    PIN: {stf.pin}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}
      {/* Clinic Master Profile Settings Modal */}
      <ClinicSettingsModal
        isOpen={isClinicModalOpen}
        onClose={() => setIsClinicModalOpen(false)}
        clinicProfile={clinicProfile}
        onSaveClinicProfile={saveClinicProfile}
        showToast={showToast}
      />
    </div>
  );
}
