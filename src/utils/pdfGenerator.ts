/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { PlayerProfile, WorkloadSession, RecoveryLog, ACWRMetrics, WorkloadAlert } from '../types';

interface GenerationData {
  profile: PlayerProfile;
  activePreset: string;
  sessions: WorkloadSession[];
  recoveries: RecoveryLog[];
  acwrMetrics: ACWRMetrics;
  alerts: WorkloadAlert[];
}

export function generatePdfReport({
  profile,
  activePreset,
  sessions,
  recoveries,
  acwrMetrics,
  alerts
}: GenerationData) {
  // Create jsPDF instance with standard A4 page size orientation (portrait, mm, a4)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Base dimensions of A4 page
  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  let currentY = 15;

  // 1. HEADER SECTION (Slate colored header banner)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 42, 'F');

  // App Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('CRICKET ATHLETIC LOAD REPORT', marginX, 18);

  // Subtitle
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(249, 115, 22); // orange-500
  doc.text('ACUTE : CHRONIC WORKLOAD RATIO (ACWR) • MEDICAL TRANSCRIPT', marginX, 24);

  // Meta details (Right side of header)
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(8);
  const localTime = new Date().toLocaleString();
  doc.text(`Generated: ${localTime}`, pageWidth - marginX - 60, 18);
  doc.text(`Preset Schema: ${activePreset.toUpperCase()}`, pageWidth - marginX - 60, 24);
  doc.text(`App Version: 1.4.0 (Offline-first)`, pageWidth - marginX - 60, 30);

  currentY = 52;

  // 2. ATHLETE BIO CARD (Grid styling)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 26, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(profile.name ? profile.name.toUpperCase() : 'NO ATHLETE PROFILE CREATED', marginX + 5, currentY + 6);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`Role: ${profile.role || 'Unspecified'}`, marginX + 5, currentY + 13);
  doc.text(`Age: ${profile.age || 'N/A'}`, marginX + 5, currentY + 19);

  doc.text(`Batting Style: ${profile.battingStyle || 'N/A'}`, marginX + 65, currentY + 13);
  doc.text(`Bowling Arm: ${profile.bowlingArm || 'N/A'}`, marginX + 65, currentY + 19);

  doc.text(`Overs Cap per 7-Day: ${profile.weeklyOversLimit ? `${profile.weeklyOversLimit} overs` : 'No Cap'}`, marginX + 120, currentY + 13);
  doc.text(`Perceived Max Intensity: RPE ${profile.maxSingleRpe || 10}/10`, marginX + 120, currentY + 19);

  currentY += 34;

  // 3. PRIMARY LOAD STATS (Acute vs Chronic metrics colored boxes)
  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CORE PHYSIOLOGICAL MONITORING METRICS', marginX, currentY);
  currentY += 4;

  const colWidth = (pageWidth - (marginX * 2) - 8) / 3;

  // Column A: Acute Load (Past 7 Days cumulative)
  doc.setFillColor(30, 41, 59); // dark slate card
  doc.rect(marginX, currentY, colWidth, 24, 'F');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ACUTE WORKLOAD (7-DAY)', marginX + 4, currentY + 6);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(String(acwrMetrics.acuteLoad || 0), marginX + 4, currentY + 16);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.text('Total subjective minutes × RPE', marginX + 4, currentY + 21);

  // Column B: Chronic Load (Past 28 Days rolling representative)
  doc.setFillColor(30, 41, 59);
  doc.rect(marginX + colWidth + 4, currentY, colWidth, 24, 'F');
  doc.setTextColor(148, 163, 184);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CHRONIC WORKLOAD (28-DAY)', marginX + colWidth + 8, currentY + 6);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(String(acwrMetrics.chronicLoad || 0), marginX + colWidth + 8, currentY + 16);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.text('Standard weekly baseline capacity', marginX + colWidth + 8, currentY + 21);

  // Column C: ACWR Ratio & Health Status Flag
  let statusBg = [22, 163, 74]; // Safe (green)
  let statusText = 'SAFE SWEET ZONE';
  let statusColor = [255, 255, 255];

  if (acwrMetrics.status === 'Danger') {
    statusBg = [225, 29, 72]; // Danger (rose red)
    statusText = 'DANGER CRITICAL';
  } else if (acwrMetrics.status === 'Caution') {
    statusBg = [217, 119, 6]; // Caution (amber orange)
    statusText = 'ELEVATED CAUTION';
  } else if (acwrMetrics.status === 'Under-trained') {
    statusBg = [71, 85, 105]; // Under-trained (gray slate)
    statusText = 'UNDER-TRAINED';
  }

  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.rect(marginX + (colWidth * 2) + 8, currentY, colWidth, 24, 'F');
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ACUTE:CHRONIC RATIO (ACWR)', marginX + (colWidth * 2) + 12, currentY + 6);
  
  doc.setFontSize(22);
  doc.text(String(acwrMetrics.acwr || '0.00'), marginX + (colWidth * 2) + 12, currentY + 16);
  
  doc.setFontSize(8);
  doc.text(statusText, marginX + (colWidth * 2) + 12, currentY + 21);

  currentY += 32;

  // 4. WORKLOAD ALERTS BRIEFING
  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SURGEON GENERAL CLINICAL AND ATHLETIC WARNING FLAGS', marginX, currentY);
  currentY += 4;

  if (alerts.length === 0) {
    doc.setFillColor(240, 253, 250); // teal-50
    doc.setDrawColor(204, 251, 241); // teal-100
    doc.rect(marginX, currentY, pageWidth - (marginX * 2), 14, 'FD');
    doc.setTextColor(13, 148, 136); // teal-600
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('✓ ALL CLINICAL SIGNALS SECURE', marginX + 4, currentY + 6);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.text('No muscle overload, weekly overs overflow, or CNS sleep depletion triggers noted on current timeline.', marginX + 4, currentY + 10);
    currentY += 20;
  } else {
    // List maximum of 3 key alerts to avoid overflowing page
    const alertsToPrint = alerts.slice(0, 3);
    
    alertsToPrint.forEach((alert) => {
      let boxColor = [251, 113, 133]; // red background highlight
      let fontColor = [159, 18, 57]; // dark crimson
      if (alert.severity === 'warning') {
        boxColor = [253, 230, 138]; // amber
        fontColor = [146, 64, 14];
      }
      
      doc.setFillColor(boxColor[0], boxColor[1], boxColor[2]);
      doc.rect(marginX, currentY, 3, 10, 'F'); // Left accent bar
      
      doc.setTextColor(fontColor[0], fontColor[1], fontColor[2]);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`[${alert.category.toUpperCase()}] ${alert.title}`, marginX + 5, currentY + 5.5);
      
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(51, 65, 85); // slate-700
      doc.setFontSize(7.5);
      const splitDesc = doc.splitTextToSize(alert.description, pageWidth - marginX * 2 - 10);
      doc.text(splitDesc, marginX + 5, currentY + 9);
      
      currentY += (splitDesc.length * 3) + 7;
    });
    currentY += 2;
  }

  // 5. CHRONOLOGICAL TRANSACTIONS LEDGER table
  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RECENT WORKLOAD SESSIONS RECORD', marginX, currentY);
  currentY += 4;

  // Let's print table headers
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 7, 'F');
  doc.setTextColor(71, 85, 105);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DATE', marginX + 3, currentY + 4.5);
  doc.text('ACTIVITY TYPE', marginX + 28, currentY + 4.5);
  doc.text('DURATION', marginX + 75, currentY + 4.5);
  doc.text('INTENSITY (RPE)', marginX + 100, currentY + 4.5);
  doc.text('BOWL OVERS', marginX + 133, currentY + 4.5);
  doc.text('CALCULATED LOAD', marginX + 160, currentY + 4.5);

  currentY += 7;

  // Get past maximum of 6 sessions to print neatly on the page
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  if (recentSessions.length === 0) {
    doc.setTextColor(148, 163, 184);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('No physical training workload sessions recorded in this cycle array.', marginX + 4, currentY + 5);
    currentY += 10;
  } else {
    recentSessions.forEach((session, idx) => {
      // Draw light horizontal separator
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(marginX, currentY, pageWidth - marginX, currentY);

      doc.setTextColor(51, 65, 85);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);

      doc.text(session.date, marginX + 3, currentY + 4.5);
      doc.text(session.type, marginX + 28, currentY + 4.5);
      doc.text(`${session.durationMinutes} mins`, marginX + 75, currentY + 4.5);
      doc.text(`${session.rpe} / 10`, marginX + 100, currentY + 4.5);
      doc.text(session.oversBowled !== undefined ? `${session.oversBowled} overs` : '-', marginX + 133, currentY + 4.5);
      doc.setFont('Helvetica', 'bold');
      doc.text(String(session.calculatedLoad), marginX + 160, currentY + 4.5);

      currentY += 7;
    });
  }
  
  currentY += 3;

  // 6. RECOVERY & COGNITIVE LOGS SUMMARY
  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RECENT ATHLETE RECOVERY & READINESS LOGS', marginX, currentY);
  currentY += 4;

  // Table header for recovery
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 7, 'F');
  doc.setTextColor(71, 85, 105);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DATE', marginX + 3, currentY + 4.5);
  doc.text('SLEEP DURATION', marginX + 28, currentY + 4.5);
  doc.text('SLEEP QUALITY', marginX + 70, currentY + 4.5);
  doc.text('SORENESS / FATIGUE / STRESS', marginX + 105, currentY + 4.5);
  doc.text('HEART RATE', marginX + 155, currentY + 4.5);
  doc.text('READINESS', marginX + 178, currentY + 4.5);

  currentY += 7;

  const recentRecoveries = [...recoveries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (recentRecoveries.length === 0) {
    doc.setTextColor(148, 163, 184);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('No cognitive daily recovery logs recorded in this cycle array.', marginX + 4, currentY + 5);
    currentY += 10;
  } else {
    recentRecoveries.forEach((rec, idx) => {
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(marginX, currentY, pageWidth - marginX, currentY);

      doc.setTextColor(51, 65, 85);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);

      doc.text(rec.date, marginX + 3, currentY + 4.5);
      doc.text(`${rec.sleepHours} hrs`, marginX + 28, currentY + 4.5);
      doc.text(`${rec.sleepQuality} / 10`, marginX + 70, currentY + 4.5);
      doc.text(`Sore: ${rec.soreness} • Fatg: ${rec.fatigue} • Strs: ${rec.stress}`, marginX + 105, currentY + 4.5);
      doc.text(rec.restingHeartRate ? `${rec.restingHeartRate} bpm` : '-', marginX + 155, currentY + 4.5);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${rec.readinessScore}%`, marginX + 178, currentY + 4.5);

      currentY += 7;
    });
  }

  // 7. MEDICAL SIGNATURE AND WORKLOAD DISCLAIMER FOOTER
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.line(marginX, pageHeight - 18, pageWidth - marginX, pageHeight - 18);

  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    'Disclaimer: This athletic workload report calculates injury susceptibility based on acute-to-chronic training ratios (Foster 1998, Gabbett 2016).',
    marginX,
    pageHeight - 14
  );
  doc.text(
    'Calculations are intended for informational conditioning support only. Direct athletic injury diagnosis should be done with physical specialists.',
    marginX,
    pageHeight - 11
  );

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Standard Gabbett Scale Compliance Ratios applied.', pageWidth - marginX - 58, pageHeight - 14);
  doc.setFont('Helvetica', 'bold');
  doc.text('CRICKET SPORT PERFORMANCE LAB ADVISORY', pageWidth - marginX - 58, pageHeight - 11);

  // Trigger A4 PDF download in user browser
  const filename = `${profile.name ? profile.name.trim().replace(/\s+/g, '_') : 'athlete'}_acwr_report.pdf`;
  doc.save(filename);
}
