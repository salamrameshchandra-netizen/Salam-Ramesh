/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerProfile, WorkloadSession, RecoveryLog, ACWRMetrics, WorkloadAlert, DayMetrics } from '../types';

/**
 * Calculates the Daily Recovery Readiness Score.
 * Core Formula:
 * - Starts at 100
 * - Sleep hours deviation (subtracted if < 7 hrs, bonus if 8-9 hrs)
 * - Sleep quality (positive contributor)
 * - Soreness, Fatigue, Stress (negative contributors)
 */
export function calculateDailyReadiness(
  sleepHours: number,
  sleepQuality: number, // 1-10
  soreness: number, // 1-10 (10 is extremely sore)
  fatigue: number, // 1-10 (10 is exhausted)
  stress: number // 1-10 (10 is stressed)
): number {
  // Normalize parameters
  const sleepPower = Math.min(sleepHours / 8, 1.2); // Cap sleep benefit at 1.2
  const sleepQualityFactor = sleepQuality / 10;
  
  // Negative indicators (higher values lower your readiness)
  // We want to scale them so low values (1-2) are optimal, and high values (8-10) are bad
  const sorenessFactor = (11 - soreness) / 10;
  const fatigueFactor = (11 - fatigue) / 10;
  const stressFactor = (11 - stress) / 10;

  // Weight scores
  const score = (
    (sleepPower * 0.25) +
    (sleepQualityFactor * 0.20) +
    (sorenessFactor * 0.25) +
    (fatigueFactor * 0.18) +
    (stressFactor * 0.12)
  ) * 100;

  return Math.min(Math.max(Math.round(score), 10), 100);
}

/**
 * Compiles custom day-by-day stats merged from sessions and recoveries
 */
export function compileDayMetrics(
  sessions: WorkloadSession[],
  recoveries: RecoveryLog[],
  dates: string[]
): DayMetrics[] {
  return dates.map(date => {
    const daySessions = sessions.filter(s => s.date === date);
    const recovery = recoveries.find(r => r.date === date);
    
    const totalLoad = daySessions.reduce((acc, s) => acc + s.calculatedLoad, 0);
    const totalOvers = daySessions.reduce((acc, s) => acc + (s.oversBowled || 0), 0);
    const totalBallsFaced = daySessions.reduce((acc, s) => acc + (s.ballsFaced || 0), 0);

    return {
      date,
      totalLoad,
      totalOvers,
      totalBallsFaced,
      readinessScore: recovery ? recovery.readinessScore : null,
      sleepHours: recovery ? recovery.sleepHours : null,
      soreness: recovery ? recovery.soreness : null,
    };
  });
}

/**
 * Calculates current ACWR and status for a specific target date
 */
export function calculateACWR(
  dayMetrics: DayMetrics[],
  targetIndex: number // Index of the target date in chronological list
): ACWRMetrics {
  // If we don't have enough history, fallback
  if (targetIndex < 0 || dayMetrics.length === 0) {
    return { acuteLoad: 0, chronicLoad: 0, acwr: 0, status: 'Safe' };
  }

  // Acute window: 7 days leading up to and including targetIndex
  let acuteTotal = 0;
  let acuteDays = 0;
  for (let i = 0; i < 7; i++) {
    const idx = targetIndex - i;
    if (idx >= 0) {
      acuteTotal += dayMetrics[idx].totalLoad;
      acuteDays++;
    }
  }
  const acuteAvg = acuteDays > 0 ? acuteTotal / 7 : 0; // standard weekly representation is acuteAvg * 7 = acuteTotal

  // Chronic window: 28 days leading up to and including targetIndex
  let chronicTotal = 0;
  let chronicDays = 0;
  for (let i = 0; i < 28; i++) {
    const idx = targetIndex - i;
    if (idx >= 0) {
      chronicTotal += dayMetrics[idx].totalLoad;
      chronicDays++;
    }
  }
  const chronicAvg = chronicDays > 0 ? chronicTotal / 28 : 0;

  // Protect against division by zero
  if (chronicAvg === 0) {
    // If we have some acute load but no chronic, ACWR is undefined/high, otherwise 1.0 default
    return {
      acuteLoad: Math.round(acuteTotal),
      chronicLoad: 0,
      acwr: acuteTotal > 0 ? 2.0 : 1.0,
      status: acuteTotal > 0 ? 'Danger' : 'Safe'
    };
  }

  // ACWR is (Acute Daily Average) / (Chronic Daily Average)
  const acwr = Number((acuteAvg / chronicAvg).toFixed(2));
  
  let status: 'Safe' | 'Caution' | 'Danger' | 'Under-trained' = 'Safe';
  if (acwr < 0.8) {
    status = 'Under-trained';
  } else if (acwr >= 0.8 && acwr <= 1.3) {
    status = 'Safe';
  } else if (acwr > 1.3 && acwr <= 1.5) {
    status = 'Caution';
  } else {
    status = 'Danger';
  }

  return {
    acuteLoad: Math.round(acuteTotal),
    chronicLoad: Math.round(chronicAvg * 7), // convert chronic daily average to standard rolling weekly average representing capacity
    acwr,
    status
  };
}

/**
 * Scans the profile, logs, and sessions to generate active warnings
 */
export function generateAlerts(
  profile: PlayerProfile,
  sessions: WorkloadSession[],
  recoveries: RecoveryLog[],
  dayMetrics: DayMetrics[]
): WorkloadAlert[] {
  const alerts: WorkloadAlert[] = [];
  if (dayMetrics.length === 0) return [];

  const latestIndex = dayMetrics.length - 1;
  const latestMetric = dayMetrics[latestIndex];
  const latestDate = latestMetric.date;

  // 1. Calculate and Alert on ACWR Load Spikes
  const acwrMetrics = calculateACWR(dayMetrics, latestIndex);
  if (acwrMetrics.status === 'Danger') {
    alerts.push({
      id: 'alert-acwr-danger',
      date: latestDate,
      severity: 'danger',
      title: 'High Injury Risk (ACWR Spike)',
      description: `Acute:Chronic Workload Ratio is ${acwrMetrics.acwr}. Values exceeding 1.5 indicate a "Danger Zone" where soft tissue and skeletal injury risk spikes exponentially.`,
      category: 'Load Spike'
    });
  } else if (acwrMetrics.status === 'Caution') {
    alerts.push({
      id: 'alert-acwr-caution',
      date: latestDate,
      severity: 'warning',
      title: 'Elevated Workload (ACWR Caution)',
      description: `Acute:Chronic Workload Ratio is at ${acwrMetrics.acwr}. Training stimulus is high. Maintain load but prioritize recovery to prevent entering the Danger Zone.`,
      category: 'Load Spike'
    });
  } else if (acwrMetrics.status === 'Under-trained' && acwrMetrics.acuteLoad > 0) {
    alerts.push({
      id: 'alert-acwr-undertrained',
      date: latestDate,
      severity: 'warning',
      title: 'Under-trained State',
      description: `Acute:Chronic Workload Ratio is ${acwrMetrics.acwr}. Your recent training volume is too low compared to historical averages, raising risk of injuries when volume suddenly ramps up.`,
      category: 'Load Spike'
    });
  }

  // 2. Bowling-specific metrics tracking (Crucial for Fast Bowlers to avoid spine stress fractures)
  if (profile.role === 'Fast Bowler' || profile.role === 'All-rounder') {
    // 7-day rolling overs bowled
    let rollingOvers7Days = 0;
    for (let i = 0; i < 7; i++) {
      const idx = latestIndex - i;
      if (idx >= 0) {
        rollingOvers7Days += dayMetrics[idx].totalOvers;
      }
    }

    if (rollingOvers7Days > profile.weeklyOversLimit) {
      alerts.push({
        id: 'alert-bowler-weekly-overs',
        date: latestDate,
        severity: 'danger',
        title: 'Weekly Bowling Limit Exceeded',
        description: `Bowled ${rollingOvers7Days.toFixed(1)} overs in the last 7 days, exceeding your custom protective limit of ${profile.weeklyOversLimit} overs. High threat of lumbar stress fractures.`,
        category: 'Bowler Limit'
      });
    } else if (rollingOvers7Days > profile.weeklyOversLimit * 0.85) {
      alerts.push({
        id: 'alert-bowler-weekly-overs-warning',
        date: latestDate,
        severity: 'warning',
        title: 'Approaching Weekly Bowling Limit',
        description: `Bowled ${rollingOvers7Days.toFixed(1)} overs in the last 7 days. You are at 85%+ of your threshold (${profile.weeklyOversLimit} overs). Advised to restrict overs in coming sessions.`,
        category: 'Bowler Limit'
      });
    }

    // Check single day overs overload
    const maxSingleDayOvers = profile.role === 'Fast Bowler' ? 12 : 15;
    if (latestMetric.totalOvers > maxSingleDayOvers) {
      alerts.push({
        id: 'alert-bowler-single-day-overs',
        date: latestDate,
        severity: 'warning',
        title: 'Extreme Single-Day Bowling Volume',
        description: `You bowled ${latestMetric.totalOvers} overs today. Intense spell noted. Ensure deep muscle tissue recovery and active flexibility stretches.`,
        category: 'Bowler Limit'
      });
    }
  }

  // 3. High Rating of Perceived Exertion (RPE) check
  const latestSessions = sessions.filter(s => s.date === latestDate);
  const highExertionSession = latestSessions.find(s => s.rpe >= profile.maxSingleRpe);
  if (highExertionSession) {
    alerts.push({
      id: `alert-high-rpe-${highExertionSession.id}`,
      date: latestDate,
      severity: 'warning',
      title: `High Intensity Session Recorded (${highExertionSession.type})`,
      description: `RPE reported at ${highExertionSession.rpe}/10. High-power fatigue has been localized. Make sure sleep cycles are maximized.`,
      category: 'Over-training'
    });
  }

  // 4. Recovery and Readiness checks
  const latestRecovery = recoveries.find(r => r.date === latestDate);
  if (latestRecovery) {
    if (latestRecovery.readinessScore < 50) {
      alerts.push({
        id: 'alert-readiness-critical',
        date: latestDate,
        severity: 'danger',
        title: 'Critical Recovery Deficit',
        description: `Readiness score is extremely low (${latestRecovery.readinessScore}%). Heavy risk of overload-type strains (hamstring, groin, side strain) if intensive loading continues.`,
        category: 'Inadequate Recovery'
      });
    } else if (latestRecovery.readinessScore < 70) {
      alerts.push({
        id: 'alert-readiness-mild',
        date: latestDate,
        severity: 'warning',
        title: 'Suboptimal Athletic Readiness',
        description: `Readiness score is ${latestRecovery.readinessScore}%. Muscles and joints are in a restoration phase. Keep exertion below maximum thresholds today.`,
        category: 'Inadequate Recovery'
      });
    }

    if (latestRecovery.soreness >= 7) {
      alerts.push({
        id: 'alert-high-soreness',
        date: latestDate,
        severity: 'warning',
        title: 'High Soreness Threshold',
        description: `Muscle soreness rating is at ${latestRecovery.soreness}/10. High danger of primary soft-tissue tears. Avoid heavy sprint loads or high-velocity deliveries.`,
        category: 'Inadequate Recovery'
      });
    }

    if (latestRecovery.sleepHours < 6) {
      alerts.push({
        id: 'alert-sleep-depleted',
        date: latestDate,
        severity: 'warning',
        title: 'Sleep Duration Depleted',
        description: `Only ${latestRecovery.sleepHours} hours of sleep logged. Muscle glycogen and neural rebuilding are impeded, limiting motor-accuracy and speeding up fatigue onset.`,
        category: 'Inadequate Recovery'
      });
    }
  }

  return alerts;
}

/**
 * Returns list of YYYY-MM-DD strings for the past N days leading up to today (UTC time)
 */
export function getPastDates(daysCount: number, baseDateStrStr?: string): string[] {
  const dates: string[] = [];
  const base = baseDateStrStr ? new Date(baseDateStrStr) : new Date();
  
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(base.getTime());
    d.setDate(base.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dates.push(dateStr);
  }
  return dates;
}

/**
 * Generated pre-populated mock dataset for a "Safe, Well-managed Build" pattern
 */
export function generateManagedStateData(dates: string[]): {
  sessions: WorkloadSession[];
  recoveries: RecoveryLog[];
} {
  const sessions: WorkloadSession[] = [];
  const recoveries: RecoveryLog[] = [];

  // Generate 35 days of data. Increments of load
  dates.forEach((date, index) => {
    // Determine activity structure:
    // Net Session 2 times a week, Matches on weekend, Conditioning twice a week, rest days
    const dayOfWeek = index % 7; // 0 to 6 (0 index could be Sunday, e.g.)
    
    // Recovery generated first: Generally good
    const sleepHours = 7.5 + Math.sin(index * 0.4) * 0.8 + (dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0);
    const sleepQuality = Math.min(Math.round(7.5 + Math.cos(index * 0.3) * 1.5), 10);
    
    // Soreness/Fatigue ramps up dynamically after hard activities but decays
    let soreness = 2;
    let fatigue = 2;
    let stress = 3 + Math.round(Math.sin(index * 0.2) * 1.5);
    
    // Adjust based on previous activities
    if (dayOfWeek === 1 || dayOfWeek === 4) {
      soreness = 5;
      fatigue = 4;
    } else if (dayOfWeek === 2 || dayOfWeek === 5) {
      soreness = 3;
      fatigue = 3;
    }

    const readinessScore = calculateDailyReadiness(
      sleepHours,
      sleepQuality,
      soreness,
      fatigue,
      stress
    );

    recoveries.push({
      id: `m-rec-${index}`,
      date,
      sleepHours: Number(sleepHours.toFixed(1)),
      sleepQuality,
      soreness,
      fatigue,
      stress,
      restingHeartRate: 54 + Math.round(soreness * 1.5 + Math.sin(index * 0.5) * 3),
      readinessScore
    });

    // Sessions:
    if (dayOfWeek === 1) {
      // Net Session (Intermediate Bowler / Batter load)
      const duration = 90;
      const rpe = 6;
      sessions.push({
        id: `m-sess-n1-${index}`,
        date,
        type: 'Net Session',
        durationMinutes: duration,
        rpe,
        oversBowled: 6,
        ballsFaced: 40,
        notes: 'Steady training. Bowled short spell of 6 overs. felt comfortable.',
        calculatedLoad: duration * rpe + (6 * 6) // weighted bowler load
      });
    } else if (dayOfWeek === 3) {
      // Conditioning / Gym
      const duration = 60;
      const rpe = 5;
      sessions.push({
        id: `m-sess-c1-${index}`,
        date,
        type: 'Conditioning / Running',
        durationMinutes: duration,
        rpe,
        highIntensityDistanceMeters: 1500,
        notes: 'Aerobic bounds and high-speed build-ups.',
        calculatedLoad: duration * rpe
      });
    } else if (dayOfWeek === 4) {
      // High-volume net session
      const duration = 120;
      const rpe = 7;
      sessions.push({
        id: `m-sess-n2-${index}`,
        date,
        type: 'Net Session',
        durationMinutes: duration,
        rpe,
        oversBowled: 8,
        ballsFaced: 60,
        notes: 'Extended batting and bowling workloads. Felt strong in the delivery stride.',
        calculatedLoad: duration * rpe + (8 * 6)
      });
    } else if (dayOfWeek === 6) {
      // Match day!
      const duration = 180;
      const rpe = 8;
      sessions.push({
        id: `m-sess-m1-${index}`,
        date,
        type: 'Match',
        durationMinutes: duration,
        rpe,
        oversBowled: 10,
        ballsFaced: 30,
        highIntensityDistanceMeters: 2800,
        notes: 'Weekend club league match. Bowled full spell of 10 overs. Took 3 wickets.',
        calculatedLoad: duration * rpe + (10 * 8)
      });
    }
  });

  return { sessions, recoveries };
}

/**
 * Generated pre-populated mock dataset for a "Danger Workload Spike" pattern
 * Showcases rapid loading, over-exertion, and deteriorating recovery leading to a major injury warning
 */
export function generateSpikedStateData(dates: string[]): {
  sessions: WorkloadSession[];
  recoveries: RecoveryLog[];
} {
  const sessions: WorkloadSession[] = [];
  const recoveries: RecoveryLog[] = [];

  // Generate 35 days of data.
  // First 4 weeks: Steady low load
  // Day 28-35 (Final week): Extreme matches, back-to-back long-spells, no rest, disastrous recovery
  dates.forEach((date, index) => {
    const isLastWeek = index >= 28;
    const dayOfWeek = index % 7;

    if (!isLastWeek) {
      // Very standard light base training
      const sleepHours = 8.0;
      const sleepQuality = 8;
      const soreness = 2;
      const fatigue = 2;
      const stress = 2;
      
      const readinessScore = calculateDailyReadiness(sleepHours, sleepQuality, soreness, fatigue, stress);
      recoveries.push({
        id: `s-rec-${index}`,
        date,
        sleepHours,
        sleepQuality,
        soreness,
        fatigue,
        stress,
        restingHeartRate: 52,
        readinessScore
      });

      // Simple weekly sessions (only Net session once a week)
      if (dayOfWeek === 2) {
        sessions.push({
          id: `s-sess-b1-${index}`,
          date,
          type: 'Net Session',
          durationMinutes: 60,
          rpe: 5,
          oversBowled: 4,
          calculatedLoad: 60 * 5 + 4 * 6
        });
      }
    } else {
      // LAST WEEK: Workload Overload!
      // Consecutive games or back-to-back double sessions
      let sleepHours = 7.0;
      let sleepQuality = 6;
      let soreness = 3;
      let fatigue = 3;
      let stress = 4;

      // Day-by-day rapid fatigue buildup in the last week:
      // Day 28 (e.g., Monday): Massive training volume
      // Day 29 (Tuesday): Fast Bowler fitness test
      // Day 30-31 (Wednesday-Thursday): Two-day match, heavy bowling spells
      // Day 32 (Friday): No recovery, intensive batting/fielding nets
      // Day 33-34 (Saturday-Sunday): Multi-innings club cup match
      const lastWeekIndex = index - 28; // 0 to 6

      if (lastWeekIndex === 0) {
        // Monday: Hard nets
        sessions.push({
          id: `slw-sess-1`,
          date,
          type: 'Net Session',
          durationMinutes: 120,
          rpe: 8,
          oversBowled: 12,
          ballsFaced: 50,
          notes: 'Drawn out net bowling session. Bowled fast and hard on turf nets.',
          calculatedLoad: 120 * 8 + 12 * 8
        });
        soreness = 5;
        fatigue = 5;
        sleepHours = 6.8;
      } else if (lastWeekIndex === 1) {
        // Tuesday: Gym + high speed bounds
        sessions.push({
          id: `slw-sess-2`,
          date,
          type: 'Conditioning / Running',
          durationMinutes: 75,
          rpe: 7,
          highIntensityDistanceMeters: 3000,
          notes: 'Shuttle runs and heavy jump squatted workouts.',
          calculatedLoad: 75 * 7
        });
        soreness = 6;
        fatigue = 6;
        sleepHours = 6.2;
      } else if (lastWeekIndex === 2) {
        // Wednesday: Match Day 1 - 20 overs bowled!
        sessions.push({
          id: `slw-sess-3`,
          date,
          type: 'Match',
          durationMinutes: 240,
          rpe: 9,
          oversBowled: 18,
          notes: 'Multi-day representative selection match. Felt back tightness in final spell.',
          calculatedLoad: 240 * 9 + 18 * 10
        });
        soreness = 8;
        fatigue = 8;
        sleepHours = 5.5;
        sleepQuality = 4;
        stress = 7;
      } else if (lastWeekIndex === 3) {
        // Thursday: Match Day 2 - Another 10 overs!
        sessions.push({
          id: `slw-sess-4`,
          date,
          type: 'Match',
          durationMinutes: 180,
          rpe: 8,
          oversBowled: 10,
          notes: 'Completed match. Body extremely warm and stiff. Lateral side soreness.',
          calculatedLoad: 180 * 8 + 10 * 8
        });
        soreness = 9;
        fatigue = 8;
        sleepHours = 5.8;
        sleepQuality = 5;
        stress = 8;
      } else if (lastWeekIndex === 4) {
        // Friday: ActiveNet
        sessions.push({
          id: `slw-sess-5`,
          date,
          type: 'Net Session',
          durationMinutes: 90,
          rpe: 6,
          oversBowled: 6,
          calculatedLoad: 90 * 6 + 6 * 6
        });
        soreness = 8;
        fatigue = 9;
        sleepHours = 5.0;
        sleepQuality = 4;
        stress = 7;
      } else if (lastWeekIndex === 5) {
        // Saturday: Match - Bowling & fielding
        sessions.push({
          id: `slw-sess-6`,
          date,
          type: 'Match',
          durationMinutes: 210,
          rpe: 9,
          oversBowled: 14,
          notes: 'Back-to-back weekend action. Heavily fatigued, speed dropped severely.',
          calculatedLoad: 210 * 9 + 14 * 10
        });
        soreness = 9;
        fatigue = 10;
        sleepHours = 5.2;
        sleepQuality = 3;
        stress = 9;
      } else if (lastWeekIndex === 6) {
        // Sunday (Today): rest day on paper, but body completely broken.
        soreness = 9;
        fatigue = 9;
        sleepHours = 5.5;
        sleepQuality = 3;
        stress = 8;
      }

      const readinessScore = calculateDailyReadiness(sleepHours, sleepQuality, soreness, fatigue, stress);
      recoveries.push({
        id: `s-rec-${index}`,
        date,
        sleepHours,
        sleepQuality,
        soreness,
        fatigue,
        stress,
        restingHeartRate: 64,
        readinessScore
      });
    }
  });

  return { sessions, recoveries };
}
