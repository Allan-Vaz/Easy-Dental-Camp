import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { DentalChartSVG } from './DentalChartSVG';
import { resolveClassRules, formatDisplayDate } from '../utils/clinicalEvaluator';
import { ADVICE_TEMPLATES, DEFAULT_DIAGNOSES, DEFAULT_TOOTH_DIAGNOSES } from '../data/defaultData';

export const DefaultAvmLogoBadge = ({ size = 'md' }) => (
  <div className={`flex items-center gap-1.5 select-none ${size === 'sm' ? 'scale-90' : ''}`}>
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1B2F5A] to-[#0f1d38] border border-[#E52629] flex items-center justify-center text-white shadow">
      <span className="text-lg">🦷</span>
    </div>
    <div className="leading-none text-left">
      <div className="text-[12px] font-black tracking-tight text-[#1B2F5A]">AVM SMILES</div>
      <div className="text-[7.5px] font-bold text-[#E52629] uppercase tracking-wider">
        Dental Wellness
      </div>
      <div className="text-[6.5px] text-slate-500 font-semibold">Mangaon, Raigad</div>
    </div>
  </div>
);

export const DefaultCartoonMascotSVG = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12">
    <ellipse cx="32" cy="30" rx="20" ry="22" fill="#FFFFFF" stroke="#1B2F5A" strokeWidth="2.5" />
    <circle cx="25" cy="26" r="3" fill="#1B2F5A" />
    <circle cx="39" cy="26" r="3" fill="#1B2F5A" />
    <circle cx="26" cy="25" r="1" fill="#FFFFFF" />
    <circle cx="40" cy="25" r="1" fill="#FFFFFF" />
    <path d="M 24 35 Q 32 44 40 35" fill="none" stroke="#E52629" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="20" cy="32" r="3" fill="#fecdd3" />
    <circle cx="44" cy="32" r="3" fill="#fecdd3" />
  </svg>
);

export const A5ReportCard = ({ student, camp, group, diagnosesList = [], toothDiagnosesList = [], clinicProfile }) => {
  const exam = student?.exam || { teeth: {}, flags: [], severity: 'G', noteCode: 'HEALTHY' };
  const resolvedRules = resolveClassRules(camp, student?.groupId || group?.id);
  const teethPerQuad = resolvedRules.teethPerQuad || group?.teethPerQuad || 6;
  const voucherCode = `${camp?.campCode || 'CAMP'}-${student?.groupId}-${student?.rollNo}`;

  // Master Tooth Diagnoses List
  const allToothDiags = toothDiagnosesList && toothDiagnosesList.length > 0
    ? toothDiagnosesList
    : DEFAULT_TOOTH_DIAGNOSES;

  // Clinic branding derived from Master Clinic Profile (with camp fallback)
  const clinicPhone = clinicProfile?.phone || camp?.clinicPhone || '9545660336';
  const clinicAddress = clinicProfile?.clinicAddress || camp?.clinicAddress || 'Trinity Plaza, Morba Road, Mangaon, Raigad';
  const clinicName = clinicProfile?.clinicName || 'AVM SMILES DENTAL WELLNESS';
  const clinicLogo = clinicProfile?.clinicLogoData || camp?.avmLogoData;
  const doctorStamp = clinicProfile?.doctorSignData;
  const voucherPromoGraphic =
    clinicProfile?.voucherPromoImageData || camp?.voucherPromoImageData || camp?.mascotImageData;

  // Promotional Offer Texts (Master Clinic Profile takes precedence, with camp fallback)
  const marathiOffer =
    clinicProfile?.defaultOfferMarathi || camp?.offerTextMarathi || 'मोफत कुटुंब तपासणी + ५०% सूट!';
  const englishOfferLine1 = (
    clinicProfile?.defaultOfferEnglishLine1 || 'FREE Family Consultation'
  ).slice(0, 41);
  const englishOfferLine2 = (
    clinicProfile?.defaultOfferEnglishLine2 ||
    camp?.offerTextEnglish ||
    '+ 50% OFF Scaling & Cleaning for entire family'
  ).slice(0, 41);

  // Detect positive findings on anatomical chart
  const teethValues = Object.values(exam.teeth || {});
  const distinctFindingIds = Array.from(new Set(teethValues));
  const hasPositiveFindings = distinctFindingIds.length > 0;

  // WhatsApp Link
  const cleanPhone = clinicPhone.replace(/\D/g, '');
  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const waMessage = `Hello ${clinicName}, I received the School Dental Report Card for ${student?.name} (Class ${student?.groupId}, Roll No ${student?.rollNo}, Voucher: ${voucherCode}) and want to book the Free Family Consultation & 50% Off Scaling offer.`;
  const targetWaUrl = clinicProfile?.customWaUrl?.trim() || camp?.whatsappCustomUrl?.trim()
    ? (clinicProfile?.customWaUrl || camp?.whatsappCustomUrl).trim()
    : `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`;

  // In-Browser Local QR Code Generation (Zero rate limits, works 100% offline)
  const [qrDataUrl, setQrDataUrl] = useState('');
  useEffect(() => {
    if (camp?.customQrData) {
      setQrDataUrl(camp.customQrData);
    } else {
      QRCode.toDataURL(targetWaUrl, {
        width: 160,
        margin: 1,
        color: { dark: '#1B2F5A', light: '#FFFFFF' }
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => {});
    }
  }, [targetWaUrl, camp?.customQrData]);

  const adviceObj = ADVICE_TEMPLATES[exam.noteCode] || ADVICE_TEMPLATES.HEALTHY;

  // Active check IDs from Rule Group + extra flagged items
  const ruleCheckIds =
    resolvedRules.activeChecks?.length > 0
      ? resolvedRules.activeChecks
      : ['cavities', 'tartar', 'alignment'];
  const extraCheckedIds = (exam.flags || []).filter((f) => !ruleCheckIds.includes(f));
  const displayCheckIds = [...ruleCheckIds, ...extraCheckedIds].slice(0, 4);

  const severityBadgeConfig = {
    R: {
      bg: 'bg-[#E52629] text-white border-[#E52629]',
      titleEn: 'Urgent Action Needed',
      titleMr: 'तत्काळ उपचाराची गरज'
    },
    Y: {
      bg: 'bg-amber-500 text-white border-amber-600',
      titleEn: 'Medium Care Needed',
      titleMr: 'लक्ष देणे आवश्यक'
    },
    G: {
      bg: 'bg-emerald-600 text-white border-emerald-700',
      titleEn: 'Healthy Smile',
      titleMr: 'उत्तम आरोग्य'
    }
  }[exam.severity || 'G'];

  return (
    <div className="a5-report-card w-[148mm] h-[208mm] bg-white border-2 border-[#1B2F5A] rounded-md overflow-hidden flex flex-col text-slate-900 shadow-md print:shadow-none box-border select-none">
      {/* ======================================================= */}
      {/* TOP SECTION: CLINICAL DENTAL REPORT                     */}
      {/* ======================================================= */}
      <div className="flex-shrink-0 flex flex-col bg-white overflow-hidden">
        {/* Header Banner */}
        <div className="grid grid-cols-12 bg-[#1B2F5A] border-b-2 border-[#E52629] shrink-0">
          {/* Left: School Logo & Name */}
          <div className="col-span-6 px-2.5 py-1.5 flex items-center gap-2 text-white">
            {camp?.schoolLogoData ? (
              <img
                src={camp.schoolLogoData}
                alt="School Logo"
                className="w-10 h-10 rounded-full object-contain bg-white p-0.5 border-2 border-[#E52629] shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white border-2 border-[#E52629] flex items-center justify-center shrink-0 text-[#1B2F5A] font-black text-[11px] shadow-inner">
                शाळा
              </div>
            )}
            <div className="leading-tight min-w-0">
              <div className="text-[13px] font-black tracking-tight text-white truncate">
                {camp?.instituteName || 'अशोक दादा साबळे विद्यालय, माणगाव'}
              </div>
              <div className="text-[8.5px] text-slate-200 font-semibold truncate">
                School Dental Health Report (शालेय दंत आरोग्य अहवाल)
              </div>
            </div>
          </div>

          {/* Right: Clinic Details (No 'with', Address & Phone in Brand Navy Blue, Right-Aligned) */}
          <div className="col-span-6 bg-white px-2 py-1 flex items-center justify-between gap-1.5 border-l-4 border-[#E52629]">
            {clinicLogo ? (
              <img
                src={clinicLogo}
                alt="Clinic Logo"
                className="max-h-10 max-w-[85px] object-contain shrink-0"
              />
            ) : (
              <DefaultAvmLogoBadge size="sm" />
            )}
            <div className="text-right leading-none text-[#1B2F5A] min-w-0 flex-1 pl-1">
              <div className="text-[9.5px] font-black uppercase tracking-tight truncate">
                {clinicName}
              </div>
              <div className="text-[7.2px] font-bold text-[#1B2F5A] mt-0.5 leading-tight line-clamp-2">
                {clinicAddress}
              </div>
              <div className="text-[8px] font-extrabold text-[#1B2F5A] mt-0.5">
                📞 {clinicPhone}
              </div>
            </div>
          </div>
        </div>

        {/* Student Demographics Bar */}
        <div className="px-3 py-1 bg-[#f4f7fb] border-b border-[#1B2F5A]/20 text-[10.5px] grid grid-cols-12 gap-y-0.5 items-center shrink-0">
          <div className="col-span-7 flex items-baseline gap-1.5">
            <span className="font-bold text-[#1B2F5A]">Name:</span>
            <span className="font-extrabold text-slate-900 border-b border-[#1B2F5A]/40 flex-1 pb-0.5 truncate">
              {student?.name}
            </span>
          </div>
          <div className="col-span-5 flex items-baseline justify-between gap-2 pl-2">
            <div>
              <span className="font-bold text-[#1B2F5A]">Age: </span>
              <span className="font-extrabold border-b border-[#1B2F5A]/40 px-1.5">
                {student?.age || '-'}
              </span>
            </div>
            <div>
              <span className="font-bold text-[#1B2F5A]">Roll No: </span>
              <span className="font-extrabold border-b border-[#1B2F5A]/40 px-2">
                {student?.rollNo}
              </span>
            </div>
          </div>
          <div className="col-span-6 flex items-baseline gap-1.5">
            <span className="font-bold text-[#1B2F5A]">Class / Section:</span>
            <span className="font-extrabold text-slate-900 border-b border-[#1B2F5A]/40 px-2.5">
              {student?.groupId}
            </span>
          </div>
          <div className="col-span-6 flex items-baseline justify-end gap-1.5">
            <span className="font-bold text-[#1B2F5A]">Checkup Date:</span>
            <span className="font-extrabold text-slate-900 border-b border-[#1B2F5A]/40 px-2">
              {formatDisplayDate(camp?.campDate)}
            </span>
          </div>
        </div>

        {/* Main 2-Column Clinical Diagnostics Area */}
        <div className="grid grid-cols-12 gap-2 px-2.5 py-1.5 bg-white shrink-0">
          {/* Left Column: Visual Tooth Map with Corrected Anatomical View */}
          <div className="col-span-6 bg-[#f8fafd] rounded-md p-1.5 border border-[#1B2F5A]/25 flex flex-col justify-between">
            <div className="w-full text-[10px] font-black text-[#1B2F5A] border-b border-[#1B2F5A]/15 pb-1 text-center uppercase tracking-tight">
              Anatomical Dental Chart
            </div>

            <div className="flex-1 flex items-center justify-center py-0.5">
              <DentalChartSVG teethPerQuad={teethPerQuad} teethData={exam.teeth || {}} toothDiagnosesList={allToothDiags} />
            </div>

            {/* Smart Conditional Legend */}
            <div className="w-full pt-1 border-t border-[#1B2F5A]/15 min-h-[24px] flex items-center">
              {hasPositiveFindings ? (
                <div className="w-full flex flex-wrap items-center justify-center gap-1.5 text-[8px] font-extrabold text-[#1B2F5A]">
                  {distinctFindingIds.map((fId) => {
                    const matchedDiag = allToothDiags.find((d) => d.id === fId);
                    const color = matchedDiag?.colorHex || (fId === 'C_R' ? '#E52629' : fId === 'C_Y' ? '#f59e0b' : fId === 'M' ? '#1B2F5A' : '#ea580c');
                    const nameEn = matchedDiag?.name || fId;
                    const nameMr = fId === 'C_R' ? 'किडलेले दात' : fId === 'C_Y' ? 'सुरुवातीची कीड' : fId === 'M' ? 'दात नाही' : fId === 'R' ? 'दुधाचे दात' : nameEn;

                    return (
                      <div
                        key={fId}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded border"
                        style={{ backgroundColor: `${color}12`, borderColor: `${color}40` }}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border-2 shrink-0 inline-block"
                          style={{ borderColor: color, backgroundColor: `${color}35` }}
                        ></span>
                        <div className="leading-none">
                          <div className="font-black text-[7.5px]" style={{ color }}>{nameEn}</div>
                          <div className="text-[6.5px] text-slate-600 font-bold">{nameMr}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="w-full flex items-center justify-center gap-1 py-0.5 px-1.5 bg-emerald-50 rounded border border-emerald-300 text-emerald-800">
                  <span className="text-amber-500 text-xs">⭐</span>
                  <span className="text-[8px] font-black uppercase tracking-tight text-emerald-900">
                    Healthy Smile / निरोगी दात
                  </span>
                  <span className="text-[7px] font-bold text-emerald-700">
                    (No cavities detected)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Severity Badge + 4 Diagnoses + Advice + Stamp */}
          <div className="col-span-6 bg-[#f8fafd] rounded-md p-1.5 border border-[#1B2F5A]/25 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-black text-[#1B2F5A] border-b border-[#1B2F5A]/15 pb-1 mb-1 uppercase tracking-tight">
                Findings & Severity
              </div>

              {/* Status / Severity Box */}
              <div className="flex items-center justify-between gap-1 mb-1 bg-white p-1 rounded border border-[#1B2F5A]/20">
                <div className="leading-tight shrink-0">
                  <div className="text-[8.5px] font-black text-[#1B2F5A]">Status / स्थिती:</div>
                </div>
                <div className={`flex-1 px-1.5 py-0.5 rounded border text-center shadow-sm ${severityBadgeConfig.bg}`}>
                  <div className="text-[8.5px] font-black uppercase tracking-wide leading-tight">
                    {severityBadgeConfig.titleEn}
                  </div>
                  <div className="text-[9px] font-extrabold leading-none mt-0.5">
                    {severityBadgeConfig.titleMr}
                  </div>
                </div>
              </div>

              {/* Up to 4 Diagnoses Checklist */}
              <div className="space-y-1">
                {displayCheckIds.map((chkId) => {
                  const diag =
                    diagnosesList.find((d) => d.id === chkId) ||
                    DEFAULT_DIAGNOSES.find((d) => d.id === chkId) || {
                      id: chkId,
                      labelEn: chkId,
                      labelMr: chkId
                    };
                  const isChecked = (exam.flags || []).includes(chkId);

                  return (
                    <div
                      key={chkId}
                      className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded border ${
                        isChecked ? 'bg-red-50/90 border-[#E52629]' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 font-black text-[9.5px] ${
                          isChecked
                            ? 'bg-[#E52629] text-white border-[#E52629]'
                            : 'bg-white border-[#1B2F5A]/50'
                        }`}
                      >
                        {isChecked ? '✓' : ''}
                      </div>
                      <div className="leading-none min-w-0">
                        <span className="text-[9px] font-black text-[#1B2F5A] block truncate">
                          {diag.labelEn}
                        </span>
                        <span className="text-[8px] font-bold text-slate-600 block truncate mt-0.5">
                          {diag.labelMr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dentist Advice & Stamp Box */}
            <div className="mt-1 pt-1 border-t border-[#1B2F5A]/20 flex items-end justify-between gap-1.5">
              <div className="flex-1 min-w-0">
                <div className="text-[8px] font-black text-[#1B2F5A]">
                  Dentist Advice / डॉक्टरांचा सल्ला:
                </div>
                <p className="text-[7.5px] leading-snug text-slate-800 font-semibold mt-0.5 line-clamp-3">
                  {exam.customNote
                    ? exam.customNote
                    : ((exam.adviceLanguage || 'mr') === 'en'
                      ? (adviceObj.textEn || adviceObj.adviceEn)
                      : (adviceObj.textMr || adviceObj.adviceMr))}
                </p>
              </div>
              <div className="w-24 border border-dashed border-[#1B2F5A] rounded p-0.5 text-center bg-white shrink-0">
                {doctorStamp ? (
                  <img src={doctorStamp} alt="Stamp" className="max-h-7 max-w-full object-contain mx-auto" />
                ) : (
                  <div className="text-[8.5px] font-serif italic text-[#1B2F5A] font-black truncate">
                    {exam.checkedBy || clinicProfile?.doctorName || 'Dr. Kunal Shet'}
                  </div>
                )}
                <div className="text-[6.2px] text-slate-500 font-bold leading-tight mt-0.5">
                  Doctor Sign / Stamp
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================= */}
      {/* BOTTOM SECTION: DYNAMIC HIGH-IMPACT FAMILY VOUCHER     */}
      {/* ======================================================= */}
      <div className="flex-1 flex flex-col bg-white border-t-2 border-dashed border-[#E52629] overflow-hidden min-h-0">
        {/* Perforation Strip Header */}
        <div className="bg-[#f4f7fb] py-0.5 px-3 flex items-center justify-between text-[7.5px] font-black text-[#1B2F5A] tracking-wider border-b border-[#1B2F5A]/20 shrink-0">
          <span>✂ - - - - - - - - - - कट करा / TEAR HERE - - - - - - - - - - ✂</span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[#E52629]">VOUCHER ID: {voucherCode}</span>
            <span className="text-slate-400 font-bold hidden sm:inline">|</span>
            <span className="text-slate-700 font-bold hidden sm:inline">VALID TILL: {formatDisplayDate(camp?.voucherExpiryDate)}</span>
          </div>
        </div>

        {/* Top Gold Privilege Ribbon */}
        <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 px-3 py-0.5 flex items-center justify-between text-[8px] font-black text-[#1B2F5A] tracking-wide border-b border-amber-500/40 shrink-0 shadow-xs">
          <div className="flex items-center gap-1.5">
            <span>🏷️</span>
            <span className="uppercase tracking-wider">Exclusive Family Privilege Voucher • खास शालेय सवलत कूपन</span>
          </div>
          <div className="font-black text-[7px] bg-[#1B2F5A] text-[#FEF08A] px-2 py-0.5 rounded-full uppercase tracking-wider">
            For Student's Entire Family
          </div>
        </div>

        {/* Voucher Body: Split into Upper Navy & Lower Red */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Top Zone (~60% height): Brand Navy Blue (#1B2F5A) */}
          <div className="h-[60%] bg-[#1B2F5A] px-3.5 py-2 flex items-center justify-between gap-3 text-white overflow-hidden relative">
            {/* Subtle decorative inner border */}
            <div className="absolute inset-1 border border-dashed border-white/15 rounded-xl pointer-events-none"></div>

            {/* Left Side: 3 Equidistant Sub-segments */}
            <div className="flex-1 min-w-0 h-full flex flex-col justify-evenly py-1 relative z-10 pr-2">
              {/* Horizontal Sub-segment 1: Marathi Promotional Line (Crimson Red 3D Shadow, Descenders Protected) */}
              <div className="overflow-visible flex items-center">
                <div
                  className="text-[20px] font-black text-[#FEF08A] tracking-tight leading-[1.3] pb-1"
                  style={{
                    textShadow: '2px 2px 0px #b91c1c, 4px 4px 0px #7f1d1d, 0 0 16px rgba(254,240,138,0.45)'
                  }}
                >
                  {marathiOffer}
                </div>
              </div>

              {/* Horizontal Sub-segment 2: English Promotional Line (Center-aligned, 20px Line 1, Equidistant, Descenders Protected) */}
              <div className="flex flex-col items-center justify-center text-center overflow-visible py-0.5">
                <div
                  className="text-[20px] font-black text-white tracking-tight leading-[1.35] pb-1.5 whitespace-nowrap overflow-visible max-w-full"
                  style={{
                    textShadow:
                      '1px 1px 0px #0A111E, 2px 2px 0px #0A111E, 3px 3px 0px #000000, 3.5px 3.5px 0px #000000'
                  }}
                >
                  {englishOfferLine1}
                </div>
                <div
                  className="text-[13.5px] font-black text-white tracking-wide leading-[1.3] pb-1 mt-0.5 whitespace-nowrap overflow-visible max-w-full"
                  style={{
                    textShadow:
                      '1px 1px 0px #0A111E, 2px 2px 0px #0A111E, 2.5px 2.5px 0px #000000'
                  }}
                >
                  {englishOfferLine2}
                </div>
              </div>

              {/* Horizontal Sub-segment 3: Valid Till Date Pill (Center Aligned, Equidistant, Shorter by ~1/3rd, Stacked Centered Labels, No Colon) */}
              <div className="flex items-center justify-center overflow-visible">
                <div className="w-[68%] max-w-[240px] h-[34px] px-3.5 py-1 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 text-[#1B2F5A] border-2 border-white shadow-lg flex items-center justify-between font-black">
                  <div className="flex flex-col items-center text-center leading-none">
                    <span className="text-[9.5px] font-black tracking-tight text-[#1B2F5A] uppercase text-center">
                      सवलत वैधता
                    </span>
                    <span className="text-[7.5px] font-black text-[#1B2F5A]/85 uppercase tracking-wider mt-0.5 text-center">
                      OFFER VALID TILL
                    </span>
                  </div>
                  <div className="text-[13px] font-black text-[#1B2F5A] font-mono tracking-wide pl-2">
                    {formatDisplayDate(camp?.voucherExpiryDate)}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: 1:1 Square Aspect Ratio Photo (Borderless & Cohesive Soft Glow) */}
            <div className="h-full aspect-square max-w-[42%] shrink-0 flex items-center justify-center relative z-10">
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.5),0_0_20px_rgba(229,38,41,0.25)] flex items-center justify-center bg-transparent">
                {voucherPromoGraphic ? (
                  <img
                    src={voucherPromoGraphic}
                    alt="Family Smiles"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-gradient-to-br from-[#E52629] to-[#991b1b] text-white text-center rounded-2xl">
                    <DefaultCartoonMascotSVG />
                    <span className="text-[8px] font-bold mt-1 text-white/90">Healthy Family Smiles</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Zone (~40% height): Brand Red (#E52629) */}
          <div className="h-[40%] bg-[#E52629] px-3.5 py-1.5 flex items-center justify-between gap-3 text-white overflow-hidden shadow-inner relative">
            {/* Subtle decorative inner border */}
            <div className="absolute inset-1 border border-dashed border-white/20 rounded-xl pointer-events-none"></div>

            {/* Left: Bigger QR Code with Text BELOW it */}
            <div className="flex flex-col items-center shrink-0 relative z-10">
              <div className="w-[72px] h-[72px] p-1 bg-white rounded-xl shadow-lg border-2 border-white flex items-center justify-center shrink-0">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-[7.5px] text-slate-400 text-center">Loading QR...</div>
                )}
              </div>
              <div className="text-[8px] font-black text-white uppercase tracking-wider text-center mt-1 drop-shadow-sm whitespace-nowrap">
                Scan to book appointment
              </div>
            </div>

            {/* Center: Authoritative Clinic Details with Google Reviews, 3-Line Address & Working Hours */}
            <div className="text-center px-1 flex-1 min-w-0 leading-tight relative z-10 flex flex-col items-center justify-center">
              {/* Clinic Name */}
              <div className="text-[12.5px] font-black text-white uppercase tracking-tight drop-shadow-sm truncate">
                {clinicName}
              </div>

              {/* 5 Stars + Google Reviews */}
              <div className="text-[8.5px] font-black text-[#FEF08A] mt-0.5 flex items-center justify-center gap-1 drop-shadow-xs">
                <span>⭐⭐⭐⭐⭐</span>
                <span>{clinicProfile?.googleReviewsText || '4.8 Stars on Google Reviews'}</span>
              </div>

              {/* 3-Line Address: Line 1, Line 2, Line 3 */}
              <div className="text-[8px] font-bold text-white/95 mt-0.5 leading-tight flex flex-col items-center">
                <div>{clinicProfile?.addressLine1 || 'First Floor, Trinity Plaza'}</div>
                <div>{clinicProfile?.addressLine2 || 'Morba Road, Mangaon'}</div>
                <div>{clinicProfile?.addressLine3 || 'Raigad, Maharashtra'}</div>
              </div>

              {/* Working Hours */}
              <div className="text-[7.5px] font-bold text-amber-200 mt-0.5 flex items-center justify-center gap-1">
                <span>🕒 Timing:</span>
                <span>{clinicProfile?.workingHours || '10:00 AM - 8:00 PM (Monday - Saturday)'}</span>
              </div>

              {/* Call / WhatsApp Number Pill */}
              <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-[#1B2F5A] text-[#FEF08A] text-[9px] font-black tracking-wide border border-white/30 shadow-md">
                📞 Call / WhatsApp: +91 {clinicPhone}
              </div>
            </div>

            {/* Right: Clinic Logo Bigger with Preserved Aspect Ratio (No Cropping) */}
            <div className="shrink-0 flex items-center justify-end relative z-10">
              <div className="w-[105px] h-[80px] bg-white p-2 rounded-xl shadow-lg border-2 border-white/90 flex items-center justify-center">
                {clinicLogo ? (
                  <img
                    src={clinicLogo}
                    alt="Clinic Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <DefaultAvmLogoBadge size="md" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
