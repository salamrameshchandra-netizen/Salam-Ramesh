/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DayMetrics, ACWRMetrics } from '../types';
import { calculateACWR } from '../utils/workload';
import { HelpCircle, RefreshCw } from 'lucide-react';

interface ChartsProps {
  dayMetrics: DayMetrics[];
}

export default function Charts({ dayMetrics }: ChartsProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [activeChart, setActiveChart] = useState<'acwr' | 'workload-recovery'>('acwr');

  if (dayMetrics.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-zinc-900/10 border border-zinc-800 rounded-2xl">
        <p className="text-zinc-500 font-sans text-sm">Insufficient timeline data to generate metrics visualizer.</p>
      </div>
    );
  }

  // Use the last 28 days or all available data (up to 35 days) for neat proportions
  const displayMetrics = dayMetrics.slice(-28);
  const totalDays = displayMetrics.length;

  // ----------------------------------------------------
  // Chart 1: Acute:Chronic Workload Ratio (ACWR) Trend
  // ----------------------------------------------------
  // We need to calculate ACWR for every day in the display slice
  const acwrHistory = displayMetrics.map((dm, idx) => {
    // Find the master index in the full dayMetrics array
    const masterIndex = dayMetrics.findIndex(item => item.date === dm.date);
    const metrics = calculateACWR(dayMetrics, masterIndex);
    return {
      date: dm.date,
      acwr: metrics.acwr,
      acute: metrics.acuteLoad,
      chronic: metrics.chronicLoad,
      status: metrics.status
    };
  });

  const maxAcwr = Math.max(...acwrHistory.map(h => h.acwr), 2.0);
  const chartHeight = 220;
  const chartWidth = 700;
  const paddingX = 40;
  const paddingY = 30;

  // Coordinate helper for ACWR
  const getAcwrCoords = (index: number, value: number) => {
    const x = paddingX + (index / (totalDays - 1)) * (chartWidth - paddingX * 2);
    // scale y between paddingY and chartHeight - paddingY
    // 0 on ratio axis is at the bottom, maxAcwr at the top
    const yTarget = chartHeight - paddingY - (value / maxAcwr) * (chartHeight - paddingY * 2);
    return { x, y: Math.max(paddingY, Math.min(chartHeight - paddingY, yTarget)) };
  };

  // Build the SVG path for ACWR
  let acwrPath = '';
  acwrHistory.forEach((pt, idx) => {
    const { x, y } = getAcwrCoords(idx, pt.acwr);
    if (idx === 0) {
      acwrPath += `M ${x} ${y}`;
    } else {
      acwrPath += ` L ${x} ${y}`;
    }
  });

  // ----------------------------------------------------
  // Chart 2: Workload vs Recovery Readiness
  // ----------------------------------------------------
  const maxLoad = Math.max(...displayMetrics.map(dm => dm.totalLoad), 600);
  
  // Coordinate helpers for Workload & Recovery
  const getLoadY = (value: number) => {
    return chartHeight - paddingY - (value / maxLoad) * (chartHeight - paddingY * 2);
  };
  
  const getRecoveryY = (value: number) => {
    // value is from 0 to 100
    return chartHeight - paddingY - (value / 100) * (chartHeight - paddingY * 2);
  };

  const getX = (index: number) => {
    return paddingX + (index / (totalDays - 1)) * (chartWidth - paddingX * 2);
  };

  // Build path for Recovery Readiness Score (Teal Line)
  let recoveryPath = '';
  const validRecoveryIndices: number[] = [];
  displayMetrics.forEach((dm, idx) => {
    if (dm.readinessScore !== null) {
      validRecoveryIndices.push(idx);
    }
  });

  validRecoveryIndices.forEach((idx, i) => {
    const x = getX(idx);
    const y = getRecoveryY(displayMetrics[idx].readinessScore || 0);
    if (i === 0) {
      recoveryPath += `M ${x} ${y}`;
    } else {
      recoveryPath += ` L ${x} ${y}`;
    }
  });

  // Highlight points
  const activePointAcwr = hoverIndex !== null ? acwrHistory[hoverIndex] : null;
  const activePointMetric = hoverIndex !== null ? displayMetrics[hoverIndex] : null;

  return (
    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Timeline Analytics</h3>
            <div className="relative group/tip cursor-help text-slate-400 hover:text-slate-300">
              <HelpCircle className="w-3.5 h-3.5" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-950 text-[10px] leading-relaxed rounded-lg text-slate-300 border border-slate-800 hidden group-hover/tip:block z-50 shadow-2xl">
                Sports scientists monitor the <strong>Acute:Chronic Workload Ratio (ACWR)</strong>. 
                Keep ACWR in the <span className="text-emerald-400 font-bold font-mono">0.8 - 1.3 sweet spot</span> to safely condition the body. 
                Spikes above <span className="text-rose-400 font-bold font-mono">1.5</span> dramatically elevate injury threats.
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">Chronological chart visualizer. Hover points for granular telemetry.</p>
        </div>

        {/* Tab buttons */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800/80">
          <button
            onClick={() => { setActiveChart('acwr'); setHoverIndex(null); }}
            className={`px-2.5 py-1 rounded text-[10px] font-black font-mono uppercase tracking-wider cursor-pointer transition-all ${
              activeChart === 'acwr' 
                ? 'bg-orange-600 text-white shadow font-bold' 
                : 'text-slate-450 hover:text-slate-205'
            }`}
          >
            ACWR Trend
          </button>
          <button
            onClick={() => { setActiveChart('workload-recovery'); setHoverIndex(null); }}
            className={`px-2.5 py-1 rounded text-[10px] font-black font-mono uppercase tracking-wider cursor-pointer transition-all ${
              activeChart === 'workload-recovery' 
                ? 'bg-teal-650 text-white shadow font-bold' 
                : 'text-slate-450 hover:text-slate-205'
            }`}
          >
            Load vs Recovery
          </button>
        </div>
      </div>

      {/* Interactive Main SVG */}
      <div className="relative overflow-x-auto select-none mt-2">
        <svg 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          className="w-full min-w-[550px] overflow-visible text-xs font-mono text-zinc-500"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            // find nearest client x ratio
            const relativeX = e.clientX - rect.left;
            const absoluteXRatio = relativeX / rect.width;
            
            // Convert to SVG x
            const svgX = absoluteXRatio * chartWidth;
            
            // Map svgX back to display index
            const usableWidth = chartWidth - paddingX * 2;
            const relativeXOnTrack = svgX - paddingX;
            let index = Math.round((relativeXOnTrack / usableWidth) * (totalDays - 1));
            index = Math.max(0, Math.min(totalDays - 1, index));
            setHoverIndex(index);
          }}
        >
          {/* Chart Grid Lines & Shaded Danger Bands */}
          {activeChart === 'acwr' ? (
            <>
              {/* Danger Zone: > 1.5 (Rose background) */}
              <rect
                x={paddingX}
                y={paddingY}
                width={chartWidth - paddingX * 2}
                height={Math.max(0, getAcwrCoords(0, 1.5).y - paddingY)}
                fill="rgba(244, 63, 94, 0.05)"
              />
              {/* Sweet Spot Zone: 0.8 to 1.3 (Emerald/Teal background) */}
              <rect
                x={paddingX}
                y={getAcwrCoords(0, 1.3).y}
                width={chartWidth - paddingX * 2}
                height={Math.max(0, getAcwrCoords(0, 0.8).y - getAcwrCoords(0, 1.3).y)}
                fill="rgba(16, 185, 129, 0.04)"
              />
              
              {/* Grid Y Line values */}
              {[0, 0.8, 1.3, 1.5, 2.0].map((val) => {
                const { y } = getAcwrCoords(0, val);
                const isLabel = val === 0.8 || val === 1.3 || val === 1.5;
                return (
                  <g key={`acwr-grid-${val}`}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke={val === 1.5 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.06)'}
                      strokeDasharray={isLabel ? '4,4' : undefined}
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 4}
                      textAnchor="end"
                      fill={val === 1.5 ? '#f43f5e' : val === 0.8 ? '#10b981' : '#6b7280'}
                      className="text-[9px] font-black"
                    >
                      {val.toFixed(1)}
                    </text>
                  </g>
                );
              })}
            </>
          ) : (
            <>
              {/* Grid lines for Workload vs Recovery */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
                const loadVal = Math.round(ratio * maxLoad);
                const recVal = Math.round(ratio * 100);
                return (
                  <g key={`wr-grid-${ratio}`}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.06)"
                    />
                    {/* Left label: Workload (Foster arbitrary units) */}
                    <text
                      x={paddingX - 10}
                      y={y + 4}
                      textAnchor="end"
                      fill="#9a3412"
                      className="text-[9px]"
                    >
                      {loadVal}
                    </text>
                    {/* Right label: Recovery Readiness */}
                    <text
                      x={chartWidth - paddingX + 10}
                      y={y + 4}
                      textAnchor="start"
                      fill="#0d9488"
                      className="text-[9px]"
                    >
                      {recVal}%
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Chronological Timestamps (X axis) */}
          {displayMetrics.map((dm, idx) => {
            // Draw quarterly labels or every 5th label so X axis doesn't clutter
            if (idx % 6 !== 0 && idx !== totalDays - 1) return null;
            const x = getX(idx);
            const dateObj = new Date(dm.date + 'T00:00:00');
            const dayStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
            return (
              <g key={`xaxis-${idx}`}>
                <line
                  x1={x}
                  y1={chartHeight - paddingY}
                  x2={x}
                  y2={chartHeight - paddingY + 5}
                  stroke="rgba(255, 255, 255, 0.15)"
                />
                <text
                  x={x}
                  y={chartHeight - paddingY + 16}
                  textAnchor="middle"
                  className="text-[9px] fill-zinc-500 font-medium"
                >
                  {dayStr}
                </text>
              </g>
            );
          })}

          {/* ACTIVE CURSOR VERTICAL TRACKER */}
          {hoverIndex !== null && (
            <line
              x1={getX(hoverIndex)}
              y1={paddingY}
              x2={getX(hoverIndex)}
              y2={chartHeight - paddingY}
              stroke="rgba(217, 119, 6, 0.4)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          )}

          {/* Render Primary Line / Bars chart */}
          {activeChart === 'acwr' ? (
            <>
              {/* Sweet spot labels indicator */}
              <text
                x={chartWidth - paddingX - 10}
                y={getAcwrCoords(0, 1.0).y + 3}
                fill="#10b981"
                textAnchor="end"
                className="text-[8px] font-bold uppercase tracking-wider opacity-60"
              >
                Sweet Spot Zone
              </text>
              <text
                x={chartWidth - paddingX - 10}
                y={getAcwrCoords(0, 1.8).y + 3}
                fill="#f43f5e"
                textAnchor="end"
                className="text-[8px] font-bold uppercase tracking-wider opacity-60"
              >
                SPIKE DANGER
              </text>

              {/* ACWR Trend Line */}
              <path
                d={acwrPath}
                fill="none"
                stroke="url(#acwrGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Bullet points for ACWR */}
              {acwrHistory.map((pt, idx) => {
                const { x, y } = getAcwrCoords(idx, pt.acwr);
                const isHovered = hoverIndex === idx;
                
                // Color based on status
                let bulletColor = '#10b981'; // safe
                if (pt.status === 'Danger') bulletColor = '#ef4444';
                else if (pt.status === 'Caution') bulletColor = '#f59e0b';
                else if (pt.status === 'Under-trained') bulletColor = '#a855f7';

                return (
                  <circle
                    key={`acwr-bullet-${idx}`}
                    cx={x}
                    cy={y}
                    r={isHovered ? 5.5 : 2}
                    fill={bulletColor}
                    stroke={isHovered ? '#18181b' : 'none'}
                    strokeWidth={isHovered ? 2 : 0}
                    className="transition-all duration-150"
                  />
                );
              })}
            </>
          ) : (
            <>
              {/* Render Bars for training load */}
              {displayMetrics.map((dm, idx) => {
                const x = getX(idx);
                const y = getLoadY(dm.totalLoad);
                const barWidth = Math.max(2, (chartWidth - paddingX * 2) / totalDays * 0.6);
                const isHovered = hoverIndex === idx;

                return (
                  <rect
                    key={`wl-bar-${idx}`}
                    x={x - barWidth / 2}
                    y={y}
                    width={barWidth}
                    height={Math.max(0, chartHeight - paddingY - y)}
                    fill={isHovered ? '#ea580c' : '#c2410c'}
                    opacity={isHovered ? 0.95 : 0.45}
                    rx="1"
                    className="transition-all duration-150"
                  />
                );
              })}

              {/* Render Recovery Line */}
              <path
                d={recoveryPath}
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Recovery Nodes */}
              {displayMetrics.map((dm, idx) => {
                if (dm.readinessScore === null) return null;
                const x = getX(idx);
                const y = getRecoveryY(dm.readinessScore);
                const isHovered = hoverIndex === idx;

                return (
                  <circle
                    key={`rec-bullet-${idx}`}
                    cx={x}
                    cy={y}
                    r={isHovered ? 5.5 : 2.5}
                    fill="#00f5d4"
                    stroke="#042f2e"
                    strokeWidth={isHovered ? 1.5 : 0.5}
                  />
                );
              })}
            </>
          )}

          {/* Gradients declaration */}
          <defs>
            <linearGradient id="acwrGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#c084fc" /> {/* undertrained */}
              <stop offset="35%" stopColor="#10b981" /> {/* safe zone */}
              <stop offset="70%" stopColor="#fbbf24" /> {/* caution */}
              <stop offset="100%" stopColor="#ef4444" /> {/* danger */}
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* FOOTER LEGEND */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 px-1 justify-center text-[10px] font-mono font-medium text-slate-400">
        {activeChart === 'acwr' ? (
          <>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 block border border-emerald-400/20" />
              <span>Sweet Spot (0.8 - 1.3)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 block border border-amber-400/20" />
              <span>Caution (1.3 - 1.5)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-500 block border border-red-500/20" />
              <span>Spike Risk (&gt; 1.5)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-purple-500 block border border-purple-400/20" />
              <span>Under-conditioned (&lt; 0.8)</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-1.5 rounded bg-orange-700 block" />
              <span>Workload (RPE * Duration)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded bg-teal-500 block relative"><span className="w-1.5 h-1.5 rounded-full bg-teal-300 absolute -top-0.5 left-1.5" /></span>
              <span>Readiness Score (0 - 100%)</span>
            </div>
          </>
        )}
      </div>

      {/* DYNAMIC HOVER TOOLTIP DETAILS */}
      <div className="mt-3.5 p-3 rounded-lg bg-slate-950 border border-slate-900 min-h-[75px] flex items-center justify-center transition-all">
        {hoverIndex !== null ? (
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 text-center md:text-left">
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono block">Timestamp</span>
              <span className="text-xs text-white font-black font-sans mt-0.5 block">
                {new Date(activePointMetric!.date + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  timeZone: 'UTC'
                })}
              </span>
            </div>

            {activeChart === 'acwr' ? (
              <>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono block">ACWR Rate</span>
                  <span className={`text-xs font-black font-mono mt-0.5 block ${
                    activePointAcwr!.status === 'Danger' ? 'text-rose-450' :
                    activePointAcwr!.status === 'Caution' ? 'text-amber-450' :
                    activePointAcwr!.status === 'Under-trained' ? 'text-purple-450' :
                    'text-emerald-450'
                  }`}>
                    {activePointAcwr!.acwr} ({activePointAcwr!.status})
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono block">Acute (7-Day)</span>
                  <span className="text-xs text-slate-300 font-mono font-bold mt-0.5 block">
                    {activePointAcwr!.acute} au
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono block">Chronic (Capacity)</span>
                  <span className="text-xs text-slate-300 font-mono font-bold mt-0.5 block">
                    {activePointAcwr!.chronic} au
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono block">Total Day Load</span>
                  <span className="text-xs text-white font-black font-mono mt-0.5 block">
                    {activePointMetric!.totalLoad} au
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono block">Readiness Score</span>
                  <span className={`text-xs font-black font-mono mt-0.5 block ${
                    activePointMetric!.readinessScore === null ? 'text-slate-500' :
                    activePointMetric!.readinessScore >= 80 ? 'text-emerald-400' :
                    activePointMetric!.readinessScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {activePointMetric!.readinessScore !== null ? `${activePointMetric!.readinessScore}%` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono block">Volume Stats</span>
                  <span className="text-xs text-slate-300 font-medium font-sans mt-0.5 block">
                    {activePointMetric!.totalOvers > 0 && `Bowled ${activePointMetric!.totalOvers} ov. `}
                    {activePointMetric!.totalBallsFaced > 0 && `Faced ${activePointMetric!.totalBallsFaced} balls.`}
                    {activePointMetric!.totalOvers === 0 && activePointMetric!.totalBallsFaced === 0 && 'No overs/balls logged'}
                  </span>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic mt-0.5 font-mono">
            Hover cursor over dates on the chart tracks to map granular daily metrics.
          </p>
        )}
      </div>
    </div>
  );
}
