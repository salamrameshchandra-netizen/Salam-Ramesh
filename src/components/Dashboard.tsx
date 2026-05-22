/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerProfile, WorkloadSession, RecoveryLog, ACWRMetrics, WorkloadAlert, DayMetrics } from '../types';
import { Activity, ShieldAlert, CheckCircle2, TrendingUp, AlertCircle, Trash2, ShieldCheck, Heart, Moon } from 'lucide-react';
import MetricCard from './MetricCard';

interface DashboardProps {
  playerProfile: PlayerProfile;
  sessions: WorkloadSession[];
  recoveries: RecoveryLog[];
  dayMetrics: DayMetrics[];
  acwrMetrics: ACWRMetrics;
  alerts: WorkloadAlert[];
  onDeleteSession: (id: string) => void;
  onDeleteRecovery: (id: string) => void;
}

export default function Dashboard({
  playerProfile,
  sessions,
  recoveries,
  dayMetrics,
  acwrMetrics,
  alerts,
  onDeleteSession,
  onDeleteRecovery
}: DashboardProps) {
  // Safe defaults
  const latestMetric = dayMetrics[dayMetrics.length - 1] || {
    totalLoad: 0,
    totalOvers: 0,
    totalBallsFaced: 0,
    readinessScore: null,
    sleepHours: null
  };

  // Safe checks for weekly overs
  let rollingOversLast7Days = 0;
  for (let i = 0; i < 7; i++) {
    const idx = dayMetrics.length - 1 - i;
    if (idx >= 0) {
      rollingOversLast7Days += dayMetrics[idx].totalOvers;
    }
  }

  // Calculate training load averages
  const totalLoad7Days = acwrMetrics.acuteLoad;
  const rollingChronicWeeklyAverage = acwrMetrics.chronicLoad;

  // Determine RPE status
  const getAcwrStatusText = (status: string) => {
    switch (status) {
      case 'Danger': return 'Load Spike (High Danger)';
      case 'Caution': return 'High Load (Caution)';
      case 'Under-trained': return 'Detrained / Underloaded';
      default: return 'Optimal (Sweet Spot)';
    }
  };

  const getAcwrColorClass = (status: string) => {
    switch (status) {
      case 'Danger': return 'text-rose-400 border-rose-500/15 bg-rose-500/5';
      case 'Caution': return 'text-amber-400 border-amber-500/15 bg-amber-500/5';
      case 'Under-trained': return 'text-purple-400 border-purple-500/15 bg-purple-500/5';
      default: return 'text-emerald-400 border-emerald-500/15 bg-emerald-500/5';
    }
  };

  const getReadinessAdvice = (score: number | null) => {
    if (score === null) return 'No recovery parameters logged for today. Submit values to calculate readiness index.';
    if (score >= 80) return 'Autonomic nervous system is fully primed. Perfect day to tackle heavy bowler spell limits or aerobic testing.';
    if (score >= 60) return 'Moderate energy status. Proceed with normal conditioning volumes, but keep physical spikes under control.';
    return 'Severe fatigue. We recommend omitting fast bowling or high-speed sprinting. Focus on active stretching and mobility drills.';
  };

  return (
    <div className="space-y-4">
      {!playerProfile.name && (
        <div className="p-4 bg-orange-600/15 border border-orange-500/30 rounded-xl flex items-center justify-between gap-3 animate-fade-in shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-black text-white uppercase tracking-wider font-mono">Pristine App State — Welcome!</p>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                All preloaded mock data and player presets have been cleared. Go to the <span className="text-orange-400 font-bold font-mono">Bio Limits</span> tab to create custom players, or click the <span className="text-orange-400 font-bold font-mono">"+"</span> button at the top header to write custom athlete profiles from scratch!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          KPI TOP SUMMARY CARDS
         ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* ACWR Load Ratio Card */}
        <MetricCard
          title="ACWR Load Ratio"
          value={acwrMetrics.acwr || 1.0}
          subValue={getAcwrStatusText(acwrMetrics.status)}
          subText="Acute Load / Chronic Load ratio. Safe zone is 0.8 to 1.3"
          icon={<TrendingUp className="w-5 h-5" />}
          status={
            acwrMetrics.status === 'Danger' ? 'danger' :
            acwrMetrics.status === 'Caution' ? 'caution' :
            acwrMetrics.status === 'Under-trained' ? 'info' : 'safe'
          }
          tooltip="Acute:Chronic Workload Ratio compares workloads over the past 7 days to the past 28 days."
        />

        {/* Dynamic Recovery Readiness Score Card */}
        <MetricCard
          title="Today's Readiness"
          value={latestMetric.readinessScore !== null ? `${latestMetric.readinessScore}%` : 'Unlogged'}
          subValue={latestMetric.sleepHours !== null ? `${latestMetric.sleepHours}h Sleep` : 'No data'}
          subText={latestMetric.readinessScore !== null ? 'Autonomic restoration based on body checks' : 'Log recovery stats to track readiness'}
          icon={<Heart className="w-5 h-5" />}
          status={
            latestMetric.readinessScore === null ? 'neutral' :
            latestMetric.readinessScore >= 80 ? 'safe' :
            latestMetric.readinessScore >= 60 ? 'caution' : 'danger'
          }
          tooltip="Readiness index calculated from sleep hours, sleep quality, soreness, stress and fatigue level."
        />

        {/* Fast Bowler Weekly Overs Limit Card */}
        <MetricCard
          title="Weekly Overs Bowled"
          value={`${rollingOversLast7Days.toFixed(1)} Overs`}
          subValue={`Limit: ${playerProfile.weeklyOversLimit || 0} overs`}
          subText={
            playerProfile.weeklyOversLimit > 0 
              ? `${Math.round((rollingOversLast7Days / playerProfile.weeklyOversLimit) * 100)}% of limit reached` 
              : 'Overs tracked for bowlers setup'
          }
          icon={<Activity className="w-5 h-5" />}
          status={
            playerProfile.weeklyOversLimit === 0 ? 'neutral' :
            rollingOversLast7Days > playerProfile.weeklyOversLimit ? 'danger' :
            rollingOversLast7Days > playerProfile.weeklyOversLimit * 0.85 ? 'caution' : 'safe'
          }
          tooltip="Total overs bowled in training and matches over the past 7 days."
        />

        {/* Total Weekly Volume Card */}
        <MetricCard
          title="Acute Load (7D)"
          value={totalLoad7Days}
          subValue={`Chronic: ${rollingChronicWeeklyAverage} avg`}
          subText="Total cumulative session intensity score over last week"
          icon={<CheckCircle2 className="w-5 h-5" />}
          status={acwrMetrics.status === 'Danger' ? 'danger' : 'neutral'}
          tooltip="Acute workload represents total physical output over last 7 days (Duration mins * RPE intensity)."
        />
      </div>

      {/* ----------------------------------------------------
          AUTOMATED BIO-INFORMED ALERTS & RECOMMENDATIONS
         ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* ALERTS MODULE */}
        <div className="lg:col-span-2 p-4 bg-slate-900/45 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                Automated Injury Risk Alerts ({alerts.length})
              </h4>
            </div>
            {alerts.length === 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3" /> Bio-systems Safe
              </span>
            )}
          </div>

          {alerts.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {alerts.map((al) => (
                <div
                  key={al.id}
                  className={`p-3 rounded-lg border flex gap-3 transition-colors duration-150 ${
                    al.severity === 'danger'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                      : 'bg-amber-500/5 border-amber-500/15 text-amber-300'
                  }`}
                >
                  <AlertCircle className={`w-4.5 h-4.5 flex-shrink-0 mt-0.5 ${
                    al.severity === 'danger' ? 'text-rose-400' : 'text-amber-400'
                  }`} />
                  <div className="leading-tight">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-sans font-bold text-xs text-white">{al.title}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase font-mono ${
                        al.severity === 'danger' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {al.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                      {al.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-36 flex flex-col items-center justify-center text-center p-2">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-200 font-bold font-mono uppercase tracking-wide">Safe Workload Adaptive Progression</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm leading-snug">
                No acute stress spikes or overs violations. The body has adapted nicely to current chronic capacities. Maintain gradual increments.
              </p>
            </div>
          )}
        </div>

        {/* SPORTS SCIENCE SUGGESTIONS */}
        <div className="p-4 bg-slate-900/45 rounded-xl border border-slate-800/80 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-3 border-b border-slate-800/60 pb-2">
              <Activity className="w-4 h-4 text-teal-400" />
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Bio-Recommendations</h4>
            </div>

            <div className={`p-3 rounded-lg border text-[11px] mb-3 leading-relaxed ${getAcwrColorClass(acwrMetrics.status)}`}>
              <span className="font-extrabold text-white font-mono uppercase text-[9px] tracking-wider block mb-0.5">Adaptive Load Strategy</span>
              {acwrMetrics.status === 'Danger' && (
                <span><strong>DE-LOAD IMMEDIATELY:</strong> Workload spike is critical. Restrict bowling to 0 overs. Short net sessions (max 20 mins, light throwdowns) with dynamic foam rolling and ice pack baths.</span>
              )}
              {acwrMetrics.status === 'Caution' && (
                <span><strong>CAP INTENSITY:</strong> Highly conditioned, but bordering overload. Limit daily session RPE to maximum 6. Skip additional sprint repeats today. Keep sleep duration to 8.5+ hours.</span>
              )}
              {acwrMetrics.status === 'Under-trained' && (
                <span><strong>SURE AND STEADY BUILD:</strong> Workloads are too low, deconditioning tissue. Do not sudden spike bowler overs. Safely increase bowling by max 10% this session (e.g., bowl 4-6 overs max).</span>
              )}
              {acwrMetrics.status === 'Safe' && (
                <span><strong>MAINTAIN CRON LEVEL:</strong> Progression is stable. Continue structural nets or speed-endurance. Workloads match chronic physical structures.</span>
              )}
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 text-[11px] text-slate-350 leading-relaxed">
              <span className="font-extrabold text-white font-mono uppercase text-[9px] tracking-wider block mb-0.5">Recovery Advice</span>
              {getReadinessAdvice(latestMetric.readinessScore)}
            </div>
          </div>

          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono mt-1 pt-1.5 border-t border-slate-800/50 text-center">
            CA-ACWR Load Principles Engaged
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          RECENT CHRONOLOGICAL LOGS (INTERACTIVE)
         ---------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* LOGGED ATHLETIC SESSIONS */}
        <div className="p-4 bg-slate-900/45 rounded-xl border border-slate-800/80">
          <h4 className="font-mono font-bold text-xs text-slate-200 uppercase tracking-wider mb-3 border-b border-slate-800/60 pb-1.5">
            Activity Logs (Past 5 Entries)
          </h4>

          {sessions.length > 0 ? (
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
              {sessions.slice(-5).reverse().map((sess) => (
                <div key={sess.id} className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-sans font-extrabold text-white">{sess.type}</span>
                      <span className="font-mono text-[10px] text-slate-500">{sess.date}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-orange-500/15 text-orange-400 border border-orange-500/10">
                        Load: {sess.calculatedLoad}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Duration: {sess.durationMinutes}m | RPE: {sess.rpe}/10
                      {sess.oversBowled !== undefined && ` | Bowled: ${sess.oversBowled} ov`}
                      {sess.ballsFaced !== undefined && ` | Faced: ${sess.ballsFaced} balls`}
                    </p>
                    {sess.notes && (
                      <p className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1">
                        &quot;{sess.notes}&quot;
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteSession(sess.id)}
                    className="p-1 px-1.5 h-7 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer transition-colors"
                    title="Delete log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-4 text-center">No session activities logged yet.</p>
          )}
        </div>

        {/* LOGGED RECOVERY Logs */}
        <div className="p-4 bg-slate-900/45 rounded-xl border border-slate-800/80">
          <h4 className="font-mono font-bold text-xs text-slate-200 uppercase tracking-wider mb-3 border-b border-slate-800/60 pb-1.5">
            Recovery Check-Ins (Past 5 Entries)
          </h4>

          {recoveries.length > 0 ? (
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
              {recoveries.slice(-5).reverse().map((rec) => (
                <div key={rec.id} className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans font-extrabold text-teal-400">{rec.readinessScore}% Readiness</span>
                      <span className="font-mono text-[10px] text-slate-500">{rec.date}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                      <span>Sleep: {rec.sleepHours}h ({rec.sleepQuality}/10)</span>
                      <span>Soreness: {rec.soreness}</span>
                      <span>Fatigue: {rec.fatigue}</span>
                      {rec.restingHeartRate && <span>RHR: {rec.restingHeartRate}</span>}
                    </div>
                    {rec.notes && (
                      <p className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1">
                        &quot;{rec.notes}&quot;
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteRecovery(rec.id)}
                    className="p-1 px-1.5 h-7 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer transition-colors"
                    title="Delete log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-4 text-center">No daily recovery checks logged yet.</p>
          )}
        </div>

      </div>
    </div>
  );
}
