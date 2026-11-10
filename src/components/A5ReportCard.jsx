import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { DentalChartSVG } from './DentalChartSVG';
import { resolveClassRules, formatDisplayDate } from '../utils/clinicalEvaluator';
import { ADVICE_TEMPLATES, DEFAULT_DIAGNOSES } from '../data/defaultData';

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

export const A5ReportCard = ({ student, camp, group, diagnosesList = [] }) => {
  const exam = student?.exam || { teeth: {}, flags: [], severity: 'G', noteCode: 'HEALTHY' };
  const resolvedRules = resolveClassRules(camp, student?.groupId || group?.id);
  const teethPerQuad = resolvedRules.teethPerQuad || group?.teethPerQuad || 6;
  const voucherCode = `${camp?.campCode || 'CAMP'}-${student?.groupId}-${student?.rollNo}`;

  // WhatsApp Link
  const cleanPhone = (camp?.clinicPhone || '9545660336').replace(/\D/g, '');
  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const waMessage = `Hello AVM Smiles Dental Clinic, I received the School Dental Report Card for ${student?.name} (Class ${student?.groupId}, Roll No ${student?.rollNo}, Voucher: ${voucherCode}) and want to book the Free Family Consultation & 50% Off Scaling offer.`;
  const targetWaUrl = camp?.whatsappCustomUrl?.trim()
    ? camp.whatsappCustomUrl.trim()
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
      {/* TOP 66.67% (2/3 HEIGHT): CLINICAL DENTAL REPORT SECTION */}
      {/* ======================================================= */}
      <div className="h-[66.67%] flex flex-col justify-between bg-white overflow-hidden">
        {/* Header Banner */}
        <div className="grid grid-cols-12 bg-[#1B2F5A] border-b-2 border-[#E52629] shrink-0">
          {/* Left: School Logo & Name */}
          <div className="col-span-7 px-2.5 py-2 flex items-center gap-2.5 text-white">
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
              <div className="text-[13.5px] font-black tracking-tight text-white truncate">
                {camp?.instituteName || 'अशोक दादा साबळे विद्यालय, माणगाव'}
              </div>
              <div className="text-[9.5px] text-slate-200 font-semibold">
                School Dental Health Report (शालेय दंत आरोग्य अहवाल)
              </div>
            </div>
          </div>

          {/* Right: AVM Smiles Clinic Logo */}
          <div className="col-span-5 bg-white px-2.5 py-1.5 flex items-center justify-end gap-2 border-l-4 border-[#E52629]">
            <span className="text-[9px] font-bold text-slate-500 italic">with</span>
            {camp?.avmLogoData ? (
              <img
                src={camp.avmLogoData}
                alt="AVM Smiles Logo"
                className="max-h-10 max-w-[125px] object-contain"
              />
            ) : (
              <DefaultAvmLogoBadge size="md" />
            )}
          </div>
        </div>

        {/* Student Demographics Bar */}
        <div className="px-3 py-1.5 bg-[#f4f7fb] border-b border-[#1B2F5A]/20 text-[11px] grid grid-cols-12 gap-y-1 items-center shrink-0">
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
        <div className="grid grid-cols-12 gap-2 px-2.5 py-2 flex-1 min-h-0 bg-white">
          {/* Left Column: Visual Tooth Map with Corrected Anatomical View */}
          <div className="col-span-6 bg-[#f8fafd] rounded-md p-2 border border-[#1B2F5A]/25 flex flex-col items-center justify-between">
            <div className="w-full text-[10.5px] font-black text-[#1B2F5A] border-b border-[#1B2F5A]/15 pb-1 text-center uppercase tracking-tight">
              Anatomical Dental Chart
            </div>

            <DentalChartSVG teethPerQuad={teethPerQuad} teethData={exam.teeth || {}} />

            {/* Clear Visual Circle Legend */}
            <div className="w-full grid grid-cols-3 gap-1 pt-1.5 border-t border-[#1B2F5A]/15 text-[8px] font-extrabold text-[#1B2F5A]">
              <div className="flex items-center gap-1 bg-red-50 px-1 py-0.5 rounded border border-[#E52629]/30">
                <span className="w-3 h-3 rounded-full border-2 border-[#E52629] bg-[#E52629]/20 shrink-0 inline-block"></span>
                <div className="leading-none">
                  <div className="text-[#E52629]">Deep Cavity</div>
                  <div className="text-[7px] text-slate-600">किडलेले दात</div>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-amber-50 px-1 py-0.5 rounded border border-amber-400/50">
                <span className="w-3 h-3 rounded-full border-2 border-amber-500 bg-amber-300/30 shrink-0 inline-block"></span>
                <div className="leading-none">
                  <div className="text-amber-800">Early Decay</div>
                  <div className="text-[7px] text-slate-600">सुरुवातीची कीड</div>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 px-1 py-0.5 rounded border border-[#1B2F5A]/40">
                <span className="w-3 h-3 rounded-full border-2 border-[#1B2F5A] bg-[#1B2F5A] text-white text-[7px] flex items-center justify-center shrink-0 leading-none">
                  ✕
                </span>
                <div className="leading-none">
                  <div className="text-[#1B2F5A]">Missing</div>
                  <div className="text-[7px] text-slate-600">दात नाही</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Active Severity Badge + Bilingual Checklist */}
          <div className="col-span-6 bg-[#f8fafd] rounded-md p-2 border border-[#1B2F5A]/25 flex flex-col justify-between">
            <div>
              <div className="text-[10.5px] font-black text-[#1B2F5A] border-b border-[#1B2F5A]/15 pb-1 mb-1.5 uppercase tracking-tight">
                Findings & Severity
              </div>

              {/* Single Highest Severity Box */}
              <div className="flex items-center justify-between gap-1.5 mb-2 bg-white p-1.5 rounded border border-[#1B2F5A]/20">
                <div className="leading-tight shrink-0">
                  <div className="text-[9.5px] font-black text-[#1B2F5A]">Status / स्थिती:</div>
                </div>
                <div className={`flex-1 px-2 py-1 rounded border text-center shadow-sm ${severityBadgeConfig.bg}`}>
                  <div className="text-[9.5px] font-black uppercase tracking-wide leading-tight">
                    {severityBadgeConfig.titleEn}
                  </div>
                  <div className="text-[10px] font-extrabold leading-none mt-0.5">
                    {severityBadgeConfig.titleMr}
                  </div>
                </div>
              </div>

              {/* Bilingual Checkboxes */}
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
                      className={`flex items-center gap-2 px-1.5 py-1 rounded border ${
                        isChecked ? 'bg-red-50/90 border-[#E52629]' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 font-black text-[11px] ${
                          isChecked
                            ? 'bg-[#E52629] text-white border-[#E52629]'
                            : 'bg-white border-[#1B2F5A]/50'
                        }`}
                      >
                        {isChecked ? '✓' : ''}
                      </div>
                      <div className="leading-tight min-w-0">
                        <span className="text-[10px] font-black text-[#1B2F5A] block truncate">
                          {diag.labelEn}
                        </span>
                        <span className="text-[9px] font-bold text-slate-600 block truncate">
                          {diag.labelMr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dentist Note & Signature Stamp */}
            <div className="mt-1.5 pt-1.5 border-t border-[#1B2F5A]/20 flex items-end justify-between gap-1.5">
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-black text-[#1B2F5A]">
                  Dentist Advice / डॉक्टरांचा सल्ला:
                </div>
                <p className="text-[8px] leading-snug text-slate-800 font-semibold mt-0.5 line-clamp-3">
                  {exam.customNote ? exam.customNote : adviceObj.textMr}
                </p>
              </div>
              <div className="w-24 border border-dashed border-[#1B2F5A] rounded p-1 text-center bg-white shrink-0">
                <div className="text-[9.5px] font-serif italic text-[#1B2F5A] font-black truncate">
                  {exam.checkedBy || 'AVM Smiles'}
                </div>
                <div className="text-[6.8px] text-slate-500 font-bold leading-tight">
                  Doctor Sign / Stamp
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================= */}
      {/* BOTTOM 33.33% (1/3 HEIGHT): TEAR-AWAY FAMILY VOUCHER    */}
      {/* ======================================================= */}
      <div className="h-[33.33%] flex flex-col justify-between bg-white border-t-2 border-dashed border-[#E52629] overflow-hidden">
        {/* Perforation Strip Header */}
        <div className="bg-[#f4f7fb] py-0.5 px-3 flex items-center justify-between text-[8.5px] font-black text-[#1B2F5A] tracking-wider border-b border-[#1B2F5A]/20 shrink-0">
          <span>✂ - - - - - - - - - - कट करा / TEAR HERE - - - - - - - - - - ✂</span>
          <span className="font-mono text-[#E52629]">VOUCHER ID: {voucherCode}</span>
        </div>

        {/* Offer Banner */}
        <div className="bg-[#1B2F5A] text-white px-3 py-1.5 flex items-center justify-between gap-2 border-b-2 border-[#E52629] shrink-0">
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-black text-white tracking-tight leading-tight truncate">
              {camp?.offerTextMarathi || 'मोफत कुटुंब तपासणी + ५०% सूट!'}
            </div>
            <div className="text-[10px] font-extrabold text-amber-300 leading-tight truncate">
              {camp?.offerTextEnglish ||
                'FREE Family Consultation + 50% OFF Scaling & Cleaning for entire family'}
            </div>
          </div>
          <div className="shrink-0 bg-white/10 px-2 py-0.5 rounded border border-white/20 text-right">
            <div className="text-[8px] font-semibold text-slate-200">Valid Until:</div>
            <div className="text-[10px] font-black text-[#E52629] bg-white px-1.5 rounded">
              {formatDisplayDate(camp?.voucherExpiryDate)}
            </div>
          </div>
        </div>

        {/* Voucher Body: QR Code, Clinic Details & Booking Info */}
        <div className="grid grid-cols-12 gap-2 px-3 py-1.5 flex-1 items-center bg-white">
          {/* QR Code with Scan Callout */}
          <div className="col-span-4 flex items-center gap-2">
            <div className="w-16 h-16 p-1 bg-white border-2 border-[#1B2F5A] rounded-lg shadow-sm flex items-center justify-center shrink-0">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="text-[9px] text-slate-400 text-center">Loading QR...</div>
              )}
            </div>
            <div className="leading-tight">
              <div className="text-[10px] font-black text-[#1B2F5A]">SCAN TO BOOK</div>
              <div className="text-[8px] text-[#E52629] font-extrabold">WhatsApp अपॉइंटमेंट</div>
              <div className="text-[7.5px] text-slate-500 font-semibold mt-0.5">
                Voucher Code will auto-fill
              </div>
            </div>
          </div>

          {/* Clinic Address & Hours */}
          <div className="col-span-6 pl-1 leading-tight text-slate-800">
            <div className="text-[11px] font-black text-[#1B2F5A]">
              AVM SMILES DENTAL WELLNESS
            </div>
            <div className="text-[8.5px] font-bold text-slate-600 mt-0.5">
              {camp?.clinicAddress || 'Trinity Plaza, Morba Road, Mangaon, Raigad'}
            </div>
            <div className="text-[9px] font-black text-[#E52629] mt-0.5">
              Direct Call / WA: +91 {camp?.clinicPhone || '9545660336'}
            </div>
            <div className="text-[7.5px] text-slate-500 font-semibold">
              Time: 10:00 AM - 8:00 PM (Monday - Saturday)
            </div>
          </div>

          {/* Cartoon Mascot */}
          <div className="col-span-2 flex justify-end">
            {camp?.mascotImageData ? (
              <img
                src={camp.mascotImageData}
                alt="Tooth Mascot"
                className="w-12 h-12 object-contain"
              />
            ) : (
              <DefaultCartoonMascotSVG />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
