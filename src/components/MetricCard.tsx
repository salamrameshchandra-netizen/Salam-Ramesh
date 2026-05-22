/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string | number;
  subText?: string;
  icon: React.ReactNode;
  status?: 'safe' | 'caution' | 'danger' | 'info' | 'neutral';
  tooltip?: string;
}

export default function MetricCard({
  title,
  value,
  subValue,
  subText,
  icon,
  status = 'neutral',
  tooltip
}: MetricCardProps) {
  const getStatusColors = () => {
    switch (status) {
      case 'safe':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          lightText: 'text-emerald-500'
        };
      case 'caution':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          lightText: 'text-amber-500'
        };
      case 'danger':
        return {
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          lightText: 'text-rose-500'
        };
      case 'info':
        return {
          bg: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
          badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          lightText: 'text-sky-500'
        };
      default:
        return {
          bg: 'bg-slate-800/50 border-slate-700/50 text-slate-300',
          badge: 'bg-slate-800 text-slate-400 border-slate-700',
          lightText: 'text-slate-400'
        };
    }
  };

  const colors = getStatusColors();

  return (
    <div 
      className="relative flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-300 bg-slate-900/60 border-slate-800/80 hover:bg-slate-900/95 group"
      title={tooltip}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold tracking-wider font-mono text-slate-400 uppercase group-hover:text-slate-300 transition-colors">
          {title}
        </span>
        <div className={`p-1.5 rounded-lg border transition-colors ${colors.bg}`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
        </div>
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="text-2xl font-extrabold tracking-tight text-white font-sans">
          {value}
        </span>
        {subValue !== undefined && (
          <span className="text-xs font-mono text-slate-400 font-bold bg-slate-950/40 px-1.5 py-0.5 rounded border border-slate-850">
            {subValue}
          </span>
        )}
      </div>

      {subText && (
        <p className="mt-1.5 text-[11px] font-medium text-slate-400 leading-snug">
          {subText}
        </p>
      )}

      {/* Decorative top corner indicator */}
      {status !== 'neutral' && (
        <span className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-bl-md rounded-tr-xl border-l border-b opacity-45 ${
          status === 'safe' ? 'bg-emerald-500/25 border-emerald-500/40' :
          status === 'caution' ? 'bg-amber-500/25 border-amber-500/40' :
          status === 'danger' ? 'bg-rose-500/25 border-rose-500/40' :
          'bg-sky-500/25 border-sky-500/40'
        }`} />
      )}
    </div>
  );
}
