/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PlayerRole = 'Fast Bowler' | 'Spin Bowler' | 'Batsman' | 'Wicketkeeper' | 'All-rounder';

export interface PlayerProfile {
  name: string;
  role: PlayerRole;
  age: number;
  bowlingArm: 'Right-arm' | 'Left-arm' | 'None';
  battingStyle: 'Right-hand bat' | 'Left-hand bat';
  weeklyOversLimit: number; // custom limit for bowlers
  maxSingleRpe: number; // warning RPE threshold (default 8)
}

export type ActivityType = 'Match' | 'Net Session' | 'Gym / Strength' | 'Conditioning / Running' | 'Fielding Drill';

export interface WorkloadSession {
  id: string;
  date: string; // YYYY-MM-DD
  type: ActivityType;
  durationMinutes: number;
  rpe: number; // Rate of Perceived Exertion (1 to 10)
  
  // Role-specific metrics
  oversBowled?: number; 
  ballsFaced?: number;
  highIntensityDistanceMeters?: number; // GPS tracking
  notes?: string;
  
  // Computed training load for this session
  // Foster's Load = Duration (mins) * RPE
  // For bowling, can incorporate weighted load (e.g. overs * RPE + generic conditioning)
  calculatedLoad: number;
}

export interface RecoveryLog {
  id: string;
  date: string; // YYYY-MM-DD
  sleepHours: number;
  sleepQuality: number; // 1 to 10
  soreness: number; // 1 to 10 (10 being extremely sore/injured)
  fatigue: number; // 1 to 10
  stress: number; // 1 to 10
  restingHeartRate?: number; // bpm
  readinessScore: number; // calculated 0 to 100%
  notes?: string;
}

export interface DayMetrics {
  date: string;
  totalLoad: number;
  totalOvers: number;
  totalBallsFaced: number;
  readinessScore: number | null; // null if not logged
  sleepHours: number | null;
  soreness: number | null;
}

export interface ACWRMetrics {
  acuteLoad: number;   // 7-day total load (including current day)
  chronicLoad: number; // 28-day average of 7-day periods (average weekly load) or average daily load * 7
  acwr: number;        // acuteLoad / chronicLoad (or using standard daily rolling formula)
  status: 'Safe' | 'Caution' | 'Danger' | 'Under-trained';
}

export interface WorkloadAlert {
  id: string;
  date: string;
  severity: 'info' | 'warning' | 'danger';
  title: string;
  description: string;
  category: 'Load Spike' | 'Bowler Limit' | 'Over-training' | 'Inadequate Recovery';
}
