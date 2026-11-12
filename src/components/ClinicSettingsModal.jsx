import React, { useState, useEffect } from 'react';
import { Building2, Upload, Trash2, X, Check, Phone, MapPin, Sparkles, Image as ImageIcon, Download } from 'lucide-react';
import { DefaultAvmLogoBadge } from './A5ReportCard';

/**
 * Compresses image file client-side to prevent LocalStorage 5MB quota overflow
 * and stay well within Firestore's 1MB document size limit.
 */
const compressImageFile = (file, maxDim = 600, quality = 0.85) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mime, quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result || '');
      img.src = e.target?.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

export const ClinicSettingsModal = ({
  isOpen,
  onClose,
  clinicProfile,
  onSaveClinicProfile,
  showToast
}) => {
  const [form, setForm] = useState({ ...(clinicProfile || {}) });

  // Sync form state whenever modal is opened or clinicProfile updates
  useEffect(() => {
    if (isOpen && clinicProfile) {
      setForm({ ...clinicProfile });
    }
  }, [isOpen, clinicProfile]);

  if (!isOpen) return null;

  const handleImageUpload = (field, maxDim = 600) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedUrl = await compressImageFile(file, maxDim, 0.85);
      setForm((prev) => ({ ...prev, [field]: compressedUrl }));
      showToast('Image uploaded & optimized for safe offline storage!');
    } catch (err) {
      console.warn('Image compression error:', err);
    }
    e.target.value = '';
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(form, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `clinic_master_profile_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Downloaded Clinic Profile backup file!');
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (imported && typeof imported === 'object') {
          setForm((prev) => ({ ...prev, ...imported }));
          showToast('Loaded profile from backup! Click "Save Master Profile" to commit.');
        }
      } catch (err) {
        showToast('Invalid backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveClinicProfile(form);
    showToast('✅ Clinic Master Profile saved permanently!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#1B2F5A] text-white flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#1B2F5A]">Clinic Master Profile</h2>
              <p className="text-xs text-slate-500">
                Persistent clinic branding inherited automatically by all school camps & report cards.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {/* Clinic Name & Doctor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Clinic Name *</label>
              <input
                type="text"
                required
                value={form.clinicName}
                onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-[#1B2F5A]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Examining Doctor Name *</label>
              <input
                type="text"
                required
                value={form.doctorName || 'Dr. Kunal Shet'}
                onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>
          </div>

          {/* Contact Phone & Registration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Clinic Contact / WhatsApp Number *
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value, whatsappNumber: e.target.value })}
                placeholder="9545660336"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Doctor Reg. / Council No.</label>
              <input
                type="text"
                value={form.doctorRegNo || 'Reg. No. A-28491'}
                onChange={(e) => setForm({ ...form, doctorRegNo: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
              />
            </div>
          </div>

          {/* Full Clinic Address & 3-Line Voucher Breakdown */}
          <div className="space-y-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200">
            <label className="block font-bold text-slate-700">Clinic Address (Printed in 3 Lines on Voucher) *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Line 1 (Building / Floor)</span>
                <input
                  type="text"
                  value={form.addressLine1 ?? 'First Floor, Trinity Plaza'}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                  placeholder="First Floor, Trinity Plaza"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Line 2 (Street / Area)</span>
                <input
                  type="text"
                  value={form.addressLine2 ?? 'Morba Road, Mangaon'}
                  onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                  placeholder="Morba Road, Mangaon"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Line 3 (District / State)</span>
                <input
                  type="text"
                  value={form.addressLine3 ?? 'Raigad, Maharashtra'}
                  onChange={(e) => setForm({ ...form, addressLine3: e.target.value })}
                  placeholder="Raigad, Maharashtra"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium text-xs"
                />
              </div>
            </div>
          </div>

          {/* Google Reviews & Working Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Google Reviews Rating Text (Voucher Badge)</label>
              <input
                type="text"
                value={form.googleReviewsText ?? '4.8 Stars on Google Reviews'}
                onChange={(e) => setForm({ ...form, googleReviewsText: e.target.value })}
                placeholder="4.8 Stars on Google Reviews"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-[#1B2F5A]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Clinic Working Hours / Timings</label>
              <input
                type="text"
                value={form.workingHours ?? '10:00 AM - 8:00 PM (Monday - Saturday)'}
                onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
                placeholder="10:00 AM - 8:00 PM (Monday - Saturday)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
              />
            </div>
          </div>

          {/* Default Voucher Offers */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-[#1B2F5A] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#E52629]" />
              <span>Default Family Voucher Offers (Printed on Tear-Away Card)</span>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Offer Headline (Marathi)</label>
              <input
                type="text"
                value={form.defaultOfferMarathi}
                onChange={(e) => setForm({ ...form, defaultOfferMarathi: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 font-bold text-[11px]">English Offer - Line 1</label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {(form.defaultOfferEnglishLine1 || '').length}/41
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={41}
                  value={form.defaultOfferEnglishLine1 ?? 'FREE Family Consultation'}
                  onChange={(e) => setForm({ ...form, defaultOfferEnglishLine1: e.target.value.slice(0, 41) })}
                  placeholder="FREE Family Consultation"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-[#1B2F5A]"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 font-bold text-[11px]">English Offer - Line 2</label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {(form.defaultOfferEnglishLine2 || '').length}/41
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={41}
                  value={form.defaultOfferEnglishLine2 ?? '+ 50% OFF Scaling & Cleaning for entire family'}
                  onChange={(e) => setForm({ ...form, defaultOfferEnglishLine2: e.target.value.slice(0, 41) })}
                  placeholder="+ 50% OFF Scaling & Cleaning for entire family"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Default Voucher Validity (Days from Camp)</label>
              <input
                type="number"
                value={form.defaultVoucherDays || 30}
                onChange={(e) => setForm({ ...form, defaultVoucherDays: Number(e.target.value) || 30 })}
                className="w-28 px-3 py-1.5 rounded-lg border border-slate-300 font-bold"
              />
            </div>
          </div>

          {/* Clinic Logo & Stamp Uploaders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Clinic Logo */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {form.clinicLogoData ? (
                    <img src={form.clinicLogoData} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <DefaultAvmLogoBadge size="sm" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-800">Clinic Logo</div>
                  <div className="text-[10px] text-slate-400">Header of reports</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <label className="px-2.5 py-1.5 rounded-lg bg-[#1B2F5A] text-white text-[10px] font-bold cursor-pointer hover:bg-slate-800">
                  Upload
                  <input type="file" accept="image/*" onChange={handleImageUpload('clinicLogoData', 400)} className="hidden" />
                </label>
                {form.clinicLogoData && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, clinicLogoData: '' })}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Doctor Signature / Stamp */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 p-1">
                  {form.doctorSignData ? (
                    <img src={form.doctorSignData} alt="Stamp" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-[9px] text-slate-400 font-serif italic text-center">Stamp Box</div>
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-800">Doctor Signature / Stamp</div>
                  <div className="text-[10px] text-slate-400">Report & audit stamp</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <label className="px-2.5 py-1.5 rounded-lg bg-[#1B2F5A] text-white text-[10px] font-bold cursor-pointer hover:bg-slate-800">
                  Upload
                  <input type="file" accept="image/*" onChange={handleImageUpload('doctorSignData', 400)} className="hidden" />
                </label>
                {form.doctorSignData && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, doctorSignData: '' })}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Voucher Promotional Banner Graphic */}
            <div className="col-span-1 sm:col-span-2 p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-16 h-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-1">
                  {form.voucherPromoImageData ? (
                    <img src={form.voucherPromoImageData} alt="Promo Graphic" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-xs">Voucher Promotional Graphic / Image</div>
                  <div className="text-[10px] text-slate-500">
                    Appears right-aligned in the top Navy Blue section of the tear-away voucher.
                  </div>
                  <div className="text-[9.5px] text-amber-700 font-medium mt-0.5">
                    💡 Auto-optimized: Large photos are resized to save storage space permanently.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                <label className="px-3 py-1.5 rounded-lg bg-[#1B2F5A] text-white text-[11px] font-bold cursor-pointer hover:bg-slate-800 transition shadow-sm flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Graphic</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload('voucherPromoImageData', 800)} className="hidden" />
                </label>
                {form.voucherPromoImageData && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, voucherPromoImageData: '' })}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Remove graphic"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
                title="Download a backup file of your clinic master profile"
              >
                <Download className="w-3.5 h-3.5 text-[#1B2F5A]" />
                <span>Backup Profile (JSON)</span>
              </button>

              <label
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Restore clinic profile from an exported backup file"
              >
                <Upload className="w-3.5 h-3.5 text-teal-700" />
                <span>Restore Backup</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#1B2F5A] hover:bg-slate-800 text-white font-black shadow flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Master Profile</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
