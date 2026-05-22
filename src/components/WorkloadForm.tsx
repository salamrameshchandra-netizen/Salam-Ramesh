/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ActivityType, PlayerProfile, WorkloadSession } from '../types';
import { Dumbbell, PlusCircle, Calendar, Clock, Sparkles } from 'lucide-react';

interface WorkloadFormProps {
  playerProfile: PlayerProfile;
  onSubmit: (session: Omit<WorkloadSession, 'id' | 'calculatedLoad'>) => void;
  todayDateStr: string;
}

export default function WorkloadForm({ playerProfile, onSubmit, todayDateStr }: WorkloadFormProps) {
  const [date, setDate] = useState<string>(todayDateStr);
  const [type, setType] = useState<ActivityType>('Net Session');
  const [duration, setDuration] = useState<number>(60);
  const [rpe, setRpe] = useState<number>(5);
  
  // Toggles for optional metrics
  const [bowled, setBowled] = useState<boolean>(
    playerProfile.role === 'Fast Bowler' || playerProfile.role === 'Spin Bowler' || playerProfile.role === 'All-rounder'
  );
  const [batted, setBatted] = useState<boolean>(
    playerProfile.role === 'Batsman' || playerProfile.role === 'Wicketkeeper' || playerProfile.role === 'All-rounder'
  );
  const [intensityMeters, setIntensityMeters] = useState<number>(0);

  // Bowling details
  const [overs, setOvers] = useState<number>(0);
  const [ballsFaced, setBallsFaced] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const [notification, setNotification] = useState<string | null>(null);

  // Description map of RPE values for helpful sporting context
  const getRpeDescription = (val: number) => {
    switch (val) {
      case 1: return 'Rest / Very Easy (Active restoration)';
      case 2: return 'Easy (Comfortable conversational breathing)';
      case 3: return 'Moderate (Slight sweating, easy pace)';
      case 4: return 'Somewhat Hard (Active aerobic work, breathing deep)';
      case 5: return 'Hard (Challenging, speech is broken)';
      case 6: return 'Challenging (Vigorous pace, muscular heat)';
      case 7: return 'Very Hard (Heavy gasping, high focus needed)';
      case 8: return 'Very, Very Hard (Lactic acid accumulation)';
      case 9: return 'Near Maximal (Extremely fatiguing spell)';
      case 10: return 'Maximal / Exhaustion (Absolute limit reached)';
      default: return '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (duration <= 0) {
      alert('Duration must be greater than zero.');
      return;
    }

    onSubmit({
      date,
      type,
      durationMinutes: duration,
      rpe,
      oversBowled: bowled ? Number(overs) : undefined,
      ballsFaced: batted ? Number(ballsFaced) : undefined,
      highIntensityDistanceMeters: intensityMeters > 0 ? Number(intensityMeters) : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
    });

    // Reset some states and trigger success message
    setNotes('');
    if (bowled) {
      setOvers(0);
    }
    if (batted) {
      setBallsFaced(0);
    }
    setIntensityMeters(0);

    setNotification('Session logged successfully and workloads updated!');
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  return (
    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 backdrop-blur-sm shadow-xl">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
          <Dumbbell className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Log Athletic Activity</h3>
          <p className="text-[11px] text-slate-400">Record training or match volumes and internal exertion ratings</p>
        </div>
      </div>

      {notification && (
        <div className="mb-4 p-2 rounded-lg bg-orange-500/15 border border-orange-500/35 text-xs text-orange-300 font-medium flex items-center gap-1.5 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 ml-1 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Date Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-1">
              Activity Date
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                <Calendar className="w-3.5 h-3.5" />
              </span>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 h-9 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all font-mono"
              />
            </div>
          </div>

          {/* Activity Type Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-1">
              Session Format
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ActivityType)}
              className="w-full px-3 py-1.5 h-9 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
            >
              <option value="Net Session">Net Session (Training)</option>
              <option value="Match">Match (Competitive)</option>
              <option value="Gym / Strength">Gym / Strength Program</option>
              <option value="Conditioning / Running">Conditioning / Running drills</option>
              <option value="Fielding Drill">Fielding Drill / catching drill</option>
            </select>
          </div>
        </div>

        {/* Duration Input */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-1 flex justify-between items-center">
            <span>Duration (Minutes)</span>
            <span className="text-slate-500 font-mono font-bold text-xs">{Math.floor(duration / 60)}h {duration % 60}m</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
              <Clock className="w-3.5 h-3.5" />
            </span>
            <input
              type="number"
              required
              min="1"
              max="480"
              value={duration || ''}
              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full pl-9 pr-3 py-1.5 h-9 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 font-mono transition-colors"
              placeholder="e.g. 90m"
            />
          </div>
        </div>

        {/* Rating of Perceived Exertion (RPE) Standard slider */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400">
              Session Intensity (RPE)
            </label>
            <span className="px-2 py-0.5 rounded font-mono text-xs font-black bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {rpe} / 10
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={rpe}
            onChange={(e) => setRpe(parseInt(e.target.value))}
            className="w-full accent-orange-500 cursor-ew-resize py-1 h-1.5 rounded-lg bg-slate-800 fill-orange-500"
          />
          <p className="mt-1 text-[11px] text-orange-350 font-medium italic">
            Intensity guide: {getRpeDescription(rpe)}
          </p>
        </div>

        {/* Sports Specific Checkboxes toggling inputs */}
        <div className="grid grid-cols-2 gap-3">
          <label className={`flex items-center gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer select-none ${
            bowled 
              ? 'bg-orange-500/5 border-orange-500/20 text-orange-300' 
              : 'bg-slate-950 border-slate-800/80 text-slate-500 hover:border-slate-705'
          }`}>
            <input
              type="checkbox"
              checked={bowled}
              onChange={() => setBowled(!bowled)}
              className="rounded accent-orange-500 w-3.5 h-3.5 bg-slate-800 border-slate-700"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Bowling Log</span>
          </label>

          <label className={`flex items-center gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer select-none ${
            batted 
              ? 'bg-orange-500/5 border-orange-500/20 text-orange-300' 
              : 'bg-slate-950 border-slate-800/80 text-slate-500 hover:border-slate-705'
          }`}>
            <input
              type="checkbox"
              checked={batted}
              onChange={() => setBatted(!batted)}
              className="rounded accent-orange-500 w-3.5 h-3.5 bg-slate-800 border-slate-700"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Batting Log</span>
          </label>
        </div>

        {/* Conditional Bowling Details */}
        {bowled && (
          <div className="p-3 rounded-lg bg-slate-950 border border-orange-500/15 space-y-2 animate-fadeIn">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-1 flex justify-between">
                <span>Overs Bowled</span>
                <span className="font-mono text-slate-550 font-bold">{(overs ? Math.round(overs * 6) : 0)} balls</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={overs || ''}
                onChange={(e) => setOvers(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500/30"
                placeholder="e.g. 6.0 overs (or 6.2)"
              />
              <p className="mt-1 text-[9px] text-slate-500 leading-normal font-mono">
                Decimals = balls: 6.1 (6 ov + 1 ball), 6.5 (6 ov + 5 balls).
              </p>
            </div>
          </div>
        )}

        {/* Conditional Batting Details */}
        {batted && (
          <div className="p-3 rounded-lg bg-slate-950 border border-orange-500/15 space-y-2 animate-fadeIn">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-1">
                Balls Faced
              </label>
              <input
                type="number"
                min="0"
                max="400"
                value={ballsFaced || ''}
                onChange={(e) => setBallsFaced(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500/30"
                placeholder="e.g. 50"
              />
            </div>
          </div>
        )}

        {/* GPS tracking speed meters - optional */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-1">
            Running Distance (Meters)
          </label>
          <input
            type="number"
            min="0"
            max="12000"
            value={intensityMeters || ''}
            onChange={(e) => setIntensityMeters(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-1.5 h-9 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500/50  font-mono transition-colors"
            placeholder="e.g. 1500 (from smartwatch)"
          />
        </div>

        {/* Custom notes or coach comments */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-1">
            Session Field Notes / Comments
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500/50 transition-colors"
            placeholder="e.g. Back stiffness resolved; speed felt fine."
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-lg bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-sans font-bold text-xs flex items-center justify-center gap-1.5 border border-orange-500/25 shadow shadow-orange-500/10 cursor-pointer transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Log Athletic Session
        </button>
      </form>
    </div>
  );
}
