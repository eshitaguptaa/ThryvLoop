import React from 'react';
import Link from 'next/link';
import WorkspacesShowcase from '@/components/landing_sections/WorkspacesShowcase';
import SoundscapeComposerShowcase from '@/components/landing_sections/SoundscapeComposerShowcase';
import TasksShowcase from '@/components/landing_sections/TasksShowcase';
import AnalysisTrackerShowcase from '@/components/landing_sections/AnalysisTrackerShowcase';
import GmailCalendarShowcase from '@/components/landing_sections/GmailCalendarShowcase';
import SpacesCrossfadeBackground from '@/components/landing_sections/SpacesCrossfadeBackground';
import ForestRainControls from '@/components/landing_sections/ForestRainControls';
import FeatureCardIcon from '@/components/landing_sections/FeatureCardIcon';
import { ScrollReveal, ScrollStagger, ScrollItem } from '@/components/landing_sections/ScrollReveal';
import { SectionBlend } from '@/components/landing_sections/SectionBlend';

// ====================================================================
// 1. Icon Components for React/Next.js
//    Replaced raw HTML icons for better React integration.
// ====================================================================

const MaterialSymbol = ({ icon, className = '', fill = 1 }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{
      fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
    }}
  >
    {icon}
  </span>
);

const ThryvLoopLogo = ({ className = 'size-8 text-primary' }) => (
  <div className={className}>
    <svg className="h-full w-full drop-shadow-lg" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"
        fill="currentColor"
      ></path>
    </svg>
  </div>
);

const TwitterIcon = ({ className = 'h-5 w-5' }) => (
  <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
);

const GitHubIcon = ({ className = 'h-5 w-5' }) => (
  <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24"><path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd"></path></svg>
);

// ====================================================================
// 2. Main Component
// ====================================================================

export default function Features() {
  return (
    <>
      {/* This is the only way to include custom CSS animations and utilities 
        inside a single React file without relying on external stylesheets 
        or CSS-in-JS libraries. 
      */}
      <style jsx global>{`
        /* Import Fonts - These should ideally be in _document.js or layout */
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        /* Material Symbols style override */
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        /* Keyframes - Must also be defined in tailwind.config.js for class usage */
        @keyframes float-slow {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes wave {
          0%, 100% { height: 4px; opacity: 0.5; }
          50% { height: 20px; opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Custom Delays for Sound Wave Bars */
        .sound-wave-bar:nth-child(2) { animation-delay: 0.1s; }
        .sound-wave-bar:nth-child(3) { animation-delay: 0.2s; }
        .sound-wave-bar:nth-child(4) { animation-delay: 0.3s; }
        .sound-wave-bar:nth-child(5) { animation-delay: 0.4s; }

        /* Custom Utility: Grid Background (used on Eraser card) */
        .grid-bg {
          background-size: 20px 20px;
          background-image: radial-gradient(circle, #e5e7eb 1px, transparent 1px);
        }
        .dark .grid-bg {
          background-image: radial-gradient(circle, #374151 1px, transparent 1px);
        }

        /* Custom Utility: Glass Panel (used on Ambience card controls) */
        .glass-panel {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>

       <div className="bg-surface text-foreground antialiased selection:bg-primary/30 selection:text-primary min-h-screen">
         <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-surface">
           <main id="features" className="flex-grow flex flex-col items-center py-20 px-4 sm:px-6 lg:px-8 relative bg-surface">
            <SectionBlend position="bottom" fromColor="transparent" toColor="background" size="xl" />
            {/* Background Gradient Blobs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10 dark:opacity-40"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent-purple/10 blur-[100px] rounded-full pointer-events-none -z-10 dark:opacity-30"></div>
            
            <div className="w-full max-w-[1280px] flex flex-col gap-20">
              {/* Header Section — always visible; scroll-reveal was leaving this stuck at opacity 0 when partially on screen */}
               <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-4xl mx-auto py-12">
                 {/* Purple glow effect around heading */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-[#5b4ded]/8 via-[#7c3aed]/10 to-[#8b5cf6]/8 blur-[100px] rounded-full pointer-events-none z-0"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#5b4ded]/5 blur-[80px] rounded-full pointer-events-none z-0"></div>
                 <div className="relative z-20 inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-xs font-semibold text-[#5b4ded] ring-1 ring-inset ring-border shadow-sm">
                   <span className="relative flex h-2 w-2">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5b4ded] opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5b4ded]"></span>
                   </span>
                   Productivity Reimagined
                 </div>
                <h1 className="relative z-20 landing-display text-4xl sm:text-[3.25rem] max-w-3xl">
                  Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5b4ded] to-[#8b5cf6]">Deep Work</span> & Flow
                </h1>
                <p className="relative z-20 landing-body text-lg sm:text-xl max-w-2xl">
                  Experience a workspace that adapts to your energy. ThryvLoop orchestrates your day, silences the noise, and keeps you in the zone.
                </p>
               </div>

              {/* Features Grid */}
              <ScrollStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr" stagger={0.06}>

                {/* Feature Card 1: Ambience & Pomodoro (Large Card) */}
                <ScrollItem className="col-span-1 md:col-span-2 lg:row-span-2">
                <div className="group relative h-full overflow-hidden rounded-3xl bg-[#2f1952] border-0 shadow-2xl shadow-gray-900/20 dark:shadow-black/40 hover:shadow-primary/10 transition-all duration-500">
                  <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
                    <SpacesCrossfadeBackground />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/90 via-[#392f55]/70 to-[#867a9e]/50 z-10" />
                    <div className="absolute inset-0 bg-transparent z-10 pointer-events-none" />
                  </div>
                  <div className="flex flex-col h-full relative z-20 p-8 sm:p-10 text-white justify-between">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 max-w-lg z-30 relative">
                        <FeatureCardIcon icon="timer" tone="dark" className="mb-1" fill={1} />
                        <h3 className="text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          Ambience & Pomodoro
                        </h3>
                        <p className="text-white/90 text-lg leading-relaxed font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] max-w-md">
                          Immerse yourself in nature. Stay focused with our adaptive soundscapes and precision timer.
                        </p>
                      </div>
                      <div className="hidden sm:flex px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 items-center gap-2 shadow-lg">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                        </span>
                        <span className="text-xs font-bold tracking-wide uppercase text-white/90">Focus Mode Active</span>
                      </div>
                    </div>
                    <div className="flex-grow flex items-center justify-center mt-8 mb-4">
                      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div className="relative flex justify-center py-6">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-72 h-72 border border-white/5 rounded-full animate-[pulse-ring_3s_cubic-bezier(0.215,0.61,0.355,1)_infinite]" />
                            <div className="absolute w-64 h-64 border border-white/10 rounded-full animate-[pulse-ring_3s_cubic-bezier(0.215,0.61,0.355,1)_infinite_0.5s]" />
                          </div>
                          <div className="relative w-72 h-72 backdrop-blur-2xl bg-black/30 rounded-full border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center z-10 group-hover:scale-105 transition-transform duration-500 ring-1 ring-white/20">
                            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-3">
                              <circle className="text-white/5" cx="50%" cy="50%" fill="transparent" r="46%" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
                              <circle className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-all duration-1000" cx="50%" cy="50%" fill="transparent" r="46%" stroke="currentColor" strokeDasharray="800" strokeDashoffset="200" strokeLinecap="round" strokeWidth="6" />
                            </svg>
                            <div className="flex flex-col items-center justify-center z-20 text-center space-y-2">
                              <div className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/60">Time Left</div>
                              <div className="text-7xl font-semibold text-white tracking-tighter tabular-nums drop-shadow-2xl leading-none">25:00</div>
                              <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-white/10 border border-white/5">
                                <MaterialSymbol icon="laptop_chromebook" className="text-[16px] text-white/80" />
                                <span className="text-xs font-semibold text-white/80">Deep Work</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <ForestRainControls />
                      </div>
                    </div>
                  </div>
                </div>
                </ScrollItem>

                {/* Feature Card 2: Task Reminders (interactive) */}
                <ScrollItem className="h-full">
                <TasksShowcase />
                </ScrollItem>

                {/* Feature Card 3: Analysis Tracker (interactive) */}
                <ScrollItem className="h-full">
                <AnalysisTrackerShowcase />
                </ScrollItem>



               {/* Feature Card 4: Team Workspaces (interactive) */}
                <ScrollItem className="h-full">
                <WorkspacesShowcase />
                </ScrollItem>
               {/* Feature Card 5: Soundscape Composer */}
                <ScrollItem className="h-full">
                <SoundscapeComposerShowcase />
                </ScrollItem>



                {/* Feature Card 6: Gmail & Calendar (interactive) */}
                <ScrollItem className="h-full">
                <GmailCalendarShowcase />
                </ScrollItem>

               {/* Feature Card 7: AI Chatbot Assistant (Wide Card) */}
                <ScrollItem className="col-span-1 md:col-span-2 lg:col-span-3">
<div className="group relative overflow-hidden rounded-3xl bg-card border border-border shadow-2xl shadow-gray-200/50 dark:shadow-black/30 hover:shadow-[0_20px_60px_-15px_rgba(99,72,193,0.15)] transition-all duration-300 p-8 sm:p-12 flex flex-col md:flex-row items-center gap-10">

  {/* subtle grid + mask (keeps same behavior) */}
  <div
    className="absolute inset-0 opacity-40 dark:opacity-20"
    style={{ maskImage: "linear-gradient(to bottom, transparent, black)" }}
  ></div>

  {/* Left content */}
  <div className="flex-1 space-y-8 relative z-10 max-w-xl">
    <div>
      <FeatureCardIcon icon="smart_toy" tone="indigo" className="mb-6" fill={1} />
      <h3 className="landing-display text-3xl md:text-4xl">
        AI Chatbot <span className="text-muted-foreground">Assistant</span>
      </h3>
    </div>

    <p className="landing-body text-lg">
      Your personal productivity concierge. Start your day with clarity as our AI summarizes your agenda, prioritizes tasks, and handles quick queries instantly.
    </p>

    <div className="flex gap-4">
      <Link
        href="/home"
        className="px-7 py-3 rounded-full bg-foreground text-background font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-1 transition-all flex items-center gap-2"
      >
        Chat with AI <MaterialSymbol icon="arrow_forward" className="text-sm" />
      </Link>
      <Link
        href="/signup"
        className="px-7 py-3 rounded-full bg-card border border-border text-foreground font-semibold hover:bg-muted transition-colors"
      >
        View Demo
      </Link>
    </div>
  </div>

  {/* RIGHT - the chat mockup with purple glow behind it */}
  <div className="flex-1 w-full max-w-lg relative">
    {/* purple glow background (indigo→purple, softer opacity + blur) */}
    <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20 blur-3xl group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"></div>

    <div className="relative bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col h-[400px] transform transition-transform duration-500 ease-out">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg ring-2 ring-card">
              <MaterialSymbol icon="smart_toy" className="text-lg" />
            </div>
            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-card shadow-sm"></span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">ThryvBot</h4>
            <span className="text-xs text-green-500 font-bold uppercase tracking-wider">Online</span>
          </div>
        </div>
        <div className="flex gap-2">
          <MaterialSymbol icon="history" className="text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-md hover:bg-muted transition-colors" fill={0} />
          <MaterialSymbol icon="more_vert" className="text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-md hover:bg-muted transition-colors" fill={0} />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-grow p-6 space-y-6 overflow-y-auto bg-surface/50">
        {/* AI Message */}
        <div className="flex items-start gap-4 animate-[float-slow_4s_ease-in-out_infinite]">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold shadow-md mt-1">AI</div>
          <div className="bg-muted rounded-2xl rounded-tl-none p-4 text-sm text-foreground max-w-[85%] shadow-sm border border-transparent">
            <p className="leading-relaxed">
              Good morning! You have <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1 py-0.5 rounded">3 high-priority tasks</span> today.
            </p>
            <div className="mt-3 p-3 bg-card rounded-xl border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span className="text-xs font-semibold text-foreground">Project Review</span>
              </div>
              <div className="text-[10px] text-muted-foreground">10:00 AM - 11:30 AM</div>
            </div>
            <p className="mt-3 leading-relaxed">Should I schedule a deep work block?</p>
          </div>
        </div>

        {/* User Message */}
        <div className="flex items-start gap-4 justify-end">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl rounded-tr-none p-4 text-sm max-w-[85%] shadow-lg shadow-indigo-500/20">
            <p className="leading-relaxed">Yes, please block out 2 hours starting at 10 AM.</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-muted-foreground text-xs font-bold mt-1 border-2 border-card">ME</div>
        </div>

        {/* Typing Indicator */}
        <div className="flex items-center gap-2 ml-12">
          <div className="bg-muted px-3 py-2 rounded-2xl rounded-tl-none border border-transparent flex gap-1 items-center">
            <span className="animate-bounce h-1.5 w-1.5 bg-muted-foreground rounded-full"></span>
            <span className="animate-bounce h-1.5 w-1.5 bg-muted-foreground rounded-full delay-75"></span>
            <span className="animate-bounce h-1.5 w-1.5 bg-muted-foreground rounded-full delay-150"></span>
          </div>
          <span className="text-xs text-muted-foreground italic">ThryvBot is typing...</span>
        </div>
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border bg-card">
        <div className="relative group/input">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-0 group-hover/input:opacity-10 blur transition-opacity pointer-events-none"></div>
          <input className="w-full bg-muted border border-border rounded-full py-3.5 pl-5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-muted-foreground text-foreground shadow-inner transition-all relative z-10" placeholder="Ask anything..." type="text" />
          <button className="absolute right-2 top-2 h-9 w-9 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full flex items-center justify-center transition-all shadow-md hover:scale-110 z-20">
            <MaterialSymbol icon="send" className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
                </ScrollItem>


              </ScrollStagger>

              <ScrollReveal className="flex justify-center mt-12" variant="fadeUpSoft" delay={0.1}>
                <button className="group relative flex min-w-[240px] cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-full h-16 px-10 bg-foreground text-background text-lg font-bold leading-normal tracking-wide transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/30">
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                  <span className="truncate">Explore all features</span>
                  <MaterialSymbol icon="arrow_forward" className="text-lg transition-transform group-hover:translate-x-1" />
                </button>
          </ScrollReveal>
          </div>
           </main>
        </div>
      </div>
    </>
  );
}