/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Activity, 
  Dumbbell, 
  Moon, 
  Settings, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  Heart, 
  CheckCircle, 
  Sparkles,
  ChevronDown,
  Info
} from 'lucide-react';

export default function HowToUse() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is the Acute:Chronic Workload Ratio (ACWR)?",
      a: "ACWR is a gold-standard sports science metric that compares your immediate stress levels (Acute Load - past 7 days average) against your historical fitness buffer (Chronic Load - past 28 days average). It calculates whether your body is conditioned for recent training spikes or if you are in high danger of muscle tears and stress fractures."
    },
    {
      q: "What is the 'Sweet Spot' for training?",
      a: "An ACWR between 0.8 and 1.3 is considered the 'Sweet Spot'. In this range, your fitness is safely increasing, and your injury risk is minimized. Going above 1.5 spikes injury rates by 300% to 400%."
    },
    {
      q: "Why are bowling overs specifically limited?",
      a: "Extended bowling spells (specifically fast bowling) exert torque up to 9 times an athlete's body weight on the lumbar spine. Tracking weekly overs helps prevent debilitating bone cracks and stress fractures before they sideline you for months."
    },
    {
      q: "How does the Readiness Score get calculated?",
      a: "The Daily Recovery Readiness Score (10 to 100%) merges sleep duration, sleep quality rating, muscular soreness, physical fatigue, and mental stress. A score below 50% flags severe recovery deficits, recommending a restricted training load."
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in font-sans">
      
      {/* HEADER HERO CAPTION */}
      <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/20 rounded-xl border border-slate-800/80 shadow-lg text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] bg-orange-600/10 border border-orange-500/20 text-orange-400 font-extrabold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
              Knowledge Base
            </span>
            <h2 className="text-xl font-bold font-sans text-slate-100 tracking-tight mt-2">
              Sports Science Workload Guide
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
              Welcome to the Cricket Athletic Load Center. Keeping players injury-free is achieved by careful tracking of physical exertion and nervous-system recovery. Learn how this applet empowers leagues and players to train safely.
            </p>
          </div>
        </div>
      </div>

      {/* THREE CORE PHASES METRIC BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Step 1 */}
        <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl text-left hover:border-slate-800 transition-all duration-150">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-orange-600/15 border border-orange-500/20 text-orange-400 text-xs font-bold font-mono flex items-center justify-center">1</span>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 font-mono">Setup Athlete Profile</h3>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
            Click on the <span className="text-orange-400 font-bold">Bio Limits</span> tab at the bottom, or use the quick-addition <span className="text-xs bg-slate-950 px-1 border border-slate-800 rounded text-orange-400 font-bold inline-block">+</span> icon at the top header to enter an athlete's name, age, playing role, and custom bowling caps.
          </p>
          <div className="flex items-center gap-1.5 p-1 px-2 border border-slate-800 bg-slate-900/60 rounded text-[9px] font-mono text-slate-500 mt-2">
            <Settings className="w-3.5 h-3.5 text-slate-400" /> Bio Limits Setup Menu
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl text-left hover:border-slate-800 transition-all duration-150">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-orange-600/15 border border-orange-500/20 text-orange-400 text-xs font-bold font-mono flex items-center justify-center">2</span>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 font-mono">Log Exercise Workloads</h3>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
            After every net practice session, fitness conditioning, or live match play, record your activity under <span className="text-orange-400 font-bold">Log Workload</span>. Specify duration and Rate of Perceived Exertion (RPE on a 1-10 fatigue scale).
          </p>
          <div className="flex items-center gap-1.5 p-1 px-2 border border-slate-800 bg-slate-900/60 rounded text-[9px] font-mono text-slate-500 mt-2">
            <Dumbbell className="w-3.5 h-3.5 text-orange-400" /> Duration (mins) × RPE (Difficulty)
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl text-left hover:border-slate-800 transition-all duration-150">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-orange-600/15 border border-orange-500/20 text-orange-400 text-xs font-bold font-mono flex items-center justify-center">3</span>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 font-mono">Log Nightly Recovery</h3>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
            Each morning, record sleep hours, subjective sleep quality, muscle soreness, and overall cognitive fatigue ratings under <span className="text-teal-400 font-bold">Log Recovery</span>. High muscle soreness acts as an early tear warning!
          </p>
          <div className="flex items-center gap-1.5 p-1 px-2 border border-slate-800 bg-slate-900/60 rounded text-[9px] font-mono text-slate-500 mt-2">
            <Moon className="w-3.5 h-3.5 text-teal-400" /> Daily CNS Readiness Score %
          </div>
        </div>

      </div>

      {/* METRIC RANGE LEGENDS AND THRESHOLDS */}
      <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-xl text-left space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-305 font-mono flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-400" /> ACWR Zone Threshold Legends
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-extrabold text-orange-400 bg-orange-500/10 px-1.5 rounded">
                &lt; 0.8
              </span>
              <span className="text-[8px] uppercase tracking-wider font-mono text-slate-500 font-bold">State</span>
            </div>
            <p className="text-xs font-bold text-slate-250 mt-1.5">Under-trained</p>
            <p className="text-[10px] text-slate-450 mt-1 leading-normal">
              Chronic capacity is high but acute loading is flat. Promotes injury vulnerability due to lack of match fitness.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-550/15">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 rounded">
                0.8 - 1.3
              </span>
              <span className="text-[8px] uppercase tracking-wider font-mono text-emerald-500 font-bold">Ideal</span>
            </div>
            <p className="text-xs font-bold text-emerald-300 mt-1.5">Sweet Spot</p>
            <p className="text-[10px] text-slate-450 mt-1 leading-normal">
              Safe progression window. Fitness levels are advancing smoothly. Injury rates are scientifically lowest here.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-550/15">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-extrabold text-amber-400 bg-amber-500/10 px-1.5 rounded">
                1.3 - 1.5
              </span>
              <span className="text-[8px] uppercase tracking-wider font-mono text-amber-500 font-bold">Watch</span>
            </div>
            <p className="text-xs font-bold text-amber-300 mt-1.5">Caution Range</p>
            <p className="text-[10px] text-slate-450 mt-1 leading-normal">
              Soreness is likely elevating. Workloads are high. Ensure active recovery, foam rolling, and deep massage.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-550/15">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-extrabold text-rose-450 bg-rose-500/10 px-1.5 rounded">
                &gt; 1.5
              </span>
              <span className="text-[8px] uppercase tracking-wider font-mono text-rose-500 font-bold">Danger</span>
            </div>
            <p className="text-xs font-bold text-rose-400 mt-1.5">Danger Spike</p>
            <p className="text-[10px] text-slate-450 mt-1 leading-normal">
              Training spikes too quickly. Body is unconditioned for this sudden load. Recommended to skip immediate sessions.
            </p>
          </div>

        </div>
      </div>

      {/* QUICK PRESETS DEMO MODE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="p-5 bg-slate-900/30 border border-slate-800 rounded-xl text-left space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-200 font-mono">Demonstration Presets</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            The app features built-in demonstration state scenarios to explore the full layout immediately without manual logs:
          </p>
          <ul className="text-[11px] text-slate-400 space-y-1 ml-4 list-disc">
            <li>
              <span className="text-slate-200 font-bold font-mono">Managed Build-up</span>: 35 days of carefully structured, high-fitness, low-fatigue cricket practice showing a persistent sweet-spot rating.
            </li>
            <li>
              <span className="text-slate-200 font-bold font-mono">Tournament Overload</span>: Simulates sudden back-to-back league match schedules, resulting in deteriorated sleep and a critical injury hazard.
            </li>
          </ul>
        </div>

        <div className="p-5 bg-slate-900/30 border border-slate-800 rounded-xl text-left space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-200 font-mono">Pristine Empty Mode</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            If you want to track a real player from scratch:
          </p>
          <ol className="text-[11px] text-slate-400 space-y-1.5 ml-4 list-decimal">
            <li>
              Click <span className="text-rose-400 font-semibold font-mono">Clear All Data</span> at the top header to wipe all mock arrays entirely.
            </li>
            <li>
              Add a custom player via the <span className="text-orange-400 font-mono font-bold font-sans">+</span> icon.
            </li>
            <li>
              Log sessions daily to build a real timeline. Once you accumulate active entries, your rolling trends will populate!
            </li>
          </ol>
        </div>

      </div>

      {/* FAQ COLLAPSED SECTION */}
      <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-xl text-left space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 font-mono flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-orange-400" /> Frequently Asked Questions
        </h3>

        <div className="space-y-2 pt-1">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div 
                key={i} 
                className="border border-slate-800 bg-slate-950/40 rounded-lg overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-3 text-left font-bold text-xs text-slate-200 hover:bg-slate-900/40 transition-colors"
                >
                  <span className="font-sans pr-4">{faq.q}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 pt-0.5 text-[11px] text-slate-400 leading-relaxed select-text font-sans border-t border-slate-900/70">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
