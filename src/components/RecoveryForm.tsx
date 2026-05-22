/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RecoveryLog } from '../types';
import { calculateDailyReadiness } from '../utils/workload';
import { Heart, Moon, Zap, Sparkles } from 'lucide-react';

interface RecoveryFormProps {
  onSubmit: (log: Omit<RecoveryLog, 'id' | 'readinessScore'> & { readinessScore: number }) => void;
  todayDateStr: string;
}

export default function RecoveryForm({ onSubmit, todayDateStr }: RecoveryFormProps) {
  const [date, setDate] = useState<string>(todayDateStr);
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [sleepQuality, setSleepQuality] = useState<number>(7);
  const [soreness, setSoreness] = useState<number>(3);
  const [fatigue, setFatigue] = useState<number>(3);
  const [stress, setStress] = useState<number>(3);
  const [restingHeartRate, setRestingHeartRate] = useState<number>(56);
  const [notes, setNotes] = useState<string>('');
  
  const [notification, setNotification] = useState<string | null>(null);

  // Dynamic preview of Readiness score
  const tempReadiness = calculateDailyReadiness(
    sleepHours,
    sleepQuality,
    soreness,
    fatigue,
    stress
  );

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (score >= 60) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
  };

  const getReadinessAssessment = (score: number) => {
    if (score >= 80) return 'Optimal - High performance spell authorized';
    if (score >= 60) return 'Moderate - Normal workload, monitor minor stiffness';
    return 'Impaired - Exercise caution, prioritize low-RPE dynamic drills';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      date,
      sleepHours: Number(sleepHours),
      sleepQuality,
      soreness,
      fatigue,
      stress,
      restingHeartRate: restingHeartRate > 0 ? Number(restingHeartRate) : undefined,
      readinessScore: tempReadiness,
      notes: notes.trim() ? notes.trim() : undefined,
    });

    setNotes('');
    setNotification(`Recovery logged! Readiness calculated: ${tempReadiness}%`);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  return (
    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 backdrop-blur-sm shadow-xl">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
          <Moon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Log Daily Recovery</h3>
          <p className="text-[11px] text-slate-400">Track autonomic recovery and structural muscle fatigue</p>
        </div>
      </div>

      {notification && (
        <div className="mb-4 p-2 rounded-lg bg-teal-500/15 border border-teal-500/35 text-xs text-teal-300 font-medium flex items-center gap-1.5 animate-pulse font-mono">
          <Sparkles className="w-3.5 h-3.5 ml-1 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Dynamic Readiness Score Gauge Preview */}
      <div className={`p-3 rounded-lg border mb-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs ${getReadinessColor(tempReadiness)}`}>
        <div>
          <span className="text-[9px] uppercase font-bold tracking-widest font-mono opacity-80 block">Readiness Forecast</span>
          <p className="font-sans text-xs font-bold text-white leading-tight mt-0.5">
            {getReadinessAssessment(tempReadiness)}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto font-mono text-sm font-black uppercase tracking-wider">
          <Zap className="w-4 h-4 fill-current animate-bounce" />
          <span>{tempReadiness}% Readiness</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Date Selector */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-1">
            Recovery Date
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-1.5 h-9 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all font-mono"
          />
        </div>

        {/* Sleep Hours & Sleep Quality */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-1 flex justify-between">
              <span>Sleep Duration</span>
              <span className="text-teal-400 font-mono font-bold text-xs">{sleepHours} hrs</span>
            </label>
            <input
              type="number"
              required
              step="0.5"
              min="1"
              max="24"
              value={sleepHours || ''}
              onChange={(e) => setSleepHours(Math.max(1, parseFloat(e.target.value) || 0))}
              className="w-full px-3 py-1.5 h-9 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 font-mono transition-all"
              placeholder="e.g. 8"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-1 flex justify-between">
              <span>Sleep Quality</span>
              <span className="text-teal-400 font-mono font-bold text-xs">{sleepQuality} / 10</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={sleepQuality}
              onChange={(e) => setSleepQuality(parseInt(e.target.value))}
              className="w-full h-1 rounded-lg bg-slate-850 accent-teal-400 cursor-ew-resize py-2 focus:ring-1 focus:ring-teal-500/20"
            />
          </div>
        </div>

        {/* Muscle Soreness */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400">Muscle Soreness</span>
            <span className={`text-xs font-mono font-bold ${soreness > 6 ? 'text-red-400 font-black' : 'text-slate-500'}`}>
              Level {soreness}/10
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={soreness}
            onChange={(e) => setSoreness(parseInt(e.target.value))}
            className="w-full h-1 bg-slate-800 accent-teal-400 cursor-ew-resize"
          />
          <div className="flex justify-between text-[9px] text-slate-550 mt-1 italic font-mono leading-none">
            <span>Fresh (1)</span>
            <span>Tight (5)</span>
            <span>Severe Pain (10)</span>
          </div>
        </div>

        {/* Central Fatigue */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400">CNS / General Fatigue</span>
            <span className={`text-xs font-mono font-bold ${fatigue > 6 ? 'text-orange-450 font-black' : 'text-slate-500'}`}>
              Level {fatigue}/10
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={fatigue}
            onChange={(e) => setFatigue(parseInt(e.target.value))}
            className="w-full h-1 bg-slate-800 accent-teal-400 cursor-ew-resize"
          />
          <div className="flex justify-between text-[9px] text-slate-550 mt-1 italic font-mono leading-none">
            <span>High energy (1)</span>
            <span>Sluggish (5)</span>
            <span>Exhausted (10)</span>
          </div>
        </div>

        {/* Psych Stress */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400">Psychological Stress</span>
            <span className={`text-xs font-mono font-bold ${stress > 6 ? 'text-orange-450 font-black' : 'text-slate-500'}`}>
              Level {stress}/10
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={stress}
            onChange={(e) => setStress(parseInt(e.target.value))}
            className="w-full h-1 bg-slate-800 accent-teal-400 cursor-ew-resize"
          />
          <div className="flex justify-between text-[9px] text-slate-550 mt-1 italic font-mono leading-none">
            <span>Calm (1)</span>
            <span>Pressure (5)</span>
            <span>Match-anxiety (10)</span>
          </div>
        </div>

        {/* Autonomic Resting Heart Rate */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-1 flex justify-between">
            <span>Resting Heart Rate (RHR)</span>
            <span className="text-teal-405 font-mono text-xs flex items-center gap-1">
              <Heart className="w-3 h-3 fill-current animate-pulse text-rose-500" /> {restingHeartRate} BPM
            </span>
          </label>
          <input
            type="number"
            min="30"
            max="140"
            value={restingHeartRate || ''}
            onChange={(e) => setRestingHeartRate(Math.max(30, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-1.5 h-9 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 font-mono transition-all"
            placeholder="e.g. 52 (wake up measure)"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-1">
            Symptom Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500/50 transition-all"
            placeholder="e.g. Back stiffness resolved; speed felt fine."
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-lg bg-teal-650 hover:bg-teal-700 active:bg-teal-800 text-white font-sans font-bold text-xs flex items-center justify-center gap-1.5 border border-teal-500/25 shadow shadow-teal-500/10 cursor-pointer transition-colors"
        >
          <Zap className="w-3.5 h-3.5 text-teal-200 animate-pulse" />
          Log Recovery Parameters
        </button>
      </form>
    </div>
  );
}
