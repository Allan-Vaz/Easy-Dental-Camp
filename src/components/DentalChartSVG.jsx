import React from 'react';
import { getToothLabels } from '../utils/clinicalEvaluator';
import { DEFAULT_TOOTH_DIAGNOSES } from '../data/defaultData';

/**
 * Standard Anatomical Dental Chart (Palmer / FDI Clinician's Perspective)
 * The clinician faces the patient:
 * Top-Left: Upper Right (UR / वरचे-उजवे)
 * Top-Right: Upper Left (UL / वरचे-डावे)
 * Bottom-Left: Lower Right (LR / खालचे-उजवे)
 * Bottom-Right: Lower Left (LL / खालचे-डावे)
 * Incisors (1 or A) meet at the midline; molars expand laterally.
 */
export const DentalChartSVG = ({ teethPerQuad = 6, teethData = {}, toothDiagnosesList = [] }) => {
  const labels = getToothLabels(teethPerQuad);
  const allToothDiags = toothDiagnosesList && toothDiagnosesList.length > 0
    ? toothDiagnosesList
    : DEFAULT_TOOTH_DIAGNOSES;

  const getArchCoordinates = (quadrant, index, total) => {
    const t = 0.14 + (index / Math.max(total - 1, 1)) * 0.78;
    const angle = t * (Math.PI / 2);
    const rx = 72;
    const ry = 76;

    // UR (Upper Right - Patient's Right) is on Clinician's LEFT
    if (quadrant === 'UR') {
      return {
        x: 110 - Math.sin(angle) * rx,
        y: 100 - Math.cos(angle) * ry
      };
    }
    // UL (Upper Left - Patient's Left) is on Clinician's RIGHT
    if (quadrant === 'UL') {
      return {
        x: 110 + Math.sin(angle) * rx,
        y: 100 - Math.cos(angle) * ry
      };
    }
    // LR (Lower Right - Patient's Right) is on Clinician's LEFT
    if (quadrant === 'LR') {
      return {
        x: 110 - Math.sin(angle) * rx,
        y: 126 + Math.cos(angle) * ry
      };
    }
    // LL (Lower Left - Patient's Left) is on Clinician's RIGHT
    return {
      x: 110 + Math.sin(angle) * rx,
      y: 126 + Math.cos(angle) * ry
    };
  };

  const quadrants = ['UR', 'UL', 'LR', 'LL'];

  return (
    <svg viewBox="0 0 220 226" className="w-full h-auto max-h-[172px] select-none">
      {/* Anatomically Correct Quadrant Labels (Clinician View) */}
      <text x="8" y="15" className="text-[9.5px] font-extrabold fill-[#1B2F5A]">
        UR (वरचे-उजवे)
      </text>
      <text x="148" y="15" className="text-[9.5px] font-extrabold fill-[#1B2F5A]">
        UL (वरचे-डावे)
      </text>
      <text x="8" y="219" className="text-[9.5px] font-extrabold fill-[#1B2F5A]">
        LR (खालचे-उजवे)
      </text>
      <text x="148" y="219" className="text-[9.5px] font-extrabold fill-[#1B2F5A]">
        LL (खालचे-डावे)
      </text>

      {/* Upper Gum Arch */}
      <path
        d="M 26 100 C 26 2, 194 2, 194 100 C 194 108, 172 108, 170 98 C 168 32, 52 32, 50 98 C 48 108, 26 108, 26 100 Z"
        fill="#f2a2a4"
        stroke="#1B2F5A"
        strokeWidth="1.2"
      />
      <path
        d="M 50 96 C 54 36, 166 36, 170 96 Z"
        fill="#e38285"
        opacity="0.45"
      />

      {/* Lower Gum Arch */}
      <path
        d="M 26 126 C 26 224, 194 224, 194 126 C 194 118, 172 118, 170 128 C 168 194, 52 194, 50 128 C 48 118, 26 118, 26 126 Z"
        fill="#f2a2a4"
        stroke="#1B2F5A"
        strokeWidth="1.2"
      />
      <path
        d="M 50 130 C 54 190, 166 190, 170 130 Z"
        fill="#e38285"
        opacity="0.4"
      />

      {/* Dashed Quadrant Divider Crosshairs (Midline & Occlusal Plane) */}
      <line x1="110" y1="6" x2="110" y2="220" stroke="#1B2F5A" strokeWidth="1.2" strokeDasharray="3,3" />
      <line x1="14" y1="113" x2="206" y2="113" stroke="#1B2F5A" strokeWidth="1.2" strokeDasharray="3,3" />

      {/* Render Individual Teeth along the Arches */}
      {quadrants.map((q) =>
        labels.map((lbl, idx) => {
          const key = `${q}${lbl}`;
          const status = teethData[key]; // 'C_R', 'C_Y', 'M', 'R', or custom ID
          const matchedDiag = allToothDiags.find((d) => d.id === status);
          const color = matchedDiag?.colorHex || (status === 'C_R' ? '#E52629' : status === 'C_Y' ? '#f59e0b' : status === 'M' ? '#1B2F5A' : '#ea580c');
          const isMissing = status === 'M' || matchedDiag?.name?.toLowerCase().includes('missing');
          const { x, y } = getArchCoordinates(q, idx, labels.length);
          const isMolar = idx >= 3;
          const r = isMolar ? 8 : 6.8;

          return (
            <g key={key} transform={`translate(${x}, ${y})`}>
              {/* Base Tooth Shape */}
              <circle
                cx="0"
                cy="0"
                r={r}
                fill={isMissing ? color : '#FFFFFF'}
                stroke="#1B2F5A"
                strokeWidth="1.3"
              />
              {/* Inner occlusal groove for normal/cavity teeth */}
              {isMolar && !isMissing && (
                <path d="M -2.5 -2 L 2.5 2 M -2.5 2 L 2.5 -2" stroke="#94a3b8" strokeWidth="0.8" />
              )}

              {/* Dynamic Callout & Dot for Active Status */}
              {status && !isMissing && (
                <>
                  <circle cx="0" cy="0" r="3.4" fill={color} />
                  <circle
                    cx="0"
                    cy="0"
                    r={r + 5}
                    fill="none"
                    stroke={color}
                    strokeWidth={matchedDiag?.severity === 'Urgent' ? '2.6' : '2.2'}
                    strokeDasharray={status === 'R' ? '2.5,2' : undefined}
                  />
                </>
              )}

              {/* Tooth Number / Letter Label */}
              <text
                x="0"
                y={isMissing ? '3' : '3.2'}
                textAnchor="middle"
                className={`text-[8px] font-black select-none pointer-events-none ${
                  isMissing ? 'fill-white' : 'fill-[#1B2F5A]'
                }`}
              >
                {lbl}
              </text>
            </g>
          );
        })
      )}
    </svg>
  );
};
