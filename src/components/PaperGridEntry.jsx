import React from 'react';
import { evaluateClinicalState } from '../utils/clinicalEvaluator';
import { DEFAULT_DIAGNOSES } from '../data/defaultData';

export const PaperGridEntry = ({
  activeGroup,
  groupPatients = [],
  diagnosesList = [],
  savePatientRecord
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 overflow-x-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-black text-[#1B2F5A]">
            Fast Paper-to-Digital Entry Grid — Class {activeGroup?.id}
          </h3>
          <p className="text-xs text-slate-500">
            Rapidly transcribe paper examination records into digital format.
          </p>
        </div>
      </div>

      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-[#1B2F5A] text-white">
            <th className="p-2.5 rounded-tl-xl">Roll</th>
            <th className="p-2.5">Student Name</th>
            <th className="p-2.5">Affected Teeth (e.g. UR4:C_R, LL5:M)</th>
            {(activeGroup?.activeChecks || []).map((chkId) => {
              const dg =
                diagnosesList.find((d) => d.id === chkId) ||
                DEFAULT_DIAGNOSES.find((d) => d.id === chkId);
              return (
                <th key={chkId} className="p-2.5 text-center">
                  <div className="font-black text-[11px]">{dg?.labelEn || chkId}</div>
                  <div className="text-[9.5px] text-slate-300 font-semibold">{dg?.labelMr || ''}</div>
                </th>
              );
            })}
            <th className="p-2.5 text-center">Severity</th>
            <th className="p-2.5 rounded-tr-xl text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {groupPatients.map((p) => {
            const teethSummary = Object.entries(p.exam?.teeth || {})
              .map(([k, v]) => `${k}:${v}`)
              .join(', ');
            return (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="p-2.5 font-black text-[#1B2F5A]">#{p.rollNo}</td>
                <td className="p-2.5 font-bold">{p.name}</td>
                <td className="p-2.5">
                  <input
                    type="text"
                    defaultValue={teethSummary}
                    placeholder="e.g. UR4:C_R, LL5:C_Y"
                    onBlur={(e) => {
                      const raw = e.target.value.trim();
                      const nextTeeth = {};
                      if (raw) {
                        raw.split(',').forEach((pair) => {
                          const [k, v] = pair.split(':').map((s) => s.trim().toUpperCase());
                          if (k) nextTeeth[k] = v || 'C_R';
                        });
                      }
                      const auto = evaluateClinicalState(nextTeeth, p.exam?.flags || []);
                      savePatientRecord({
                        ...p,
                        status: 'checked',
                        exam: {
                          ...(p.exam || {}),
                          teeth: nextTeeth,
                          flags: auto.flags,
                          severity: auto.severity,
                          noteCode: auto.noteCode
                        }
                      });
                    }}
                    className="w-48 px-2 py-1 rounded border border-slate-300 font-mono text-[11px]"
                  />
                </td>
                {(activeGroup?.activeChecks || []).map((chkId) => {
                  const checked = (p.exam?.flags || []).includes(chkId);
                  return (
                    <td key={chkId} className="p-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const cur = p.exam?.flags || [];
                          const nextFlags = checked
                            ? cur.filter((f) => f !== chkId)
                            : [...cur, chkId];
                          const auto = evaluateClinicalState(p.exam?.teeth || {}, nextFlags);
                          savePatientRecord({
                            ...p,
                            status: 'checked',
                            exam: {
                              ...(p.exam || {}),
                              flags: nextFlags,
                              severity: auto.severity,
                              noteCode: auto.noteCode
                            }
                          });
                        }}
                        className="w-4 h-4 accent-[#E52629] cursor-pointer"
                      />
                    </td>
                  );
                })}
                <td className="p-2.5 text-center">
                  <select
                    value={p.exam?.severity || 'G'}
                    onChange={(e) =>
                      savePatientRecord({
                        ...p,
                        status: 'checked',
                        exam: { ...(p.exam || {}), severity: e.target.value }
                      })
                    }
                    className="px-2 py-1 rounded border border-slate-300 font-bold text-xs"
                  >
                    <option value="G">Green (Healthy)</option>
                    <option value="Y">Yellow (Care)</option>
                    <option value="R">Red (Urgent)</option>
                  </select>
                </td>
                <td className="p-2.5 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'checked'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
