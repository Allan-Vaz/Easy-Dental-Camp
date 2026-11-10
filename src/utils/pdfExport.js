import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDisplayDate } from './clinicalEvaluator';

/**
 * Generates an official, non-editable PDF School Dental Health Audit Report
 * for Principals, School Management, and Education Authorities.
 */
export const generateAuditReportPDF = ({ camp, patients = [], diagnosesList = [] }) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const navyColor = [27, 47, 90];      // #1B2F5A
  const crimsonColor = [229, 38, 41];  // #E52629
  const slateDark = [30, 41, 59];

  // Camp metrics
  const campPatients = patients.filter((p) => p.campId === camp.id);
  const examined = campPatients.filter((p) => p.status === 'checked');
  const redCount = examined.filter((p) => p.exam?.severity === 'R').length;
  const yellowCount = examined.filter((p) => p.exam?.severity === 'Y').length;
  const greenCount = examined.filter((p) => (p.exam?.severity || 'G') === 'G').length;

  // Header Banner
  doc.setFillColor(...navyColor);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setFillColor(...crimsonColor);
  doc.rect(0, 32, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AVM SMILES DENTAL WELLNESS', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Trinity Plaza, Morba Road, Mangaon, Raigad | Phone: ' + (camp.clinicPhone || '9545660336'), 14, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SCHOOL DENTAL HEALTH AUDIT REPORT', 14, 26);

  doc.setFontSize(9);
  doc.text(`Date: ${formatDisplayDate(camp.campDate)}`, 165, 26);

  // School Information Block
  doc.setTextColor(...slateDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(camp.instituteNameEn || camp.instituteName || 'School Dental Health Camp', 14, 43);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Camp Code: ${camp.campCode || 'CAMP'} | Voucher Validity: Till ${formatDisplayDate(camp.voucherExpiryDate)}`, 14, 49);

  // Section 1: Executive Summary Table
  autoTable(doc, {
    startY: 53,
    theme: 'grid',
    head: [['Total Enrolled', 'Total Examined', 'Healthy Smiles (Green)', 'Care / Scaling (Yellow)', 'Urgent Treatment (Red)']],
    body: [
      [
        campPatients.length,
        examined.length,
        `${greenCount} (${examined.length ? Math.round((greenCount / examined.length) * 100) : 0}%)`,
        `${yellowCount} (${examined.length ? Math.round((yellowCount / examined.length) * 100) : 0}%)`,
        `${redCount} (${examined.length ? Math.round((redCount / examined.length) * 100) : 0}%)`
      ]
    ],
    headStyles: {
      fillColor: navyColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8.5
    },
    bodyStyles: {
      halign: 'center',
      fontStyle: 'bold',
      fontSize: 10,
      textColor: slateDark
    },
    columnStyles: {
      2: { textColor: [16, 185, 129] }, // Emerald
      3: { textColor: [217, 119, 6] },  // Amber
      4: { textColor: crimsonColor }     // Red
    }
  });

  // Section 2: Class-Wise Breakdown Table
  const groups = camp.groups || [];
  const classRows = groups.map((g) => {
    const inGrp = campPatients.filter((p) => p.groupId === g.id);
    const grpChecked = inGrp.filter((p) => p.status === 'checked');
    const grpRed = grpChecked.filter((p) => p.exam?.severity === 'R').length;
    const grpYellow = grpChecked.filter((p) => p.exam?.severity === 'Y').length;
    const grpGreen = grpChecked.filter((p) => (p.exam?.severity || 'G') === 'G').length;
    return [
      g.id,
      inGrp.length,
      grpChecked.length,
      grpGreen,
      grpYellow,
      grpRed
    ];
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...navyColor);
  doc.text('Class-Wise Dental Health Summary', 14, doc.lastAutoTable.finalY + 8);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 11,
    theme: 'striped',
    head: [['Class / Division', 'Enrolled', 'Examined', 'Healthy (G)', 'Care (Y)', 'Urgent (R)']],
    body: classRows,
    headStyles: {
      fillColor: [43, 75, 140],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 8,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      5: { textColor: crimsonColor, fontStyle: 'bold' }
    }
  });

  // Section 3: Detailed Student Ledger
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...navyColor);
  doc.text('Student Examination Findings Roster', 14, doc.lastAutoTable.finalY + 9);

  const studentRows = examined
    .sort((a, b) => a.groupId.localeCompare(b.groupId) || Number(a.rollNo) - Number(b.rollNo))
    .map((s) => {
      const teethKeys = Object.entries(s.exam?.teeth || {})
        .map(([k, v]) => `${k}(${v === 'C_R' ? 'Cavity-Deep' : v === 'C_Y' ? 'Decay' : v === 'M' ? 'Missing' : 'Milk'})`)
        .join(', ');

      const flagLabels = (s.exam?.flags || [])
        .map((fid) => {
          const match = diagnosesList.find((d) => d.id === fid);
          return match?.labelEn || fid;
        })
        .join(', ');

      const sevText = s.exam?.severity === 'R' ? 'URGENT' : s.exam?.severity === 'Y' ? 'CARE' : 'HEALTHY';

      return [
        s.groupId,
        s.rollNo,
        s.name,
        sevText,
        teethKeys || 'All Normal',
        flagLabels || 'None',
        s.exam?.customNote || s.exam?.noteCode || 'Routine checkup'
      ];
    });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 12,
    theme: 'grid',
    head: [['Class', 'Roll', 'Student Name', 'Severity', 'Affected Teeth', 'Diagnoses', 'Dentist Notes']],
    body: studentRows,
    headStyles: {
      fillColor: navyColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    bodyStyles: {
      fontSize: 7,
      textColor: slateDark
    },
    columnStyles: {
      0: { cellWidth: 16, fontStyle: 'bold' },
      1: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 38, fontStyle: 'bold' },
      3: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 38 },
      5: { cellWidth: 34 },
      6: { cellWidth: 32 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        if (data.cell.raw === 'URGENT') {
          data.cell.styles.textColor = crimsonColor;
        } else if (data.cell.raw === 'CARE') {
          data.cell.styles.textColor = [217, 119, 6];
        } else {
          data.cell.styles.textColor = [16, 185, 129];
        }
      }
    }
  });

  // Doctor Signature Block on last page
  const finalY = doc.lastAutoTable.finalY + 15;
  if (finalY > 255) {
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Examining Dental Surgeon Sign & Stamp:', 130, 30);
    doc.rect(130, 35, 65, 20);
    doc.text('Dr. Kunal Shet / Dental Team', 135, 47);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('AVM Smiles Dental Wellness, Mangaon', 135, 51);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Examining Dental Surgeon Sign & Stamp:', 130, finalY);
    doc.rect(130, finalY + 4, 65, 20);
    doc.text('Dr. Kunal Shet / Dental Team', 135, finalY + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('AVM Smiles Dental Wellness, Mangaon', 135, finalY + 18);
  }

  // Page Numbers Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `Official Camp Audit Report • AVM Smiles Dental Wellness • Page ${i} of ${pageCount}`,
      105,
      292,
      { align: 'center' }
    );
  }

  // Save the PDF
  const filename = `${camp.campCode || 'CAMP'}_Dental_Audit_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};
