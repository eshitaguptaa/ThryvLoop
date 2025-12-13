import React from 'react';

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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
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

       <div className="light bg-gray-100 dark:bg-background-dark font-display text-[#0f0e1b] dark:text-white antialiased selection:bg-primary/30 selection:text-primary min-h-screen">
         <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-gray-100">
           <main className="flex-grow flex flex-col items-center py-20 px-4 sm:px-6 lg:px-8 relative bg-gray-100">
            {/* Background Gradient Blobs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10 dark:opacity-40"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent-purple/10 blur-[100px] rounded-full pointer-events-none -z-10 dark:opacity-30"></div>
            
            <div className="w-full max-w-[1280px] flex flex-col gap-20">
              {/* Header Section */}
               <div className="relative flex flex-col items-center text-center gap-6 max-w-4xl mx-auto py-12">
                 {/* Purple glow effect around heading */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-[#5b4ded]/8 via-[#7c3aed]/10 to-[#8b5cf6]/8 blur-[100px] rounded-full pointer-events-none z-0"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#5b4ded]/5 blur-[80px] rounded-full pointer-events-none z-0"></div>
                 <div className="relative z-20 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold text-[#5b4ded] ring-1 ring-inset ring-[#d9d9f3] shadow-sm">
                   <span className="relative flex h-2 w-2">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5b4ded] opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5b4ded]"></span>
                   </span>
                   Productivity Reimagined
                 </div>
                <h1 className="relative z-20 text-[#0e0d1a] text-4xl sm:text-6xl font-black leading-[1.05] tracking-tight">
                  Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5b4ded] to-[#8b5cf6]">Deep Work</span> & Flow
                </h1>
                <p className="relative z-20 text-[#4b4b6b] text-lg sm:text-xl font-normal leading-relaxed max-w-3xl">
                  Experience a workspace that adapts to your energy. ThryvLoop orchestrates your day, silences the noise, and keeps you in the zone.
                </p>
               </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">

                {/* Feature Card 1: Ambience & Pomodoro (Large Card) */}
                <div className="group relative col-span-1 md:col-span-2 lg:row-span-2 overflow-hidden rounded-3xl bg-[#2f1952] border border-gray-100 shadow-2xl shadow-gray-900/20 hover:shadow-primary/10 transition-all duration-500">
                  <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/90 via-[#392f55]/70 to-[#867a9e]/50 z-10"></div>
                    <div className="absolute inset-0 bg-transparent z-10 pointer-events-none"></div>



                    <img alt="Interactive Nature Scene" className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-[5s] ease-in-out" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAq8WwwvwCOWTLhUqtA-iLWr0mRv6GYzHADObkJNNQ2FHWcbwG6rsmlbCfJVcHr4L4F2u2CIJFaWovTVOYfcxD-mzjRg5XWC88Pq_y2cZ5TXe0m9hmkdBk7vpE24tdHY_OFTtwAwEtGKfAO74CZNpV3TmauT3qzWfp2JL6E7OxidXeHYBowStNoza1DG1h9AaXb9-lNwbbgmk0hKjZ22q1x2Gz8rPSi1be5DE5cgr5vUKB8tyYoSTOs3O4kvM1DzYxgVMd498kFh9A" />
                    <div className="absolute inset-0 z-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-pulse"></div>
                  </div>
                  <div className="flex flex-col h-full relative z-20 p-8 sm:p-10 text-white justify-between">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 max-w-lg z-30 relative">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-xl ring-1 ring-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] text-2xl mb-1">
                          🍅
                        </div>
                        <h3 className="text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          Ambience & Pomodoro
                        </h3>
                        <p className="text-white/90 text-lg leading-relaxed font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] max-w-md">
                          Immerse yourself in nature. Stay focused with our adaptive soundscapes and precision timer.
                        </p>
                      </div>
                      <div className="hidden sm:flex px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 items-center gap-2 shadow-lg">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-bold tracking-wide uppercase text-white/90">Focus Mode Active</span>
                      </div>
                    </div>
                    <div className="flex-grow flex items-center justify-center mt-8 mb-4">
                      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        {/* Pomodoro Timer */}
                        <div className="relative flex justify-center py-6">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-72 h-72 border border-white/5 rounded-full animate-[pulse-ring_3s_cubic-bezier(0.215,0.61,0.355,1)_infinite]"></div>
                            <div className="absolute w-64 h-64 border border-white/10 rounded-full animate-[pulse-ring_3s_cubic-bezier(0.215,0.61,0.355,1)_infinite_0.5s]"></div>
                          </div>
                          <div className="relative w-72 h-72 backdrop-blur-2xl bg-black/30 rounded-full border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center z-10 group-hover:scale-105 transition-transform duration-500 ring-1 ring-white/20">
                            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-3">
                              <circle className="text-white/5" cx="50%" cy="50%" fill="transparent" r="46%" stroke="currentColor" strokeLinecap="round" strokeWidth="4"></circle>
                              <circle className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-all duration-1000" cx="50%" cy="50%" fill="transparent" r="46%" stroke="currentColor" strokeDasharray="800" strokeDashoffset="200" strokeLinecap="round" strokeWidth="6"></circle>
                            </svg>
                            <div className="flex flex-col items-center justify-center z-20 text-center space-y-2">
                              <div className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/60">Time Left</div>
                              <div className="text-7xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl leading-none font-display">25:00</div>
                              <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-white/10 border border-white/5">
                                <MaterialSymbol icon="laptop_chromebook" className="text-[16px] text-white/80" />
                                <span className="text-xs font-semibold text-white/80">Deep Work</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Ambience Controls (uses .glass-panel and .sound-wave-bar from embedded styles) */}
                        <div className="glass-panel p-6 rounded-3xl shadow-2xl relative overflow-hidden group/controls">
  <div className="absolute top-0 right-0 p-10 opacity-30 group-hover/controls:opacity-50 transition-opacity">
    <MaterialSymbol 
      icon="graphic_eq" 
      className="text-[300px] text-white opacity-80 scale-[2.5]" 
      fill={0} 
    />
  </div>

                          <div className="flex flex-col gap-6 relative z-10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-md flex items-center justify-center text-white ring-1 ring-white/30 shadow-lg">
                                  <MaterialSymbol icon="forest" className="text-2xl" />
                                </div>
                                <div>
                                  <div className="text-lg font-bold text-white leading-tight">Forest Rain</div>
                                  <div className="text-xs text-white/60 font-medium">Binaural Beats • 40Hz</div>
                                </div>
                              </div>
                           <div className="flex gap-1.5 items-center h-10 px-2">
  <div className="w-1.5 bg-white/90 rounded-full sound-wave-bar h-3 shadow-[0_0_10px_white]"></div>
  <div className="w-1.5 bg-white/90 rounded-full sound-wave-bar h-6 shadow-[0_0_10px_white]"></div>
  <div className="w-1.5 bg-white/90 rounded-full sound-wave-bar h-4 shadow-[0_0_10px_white]"></div>
  <div className="w-1.5 bg-white/90 rounded-full sound-wave-bar h-8 shadow-[0_0_10px_white]"></div>
  <div className="w-1.5 bg-white/90 rounded-full sound-wave-bar h-3 shadow-[0_0_10px_white]"></div>
</div>







                            </div>
                            <div className="space-y-5">
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs text-white/70 font-semibold tracking-wide">
                                  <span>INTENSITY</span>
                                  <span>65%</span>
                                </div>
                                <div className="relative w-full h-8 bg-black/40 rounded-full flex items-center px-1.5 group/slider cursor-pointer border border-white/5 hover:border-white/20 transition-colors shadow-inner">
                                  <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-1.5 bg-white/10 rounded-full"></div>
                                  <div className="absolute left-1 top-1/2 -translate-y-1/2 h-1.5 w-[65%] bg-gradient-to-r from-purple-400 to-purple-600 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.8)]"></div>

                                  <div className="absolute left-[65%] top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-[0_0_20px_rgba(168,85,247,0.8)] border-4 border-purple cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10"></div>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <button className="h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all backdrop-blur-sm group/btn">
                                  <MaterialSymbol icon="skip_previous" className="group-hover/btn:-translate-x-0.5 transition-transform" fill={0} />
                                </button>
                                <button className="h-12 rounded-xl bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-transform hover:scale-105 active:scale-95">
                                  <MaterialSymbol icon="pause" className="text-3xl" />
                                </button>
                                <button className="h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all backdrop-blur-sm group/btn">
                                  <MaterialSymbol icon="skip_next" className="group-hover/btn:translate-x-0.5 transition-transform" fill={0} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Card 2: Task Reminders */}
                <div className="group relative flex flex-col overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-yellow-500/10 hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/30 rounded-full blur-3xl pointer-events-none group-hover:bg-yellow-400/40 transition-colors"></div>
                  <div className="p-6 pb-2 relative z-10 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400/40 to-orange-500/40 text-xl shadow-md">
                        🔔
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 leading-tight">Task Reminders</h3>
                        <p className="text-[#534f96] text-[10px] font-bold uppercase tracking-wider mt-0.5">Today's Focus</p>
                      </div>
                    </div>
                    <div className="relative h-12 w-12 flex items-center justify-center">
                      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
                        <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                        <path className="text-yellow-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="70, 100" strokeLinecap="round" strokeWidth="3"></path>
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center leading-none">
                        <span className="text-[10px] font-black text-gray-900">5/7</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-3 relative z-10">
                    <div className="flex justify-between items-stretch gap-2">
                      <div className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-yellow-500 text-white shadow-md rounded-lg py-2 cursor-pointer">
                        <span className="text-[8px] font-bold uppercase tracking-wider">Today</span>
                        <span className="text-sm font-black">12</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-gray-50 border border-gray-200 rounded-lg py-2 cursor-pointer hover:bg-gray-100 transition-colors group/day">
                        <span className="text-[8px] font-bold uppercase text-gray-500 group-hover/day:text-gray-700">Wed</span>
                        <span className="text-xs font-bold text-gray-700">13</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-gray-50 border border-gray-200 rounded-lg py-2 cursor-pointer hover:bg-gray-100 transition-colors group/day">
                        <span className="text-[8px] font-bold uppercase text-gray-500 group-hover/day:text-gray-700">Thu</span>
                        <span className="text-xs font-bold text-gray-700">14</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-gray-50 border border-gray-200 rounded-lg py-2 cursor-pointer hover:bg-gray-100 transition-colors group/day">
                        <span className="text-[8px] font-bold uppercase text-gray-500 group-hover/day:text-gray-700">Fri</span>
                        <span className="text-xs font-bold text-gray-700">15</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 flex-grow flex flex-col gap-3 relative z-10 overflow-hidden">
                    {/* Task 1 */}
                    <div className="relative group/task cursor-pointer">
                      <div className="relative bg-white p-3 rounded-xl border-l-[3px] border-l-red-500 border-y border-r border-gray-200 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 h-4 w-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-gray-800 truncate pr-2">Launch Review</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white whitespace-nowrap">URGENT</span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-medium">
                                <MaterialSymbol icon="timer" className="text-[12px]" fill={0} />
                                <span>Due in 2h</span>
                              </div>
                              <div className="flex -space-x-1.5">
                                <img alt="User" className="w-4 h-4 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAseiFl0rSt5HMITynLYhO0Ombv-FcnLQzh_FiYrY7VloTeq2sRz5lMMiEhpu4U9vdE9HWcSn1167d13uHLffdrGfZuL-pnrTip0JhuKwkuZEzYqtlcM5PFgnLyEgN-aod9F-YK569KsfnftAiVGvB099w_SQn967aAgY6SSwRoiXQJnsSAu3f6TyyQZrLr03V_nKOWa9NRVquX_W_3HDt5bdI13bNzF74zQOPFs0hQFkzZW0RrAIdTlv5q3hDuWa0N90bg_Im4gmU" />
                                <img alt="User" className="w-4 h-4 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNmdYyH1_WPqA_X7UXNAXEZ9cBL9_WPv9ofLATXvfI-At0TcqHdHfANnSg_PYCt1D9Gs0tsh_15G6ZjHEWPV_l4vYUUbW7Z4J32pXhsICvT3a24DWjqJY4PI020QOXPN8iSjB_xcoN6DnUJ6Ve7hl4py3Qyrqlcus97KKfOGbP_r1vyguyI6bvlOnt6xv7MFSBXr2EogyTomXDjnkBRBGwtJ_t8jY3I4cCdz3T9UVm2NHTcYa76491T1pzikkjDFrtvmuEucTTNPY" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Task 2 */}
                    <div className="relative group/task cursor-pointer">
                      <div className="relative bg-gray-50 p-3 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300 group-hover/task:border-yellow-500 transition-colors"></div>
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-gray-500 line-through decoration-gray-400 decoration-2 group-hover/task:no-underline group-hover/task:text-gray-700 transition-all">Quarterly Report</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                            <MaterialSymbol icon="event" className="text-[12px]" fill={0} /> 4:30 PM
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Task 3 */}
                    <div className="relative group/task cursor-pointer">
                      <div className="relative bg-gray-50 p-3 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300 group-hover/task:border-blue-500 transition-colors"></div>
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-gray-700">Client Call</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                            <MaterialSymbol icon="videocam" className="text-[12px]" fill={0} /> 5:00 PM
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 pt-3 mt-auto relative z-10">
                    <div className="relative flex items-center gap-2">
                      <div className="relative flex-grow">
                        <input className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-3 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 text-gray-800 placeholder-gray-400 transition-shadow" placeholder="+ Add task..." type="text" />
                      </div>
                      <button className="h-8 w-8 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95">
                        <MaterialSymbol icon="arrow_upward" className="text-[16px]" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Feature Card 3: Analysis Tracker */}
              <div className="group relative overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="p-8 pb-2 relative z-10">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-2xl shadow-sm">
                    📊
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Analysis Tracker</h3>
                  <p className="text-[#534f96] text-sm font-medium">
                    Visualize trends & optimize.
                  </p>
                </div>
                <div className="flex-grow p-6 pt-2 relative z-10">
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 h-full flex flex-col relative overflow-hidden shadow-inner">
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Productivity Score</div>
                        <div className="text-3xl font-black text-gray-900">94%</div>
                      </div>
                      <div className="px-2 py-1 rounded-lg bg-green-100 border border-green-200 text-green-700 text-xs font-bold flex items-center gap-1">
                        <MaterialSymbol icon="trending_up" className="text-sm" fill={0} /> +12%
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-2 h-24 sm:h-28 md:h-36 w-full mt-auto">
                      <div className="w-full bg-gradient-to-t from-purple-100 to-purple-200 rounded-t-md h-[30%] relative group/bar hover:h-[35%] transition-all duration-300" />
                      <div className="w-full bg-gradient-to-t from-purple-100 to-purple-300 rounded-t-md h-[50%] relative group/bar hover:h-[55%] transition-all duration-300 delay-75" />
                      <div className="w-full bg-gradient-to-t from-purple-200 to-purple-300 rounded-t-md h-[40%] relative group/bar hover:h-[45%] transition-all duration-300 delay-100" />

                    {/* Peak bar (tooltip appears only when hovering this bar; top less rounded) */}
                    <div className="w-full relative flex items-end justify-center">
                      <div className="relative w-full max-w-xs flex flex-col items-center">
                        {/* Peak bar button MUST come before the tooltip so peer-* works on the tooltip */}
                        <button
                          className="peer w-full h-24 sm:h-28 md:h-32 rounded-t-md bg-gradient-to-b from-purple-500 to-indigo-500 transition-all duration-300 hover:h-28 sm:hover:h-32 md:hover:h-36 shadow-md focus:outline-none focus:ring-4 focus:ring-violet-200/40"
                          aria-label="Peak performance bar"
                        />

                        {/* Tooltip shown only when the button (peer) is hovered or focused */}
                        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center opacity-0 pointer-events-none transition-opacity duration-200 peer-hover:opacity-100 peer-focus:opacity-100">
                          {/* smaller glow behind bubble */}
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 sm:w-24 md:w-28 h-6 sm:h-7 rounded-xl bg-gradient-to-r from-violet-400/24 to-indigo-500/18 blur-lg opacity-0 peer-hover:opacity-100 peer-focus:opacity-100" />
                          <div className="relative z-10">
                            <div className="bg-gray-900 text-white font-semibold text-xs sm:text-sm px-2 py-1 rounded-md shadow-lg">
                              Peak Performance
                            </div>
                            <svg className="mx-auto mt-1" width="16" height="8" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                              <path d="M10 10L0 0H20L10 10Z" fill="#111827" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                      <div className="w-full bg-gradient-to-t from-purple-200 to-purple-300 rounded-t-md h-[60%] relative group/bar hover:h-[65%] transition-all duration-300 delay-150" />
                      <div className="w-full bg-gradient-to-t from-purple-250 to-purple-300 rounded-t-md h-[20%] relative group/bar hover:h-[25%] transition-all duration-300 delay-200" />
                    </div>
                  </div>
                </div>
              </div>



               {/* Feature Card 4: Eraser.io Editor (color tuned) */}
                <div className="group relative overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-100/60 hover:shadow-2xl hover:shadow-orange-400/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                  <div className="p-8 pb-4 relative z-10">
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 text-2xl ring-1 ring-orange-200 shadow-sm">
                      ✏️
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Eraser.io Editor</h3>
                    <p className="text-[#6b5aa3] text-sm font-medium">Seamless whiteboard & brainstorming.</p>
                  </div>

                  <div className="flex-grow p-6 pt-0 relative z-10">
                    <div className="w-full h-full bg-white rounded-2xl border border-gray-100 relative overflow-hidden group-hover:border-orange-300 transition-colors shadow-inner grid-bg">
                      <div className="absolute inset-0 p-4 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute top-8 left-8 w-20 h-12 border-2 border-gray-200 rounded-lg flex items-center justify-center bg-white shadow-sm transform -rotate-2">
                          <div className="h-2 w-12 bg-gray-100 rounded-full"></div>
                        </div>

                        <svg className="absolute top-14 left-28 w-16 h-12 text-gray-200" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M0,0 C20,0 20,40 60,40" strokeDasharray="4 4"></path>
                          <path d="M55,35 L60,40 L55,45" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>

                        <div className="absolute top-24 left-40 w-24 h-16 border-2 border-orange-300 rounded-lg flex flex-col gap-2 items-center justify-center bg-orange-50 shadow-sm transform rotate-1">
                          <div className="h-2 w-16 bg-orange-200 rounded-full"></div>
                          <div className="h-2 w-10 bg-orange-100 rounded-full"></div>
                        </div>

                        <div className="absolute top-1/2 left-1/2 transform translate-x-4 translate-y-8 z-20 transition-transform duration-1000 group-hover:translate-x-12 group-hover:translate-y-2">
                          <svg className="w-6 h-6 text-orange-500 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M5.5 3.21l12.32 10.74-5.26 1.18 3.54 6.94-2.22 1.12-3.56-6.94-3.72 4.48V3.21z"></path></svg>
                          <div className="absolute left-4 top-4 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap shadow-md">Sarah</div>
                        </div>

                        <div className="absolute bottom-4 right-4 w-16 h-16 bg-yellow-100 border border-yellow-200 shadow-md transform rotate-3 flex items-center justify-center">
                          <MaterialSymbol icon="lightbulb" className="text-yellow-600 text-xl" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
               {/* Feature Card 5: Music Integration — slightly smaller height */}
                <div className="group relative overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-xl hover:shadow-2xl hover:shadow-pink-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  
                  {/* Header */}
                  <div className="p-8 pb-4 relative z-10">
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-2xl ring-1 ring-pink-100">
                      🎵
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Music Integration</h3>
                    <p className="text-[#6b5aa3] text-sm font-medium">Sync playlists without breaking flow.</p>
                  </div>

                  {/* Purple Player */}
                  <div className="flex-grow px-6 pb-6 pt-0 relative z-10">
                    <div
                      className="rounded-2xl p-5 text-white relative overflow-hidden shadow-2xl border border-gray-800 h-full min-h-[270px] sm:min-h-[295px] md:min-h-[315px] flex flex-col justify-center"
                      style={{ background: "linear-gradient(180deg,#4c1053 0%,#1b0737 100%)" }}
                    >

                      {/* Glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-600 to-purple-900 opacity-30 pointer-events-none"></div>

                      {/* blob */}
                      <div className="absolute -right-10 -top-10 w-32 h-32 bg-pink-500 rounded-full blur-[40px] opacity-40 pointer-events-none"></div>

                      {/* Content */}
                      <div className="relative z-10 flex flex-col gap-4">

                        {/* Album Row */}
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-lg bg-gray-800 shadow-lg relative overflow-hidden group/album">
                            <img
                              alt="Album"
                              className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover/album:scale-110"
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDD-qlvELW4gCkYdA3cbPq8oF2HU57LjttnWCeQCBtWmirWDq_u3oFYTBsy7SdsYlNQ8aOVrMlZLqUqPfoBJkw9E4vydSU9GFnuOviFksH25Ens5PHlBljZ-hK1jtRvhYzNJcdhxfH1lCExSL6Xrd_vFPvW4hMMifeufdHt8ID-dH-4yUnJwojai6ppbPSgf5SgqgpBspOlr9nOOF5geiCn4a3qKh9IHabWAyJROGAWsErC3mXC5fIu0Y2H7LmHl-P6UdwNnp8TfDY"
                            />
                          </div>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold truncate">Deep Focus Mix</span>
                              <MaterialSymbol icon="verified" className="text-xs text-green-400" />
                            </div>
                            <span className="text-[11px] text-gray-300 truncate">Lofi Girl • Spotify</span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full w-1/3 bg-white rounded-full relative overflow-hidden transition-all duration-[2500ms] ease-linear group-hover:w-1/2">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between text-white pt-1">
                          <MaterialSymbol icon="shuffle" className="text-xl cursor-pointer hover:scale-110 transition-transform" />

                          <div className="flex items-center gap-4">
                            <MaterialSymbol icon="skip_previous" className="text-2xl cursor-pointer hover:-translate-x-1 transition-transform" />

                            <div className="h-10 w-10 rounded-full bg-white text-black flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-white/30 shadow-lg">
                              <MaterialSymbol icon="pause" className="text-2xl" />
                            </div>

                            <MaterialSymbol icon="skip_next" className="text-2xl cursor-pointer hover:translate-x-1 transition-transform" />
                          </div>

                          <MaterialSymbol icon="repeat" className="text-xl cursor-pointer hover:scale-110 transition-transform" />
                        </div>

                      </div>
                    </div>
                  </div>
                </div>



                {/* Feature Card 6: Gmail & Calendar (color tuned) */}
                <div className="group relative overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl hover:shadow-blue-400/10 hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <div className="p-8 pb-4 relative z-10">
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-50 text-2xl ring-1 ring-blue-100 shadow-sm">
                      📅
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Gmail & Calendar</h3>
                    <p className="text-[#6b5aa3] text-sm font-medium">Unified inbox & schedule view.</p>
                  </div>

                  <div className="flex-grow px-6 pb-6 pt-0 relative z-10">
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col shadow-sm group-hover:shadow-lg transition-shadow h-full">
                      <div className="h-9 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-400"></div>
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400"></div>
                        <div className="h-2.5 w-2.5 rounded-full bg-green-400"></div>
                        <div className="ml-auto w-24 h-4 bg-gray-200 rounded-full"></div>
                      </div>

                      <div className="p-4 space-y-4 relative">
                        <div className="absolute left-7 top-4 bottom-4 w-0.5 bg-gray-100 z-0"></div>

                        <div className="flex items-start gap-3 relative z-10">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 flex-shrink-0 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                            <MaterialSymbol icon="calendar_month" className="text-xs" />
                          </div>
                          <div className="flex-grow bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                            <div className="flex justify-between">
                              <div className="h-2 w-20 bg-gray-300 rounded mb-1.5"></div>
                              <span className="text-[10px] text-blue-500 font-bold">NOW</span>
                            </div>
                            <div className="h-1.5 w-12 bg-blue-200 rounded"></div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 relative z-10">
                          <div className="h-8 w-8 rounded-lg bg-red-50 flex-shrink-0 flex items-center justify-center text-red-600 border border-red-100 shadow-sm">
                            <div className="relative">
                              <MaterialSymbol icon="mail" className="text-xs" />
                              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                            </div>
                          </div>
                          <div className="flex-grow bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm group-hover:translate-x-1 transition-transform">
                            <div className="flex justify-between items-center mb-1.5">
                              <div className="h-2 w-16 bg-gray-800 rounded"></div>
                              <div className="text-[9px] text-gray-400">10m ago</div>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded mb-1"></div>
                            <div className="h-1.5 w-2/3 bg-gray-100 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

               {/* Feature Card 7: AI Chatbot Assistant (Wide Card) */}
<div className="group relative col-span-1 md:col-span-2 lg:col-span-3 overflow-hidden rounded-3xl bg-gradient-to-r from-white to-[#fbf8ff] border border-gray-100 shadow-2xl shadow-gray-200/50 hover:shadow-[0_20px_60px_-15px_rgba(99,72,193,0.15)] transition-all duration-300 p-8 sm:p-12 flex flex-col md:flex-row items-center gap-10">

  {/* subtle grid + mask (keeps same behavior) */}
  <div
    className="absolute inset-0 bg-grid-slate-100/40"
    style={{ maskImage: "linear-gradient(to bottom, transparent, black)" }}
  ></div>

  {/* Left content */}
  <div className="flex-1 space-y-8 relative z-10 max-w-xl">
    <div>
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-3xl ring-1 ring-indigo-500/30 shadow-lg mb-6">
        🤖
      </div>
      <h3 className="text-3xl md:text-4xl font-bold text-[#0f0e1b] leading-tight">
        AI Chatbot <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Assistant</span>
      </h3>
    </div>

    <p className="text-[#5f5590] text-lg leading-relaxed">
      Your personal productivity concierge. Start your day with clarity as our AI summarizes your agenda, prioritizes tasks, and handles quick queries instantly.
    </p>

    <div className="flex gap-4">
      <button className="px-7 py-3 rounded-full bg-[#0f0e1b] text-white font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-1 transition-all flex items-center gap-2">
        Chat with AI <MaterialSymbol icon="arrow_forward" className="text-sm" />
      </button>
      <button className="px-7 py-3 rounded-full bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
        View Demo
      </button>
    </div>
  </div>

  {/* RIGHT - the chat mockup with purple glow behind it */}
  <div className="flex-1 w-full max-w-lg relative">
    {/* purple glow background (indigo→purple, softer opacity + blur) */}
    <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20 blur-3xl group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"></div>

    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col h-[400px] transform transition-transform duration-500 ease-out">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg ring-2 ring-white">
              <MaterialSymbol icon="smart_toy" className="text-lg" />
            </div>
            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white shadow-sm"></span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">ThryvBot</h4>
            <span className="text-xs text-green-500 font-bold uppercase tracking-wider">Online</span>
          </div>
        </div>
        <div className="flex gap-2">
          <MaterialSymbol icon="history" className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-md hover:bg-gray-100 transition-colors" fill={0} />
          <MaterialSymbol icon="more_vert" className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-md hover:bg-gray-100 transition-colors" fill={0} />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-grow p-6 space-y-6 overflow-y-auto bg-grid-slate-50/40">
        {/* AI Message */}
        <div className="flex items-start gap-4 animate-[float-slow_4s_ease-in-out_infinite]">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold shadow-md mt-1">AI</div>
          <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4 text-sm text-[#0f0e1b] max-w-[85%] shadow-sm border border-transparent">
            <p className="leading-relaxed">
              Good morning! You have <span className="font-bold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">3 high-priority tasks</span> today.
            </p>
            <div className="mt-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span className="text-xs font-semibold">Project Review</span>
              </div>
              <div className="text-[10px] text-gray-500">10:00 AM - 11:30 AM</div>
            </div>
            <p className="mt-3 leading-relaxed">Should I schedule a deep work block?</p>
          </div>
        </div>

        {/* User Message */}
        <div className="flex items-start gap-4 justify-end">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl rounded-tr-none p-4 text-sm max-w-[85%] shadow-lg shadow-indigo-500/20">
            <p className="leading-relaxed">Yes, please block out 2 hours starting at 10 AM.</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 text-xs font-bold mt-1 border-2 border-white">ME</div>
        </div>

        {/* Typing Indicator */}
        <div className="flex items-center gap-2 ml-12">
          <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-tl-none border border-transparent flex gap-1 items-center">
            <span className="animate-bounce h-1.5 w-1.5 bg-gray-400 rounded-full"></span>
            <span className="animate-bounce h-1.5 w-1.5 bg-gray-400 rounded-full delay-75"></span>
            <span className="animate-bounce h-1.5 w-1.5 bg-gray-400 rounded-full delay-150"></span>
          </div>
          <span className="text-xs text-gray-400 italic">ThryvBot is typing...</span>
        </div>
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="relative group/input">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-0 group-hover/input:opacity-10 blur transition-opacity pointer-events-none"></div>
          <input className="w-full bg-gray-50 border border-gray-200 rounded-full py-3.5 pl-5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-gray-500 text-gray-800 shadow-inner transition-all relative z-10" placeholder="Ask anything..." type="text" />
          <button className="absolute right-2 top-2 h-9 w-9 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full flex items-center justify-center transition-all shadow-md hover:scale-110 z-20">
            <MaterialSymbol icon="send" className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  </div>
</div>


              </div>

              <div className="flex justify-center mt-12">
                <button className="group relative flex min-w-[240px] cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-full h-16 px-10 bg-[#0f0e1b] dark:bg-white text-white dark:text-[#0f0e1b] text-lg font-bold leading-normal tracking-wide transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/30">
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                  <span className="truncate">Explore all features</span>
                  <MaterialSymbol icon="arrow_forward" className="text-lg transition-transform group-hover:translate-x-1" />
                </button>
          </div>
          </div>
           </main>
        </div>
      </div>
    </>
  );
}