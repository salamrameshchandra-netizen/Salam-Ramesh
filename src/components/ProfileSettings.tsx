/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PlayerProfile, PlayerRole } from '../types';
import { User, ShieldAlert, CheckCircle, Save, Trash2, Users, UserPlus } from 'lucide-react';

interface ProfileSettingsProps {
  initialProfile: PlayerProfile;
  onUpdate: (updatedProfile: PlayerProfile) => void;
  allPlayers?: PlayerProfile[];
  onSelectPlayer?: (profile: PlayerProfile) => void;
  onAddPlayer?: (profile: PlayerProfile) => void;
  onDeletePlayer?: (name: string) => void;
}

export default function ProfileSettings({ 
  initialProfile, 
  onUpdate,
  allPlayers = [],
  onSelectPlayer,
  onAddPlayer,
  onDeletePlayer
}: ProfileSettingsProps) {
  const [name, setName] = useState<string>(initialProfile.name);
  const [role, setRole] = useState<PlayerRole>(initialProfile.role);
  const [age, setAge] = useState<number>(initialProfile.age);
  const [bowlingArm, setBowlingArm] = useState<'Right-arm' | 'Left-arm' | 'None'>(initialProfile.bowlingArm);
  const [battingStyle, setBattingStyle] = useState<'Right-hand bat' | 'Left-hand bat'>(initialProfile.battingStyle);
  const [weeklyOversLimit, setWeeklyOversLimit] = useState<number>(initialProfile.weeklyOversLimit);
  const [maxSingleRpe, setMaxSingleRpe] = useState<number>(initialProfile.maxSingleRpe);

  // Synchronize internal form state when initialProfile changes on active selection
  useEffect(() => {
    setName(initialProfile.name);
    setRole(initialProfile.role);
    setAge(initialProfile.age);
    setBowlingArm(initialProfile.bowlingArm);
    setBattingStyle(initialProfile.battingStyle);
    setWeeklyOversLimit(initialProfile.weeklyOversLimit);
    setMaxSingleRpe(initialProfile.maxSingleRpe);
  }, [initialProfile]);

  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleRoleChange = (selectedRole: PlayerRole) => {
    setRole(selectedRole);
    // Auto-adjust default weekly overs based on roles
    if (selectedRole === 'Fast Bowler') {
      setWeeklyOversLimit(24);
      setBowlingArm(initialProfile.bowlingArm === 'None' ? 'Right-arm' : initialProfile.bowlingArm);
    } else if (selectedRole === 'Spin Bowler') {
      setWeeklyOversLimit(36);
      setBowlingArm(initialProfile.bowlingArm === 'None' ? 'Right-arm' : initialProfile.bowlingArm);
    } else if (selectedRole === 'All-rounder') {
      setWeeklyOversLimit(30);
      setBowlingArm(initialProfile.bowlingArm === 'None' ? 'Right-arm' : initialProfile.bowlingArm);
    } else {
      setWeeklyOversLimit(0);
      setBowlingArm('None');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      name: name.trim() || 'Athlete',
      role,
      age: Number(age) || 24,
      bowlingArm,
      battingStyle,
      weeklyOversLimit: Number(weeklyOversLimit) || 0,
      maxSingleRpe: Number(maxSingleRpe) || 8,
    });

    setSavedMessage('Player Profile and bio-thresholds updated successfully!');
    setTimeout(() => {
      setSavedMessage(null);
    }, 4000);
  };

  return (
    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 backdrop-blur-sm shadow-xl">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
          <User className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Athlete Bio-Limits</h3>
          <p className="text-[11px] text-slate-400">Configure biomechanical roles and personalized fatigue thresholds</p>
        </div>
      </div>

      {savedMessage && (
        <div className="mb-4 p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-xs text-emerald-300 font-medium flex items-center gap-1.5 font-mono">
          <CheckCircle className="w-3.5 h-3.5 ml-1 flex-shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Squad Roster Quick-Switcher / Creator with prompt */}
      <div className="mb-5 p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 shadow-inner">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800/50 pb-2">
          <span className="text-[10px] font-black font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-orange-400" /> Squad Roster ({allPlayers.length})
          </span>
          <button
            type="button"
            onClick={() => {
              const manualName = prompt("Enter the new player's full name:");
              if (manualName && manualName.trim()) {
                const trimmed = manualName.trim();
                // Check duplicate name
                if (allPlayers.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
                  alert(`A player named "${trimmed}" already exists in the roster!`);
                  return;
                }
                
                const defaultPlayer: PlayerProfile = {
                  name: trimmed,
                  role: 'Fast Bowler',
                  age: 26,
                  bowlingArm: 'Right-arm',
                  battingStyle: 'Right-hand bat',
                  weeklyOversLimit: 24,
                  maxSingleRpe: 8
                };
                if (onAddPlayer) onAddPlayer(defaultPlayer);
              }
            }}
            className="px-2 py-1 rounded bg-orange-600/10 hover:bg-orange-600 border border-orange-500/20 hover:border-orange-500 text-orange-400 hover:text-white text-[9px] font-bold font-mono uppercase tracking-wider cursor-pointer duration-150 transition-all flex items-center gap-1"
            id="roster-inline-add-player-btn"
          >
            <UserPlus className="w-3 h-3" /> + Add Squad Player
          </button>
        </div>

        {allPlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto scroller-hidden">
            {allPlayers.map((player) => {
              const isActive = player.name === initialProfile.name && initialProfile.name !== '';
              return (
                <div 
                  key={player.name}
                  className={`p-2 rounded border flex items-center justify-between gap-1.5 duration-150 transition-all ${
                    isActive 
                      ? 'bg-orange-600/10 border-orange-500/40 text-orange-200 shadow'
                      : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:border-slate-800'
                  }`}
                >
                  <div 
                    onClick={() => onSelectPlayer && onSelectPlayer(player)}
                    className="flex-1 cursor-pointer select-none text-left animate-fade-in"
                    title={`Click to load ${player.name} profile`}
                  >
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <span className={isActive ? 'text-orange-400' : 'text-slate-300'}>{player.name}</span>
                      {isActive && <span className="text-[7px] bg-orange-600 text-white font-extrabold px-1 rounded uppercase">Active</span>}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5 leading-none">
                      {player.role} • Age {player.age}
                    </p>
                  </div>

                  {allPlayers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeletePlayer && onDeletePlayer(player.name)}
                      className="p-1 px-1.5 rounded hover:bg-rose-600/15 text-slate-500 hover:text-rose-450 cursor-pointer duration-150 flex items-center justify-center transition-colors"
                      title={`Remove ${player.name} from squad`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-4 border border-dashed border-slate-800 rounded bg-slate-900/20">
            <p className="text-xs text-slate-400 font-bold">No active players in squad.</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
              Click "+ Add Squad Player" or write a name below and save to build your custom, pristine athlete pool.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-1">
              Athlete Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 h-9 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
              placeholder="e.g. Jasprit Bumrah"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-1">
              Athlete Age (years)
            </label>
            <input
              type="number"
              required
              min="12"
              max="65"
              value={age || ''}
              onChange={(e) => setAge(Math.max(12, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-1.5 h-9 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 font-mono transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Primary Role */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-1">
              Primary Role
            </label>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value as PlayerRole)}
              className="w-full px-3 py-1.5 h-9 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
            >
              <option value="Fast Bowler">Fast Bowler (Paceman)</option>
              <option value="Spin Bowler">Spin Bowler (Tweak/Orthodox)</option>
              <option value="Batsman">Primary Batsman</option>
              <option value="Wicketkeeper">Wicketkeeper-Batsman</option>
              <option value="All-rounder">Genuine All-rounder</option>
            </select>
          </div>

          {/* Batting Orientation */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-1">
              Batting Stance
            </label>
            <select
              value={battingStyle}
              onChange={(e) => setBattingStyle(e.target.value as 'Right-hand bat' | 'Left-hand bat')}
              className="w-full px-3 py-1.5 h-9 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
            >
              <option value="Right-hand bat">Right-hand bat</option>
              <option value="Left-hand bat">Left-hand bat</option>
            </select>
          </div>

          {/* Bowling Arm */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-1">
              Bowling Orientation
            </label>
            <select
              value={bowlingArm}
              disabled={role === 'Batsman' || role === 'Wicketkeeper'}
              onChange={(e) => setBowlingArm(e.target.value as 'Right-arm' | 'Left-arm' | 'None')}
              className="w-full px-3 py-1.5 h-9 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
            >
              <option value="Right-arm">Right-arm delivery</option>
              <option value="Left-arm">Left-arm delivery</option>
              <option value="None">None (Pure batter/keeper)</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-800 my-4 pt-4 space-y-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldAlert className="w-4 h-4 text-orange-450 flex-shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-white">Workload Bio-threshold Warnings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Weekly Bowling overs limit */}
            <div>
              <label className="block text-[10px] font-bold text-slate-450 mb-1 flex justify-between font-mono">
                <span>Maximum Weekly Overs Bowled</span>
                <span className="text-orange-400 font-bold">{weeklyOversLimit} overs</span>
              </label>
              <input
                type="number"
                disabled={role === 'Batsman' || role === 'Wicketkeeper'}
                min="0"
                max="100"
                value={weeklyOversLimit}
                onChange={(e) => setWeeklyOversLimit(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-1.5 h-9 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-40 text-white text-xs focus:outline-none focus:border-orange-500/50 transition-colors font-mono"
                placeholder="e.g. 24"
              />
              <p className="mt-1 text-[9px] text-slate-500 leading-normal font-mono">
                Spinner limits are standard 36; Fast Bowlers max 24.
              </p>
            </div>

            {/* Critical rating of exertion warning threshold */}
            <div>
              <label className="block text-[10px] font-bold text-slate-450 mb-1 flex justify-between font-mono">
                <span>Critical Session RPE Threshold</span>
                <span className="text-orange-400 font-bold">RPE {maxSingleRpe}/10</span>
              </label>
              <input
                type="number"
                min="5"
                max="10"
                value={maxSingleRpe}
                onChange={(e) => setMaxSingleRpe(Math.max(5, Math.min(10, parseInt(e.target.value) || 8)))}
                className="w-full px-3 py-1.5 h-9 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500/50 transition-colors font-mono"
              />
              <p className="mt-1 text-[9px] text-slate-500 leading-normal font-mono">
                Triggers warning alerts whenever a single workout session is logged with effort exceeding this level.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-750 active:bg-slate-850 text-white font-mono font-black uppercase text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          Save Settings & Limits
        </button>
      </form>
    </div>
  );
}
