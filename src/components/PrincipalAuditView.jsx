import React from 'react';
import { Download, Printer } from 'lucide-react';
import { formatDisplayDate } from '../utils/clinicalEvaluator';
import { generateAuditReportPDF } from '../utils/pdfExport';
import { DefaultAvmLogoBadge } from './A5ReportCard';

export const PrincipalAuditView = ({ activeCamp, campPatients = [], diagnosesList = [] }) => {
  const checkedStudents = campPatients.filter((p) => p.status === 'checked');
  const redCount = checkedStudents.filter((p) => p.exam?.severity === 'R').length;
  const yellowCount = checkedStudents.filter((p) => p.exam?.severity === 'Y').length;
  const greenCount = checkedStudents.filter((p) => (p.exam?.severity || 'G') === 'G').length;

  const handleDownloadPDF = () => {
    generateAuditReportPDF({
      camp: activeCamp,
      patients: campPatients,
      diagnosesList
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Bar for PDF & Print */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div>
          <h2 className="text-sm font-black text-[#1B2F5A]">Official Principal Health Audit</h2>
          <p className="text-xs text-slate-500">
            Export a tamper-proof official PDF for the school principal or print directly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black flex items-center gap-2 shadow"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF Report</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-[#1B2F5A] hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Print Audit Sheet</span>
          </button>
        </div>
      </div>

      {/* Audit Sheet Content */}
      <div className="print-audit-page max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow-md border-2 border-[#1B2F5A] space-y-6">
        <div className="flex items-center justify-between border-b-2 border-[#E52629] pb-4">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-[#E52629]">
              Consolidated School Dental Health Audit Report
            </div>
            <h1 className="text-2xl font-black text-[#1B2F5A] mt-0.5">
              {activeCamp?.instituteName}
            </h1>
            <p className="text-xs font-bold text-slate-600 mt-1">
              Camp Date: {formatDisplayDate(activeCamp?.campDate)} • Conducted by AVM Smiles Dental
              Wellness, Mangaon
            </p>
          </div>
          <DefaultAvmLogoBadge size="md" />
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-2xl font-black text-[#1B2F5A]">
              {checkedStudents.length} / {campPatients.length}
            </div>
            <div className="text-xs font-bold text-slate-600 mt-1">Students Examined</div>
          </div>
          <div className="p-4 rounded-xl bg-red-50 border border-[#E52629]/40 text-center">
            <div className="text-2xl font-black text-[#E52629]">{redCount}</div>
            <div className="text-xs font-bold text-red-800 mt-1">
              Urgent Care Needed (Red)
            </div>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-center">
            <div className="text-2xl font-black text-amber-600">{yellowCount}</div>
            <div className="text-xs font-bold text-amber-900 mt-1">
              Medium Care / Scaling (Yellow)
            </div>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-center">
            <div className="text-2xl font-black text-emerald-600">{greenCount}</div>
            <div className="text-xs font-bold text-emerald-900 mt-1">
              Healthy Smiles (Green)
            </div>
          </div>
        </div>

        {/* Class-wise Breakdown Table */}
        <div>
          <h3 className="text-sm font-black text-[#1B2F5A] mb-2 uppercase tracking-wide">
            Class-Wise Dental Health Summary
          </h3>
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-[#1B2F5A] text-white">
                <th className="p-2 border border-slate-300">Class</th>
                <th className="p-2 border border-slate-300 text-center">Enrolled</th>
                <th className="p-2 border border-slate-300 text-center">Examined</th>
                <th className="p-2 border border-slate-300 text-center">Healthy (G)</th>
                <th className="p-2 border border-slate-300 text-center">Care (Y)</th>
                <th className="p-2 border border-slate-300 text-center">Urgent (R)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-semibold">
              {(activeCamp?.groups || []).map((g) => {
                const inGrp = campPatients.filter((p) => p.groupId === g.id);
                const doneInGrp = inGrp.filter((p) => p.status === 'checked');
                const gCount = doneInGrp.filter((p) => (p.exam?.severity || 'G') === 'G').length;
                const yCount = doneInGrp.filter((p) => p.exam?.severity === 'Y').length;
                const rCount = doneInGrp.filter((p) => p.exam?.severity === 'R').length;

                return (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className="p-2 border border-slate-300 font-black text-[#1B2F5A]">{g.id}</td>
                    <td className="p-2 border border-slate-300 text-center">{inGrp.length}</td>
                    <td className="p-2 border border-slate-300 text-center font-bold">{doneInGrp.length}</td>
                    <td className="p-2 border border-slate-300 text-center text-emerald-700">{gCount}</td>
                    <td className="p-2 border border-slate-300 text-center text-amber-700">{yCount}</td>
                    <td className="p-2 border border-slate-300 text-center text-[#E52629] font-black">{rCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Doctor Stamp & Signature Box */}
        <div className="pt-6 border-t border-slate-300 flex justify-between items-end text-xs">
          <div>
            <div className="text-slate-500 font-medium">Report Generated On:</div>
            <div className="font-bold text-slate-800">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            <div className="text-[11px] text-slate-500">AVM Smiles Dental Wellness Camp Management System</div>
          </div>
          <div className="w-56 border border-dashed border-[#1B2F5A] rounded-xl p-3 text-center bg-slate-50">
            <div className="text-sm font-serif italic text-[#1B2F5A] font-black">Dr. Kunal Shet</div>
            <div className="text-[10px] text-slate-600 font-bold mt-0.5">Dental Surgeon • Reg. No. A-28491</div>
            <div className="text-[9px] text-slate-400 mt-1">Official Clinic Stamp & Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
};
