import React, { useState } from 'react';
import { Building2, Upload, Trash2, X, Check, Phone, MapPin, Sparkles } from 'lucide-react';
import { DefaultAvmLogoBadge } from './A5ReportCard';

export const ClinicSettingsModal = ({
  isOpen,
  onClose,
  clinicProfile,
  onSaveClinicProfile,
  showToast
}) => {
  const [form, setForm] = useState({ ...clinicProfile });

  if (!isOpen) return null;

  const handleImageUpload = (field) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setForm((prev) => ({ ...prev, [field]: evt.target.result }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveClinicProfile(form);
    showToast('Clinic Master Profile saved successfully!');
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

          {/* Full Clinic Address */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Complete Clinic Address *</label>
            <input
              type="text"
              required
              value={form.clinicAddress}
              onChange={(e) => setForm({ ...form, clinicAddress: e.target.value })}
              placeholder="Trinity Plaza, Morba Road, Mangaon, Raigad"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
            />
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
            <div>
              <label className="block text-slate-600 mb-1">Sub-Offer Description (English)</label>
              <input
                type="text"
                value={form.defaultOfferEnglish}
                onChange={(e) => setForm({ ...form, defaultOfferEnglish: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
              />
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
                  <input type="file" accept="image/*" onChange={handleImageUpload('clinicLogoData')} className="hidden" />
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
                  <input type="file" accept="image/*" onChange={handleImageUpload('doctorSignData')} className="hidden" />
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
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t">
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
        </form>
      </div>
    </div>
  );
};
