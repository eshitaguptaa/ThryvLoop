'use client';

import { ScrollReveal, ScrollStagger, ScrollItem } from '@/components/landing_sections/ScrollReveal';
import { SectionBlend, gridFadeStyle } from '@/components/landing_sections/SectionBlend';

/* ─── Kanban Data ─── */
const KANBAN_COLUMNS = [
  {
    id: 'todo',
    label: 'TO DO',
    count: 4,
    tasks: [
      {
        title: 'Q3 Marketing Site Overhaul',
        tag: { label: 'Project', icon: true, style: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/50' },
        progress: { w: 'w-[40%]', bg: 'bg-sky-400' },
        avatars: [11, 44],
      },
      {
        title: 'Client Onboarding Flow',
        progress: { w: 'w-[80%]', bg: 'bg-indigo-600' },
      },
      {
        title: 'Internal Security Audit',
        topRightTag: { label: 'New', style: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 font-bold' },
        avatars: [33, 22],
      },
    ],
  },
  {
    id: 'in-progress',
    label: 'IN PROGRESS',
    count: 5,
    highlight: true,
    tasks: [
      {
        title: 'Auth Module Integration',
        circles: ['bg-indigo-600', 'bg-emerald-400', 'bg-amber-400', 'bg-slate-300'],
        dueTag: { label: 'Due Tomorrow', style: 'text-sky-600 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50' },
      },
      {
        title: 'API Rate Limiting',
        circles: ['bg-amber-400', 'bg-sky-400'],
        dueTag: { label: 'Due Friday', style: 'text-sky-600 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50' },
      },
      {
        title: 'Internal Security Audit',
        avatars: [55, 66],
        dueTag: { label: 'Due Friday', style: 'text-sky-600 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50' },
      },
      {
        title: 'Basic Developering',
        avatars: [12, 45],
      },
    ],
  },
  {
    id: 'review',
    label: 'REVIEW',
    count: 3,
    tasks: [
      {
        title: 'Database Migration Scoping',
        avatars: [68, 29],
      },
      {
        title: 'Work Cycle Situation',
        avatars: [15],
        dueTag: { label: 'Due Friday', style: 'text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50' },
      },
      {
        title: 'Passeook Tlmplate Tasks',
        avatars: [41, 32],
      },
    ],
  },
];

/* ─── Helper Components ─── */

function AvatarStack({ ids = [] }) {
  return (
    <div className="flex -space-x-1.5">
      {ids.map((id, i) => (
        <div 
          key={i} 
          className="h-6 w-6 rounded-full border-2 border-card bg-muted overflow-hidden shrink-0 shadow-sm cursor-pointer transition-transform duration-200 hover:scale-125 hover:z-10"
        >
          <img src={`https://i.pravatar.cc/100?img=${id}`} alt="avatar" className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );
}

function KanbanTaskCard({ task }) {
  const hasFooter = task.tag || task.progress || task.avatars || task.circles || task.dueTag;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-indigo-400/50 dark:hover:border-indigo-600 cursor-pointer group">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {task.title}
        </p>
        {task.topRightTag && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs uppercase tracking-wide transition-transform hover:scale-105 active:scale-95 ${task.topRightTag.style}`}>
            {task.topRightTag.label}
          </span>
        )}
      </div>

      {hasFooter && (
        <div className="mt-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {task.tag && (
              <span className={`flex items-center gap-1 shrink-0 rounded px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide transition-transform hover:scale-105 active:scale-95 ${task.tag.style}`}>
                {task.tag.icon && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                )}
                {task.tag.label}
              </span>
            )}
            
            {task.circles && (
              <div className="flex -space-x-1.5 shrink-0 transition-transform hover:scale-105">
                {task.circles.map((c, i) => (
                  <div key={i} className={`h-4 w-4 rounded-full border-[1.5px] border-white ${c}`} />
                ))}
              </div>
            )}
            
            {task.progress && (
              <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden max-w-[45px] relative group-hover:bg-muted/80 transition-colors">
                <div className={`absolute top-0 left-0 h-full rounded-full ${task.progress.bg} ${task.progress.w} transition-all duration-500 ease-out`} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {task.avatars && <AvatarStack ids={task.avatars} />}
            {task.dueTag && (
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold transition-transform hover:scale-105 active:scale-95 ${task.dueTag.style}`}>
                {task.dueTag.label}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LineChart() {
  const lineChartLines = [
    { color: '#a855f7', path: 'M0,35 L25,25 L50,15 L75,10 L100,5' },
    { color: '#10b981', path: 'M0,45 L25,35 L50,25 L75,15 L100,10' },
    { color: '#f59e0b', path: 'M0,55 L25,45 L50,40 L75,30 L100,20' },
    { color: '#3b82f6', path: 'M0,60 L25,55 L50,50 L75,40 L100,30' },
  ];

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-5 flex flex-col h-full w-full cursor-pointer transition-all duration-300 hover:bg-white/10 hover:border-white/20 group">
      <h3 className="text-sm font-bold text-slate-200 mb-6 group-hover:text-white transition-colors">Work Completion trends</h3>
      
      <div className="relative flex-1 min-h-[160px] flex">
        {/* Y-Axis */}
        <div className="flex flex-col justify-between text-xs text-slate-500 pb-6 pr-3">
          <span>250</span><span>200</span><span>150</span><span>100</span><span>50</span><span>0</span>
        </div>
        
        <div className="relative flex-1">
          {/* Interactive Tooltips */}
          <div className="absolute top-[8%] right-0 bg-slate-800 text-slate-200 text-[10px] font-semibold px-2 py-1 rounded border border-slate-700 shadow-lg transform translate-x-4 -translate-y-full z-10 cursor-pointer hover:scale-110 hover:bg-indigo-600 hover:text-white transition-all duration-200">
            50000.500
          </div>
          <div className="absolute top-[28%] left-[25%] bg-slate-800 text-slate-200 text-[10px] font-semibold px-2 py-1 rounded border border-slate-700 shadow-lg transform -translate-x-1/2 -translate-y-full z-10 cursor-pointer hover:scale-110 hover:bg-emerald-600 hover:text-white transition-all duration-200">
            35.55
          </div>
          <div className="absolute bottom-[20%] left-[50%] bg-slate-800 text-slate-200 text-[10px] font-semibold px-2 py-1 rounded border border-slate-700 shadow-lg transform -translate-x-1/2 z-10 cursor-pointer hover:scale-110 hover:bg-amber-600 hover:text-white transition-all duration-200">
            000.25
          </div>

          <svg viewBox="0 0 100 70" className="w-full h-full group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] transition-all duration-500" preserveAspectRatio="none">
            {/* Horizontal Grid Lines */}
            {[0, 14, 28, 42, 56, 70].map((y, i) => (
              <line key={i} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            ))}
            
            {/* Data Lines */}
            {lineChartLines.map((line, i) => (
              <path key={i} d={line.path} fill="none" stroke={line.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300 hover:stroke-2 cursor-pointer" />
            ))}
            
            {/* Highlight Nodes */}
            <circle cx="100" cy="5" r="1.5" fill="#a855f7" className="cursor-pointer hover:r-[3px] transition-all" />
            <circle cx="25" cy="25" r="1.5" fill="#10b981" className="cursor-pointer hover:r-[3px] transition-all" />
            <circle cx="50" cy="50" r="1.5" fill="#3b82f6" className="cursor-pointer hover:r-[3px] transition-all" />
          </svg>
          
          {/* X-Axis */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-slate-500 pt-3">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Jen</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Meb</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Apr</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">May</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Thu</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Gul</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Sup</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DonutChart() {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-5 flex flex-col items-center justify-between h-full w-full cursor-pointer transition-all duration-300 hover:bg-white/10 hover:border-white/20 group">
      <h3 className="text-sm font-bold text-slate-200 mb-4 w-full text-left group-hover:text-white transition-colors">Task Distribution by Project</h3>
      
      <div className="relative w-32 h-32 mt-2 mb-6 transition-transform duration-500 group-hover:scale-105">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle cx="50" cy="50" r="35" fill="none" stroke="#3b82f6" strokeWidth="16" strokeDasharray="220" strokeDashoffset="0" className="hover:stroke-[18px] transition-all duration-200 cursor-pointer" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="#f59e0b" strokeWidth="16" strokeDasharray="220" strokeDashoffset="45" className="hover:stroke-[18px] transition-all duration-200 cursor-pointer" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="#10b981" strokeWidth="16" strokeDasharray="220" strokeDashoffset="100" className="hover:stroke-[18px] transition-all duration-200 cursor-pointer" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="#a855f7" strokeWidth="16" strokeDasharray="220" strokeDashoffset="155" className="hover:stroke-[18px] transition-all duration-200 cursor-pointer" />
          <circle cx="50" cy="50" r="22" fill="#141226" className="group-hover:fill-[#1a1835] transition-colors duration-300" />
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 w-full px-2">
        <div className="flex items-center gap-2 group/legend cursor-pointer">
          <div className="h-2 w-2 rounded-full bg-emerald-500 group-hover/legend:scale-150 transition-transform" />
          <span className="text-xs font-semibold text-slate-300 group-hover/legend:text-white transition-colors">Projes</span>
        </div>
        <div className="flex items-center gap-2 group/legend cursor-pointer">
          <div className="h-2 w-2 rounded-full bg-blue-500 group-hover/legend:scale-150 transition-transform" />
          <span className="text-xs font-semibold text-slate-300 group-hover/legend:text-white transition-colors">Progress</span>
        </div>
        <div className="flex items-center gap-2 group/legend cursor-pointer">
          <div className="h-2 w-2 rounded-full bg-purple-500 group-hover/legend:scale-150 transition-transform" />
          <span className="text-xs font-semibold text-slate-300 group-hover/legend:text-white transition-colors">Distribution</span>
        </div>
        <div className="flex items-center gap-2 group/legend cursor-pointer">
          <div className="h-2 w-2 rounded-full bg-amber-500 group-hover/legend:scale-150 transition-transform" />
          <span className="text-xs font-semibold text-slate-300 group-hover/legend:text-white transition-colors">Phqott</span>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, valueColor = 'text-white' }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col justify-center w-full cursor-pointer transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 hover:shadow-lg group">
      <p className="text-xs font-semibold text-slate-400 mb-1.5 group-hover:text-slate-300 transition-colors">{label}</p>
      <p className={`text-xl font-bold mb-1 transition-transform group-hover:scale-105 origin-left ${valueColor}`}>{value}</p>
      <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">Sample Data</p>
    </div>
  );
}

function PremiumTrustBadge() {
  return (
    <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 shrink-0 transition-transform duration-500 hover:scale-110 active:scale-95 cursor-pointer group">
      {/* Ambient Outer Glow */}
      <div className="absolute inset-0 bg-emerald-500/20 rounded-[2rem] blur-xl group-hover:bg-emerald-400/40 transition-colors duration-500" />
      
      {/* Backdrop Decorative Layer */}
      <div className="absolute inset-1 sm:inset-2 bg-emerald-600 rounded-[1.25rem] sm:rounded-[1.5rem] rotate-[8deg] opacity-60 border border-emerald-400/30 group-hover:rotate-12 transition-transform duration-500" />
      
      {/* Main Glass Layer */}
      <div className="absolute inset-1 sm:inset-2 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[1.25rem] sm:rounded-[1.5rem] shadow-[0_8px_24px_-6px_rgba(16,185,129,0.5)] border border-white/30 backdrop-blur-md flex items-center justify-center overflow-hidden">
        {/* Top Glare Reflection */}
        <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/30 to-transparent rounded-t-[1.25rem] sm:rounded-t-[1.5rem]" />
        
        {/* Icon */}
        <svg className="relative z-10 w-10 h-10 sm:w-11 sm:h-11 text-white drop-shadow-md group-hover:drop-shadow-lg transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
    </div>
  );
}

function TrustPadlockGraphic() {
  return (
    <div className="relative flex items-center justify-center w-56 h-56 shrink-0 cursor-pointer group">
      
      {/* Continuous pulsing background glow */}
      <div className="absolute inset-4 bg-indigo-500/20 rounded-full blur-2xl animate-pulse group-hover:bg-indigo-400/30 transition-colors duration-500" />
      
      {/* Continuous expanding radar ping ring */}
      <div 
        className="absolute inset-12 rounded-full border-2 border-indigo-400/50 animate-ping opacity-60" 
        style={{ animationDuration: '3s' }} 
      />

      {/* Precision Concentric Rings (Interactive on hover) */}
      <div className="absolute inset-0 rounded-full border border-border/60 group-hover:border-indigo-400/50 group-hover:scale-105 transition-all duration-500" />
      <div className="absolute inset-6 rounded-full border border-border shadow-[inset_0_0_30px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_0_30px_rgba(255,255,255,0.02)] group-hover:border-indigo-400/50 group-hover:scale-105 transition-all duration-500 delay-75" />
      <div className="absolute inset-12 rounded-full border border-border bg-gradient-to-br from-muted to-card/50 group-hover:border-indigo-400/60 group-hover:scale-105 transition-all duration-500 delay-100" />
      
      {/* Center Premium Glass Orb */}
      <div className="relative z-10 w-24 h-24 rounded-full bg-card/80 backdrop-blur-xl border border-border shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08),_inset_0_1px_0_rgba(255,255,255,0.1)] dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_20px_40px_-10px_rgba(99,102,241,0.25)] group-active:scale-95">
        
        {/* SVG Lock */}
        <svg className="w-9 h-9 text-foreground group-hover:text-indigo-500 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>

        {/* Floating Trusted Badge */}
        <div className="absolute -bottom-3.5 bg-slate-800 text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest border border-slate-700 flex items-center gap-1.5 transition-all duration-300 group-hover:translate-y-1 group-hover:bg-indigo-600 group-hover:border-indigo-500">
          <svg className="w-2.5 h-2.5 text-emerald-400 group-hover:animate-spin" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          Trusted
        </div>
      </div>
    </div>
  );
}

/* ─── Main Section ─── */

export default function WorkspaceEnvironment() {
  return (
    <section className="relative px-4 pt-20 pb-14 sm:px-6 sm:pt-28 sm:pb-16 overflow-hidden bg-surface">
      
      <SectionBlend position="bottom" fromColor="transparent" toColor="background" size="md" />

      {/* Background Grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99,102,241,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          ...gridFadeStyle('both'),
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        
        {/* Top Header Area */}
        <ScrollReveal className="mb-16 sm:mb-24 text-center sm:text-left flex flex-col items-center sm:items-start relative">
          
          <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 flex items-center gap-2 sm:hidden cursor-pointer hover:opacity-80 transition-opacity">
            <svg className="w-5 h-5 text-indigo-700" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="font-bold text-foreground tracking-tight">ThryvLoop</span>
          </div>

          <div className="inline-flex items-center gap-2.5 rounded-full bg-card border border-border px-4 py-2 text-[10px] sm:text-xs font-bold tracking-widest text-muted-foreground shadow-sm uppercase mb-8 cursor-pointer hover:shadow-md hover:bg-muted transition-all active:scale-95">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            Workspace Environment
          </div>

          <h2 className="font-extrabold tracking-tight leading-[1.05] mb-6 max-w-3xl text-4xl sm:text-5xl lg:text-[4rem] text-foreground cursor-default select-none">
            Elevate Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 drop-shadow-sm pb-2 inline-block hover:scale-[1.02] transition-transform duration-300">
              Workflow Autonomy
            </span>
          </h2>

          <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground font-medium">
            A high-contrast, zero-surveillance environment designed to align management
            oversight with deep creative focus.
          </p>
        </ScrollReveal>

        {/* Dashboard Cards Area */}
        <ScrollStagger className="grid grid-cols-1 xl:grid-cols-[1.5fr_1.1fr] gap-6 lg:gap-8 mb-8" stagger={0.07}>
          
          {/* Task Management (Left Column) */}
          <ScrollItem>
            <div className="rounded-3xl bg-card border border-border shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] p-6 sm:p-8 h-full flex flex-col group/board transition-shadow hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)]">
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-6 border-b border-border">
                <div className="space-y-1.5 cursor-default">
                  <h3 className="text-xl font-bold text-foreground tracking-tight transition-colors group-hover/board:text-indigo-600 dark:group-hover/board:text-indigo-400">
                    Integrated Task & Project Management
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Frictionless coordination across strategic initiatives.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <button className="flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-700 px-3 py-2 transition-all active:scale-95 group/btn">
                    <svg className="h-4 w-4 text-muted-foreground group-hover/btn:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span className="text-sm font-semibold text-muted-foreground group-hover/btn:text-indigo-600 dark:group-hover/btn:text-indigo-400 transition-colors">Filters & Search</span>
                  </button>
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm hover:shadow active:scale-95">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Kanban Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                {KANBAN_COLUMNS.map((col) => (
                  <div key={col.id} className={`relative rounded-2xl p-4 flex flex-col transition-colors duration-300 ${col.highlight ? 'bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15' : 'bg-muted hover:bg-muted/80'}`}>
                    {col.highlight && <div className="absolute inset-x-5 top-0 h-1 rounded-b-full bg-indigo-500" />}
                    
                    <div className="flex items-center gap-2 mb-4 pt-1 cursor-default">
                      <span className={`text-xs font-bold tracking-widest uppercase ${col.highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'}`}>
                        {col.label}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">({col.count})</span>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {col.tasks.map((task) => (
                        <KanbanTaskCard key={task.title} task={task} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollItem>

          {/* Analytics (Right Column) */}
          <ScrollItem>
            <div className="rounded-3xl p-6 lg:p-8 flex flex-col shadow-2xl h-full border border-slate-800 bg-[#141226] transition-all duration-500 hover:border-indigo-500/30 group/analytics">
              
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-inner group-hover/analytics:bg-white/10 transition-colors">
                  <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                
                <div className="flex items-center gap-3">
                  <button className="hidden sm:flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 hover:bg-white/10 active:scale-95 transition-all cursor-pointer group/filter">
                    <span className="text-sm font-semibold text-slate-300 group-hover/filter:text-white transition-colors">Filter by Team/Project</span>
                    <svg className="h-4 w-4 text-slate-400 group-hover/filter:text-slate-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 hover:bg-white/10 active:scale-95 transition-all cursor-pointer group/date">
                    <svg className="h-4 w-4 text-slate-400 group-hover/date:text-slate-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-300 whitespace-nowrap group-hover/date:text-white transition-colors">Jan - lth. 20</span>
                    <svg className="h-4 w-4 text-slate-400 group-hover/date:text-slate-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Separated Charts Area */}
              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 lg:gap-6 flex-1 mb-8">
                <LineChart />
                <DonutChart />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                <MetricBox label="Average Cycle Time" value="1216 min" />
                <MetricBox label="Completion Rate" value="63 %" valueColor="text-emerald-400" />
                <MetricBox label="Overdue Tasks" value="0" valueColor="text-rose-400" />
              </div>

              <button type="button" className="w-full rounded-xl bg-white py-4 text-sm font-bold text-slate-900 hover:bg-slate-200 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl cursor-pointer">
                View Detailed Report
              </button>
            </div>
          </ScrollItem>
        </ScrollStagger>

        {/* Privacy & Integrity Commitment (Bottom Section) */}
        <ScrollReveal variant="fadeUpSoft">
          <div className="rounded-3xl bg-card border border-border shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] p-8 sm:p-10 relative overflow-hidden transition-shadow duration-500 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)]">
            
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-muted/50 to-transparent pointer-events-none"></div>

            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-10 lg:gap-14 items-center relative z-10">
              
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-5">
                <PremiumTrustBadge />
                <p className="text-sm font-bold text-foreground leading-snug max-w-[120px] cursor-default">
                  A foundation built on trust.
                </p>
              </div>

              <div className="space-y-4 cursor-default">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Privacy & Integrity Commitment
                </h4>
                
                <div className="flex flex-wrap items-center gap-4">
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    Our Anti-Surveillance Promise
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase cursor-pointer hover:bg-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      Anti-Spyware Guarantee
                    </span>
                    <svg className="w-6 h-6 text-muted-foreground cursor-pointer hover:opacity-80 transition-opacity" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10" fill="currentColor" className="opacity-20" />
                      <path d="M12 2l2.4 4.8L20 8l-4 3.9.9 5.5L12 15.8 7.1 17.4 8 11.9 4 8l5.6-1.2L12 2z" fill="currentColor" className="opacity-60" />
                    </svg>
                  </div>
                </div>

                <p className="text-base leading-relaxed text-muted-foreground max-w-2xl">
                  We believe in empowering teams, not monitoring them. ThryvLoop explicitly
                  restricts keystroke logging, screen recording, and micro-surveillance features
                  to foster a high-trust, low-anxiety professional environment.
                </p>
              </div>

              <div className="hidden lg:flex items-center justify-center pr-4">
                <TrustPadlockGraphic />
              </div>

            </div>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}