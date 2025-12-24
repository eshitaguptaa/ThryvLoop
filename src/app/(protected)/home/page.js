import { 
  Bell, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Calendar, 
  Video, 
  MoreHorizontal,
  Music,
  ArrowUpRight,
  Timer
} from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#F8F9F8] text-[#1A1A1A] px-4 pt-2 pb-4 sm:px-6 sm:pt-3 sm:pb-6 md:px-8 md:pt-4 md:pb-8 lg:px-12 lg:pt-6 lg:pb-10 font-[var(--font-poppins)]">
      <div className="max-w-7xl mx-auto">
        
        {/* --- Header Section --- */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 sm:mb-3 md:mb-4 gap-3 sm:gap-4">
          <div className="flex-1">
            <p className="text-indigo-500 text-xs font-semibold uppercase tracking-widest mb-2">Dashboard</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-2 leading-tight">
              Ready to flow, Alex?
            </h1>
            <p className="text-sm sm:text-base text-gray-500 font-medium">Tuesday, Oct 24</p>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <button className="p-2.5 sm:p-3 bg-white border border-gray-100 rounded-full shadow-sm hover:shadow-md transition-all text-gray-600">
              <Bell size={18} className="sm:w-5 sm:h-5" />
            </button>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
              {/* Placeholder for user avatar */}
              <img 
                src="https://i.pravatar.cc/150?u=alex" 
                alt="Profile" 
                className="h-full w-full object-cover" 
              />
            </div>
          </div>
        </header>

        {/* --- Main Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 md:gap-8 mb-5 sm:mb-6 md:mb-8">
          
          {/* 1. Focus Mode Hero Card (Spans 8 columns) */}
          <div className="lg:col-span-8 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 rounded-3xl sm:rounded-[40px] p-5 sm:p-6 md:p-8 lg:p-10 flex flex-col lg:flex-row relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-indigo-100/50 group">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-transparent to-purple-50/30 pointer-events-none opacity-100 group-hover:opacity-80 transition-opacity duration-500"></div>
            
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-bl-full blur-2xl"></div>
            
            <div className="flex-1 z-10 flex flex-col justify-center relative pr-0 lg:pr-6 xl:pr-8">
              {/* Enhanced badge */}
              <div className="inline-flex self-start items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-4 sm:px-5 py-2 rounded-full text-[10px] sm:text-xs font-semibold tracking-wider mb-4 sm:mb-5 md:mb-6 shadow-sm border border-indigo-200/50">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                FOCUS MODE
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3 sm:mb-4 md:mb-5 text-gray-900 pr-0 lg:pr-4">
                Enter your flow state
              </h2>
              
              <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6 md:mb-8 max-w-md leading-relaxed font-medium pr-0 lg:pr-6">
                Start a focused work session tailored to your schedule and preferences.
              </p>
              
              {/* Enhanced CTA Button */}
              <button className="bg-gradient-to-r from-[#545BE8] to-indigo-600 text-white px-7 sm:px-9 py-3 sm:py-3.5 md:py-4 rounded-xl sm:rounded-2xl flex items-center gap-3 font-medium hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-xl shadow-indigo-300/50 hover:shadow-2xl hover:shadow-indigo-400/50 w-full sm:w-fit text-sm sm:text-base hover:scale-105 active:scale-100 group/btn">
                <div className="bg-white/25 p-1.5 rounded-full group-hover/btn:bg-white/30 transition-colors">
                  <Play size={14} className="sm:w-4 sm:h-4 fill-white ml-0.5" />
                </div>
                <span>Begin Focus Session</span>
                <ArrowUpRight size={16} className="opacity-70 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-all" />
              </button>
            </div>
            
            {/* Enhanced Decorative Image Container */}
            <div className="mt-4 sm:mt-6 lg:mt-0 lg:w-[300px] xl:w-[320px] lg:ml-4 h-40 sm:h-56 md:h-64 lg:h-auto rounded-2xl sm:rounded-[32px] overflow-hidden relative shadow-2xl shrink-0 group-hover:shadow-indigo-200/50 transition-shadow duration-300">
              {/* Image overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10"></div>
              
              {/* Decorative border glow */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-[32px] border-2 border-white/20 shadow-inner"></div>
              
              <img 
                src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=800" 
                alt="Mountain Landscape" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Floating particles effect */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-white/60 rounded-full blur-sm animate-pulse"></div>
              <div className="absolute bottom-8 left-6 w-1.5 h-1.5 bg-indigo-300/60 rounded-full blur-sm animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>

          {/* 2. Right Column Widgets (Spans 4 columns) */}
          <div className="lg:col-span-4 flex flex-col gap-5 sm:gap-6 md:gap-8">
            
            {/* Time Focused Card */}
            <div className="bg-gradient-to-br from-white to-indigo-50/30 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-[32px] shadow-lg hover:shadow-xl transition-all duration-300 border border-indigo-100/50 flex flex-col justify-between group relative overflow-hidden">
              {/* Background decorative elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-100/20 rounded-full blur-xl"></div>
              
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-t-2xl sm:rounded-t-[32px]"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2 sm:mb-3 md:mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 sm:p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl shadow-sm border border-indigo-200/50">
                      <Timer size={14} className="sm:w-4 sm:h-4 text-indigo-600" />
                    </div>
                    <span className="text-gray-500 font-semibold text-[10px] sm:text-xs tracking-wider uppercase">Time Focused</span>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 text-[9px] sm:text-[10px] font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm border border-emerald-200/50">
                    <ArrowUpRight size={11} className="sm:w-3.5 sm:h-3.5" /> 
                    <span className="font-bold">+12%</span>
                    <span className="font-medium text-emerald-600/70 ml-0.5 hidden sm:inline shrink-0 text-[8px]">vs yesterday</span>
                  </div>
                </div>
                
                <div className="mb-3 sm:mb-4 md:mb-5">
                  {/* Enhanced time display */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-none">2</span>
                    <span className="text-base sm:text-lg md:text-xl text-gray-500 font-medium">h</span>
                    <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-none ml-2">15</span>
                    <span className="text-base sm:text-lg md:text-xl text-gray-500 font-medium">m</span>
                  </div>
                </div>
                
                {/* Enhanced progress section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-gray-900">65%</span>
                      <span className="text-[10px] sm:text-xs text-gray-400 font-medium">of goal</span>
                    </div>
                  </div>
                  <div className="h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner relative">
                    <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full relative overflow-hidden shadow-sm" style={{ width: '65%' }}>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Soundscape Music Card */}
            <div className="bg-gradient-to-br from-[#2D2823] via-[#1F1B17] to-[#2D2823] text-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-[32px] relative overflow-hidden flex flex-col justify-between shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-800/50 group">
               {/* Blurred Tokyo Background Image */}
               <div className="absolute inset-0 z-0">
                 <img 
                   src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=1200" 
                   alt="Tokyo" 
                   className="w-full h-full object-cover opacity-30 blur-md scale-110"
                 />
                 {/* Dark overlay for better text readability */}
                 <div className="absolute inset-0 bg-gradient-to-br from-[#2D2823]/90 via-[#1F1B17]/85 to-[#2D2823]/90"></div>
               </div>
               
               {/* Enhanced Background Blurs/Gradient */}
               <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/25 blur-3xl rounded-full animate-pulse z-10" />
               <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/25 blur-3xl rounded-full animate-pulse z-10" style={{ animationDelay: '1s' }} />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/15 blur-2xl rounded-full animate-pulse z-10" style={{ animationDelay: '0.5s' }} />
               {/* Additional gradient overlay */}
               <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-transparent to-indigo-900/10 pointer-events-none z-10"></div>

               <div className="flex justify-between items-start relative z-10 gap-2">
                 <div className="flex items-center gap-1.5 sm:gap-2 bg-white/15 backdrop-blur-md px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-semibold tracking-wider text-white shadow-lg border border-white/10">
                   <Music size={11} className="sm:w-3.5 sm:h-3.5" /> SOUNDSCAPE
                 </div>
                 <div className="flex items-center gap-1.5 sm:gap-2 bg-red-500/30 backdrop-blur-sm text-red-200 px-2.5 sm:px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-semibold shrink-0 shadow-lg border border-red-500/20">
                   <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse shadow-sm shadow-red-400/50" /> LIVE
                 </div>
               </div>
               
               <div className="relative z-10 mt-3 sm:mt-4 md:mt-5">
                 {/* Animated Visualizer Bars */}
                 <div className="flex items-end gap-1 sm:gap-1.5 mb-3 sm:mb-4 md:mb-5 h-6 sm:h-7 md:h-8 justify-center">
                    {[
                      { base: 20, peak: 80, delay: 0, duration: 0.8 },
                      { base: 40, peak: 100, delay: 0.1, duration: 0.6 },
                      { base: 15, peak: 70, delay: 0.2, duration: 0.9 },
                      { base: 50, peak: 95, delay: 0.15, duration: 0.7 },
                      { base: 30, peak: 85, delay: 0.05, duration: 0.75 },
                      { base: 60, peak: 100, delay: 0.2, duration: 0.65 },
                      { base: 25, peak: 75, delay: 0.1, duration: 0.85 },
                      { base: 45, peak: 90, delay: 0.25, duration: 0.7 },
                      { base: 35, peak: 80, delay: 0.15, duration: 0.8 }
                    ].map((bar, i) => (
                      <div 
                        key={i} 
                        className="w-1.5 sm:w-2 bg-gradient-to-t from-indigo-400 via-purple-400 to-pink-400 rounded-full shadow-lg shadow-indigo-500/30"
                        style={{
                          animation: `dance ${bar.duration}s ease-in-out infinite`,
                          animationDelay: `${bar.delay}s`,
                          height: `${bar.base}%`,
                          minHeight: '4px'
                        }}
                      />
                    ))}
                 </div>

                 <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-0.5">Rainy Tokyo</h3>
                 <p className="text-[10px] sm:text-xs text-gray-300 mb-3 sm:mb-4 md:mb-5 font-medium uppercase tracking-wide">Night Cafe Jazz · Ambience</p>
                 
                 <div className="flex items-center justify-between gap-2">
                   <span className="text-[9px] sm:text-[10px] text-gray-400 font-mono">14:20</span>
                   <div className="flex items-center gap-3 sm:gap-4">
                     <button className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                       <SkipBack size={14} className="sm:w-4 sm:h-4" />
                     </button>
                     <button className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center text-indigo-900 hover:scale-110 transition-transform shadow-lg hover:shadow-xl">
                        <Pause size={14} className="sm:w-[18px] sm:h-[18px]" fill="currentColor" />
                     </button>
                     <button className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                       <SkipForward size={14} className="sm:w-4 sm:h-4" />
                     </button>
                   </div>
                   <span className="text-[9px] sm:text-[10px] text-gray-400 font-mono">-30:40</span>
                 </div>
                 {/* Enhanced Progress Line */}
                 <div className="mt-2 sm:mt-3 h-0.5 sm:h-1 bg-white/10 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-full shadow-sm" style={{ width: '33%' }} />
                 </div>
               </div>
            </div>

          </div>
        </div>

        {/* --- Bottom Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 md:gap-8 pb-4 sm:pb-6 md:pb-8">
          
          {/* Productivity Trend Graph */}
          <div className="bg-gradient-to-br from-white to-indigo-50/30 p-5 sm:p-6 md:p-8 rounded-3xl sm:rounded-[40px] shadow-lg hover:shadow-xl transition-all duration-300 border border-indigo-100/50 flex flex-col justify-between group relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-100/20 rounded-full blur-xl"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4 sm:mb-5 md:mb-6 gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg shadow-sm border border-indigo-200/50">
                      <div className="w-2 h-2 bg-[#615FFF] rounded-full"></div>
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Productivity Trend</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Weekly focus efficiency</p>
                </div>
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 text-[#615FFF] px-3 sm:px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold shrink-0 shadow-sm border border-indigo-200/50 flex items-center gap-1.5">
                  <ArrowUpRight size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span className="font-bold">+15%</span>
                </div>
              </div>
              
              {/* Enhanced SVG Chart */}
              <div className="relative h-40 sm:h-44 md:h-52 w-full mb-3 sm:mb-4">
                <svg viewBox="0 0 400 150" className="w-full h-full">
                  <defs>
                    <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#615FFF" stopOpacity="0.25"/>
                      <stop offset="50%" stopColor="#818cf8" stopOpacity="0.15"/>
                      <stop offset="100%" stopColor="#615FFF" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="productivityLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#615FFF"/>
                      <stop offset="50%" stopColor="#818cf8"/>
                      <stop offset="100%" stopColor="#615FFF"/>
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  <g opacity="0.1">
                    <line x1="0" y1="30" x2="400" y2="30" stroke="#615FFF" strokeWidth="1"/>
                    <line x1="0" y1="60" x2="400" y2="60" stroke="#615FFF" strokeWidth="1"/>
                    <line x1="0" y1="90" x2="400" y2="90" stroke="#615FFF" strokeWidth="1"/>
                    <line x1="0" y1="120" x2="400" y2="120" stroke="#615FFF" strokeWidth="1"/>
                  </g>
                  {/* Area fill */}
                  <path 
                    d="M0,120 C40,110 80,115 120,80 C160,45 200,90 240,110 C280,130 320,50 360,40 L400,30 V150 H0 Z" 
                    fill="url(#productivityGradient)" 
                  />
                  {/* Main line */}
                  <path 
                    d="M0,120 C40,110 80,115 120,80 C160,45 200,90 240,110 C280,130 320,50 360,40 L400,30" 
                    fill="none" 
                    stroke="url(#productivityLine)" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Data points */}
                  {[
                    { x: 0, y: 120 },
                    { x: 57, y: 110 },
                    { x: 114, y: 80 },
                    { x: 171, y: 45 },
                    { x: 228, y: 90 },
                    { x: 285, y: 110 },
                    { x: 342, y: 50 },
                    { x: 400, y: 30 }
                  ].map((point, i) => (
                    <g key={i}>
                      <circle cx={point.x} cy={point.y} r="5" fill="white" stroke="#615FFF" strokeWidth="2.5"/>
                      <circle cx={point.x} cy={point.y} r="2.5" fill="#615FFF"/>
                    </g>
                  ))}
                </svg>
              </div>
              
              {/* Enhanced day labels */}
              <div className="flex justify-between mt-2 sm:mt-3 text-[9px] sm:text-[10px] text-gray-500 font-semibold uppercase tracking-wider px-1 sm:px-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <span key={day} className={i === 6 ? 'text-[#615FFF]' : ''}>{day}</span>
                ))}
              </div>
              
              {/* Summary Stats */}
              <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-200/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center border border-indigo-100/50 shadow-sm">
                    <svg className="w-5 h-5 text-[#615FFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Peak Day</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">Thursday</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <div className="text-right">
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Avg Efficiency</p>
                    <p className="text-base sm:text-lg font-bold text-[#615FFF]">72%</p>
                  </div>
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center border border-indigo-100/50 shadow-sm">
                    <svg className="w-5 h-5 text-[#615FFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming & Alerts */}
          <div className="bg-gradient-to-br from-white to-indigo-50/20 p-5 sm:p-6 md:p-8 rounded-3xl sm:rounded-[40px] shadow-lg hover:shadow-xl transition-all duration-300 border border-indigo-100/50 group relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-100/20 rounded-full blur-xl"></div>
            
            <div className="relative z-10">
             <div className="flex justify-between items-center mb-4 sm:mb-5 md:mb-6 gap-4">
               <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg shadow-sm border border-indigo-200/50">
                      <Calendar size={14} className="sm:w-4 sm:h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Upcoming & Alerts</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Your day at a glance</p>
               </div>
             </div>

             <div className="space-y-3 sm:space-y-4 md:space-y-5">
                {/* Active Alert Item */}
                <div className="group/item relative bg-gradient-to-br from-[#F4F5FF] via-indigo-50/80 to-purple-50/50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-indigo-200/50 overflow-hidden transition-all hover:shadow-xl hover:border-indigo-300 hover:scale-[1.01]">
                  {/* Animated left border */}
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#545BE8] via-indigo-500 to-purple-500 rounded-l-2xl sm:rounded-l-3xl"></div>
                  
                  {/* Pulse indicator */}
                  <div className="absolute top-3 right-3 w-2 h-2 bg-[#545BE8] rounded-full animate-pulse shadow-lg shadow-indigo-400/50"></div>
                  
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-[#545BE8] shadow-md border border-indigo-200/50 shrink-0 group-hover/item:scale-110 transition-transform">
                      <Video size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5 gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">Team Sync Started</h4>
                        <span className="bg-gradient-to-r from-[#EBEBFF] to-indigo-100 text-[#545BE8] text-[8px] sm:text-[9px] font-bold px-2 sm:px-2.5 py-1 rounded-full uppercase shrink-0 shadow-sm border border-indigo-200/50">Now</span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-gray-600 font-medium mb-3 sm:mb-4">Microsoft Teams · General Channel</p>
                      
                      <div className="flex gap-2 sm:gap-3 flex-wrap">
                        <button className="bg-gradient-to-r from-[#545BE8] to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-[10px] sm:text-[11px] font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-100">
                          Join Meeting
                        </button>
                        <button className="text-gray-500 hover:text-gray-700 text-[10px] sm:text-[11px] font-medium px-3 py-2 sm:py-2.5 hover:bg-gray-100 rounded-lg transition-all">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Standard Schedule Item */}
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl group cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/30 transition-all duration-200 border border-transparent hover:border-indigo-100/50">
                  <div className="flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 group-hover:from-indigo-50 group-hover:to-purple-50 transition-all duration-200 shadow-sm shrink-0 border border-gray-200/50 group-hover:border-indigo-200/50">
                     <span className="text-[8px] sm:text-[9px] font-semibold text-gray-500 uppercase">Oct</span>
                     <span className="text-base sm:text-lg font-semibold text-gray-800 group-hover:text-indigo-700">24</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-[#545BE8] transition-colors truncate">Quarterly Review</h4>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-0.5">Outlook · 10m ago</p>
                  </div>
                  
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full shrink-0 shadow-sm"></div>
                </div>
                
                {/* Another Standard Item Placeholder */}
                 <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl group cursor-pointer opacity-60 hover:opacity-100 hover:bg-gray-50/50 transition-all duration-200 border border-transparent hover:border-gray-200/50">
                  <div className="flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 shadow-sm shrink-0 border border-gray-200/50">
                     <span className="text-[8px] sm:text-[9px] font-semibold text-gray-400 uppercase">Oct</span>
                     <span className="text-base sm:text-lg font-semibold text-gray-700">24</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-700 truncate">Project Loop Specs</h4>
                    <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium mt-0.5">Later today</p>
                  </div>
                </div>

             </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}