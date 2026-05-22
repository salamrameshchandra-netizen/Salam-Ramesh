/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PlayerProfile, PlayerRole, WorkloadSession, RecoveryLog, ACWRMetrics, WorkloadAlert } from './types';
import {
  calculateACWR,
  generateAlerts,
  compileDayMetrics,
  getPastDates,
  generateManagedStateData,
  generateSpikedStateData
} from './utils/workload';
import Dashboard from './components/Dashboard';
import WorkloadForm from './components/WorkloadForm';
import RecoveryForm from './components/RecoveryForm';
import Charts from './components/Charts';
import ProfileSettings from './components/ProfileSettings';
import HowToUse from './components/HowToUse';
import { generatePdfReport } from './utils/pdfGenerator';
import { 
  TrendingUp, 
  Dumbbell, 
  Moon, 
  Settings, 
  Activity, 
  User, 
  UserCheck, 
  CheckCircle, 
  Zap, 
  AlertTriangle, 
  Flame, 
  Compass,
  Calendar,
  Plus,
  UserPlus,
  Trash2,
  Users,
  BookOpen,
  FileDown
} from 'lucide-react';

const STATIC_TODAY = '2026-05-21'; // matching current local metadata time for timelines

export default function App() {
  // 1. Initial Player Roster & Profile States
  const [allPlayers, setAllPlayers] = useState<PlayerProfile[]>(() => {
    const saved = localStorage.getItem('cricket_all_players');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [
      {
        name: 'Jasprit Bumrah',
        role: 'Fast Bowler',
        age: 32,
        bowlingArm: 'Right-arm',
        battingStyle: 'Right-hand bat',
        weeklyOversLimit: 24,
        maxSingleRpe: 8
      },
      {
        name: 'R. Ashwin',
        role: 'Spin Bowler',
        age: 39,
        bowlingArm: 'Right-arm',
        battingStyle: 'Right-hand bat',
        weeklyOversLimit: 36,
        maxSingleRpe: 8
      },
      {
        name: 'Virat Kohli',
        role: 'Batsman',
        age: 37,
        bowlingArm: 'None',
        battingStyle: 'Right-hand bat',
        weeklyOversLimit: 0,
        maxSingleRpe: 7
      }
    ];
  });

  const [profile, setProfile] = useState<PlayerProfile>(() => {
    const saved = localStorage.getItem('cricket_athlete_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      name: 'Jasprit Bumrah',
      role: 'Fast Bowler',
      age: 32,
      bowlingArm: 'Right-arm',
      battingStyle: 'Right-hand bat',
      weeklyOversLimit: 24,
      maxSingleRpe: 8
    };
  });

  // State for adding a player on the fly in the top header bar
  const [showAddPlayerPopover, setShowAddPlayerPopover] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState<'Fast Bowler' | 'Spin Bowler' | 'Batsman' | 'Wicketkeeper' | 'All-rounder'>('Fast Bowler');
  const [newPlayerAge, setNewPlayerAge] = useState(25);

  // Timeline days (35 days historical sequence leading up to 2026-05-21)
  const [dateTimeline] = useState<string[]>(() => getPastDates(35, STATIC_TODAY));

  // Preset Selection: 'managed' (gradual ramp) vs 'spiked' (sudden extreme matches)
  const [activePreset, setActivePreset] = useState<'managed' | 'spiked'>(() => {
    const savedPreset = localStorage.getItem('cricket_active_preset');
    return (savedPreset as 'managed' | 'spiked') || 'managed';
  });

  // 2. Workload & Recovery datasets
  const [sessions, setSessions] = useState<WorkloadSession[]>([]);
  const [recoveries, setRecoveries] = useState<RecoveryLog[]>([]);

  // Inline safe confirmation prompt states (bypasses sandboxed iframe confirm dialog blocks)
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Page index tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'log-workload' | 'log-recovery' | 'charts' | 'settings' | 'how-to-use'>('dashboard');

  // Load and populate preselected preset data or retrieve from custom localStorage logs
  useEffect(() => {
    const savedSessions = localStorage.getItem(`cricket_sessions_${activePreset}`);
    const savedRecoveries = localStorage.getItem(`cricket_recoveries_${activePreset}`);

    if (savedSessions && savedRecoveries) {
      try {
        setSessions(JSON.parse(savedSessions));
        setRecoveries(JSON.parse(savedRecoveries));
        return;
      } catch (e) {
        // Fallback to generators if corrupt
      }
    }

    // Otherwise, generate pre-calculated template sequences
    const defaultData = activePreset === 'managed' 
      ? generateManagedStateData(dateTimeline)
      : generateSpikedStateData(dateTimeline);

    setSessions(defaultData.sessions);
    setRecoveries(defaultData.recoveries);

    // Save as current
    localStorage.setItem(`cricket_sessions_${activePreset}`, JSON.stringify(defaultData.sessions));
    localStorage.setItem(`cricket_recoveries_${activePreset}`, JSON.stringify(defaultData.recoveries));
  }, [activePreset, dateTimeline]);

  // Persist profile & all players list when changed
  useEffect(() => {
    localStorage.setItem('cricket_athlete_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('cricket_all_players', JSON.stringify(allPlayers));
  }, [allPlayers]);

  // Triggered when user alters the preset simulation
  const handlePresetSwitch = (preset: 'managed' | 'spiked') => {
    setActivePreset(preset);
    localStorage.setItem('cricket_active_preset', preset);
  };

  // 3. Computed sports metrics calculations
  const dayMetrics = compileDayMetrics(sessions, recoveries, dateTimeline);
  
  // Calculate current ACWR on the last date of timeline
  const currentACWRMetrics = calculateACWR(dayMetrics, dayMetrics.length - 1);
  
  // Generate automated alerts
  const activeAlerts = generateAlerts(profile, sessions, recoveries, dayMetrics);

  // 4. Logging handlers (saves instantly into active preset storage list)
  const handleAddSession = (newSess: Omit<WorkloadSession, 'id' | 'calculatedLoad'>) => {
    const id = `sess-${Date.now()}`;
    
    // Standard Foster's Session Load: duration * RPE
    let calculatedLoad = newSess.durationMinutes * newSess.rpe;
    
    // Bowler specific weight: adding spinal delivery count load values
    if (newSess.oversBowled && newSess.oversBowled > 0) {
      calculatedLoad += Math.round(newSess.oversBowled * 6 * newSess.rpe * 0.15); // bowling impact adjustment
    }

    const session: WorkloadSession = {
      ...newSess,
      id,
      calculatedLoad
    };

    const updated = [...sessions, session];
    setSessions(updated);
    localStorage.setItem(`cricket_sessions_${activePreset}`, JSON.stringify(updated));
  };

  const handleAddRecovery = (newRec: Omit<RecoveryLog, 'id'>) => {
    const id = `rec-${Date.now()}`;
    const recovery: RecoveryLog = {
      ...newRec,
      id
    };

    // Filter out old records on the exact same date to avoid double checks
    const cleaned = recoveries.filter(r => r.date !== newRec.date);
    const updated = [...cleaned, recovery].sort((a,b) => a.date.localeCompare(b.date));
    setRecoveries(updated);
    localStorage.setItem(`cricket_recoveries_${activePreset}`, JSON.stringify(updated));
  };

  // Log deletes
  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem(`cricket_sessions_${activePreset}`, JSON.stringify(updated));
  };

  const handleDeleteRecovery = (id: string) => {
    const updated = recoveries.filter(r => r.id !== id);
    setRecoveries(updated);
    localStorage.setItem(`cricket_recoveries_${activePreset}`, JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500/30">
      
      {/* ----------------------------------------------------
          APPLICATION TOP BAR
         ---------------------------------------------------- */}
      <header className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-lg shadow-orange-500/15">
              <Flame className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-black font-sans uppercase tracking-wider text-white flex items-center gap-1.5 leading-none">
                Cricketer Workload Monitor
              </h1>
              <p className="text-[9px] text-slate-500 font-mono flex items-center gap-1 uppercase tracking-widest mt-0.5 font-bold">
                <Calendar className="w-2.5 h-2.5 text-orange-500/75" /> Local Cycle Time: {STATIC_TODAY}
              </p>
            </div>
          </div>

          {/* Player Quick Badge widget (Editable inline manually or added via button) */}
          <div className="flex items-center gap-2 bg-slate-900/75 p-1 px-2 border border-slate-800 rounded-lg max-h-[46px] relative">
            <div className="w-7 h-7 rounded-full bg-orange-600/15 border border-orange-500/20 flex items-center justify-center text-orange-400 flex-shrink-0">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            
            <div className="leading-tight flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                {/* Select dropdown of saved players */}
                 <select
                  value={profile.name || ''}
                  onChange={(e) => {
                    const found = allPlayers.find(p => p.name === e.target.value);
                    if (found) setProfile(found);
                  }}
                  className="bg-slate-950 text-[10px] font-bold text-slate-200 border border-slate-800/80 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-orange-500/40 max-w-[100px] sm:max-w-[130px] font-sans"
                  title="Select a player from squad roster"
                  id="header-player-select"
                >
                  {allPlayers.length === 0 ? (
                    <option value="">No Players</option>
                  ) : (
                    allPlayers.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))
                  )}
                </select>

                {/* Plus Button to toggle inline player addition screen */}
                <button
                  onClick={() => {
                    setShowAddPlayerPopover(!showAddPlayerPopover);
                    setNewPlayerName('');
                  }}
                  className="p-1 rounded bg-orange-600 hover:bg-orange-700 text-white select-none cursor-pointer duration-150 transition-colors flex items-center justify-center"
                  title="Add a new player's name manually"
                  id="header-add-player-init-btn"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
              <p className="text-[8px] text-orange-450 font-mono font-bold tracking-tight px-1 leading-none mt-0.5">
                {profile.name ? `${profile.role} (Age ${profile.age})` : 'Create/Add Athlete'}
              </p>
            </div>

            {/* Floating popover to instantly add player name manually */}
            {showAddPlayerPopover && (
              <div 
                className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl z-50 text-left font-sans space-y-2.5"
                style={{ contentVisibility: 'auto' }}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider font-mono text-orange-400 flex items-center gap-1">
                    <UserPlus className="w-3 h-3" /> Add Player Profile
                  </span>
                  <button 
                    onClick={() => setShowAddPlayerPopover(false)} 
                    className="text-slate-500 hover:text-slate-300 font-mono text-[9px] font-black cursor-pointer px-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div>
                    <label className="block text-[8px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-0.5">
                      Athlete Name:
                    </label>
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      className="w-full px-2 py-1 h-7 rounded bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500/50"
                      placeholder="e.g. Mitchell Starc"
                      id="new-player-name-field"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-0.5">
                        Age:
                      </label>
                      <input
                        type="number"
                        min="12"
                        max="60"
                        value={newPlayerAge}
                        onChange={(e) => setNewPlayerAge(parseInt(e.target.value) || 25)}
                        className="w-full px-2 py-1 h-7 rounded bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold uppercase tracking-wider font-mono text-slate-400 mb-0.5">
                        Role:
                      </label>
                      <select
                        value={newPlayerRole}
                        onChange={(e) => setNewPlayerRole(e.target.value as PlayerRole)}
                        className="w-full px-1 py-1 h-7 rounded bg-slate-900 border border-slate-800 text-white text-[10px] focus:outline-none focus:border-orange-500/50"
                      >
                        <option value="Fast Bowler">Fast Bowler</option>
                        <option value="Spin Bowler">Spin Bowler</option>
                        <option value="Batsman">Batsman</option>
                        <option value="Wicketkeeper">Wicketkeeper</option>
                        <option value="All-rounder">All-rounder</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => {
                      const trimmed = newPlayerName.trim();
                      if (!trimmed) return;
                      
                      let recommendedOvers = 0;
                      if (newPlayerRole === 'Fast Bowler') recommendedOvers = 24;
                      else if (newPlayerRole === 'Spin Bowler') recommendedOvers = 36;
                      else if (newPlayerRole === 'All-rounder') recommendedOvers = 30;

                      const newP: PlayerProfile = {
                        name: trimmed,
                        role: newPlayerRole,
                        age: newPlayerAge,
                        bowlingArm: (newPlayerRole === 'Batsman' || newPlayerRole === 'Wicketkeeper') ? 'None' : 'Right-arm',
                        battingStyle: 'Right-hand bat',
                        weeklyOversLimit: recommendedOvers,
                        maxSingleRpe: 8
                      };

                      setAllPlayers(prev => {
                        if (prev.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
                          return prev.map(p => p.name.toLowerCase() === trimmed.toLowerCase() ? newP : p);
                        }
                        return [...prev, newP];
                      });
                      setProfile(newP);
                      setShowAddPlayerPopover(false);
                    }}
                    className="flex-1 py-1 px-2 rounded bg-orange-600 hover:bg-orange-700 text-white font-mono font-bold text-[9px] uppercase text-center cursor-pointer duration-150 transition-all border border-orange-500/10"
                    id="save-new-player-btn"
                  >
                    Add player
                  </button>
                  <button
                    onClick={() => setShowAddPlayerPopover(false)}
                    className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-[9px] uppercase text-center cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">

        {/* ----------------------------------------------------
            SIMULATION / MOCK CONTROLS PANEL
           ---------------------------------------------------- */}
        <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/15 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-inner">
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/20 font-mono">
              <Compass className="w-2.5 h-2.5" /> Dashboard Simulation Controls
            </span>
            <h3 className="text-xs font-extrabold text-white tracking-wider font-mono uppercase">
              Test Spikes vs Steady Progression
            </h3>
            <p className="text-[11px] text-slate-400 leading-snug max-w-xl">
              Cricketers can alternate between steady conditioning workloads vs sudden match overloads. Let's explore real-time risk simulation:
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handlePresetSwitch('managed')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider font-mono cursor-pointer transition-all duration-150 ${
                activePreset === 'managed'
                  ? 'bg-emerald-600 text-white shadow border border-emerald-500'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-850'
              }`}
            >
              Steady Conditioning (Safe)
            </button>
            <button
              onClick={() => handlePresetSwitch('spiked')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider font-mono cursor-pointer transition-all duration-150 ${
                activePreset === 'spiked'
                  ? 'bg-rose-600 text-white shadow border border-rose-500 animate-pulse'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-850'
              }`}
            >
              Tournament Overload (Spike)
            </button>

            {/* Safe Interactive Wiping / Reset controls (Free of iframe-blocking confirm modal dialogs) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Programmable PDF export button */}
              <button
                onClick={() => {
                  generatePdfReport({
                    profile,
                    activePreset,
                    sessions,
                    recoveries,
                    acwrMetrics: currentACWRMetrics,
                    alerts: activeAlerts
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black font-mono bg-gradient-to-r from-orange-600 to-orange-550 hover:from-orange-700 hover:to-orange-650 text-white cursor-pointer transition-all duration-150 border border-orange-500/20 shadow-md hover:shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98]"
                title="Download physiological athletic report as PDF"
                id="export-pdf-btn"
              >
                <FileDown className="w-3.5 h-3.5 text-white animate-pulse" />
                Export PDF
              </button>

              {/* Reset to Default simulated data button */}
              {showResetConfirm ? (
                <div id="reset-confirm-box" className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-orange-500/40">
                  <span className="text-[9px] font-bold font-mono text-orange-400 px-1">Reset defaults?</span>
                  <button
                    onClick={() => {
                      const defaultData = activePreset === 'managed' 
                        ? generateManagedStateData(dateTimeline)
                        : generateSpikedStateData(dateTimeline);

                      setSessions(defaultData.sessions);
                      setRecoveries(defaultData.recoveries);
                      
                      localStorage.setItem(`cricket_sessions_${activePreset}`, JSON.stringify(defaultData.sessions));
                      localStorage.setItem(`cricket_recoveries_${activePreset}`, JSON.stringify(defaultData.recoveries));
                      
                      setShowResetConfirm(false);
                    }}
                    className="px-2 py-1 rounded bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-extrabold font-mono uppercase cursor-pointer"
                    id="confirm-reset-yes"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold font-mono uppercase cursor-pointer"
                    id="confirm-reset-no"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowResetConfirm(true);
                    setShowClearConfirm(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold font-mono text-slate-300 hover:text-white border border-slate-800 bg-slate-950 cursor-pointer hover:bg-slate-900 transition-colors"
                  title="Reload demonstration scenario logs mapping"
                  id="reset-defaults-btn"
                >
                  Reset Defaults
                </button>
              )}

              {/* Clear All Logs button (allows entering custom manual statistics from scratch) */}
              {showClearConfirm ? (
                <div id="clear-confirm-box" className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-rose-500/40">
                  <span className="text-[9px] font-bold font-mono text-rose-450 px-1 font-black">Clear everything?</span>
                  <button
                    onClick={() => {
                      setSessions([]);
                      setRecoveries([]);
                      setAllPlayers([]);
                      
                      const emptyProf: PlayerProfile = {
                        name: '',
                        role: 'Batsman',
                        age: 25,
                        bowlingArm: 'None',
                        battingStyle: 'Right-hand bat',
                        weeklyOversLimit: 0,
                        maxSingleRpe: 10
                      };
                      setProfile(emptyProf);
                      
                      localStorage.setItem(`cricket_sessions_${activePreset}`, JSON.stringify([]));
                      localStorage.setItem(`cricket_recoveries_${activePreset}`, JSON.stringify([]));
                      localStorage.setItem('cricket_all_players', JSON.stringify([]));
                      localStorage.setItem('cricket_athlete_profile', JSON.stringify(emptyProf));
                      
                      setShowClearConfirm(false);
                    }}
                    className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold font-mono uppercase cursor-pointer"
                    id="confirm-clear-yes"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold font-mono uppercase cursor-pointer"
                    id="confirm-clear-no"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowClearConfirm(true);
                    setShowResetConfirm(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold font-mono text-rose-500 hover:text-rose-400 border border-slate-800/80 bg-slate-950 cursor-pointer hover:bg-slate-900 transition-colors"
                  title="Remove all logged exercises and start fully pristine empty log boards"
                  id="clear-all-btn"
                >
                  Clear All Data
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------
            PRIMARY TAB NAVIGATION RAIL
           ---------------------------------------------------- */}
        <div className="flex bg-slate-900/40 p-1 border border-slate-800 rounded-xl overflow-x-auto scroller-hidden">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-black tracking-wider uppercase font-mono cursor-pointer transition-all ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-white shadow-inner border-b-2 border-orange-500'
                : 'text-slate-400 hover:text-slate-250 hover:bg-slate-850/50'
            }`}
          >
            <Activity className="w-4.5 h-4.5" />
            Dashboard
          </button>
          
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-black tracking-wider uppercase font-mono cursor-pointer transition-all ${
              activeTab === 'charts'
                ? 'bg-slate-800 text-white shadow-inner border-b-2 border-orange-500'
                : 'text-slate-400 hover:text-slate-250 hover:bg-slate-850/50'
            }`}
          >
            <TrendingUp className="w-4.5 h-4.5" />
            Charts
          </button>

          <button
            onClick={() => setActiveTab('log-workload')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-black tracking-wider uppercase font-mono cursor-pointer transition-all ${
              activeTab === 'log-workload'
                ? 'bg-slate-800 text-white shadow-inner border-b-2 border-orange-500'
                : 'text-slate-400 hover:text-slate-250 hover:bg-slate-850/50'
            }`}
          >
            <Dumbbell className="w-4.5 h-4.5 text-orange-400" />
            Log Workload
          </button>

          <button
            onClick={() => setActiveTab('log-recovery')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-black tracking-wider uppercase font-mono cursor-pointer transition-all ${
              activeTab === 'log-recovery'
                ? 'bg-slate-800 text-white shadow-inner border-b-2 border-orange-500'
                : 'text-slate-400 hover:text-slate-250 hover:bg-slate-850/50'
            }`}
          >
            <Moon className="w-4.5 h-4.5 text-teal-400" />
            Log Recovery
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-black tracking-wider uppercase font-mono cursor-pointer transition-all ${
              activeTab === 'settings'
                ? 'bg-slate-800 text-white shadow-inner border-b-2 border-orange-500'
                : 'text-slate-400 hover:text-slate-250 hover:bg-slate-850/50'
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
            Bio Limits
          </button>

          <button
            onClick={() => setActiveTab('how-to-use')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-black tracking-wider uppercase font-mono cursor-pointer transition-all ${
              activeTab === 'how-to-use'
                ? 'bg-slate-800 text-white shadow-inner border-b-2 border-orange-500'
                : 'text-slate-400 hover:text-slate-250 hover:bg-slate-850/50'
            }`}
          >
            <BookOpen className="w-4.5 h-4.5 text-orange-400" />
            How to Use
          </button>
        </div>

        {/* ----------------------------------------------------
            ACTIVE PANEL CONTENT
           ---------------------------------------------------- */}
        <div className="transition-all duration-300">
          {activeTab === 'dashboard' && (
            <Dashboard
              playerProfile={profile}
              sessions={sessions}
              recoveries={recoveries}
              dayMetrics={dayMetrics}
              acwrMetrics={currentACWRMetrics}
              alerts={activeAlerts}
              onDeleteSession={handleDeleteSession}
              onDeleteRecovery={handleDeleteRecovery}
            />
          )}

          {activeTab === 'charts' && (
            <Charts dayMetrics={dayMetrics} />
          )}

          {activeTab === 'log-workload' && (
            <div className="max-w-xl mx-auto space-y-4">
              <WorkloadForm
                playerProfile={profile}
                onSubmit={handleAddSession}
                todayDateStr={STATIC_TODAY}
              />
              {/* Info Tips */}
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg text-xs text-slate-400 leading-relaxed font-sans shadow-sm">
                <span className="font-extrabold text-white font-mono uppercase text-[9px] block mb-0.5 tracking-wider">Injury Prevention Tip</span>
                Fast bowlers should avoid ramping up their weekly bowling overs by more than 15% from week to week. Sudden workloads (above 1.5 ACWR) increases joint fatigue and is the leading cause of ankle sprains, hamstring pulls, and lumbar spine stress cracks.
              </div>
            </div>
          )}

          {activeTab === 'log-recovery' && (
            <div className="max-w-xl mx-auto space-y-4">
              <RecoveryForm
                onSubmit={handleAddRecovery}
                todayDateStr={STATIC_TODAY}
              />
              {/* Info Tips */}
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg text-xs text-slate-400 leading-relaxed font-sans shadow-sm">
                <span className="font-extrabold text-white font-mono uppercase text-[9px] block mb-0.5 tracking-wider">CNS Recovery Guidelines</span>
                Sleeping less than 7 hours increases overall muscular stiffness by reducing blood perfusion. If you have logged a soreness scale of 7+, consider an ice bath session followed by gentle, low-intensity active recovery or yoga.
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto">
              <ProfileSettings
                initialProfile={profile}
                onUpdate={(up) => {
                  setProfile(up);
                  setAllPlayers(prev => prev.map(p => p.name === profile.name ? up : p));
                }}
                allPlayers={allPlayers}
                onSelectPlayer={(p) => setProfile(p)}
                onAddPlayer={(newP) => {
                  setAllPlayers(prev => {
                    if (prev.some(p => p.name.toLowerCase() === newP.name.toLowerCase())) {
                      return prev; // Avoid duplicate player profiles
                    }
                    return [...prev, newP];
                  });
                  setProfile(newP);
                }}
                onDeletePlayer={(nameToDelete) => {
                  const filtered = allPlayers.filter(p => p.name !== nameToDelete);
                  if (filtered.length > 0) {
                    setAllPlayers(filtered);
                    if (profile.name === nameToDelete) {
                      setProfile(filtered[0]);
                    }
                  }
                }}
              />
            </div>
          )}

          {activeTab === 'how-to-use' && (
            <HowToUse />
          )}
        </div>

      </main>

      {/* ----------------------------------------------------
          APPLICATION FOOTER
         ---------------------------------------------------- */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950 py-6 text-center text-[11px] text-slate-500">
        <p className="font-sans">© 2026 Cricketer Workload Applet. Built with clean, offline-first responsive local storage. All sports telemetry values are kept on-system only.</p>
        <p className="mt-1 font-mono text-[9px] text-slate-600 uppercase tracking-wider">Calculated under standard acute:chronic overload methodology.</p>
      </footer>

    </div>
  );
}
