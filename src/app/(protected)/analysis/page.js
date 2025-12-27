'use client';

import React from 'react';
import { 
  Download, 
  Plus, 
  MoreHorizontal, 
  Zap,
  MoveRight,
  TrendingUp
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    // Background made slightly deeper to help white cards stand out
    <div className="min-h-screen bg-[#F1F5F9] font-sans text-slate-900 p-4 sm:p-6 md:p-8 lg:p-12">
      
      <main className="max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 md:mb-8 gap-4 sm:gap-6">
          <div className="flex-1">
            <p className="text-indigo-500 text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-2">Analytics Dashboard</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-2 leading-tight">
              Analytics
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-500 font-medium">{dateString}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-white border border-slate-200 rounded-xl sm:rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 text-slate-700 font-bold text-xs sm:text-sm shadow-sm hover:shadow-md">
              <Download size={16} className="sm:w-5 sm:h-5" />
              <span className="whitespace-nowrap">Export Report</span>
            </button>
            <button className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-[#111827] hover:bg-black text-white rounded-xl sm:rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-xs sm:text-sm shadow-lg shadow-slate-900/20 hover:shadow-xl hover:scale-105 active:scale-95">
              <Plus size={16} className="sm:w-5 sm:h-5" />
              <span className="whitespace-nowrap">New Dashboard</span>
            </button>
          </div>
        </header>

        {/* Top Grid Section */}
        <div className="grid grid-cols-12 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          
          {/* Left Large Column (Team Overview) */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-slate-100 h-full hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.12)] transition-shadow duration-300">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 md:mb-8 gap-3">
                <div>
                   <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                     <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Team Overview</h2>
                     <span className="px-2.5 sm:px-3 py-1 bg-[#DCFCE7] text-[#15803D] text-[10px] sm:text-[11px] font-extrabold tracking-wider rounded-full uppercase w-fit">Live Data</span>
                   </div>
                </div>
              </div>

              {/* Inner Chart Card */}
              <div className="bg-[#F8FAFC] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 relative border border-slate-50">
                 <div className="flex flex-col md:flex-row justify-between items-start mb-4 sm:mb-6 md:mb-8 gap-4 sm:gap-6 md:gap-8">
                    <div className="flex-1">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-600 mb-3 sm:mb-4 md:mb-5 uppercase tracking-wide">Team Focus Efficiency</h3>
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8 md:gap-12">
                           <div>
                              <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 mb-1 sm:mb-2 tracking-tighter">89%</div>
                              <div className="text-xs sm:text-sm font-bold text-[#16A34A] flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg w-fit">
                                 <TrendingUp size={14} className="sm:w-4 sm:h-4" strokeWidth={3} /> <span className="whitespace-nowrap">+4.2% this week</span>
                              </div>
                           </div>
                           <div className="pb-1">
                              <div className="text-xl sm:text-2xl font-bold text-slate-400 mb-1">12%</div>
                              <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wide">Risk Level</div>
                           </div>
                        </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 bg-white px-3 sm:px-4 py-2 rounded-xl shadow-sm border border-slate-100 w-full sm:w-auto">
                       <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">
                          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#5043F3] ring-2 sm:ring-4 ring-[#5043F3]/20"></span> Efficiency
                       </div>
                       <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">
                          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#EF4444] ring-2 sm:ring-4 ring-[#EF4444]/20"></span> Burnout
                       </div>
                    </div>
                 </div>

                 {/* SVG Chart Area */}
                 <div className="h-40 sm:h-48 md:h-56 w-full mt-3 sm:mt-4">
                   <svg viewBox="0 0 800 200" className="w-full h-full overflow-visible">
                     <defs>
                       <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="0%" stopColor="#5043F3" stopOpacity="0.15"/>
                         <stop offset="100%" stopColor="#5043F3" stopOpacity="0"/>
                       </linearGradient>
                       <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                          <feMerge>
                             <feMergeNode in="coloredBlur" />
                             <feMergeNode in="SourceGraphic" />
                          </feMerge>
                       </filter>
                     </defs>
                     
                     {/* Dashed Red Line (Burnout) - More variable */}
                     <path 
                       d="M0,145 C80,135 120,150 160,140 C200,130 240,125 300,135 C360,145 400,130 480,140 C560,150 600,135 680,125 C720,120 760,130 800,115" 
                       fill="none" 
                       stroke="#EF4444" 
                       strokeWidth="2.5" 
                       strokeDasharray="8 8"
                       strokeLinecap="round"
                       opacity="0.6"
                     />

                     {/* Solid Purple Line (Efficiency) - More variable */}
                     <path 
                       d="M0,130 C60,100 100,125 150,85 C200,45 250,75 300,60 C350,45 400,90 450,70 C500,50 550,95 600,80 C650,65 700,100 750,85 C780,75 800,65 800,55" 
                       fill="none" 
                       stroke="#5043F3" 
                       strokeWidth="5" 
                       strokeLinecap="round"
                       filter="url(#glow)"
                     />
                      {/* Fill under purple line */}
                      <path 
                       d="M0,130 C60,100 100,125 150,85 C200,45 250,75 300,60 C350,45 400,90 450,70 C500,50 550,95 600,80 C650,65 700,100 750,85 C780,75 800,65 800,55 L800,220 L0,220 Z" 
                       fill="url(#chartGradient)" 
                     />
                     
                     {/* Data points on efficiency line */}
                     <circle cx="150" cy="85" r="4" fill="#5043F3" className="drop-shadow-sm"/>
                     <circle cx="300" cy="60" r="4" fill="#5043F3" className="drop-shadow-sm"/>
                     <circle cx="450" cy="70" r="4" fill="#5043F3" className="drop-shadow-sm"/>
                     <circle cx="600" cy="80" r="4" fill="#5043F3" className="drop-shadow-sm"/>
                     <circle cx="750" cy="85" r="4" fill="#5043F3" className="drop-shadow-sm"/>
                     
                     {/* X Axis Labels */}
                     <g className="text-[11px] font-bold fill-slate-400 tracking-wider" transform="translate(0, 230)">
                       <text x="20">MON</text>
                       <text x="150">TUE</text>
                       <text x="280">WED</text>
                       <text x="410">THU</text>
                       <text x="540">FRI</text>
                       <text x="670">SAT</text>
                       <text x="780">SUN</text>
                     </g>
                   </svg>
                 </div>
              </div>
            </div>
          </div>

          {/* Right Column Stack */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 sm:gap-6 lg:gap-8">
            
            {/* Peak Hours */}
            <div className="bg-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-slate-100 hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.12)] transition-shadow duration-300">
               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Peak Hours</h3>
                  <span className="text-[10px] sm:text-xs font-bold text-[#5043F3] bg-[#EEF2FF] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg tracking-wide w-fit">WEEKLY AVG</span>
               </div>
               
               {/* Heatmap */}
               <div className="grid grid-cols-8 gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] text-slate-400 font-bold">
                  {/* Header Row */}
                  <div></div>
                  <div className="text-center">M</div><div className="text-center">T</div><div className="text-center">W</div>
                  <div className="text-center">T</div><div className="text-center">F</div><div className="text-center">S</div><div className="text-center">S</div>

                  {/* 9AM */}
                  <div className="flex items-center whitespace-nowrap">9 AM</div>
                  <Cell c={1} /><Cell c={2} /><Cell c={3} /><Cell c={2} /><Cell c={1} /><Cell c={0} /><Cell c={0} />

                   {/* 12PM */}
                  <div className="flex items-center whitespace-nowrap">12 PM</div>
                  <Cell c={3} /><Cell c={4} /><Cell c={5} /><Cell c={5} /><Cell c={4} /><Cell c={2} /><Cell c={1} />

                   {/* 3PM */}
                  <div className="flex items-center whitespace-nowrap">3 PM</div>
                  <Cell c={3} /><Cell c={4} /><Cell c={5} /><Cell c={4} /><Cell c={3} /><Cell c={2} /><Cell c={1} />

                   {/* 6PM */}
                  <div className="flex items-center whitespace-nowrap">6 PM</div>
                  <Cell c={1} /><Cell c={2} /><Cell c={2} /><Cell c={2} /><Cell c={1} /><Cell c={0} /><Cell c={0} />
               </div>
            </div>

            {/* Team Velocity */}
            <div className="bg-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-slate-100 flex-1 hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.12)] transition-shadow duration-300">
               <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6 md:mb-8 tracking-tight">Team Velocity</h3>
               <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  <VelocityBar label="Engineering" points={124} width="85%" />
                  <VelocityBar label="Design" points={86} width="60%" color="bg-[#A78BFA]" />
                  <VelocityBar label="Marketing" points={92} width="70%" color="bg-[#F472B6]" />
               </div>
            </div>
          </div>
        </div>

        {/* Bottom Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pl-2">
           <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 leading-tight">My Personal Insights</h2>
           <span className="px-2.5 sm:px-3 py-1 bg-[#FAF5FF] text-[#9333EA] text-[9px] sm:text-[10px] font-extrabold tracking-wider rounded-full uppercase border border-[#E9D5FF] w-fit">Private</span>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
           
           {/* Daily Rhythm (Wide) */}
           <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-slate-100 hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.12)] transition-shadow duration-300">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 md:mb-8 gap-3">
                 <h3 className="text-base sm:text-lg font-bold text-slate-700 tracking-tight">My Daily Rhythm</h3>
                 <div className="flex gap-4 sm:gap-6 text-[10px] sm:text-xs font-bold text-slate-600">
                    <div className="flex items-center gap-1.5 sm:gap-2"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#5043F3]"></div>Deep Work</div>
                    <div className="flex items-center gap-1.5 sm:gap-2"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FACC15]"></div>Meeting</div>
                 </div>
              </div>
              
              <div className="relative pt-6 sm:pt-8 pb-3 sm:pb-4 mb-4 sm:mb-6">
                 {/* Timeline Bar */}
                 <div className="h-12 sm:h-14 w-full rounded-xl sm:rounded-2xl overflow-hidden flex text-[9px] sm:text-[10px] md:text-[11px] font-extrabold text-white tracking-wider relative shadow-inner">
                    <div className="w-[28%] bg-[#5043F3] flex items-center justify-center">FOCUS</div>
                    <div className="w-[15%] bg-[#FACC15] text-slate-900 flex items-center justify-center">SYNC</div>
                    <div className="w-[10%] bg-slate-50"></div> {/* Gap */}
                    <div className="w-[25%] bg-[#5043F3] flex items-center justify-center">DEV</div>
                    <div className="w-[22%] bg-[#FACC15] text-slate-900 flex items-center justify-center">REVIEW</div>
                 </div>

                 {/* Time Labels */}
                 <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 font-bold mt-3 sm:mt-4 px-1">
                    <span>9:00</span>
                    <span>11:00</span>
                    <span>13:00</span>
                    <span className="text-[#EF4444]">15:00</span>
                    <span>17:00</span>
                 </div>

                 {/* Now Indicator */}
                 <div className="absolute top-0 bottom-6 sm:bottom-8 left-[60%] w-[2px] bg-[#EF4444] z-10 flex flex-col items-center pointer-events-none">
                    <div className="bg-[#EF4444] text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md mb-1 shadow-md">Now</div>
                    <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#EF4444] border-2 border-white shadow-sm translate-y-[44px] sm:translate-y-[52px]"></div>
                 </div>
              </div>

              {/* Insights/Stats Section */}
              <div className="border-t border-slate-200 pt-4 sm:pt-6 mt-4 sm:mt-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Peak Productivity Window */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-indigo-100/60 relative overflow-hidden group hover:shadow-md transition-all">
                       <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-indigo-200/20 rounded-bl-full blur-xl"></div>
                       <div className="relative z-10">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                             <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#5043F3]"></div>
                             <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">Peak Window</div>
                          </div>
                          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-0.5 sm:mb-1">10:30 AM</div>
                          <div className="text-[10px] sm:text-xs font-semibold text-indigo-600">Most Productive</div>
                       </div>
                    </div>
                    
                    {/* Meeting Efficiency */}
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-amber-100/60 relative overflow-hidden group hover:shadow-md transition-all">
                       <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-amber-200/20 rounded-bl-full blur-xl"></div>
                       <div className="relative z-10">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                             <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#FACC15]"></div>
                             <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">Meeting Ratio</div>
                          </div>
                          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-0.5 sm:mb-1">34%</div>
                          <div className="text-[10px] sm:text-xs font-semibold text-amber-600">Optimal Range</div>
                       </div>
                    </div>
                    
                    {/* Focus Blocks */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-100/60 relative overflow-hidden group hover:shadow-md transition-all">
                       <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-blue-200/20 rounded-bl-full blur-xl"></div>
                       <div className="relative z-10">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                             <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-blue-600"></div>
                             <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">Focus Blocks</div>
                          </div>
                          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-0.5 sm:mb-1">2</div>
                          <div className="text-[10px] sm:text-xs font-semibold text-blue-600">Deep Work Sessions</div>
                       </div>
                    </div>
                    
                    {/* Context Switching */}
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200/60 relative overflow-hidden group hover:shadow-md transition-all">
                       <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-slate-200/20 rounded-bl-full blur-xl"></div>
                       <div className="relative z-10">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                             <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-slate-400"></div>
                             <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">Switches</div>
                          </div>
                          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-0.5 sm:mb-1">3</div>
                          <div className="text-[10px] sm:text-xs font-semibold text-slate-600">Low Interruption</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Balance Score (Square) */}
           <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-gradient-to-br from-green-50 via-emerald-50/50 to-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 md:p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-green-100/50 hover:shadow-[0_25px_60px_-12px_rgba(16,185,129,0.15)] transition-all duration-300 relative overflow-hidden group">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 rounded-bl-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-200/15 rounded-tr-full blur-xl"></div>
              
              <div className="relative z-10">
                 {/* Header */}
                 <div className="mb-3 sm:mb-4">
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mb-1">Balance Score</h3>
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Work-Life Harmony</p>
                 </div>
                 
                 {/* Ring Chart */}
                 <div className="relative w-full aspect-square max-w-[160px] sm:max-w-[180px] md:max-w-[200px] mx-auto mb-3 sm:mb-4">
                    <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                      <defs>
                        <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="50%" stopColor="#22C55E" />
                          <stop offset="100%" stopColor="#34D399" />
                        </linearGradient>
                        <filter id="balanceGlow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      {/* Background circle (full ring) */}
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                      {/* Progress arc - 92% of full circle (360 degrees) */}
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="url(#balanceGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 85 * 0.92} ${2 * Math.PI * 85}`}
                        filter="url(#balanceGlow)"
                        className="drop-shadow-lg"
                      />
                    </svg>
                    
                    {/* Center Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                       <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tighter mb-1">92</div>
                       <div className="text-[10px] sm:text-xs font-extrabold text-[#10B981] uppercase tracking-wider bg-green-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-green-200/50">Excellent</div>
                    </div>
                 </div>
                 
                 {/* Stats Grid */}
                 <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
                    {/* Overtime Indicator */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-3.5 border-2 border-green-200/50 shadow-sm hover:shadow-md transition-all group">
                       <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                             <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5">Overtime This Week</div>
                             <div className="text-lg sm:text-xl font-extrabold text-slate-900">2.5h</div>
                          </div>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center border-2 border-green-200/50 shrink-0">
                             <div className="text-[10px] sm:text-xs font-extrabold text-green-600">-18%</div>
                          </div>
                       </div>
                       <div className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] font-semibold text-green-600">Below company avg</div>
                    </div>
                    
                    {/* Stress Level */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-3.5 border-2 border-green-200/50 shadow-sm hover:shadow-md transition-all group">
                       <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                             <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5">Stress Indicator</div>
                             <div className="text-lg sm:text-xl font-extrabold text-slate-900">Low</div>
                          </div>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center border-2 border-green-200/50 shrink-0">
                             <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                             </svg>
                          </div>
                       </div>
                       <div className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] font-semibold text-green-600">Healthy balance maintained</div>
                    </div>
                 </div>
              </div>
           </div>

           {/* AI Insight (Square) */}
           <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-gradient-to-br from-[#F5F3FF] via-[#EEF2FF] to-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 md:p-6 border-2 border-[#C7D2FE] shadow-[0_20px_50px_-12px_rgba(79,70,229,0.25)] hover:shadow-[0_25px_60px_-12px_rgba(79,70,229,0.35)] transition-all duration-300 relative overflow-hidden group">
              {/* Decorative dot top right */}
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-purple-300 rounded-full opacity-60"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                 {/* Header */}
                 <div className="mb-3 sm:mb-4 md:mb-5">
                    <div className="flex items-center gap-2 sm:gap-3">
                       <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-[#5043F3] rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-md">
                          <Zap size={16} className="sm:w-5 sm:h-5" fill="white" strokeWidth={2.5} />
                       </div>
                       <div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Thryv AI Insight</h3>
                          <p className="text-[9px] sm:text-[10px] font-semibold text-[#5043F3] uppercase tracking-widest mt-0.5">PERSONALIZED ANALYSIS</p>
                       </div>
                    </div>
                 </div>
                 
                 {/* Central Graphic with Concentric Dashed Circles */}
                 <div className="relative w-full flex items-center justify-center mb-3 sm:mb-4 md:mb-5" style={{ minHeight: '140px' }}>
                    <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40">
                       {/* Outer dashed circle */}
                       <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 160">
                          <circle
                             cx="80"
                             cy="80"
                             r="70"
                             fill="none"
                             stroke="#C7D2FE"
                             strokeWidth="2"
                             strokeDasharray="4 4"
                             opacity="0.6"
                          />
                          {/* Dots on outer circle */}
                          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                             const rad = (angle * Math.PI) / 180;
                             const x = 80 + 70 * Math.cos(rad);
                             const y = 80 + 70 * Math.sin(rad);
                             return (
                                <circle key={i} cx={x} cy={y} r="2" fill="#A5B4FC" opacity="0.7" />
                             );
                          })}
                       </svg>
                       
                       {/* Middle dashed circle */}
                       <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 160">
                          <circle
                             cx="80"
                             cy="80"
                             r="50"
                             fill="none"
                             stroke="#C7D2FE"
                             strokeWidth="2"
                             strokeDasharray="3 3"
                             opacity="0.5"
                          />
                          {/* Dots on middle circle */}
                          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                             const rad = (angle * Math.PI) / 180;
                             const x = 80 + 50 * Math.cos(rad);
                             const y = 80 + 50 * Math.sin(rad);
                             return (
                                <circle key={i} cx={x} cy={y} r="1.5" fill="#A5B4FC" opacity="0.6" />
                             );
                          })}
                       </svg>
                       
                       {/* Inner dashed circle */}
                       <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 160">
                          <circle
                             cx="80"
                             cy="80"
                             r="30"
                             fill="none"
                             stroke="#C7D2FE"
                             strokeWidth="2"
                             strokeDasharray="2 2"
                             opacity="0.4"
                          />
                       </svg>
                       
                       {/* Center icon */}
                       <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-[#5043F3] rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-lg">
                             <Zap size={18} className="sm:w-5 sm:h-5 md:w-[22px] md:h-[22px]" fill="white" strokeWidth={2.5} />
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 {/* Insight Text Card */}
                 <div className="flex-1 flex flex-col">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm border border-gray-100 mb-3 sm:mb-4">
                       <p className="text-xs sm:text-sm font-normal text-slate-800 leading-relaxed mb-2">
                          You tend to hit deep focus states faster after <span className="font-semibold text-[#5043F3] bg-purple-100 px-1.5 sm:px-2 py-0.5 rounded">10:30</span> <span className="font-semibold text-[#5043F3] bg-purple-100 px-1.5 sm:px-2 py-0.5 rounded">AM</span>.
                       </p>
                       <p className="text-xs sm:text-sm font-normal text-slate-800 leading-relaxed">
                          Consider moving your daily stand-up to <span className="font-semibold text-[#5043F3] bg-purple-100 px-1.5 sm:px-2 py-0.5 rounded">9:30 AM</span> to free up this block.
                       </p>
                    </div>
                    
                    {/* Action Button */}
                    <button className="w-full px-4 sm:px-5 py-2.5 sm:py-3 bg-[#5043F3] hover:bg-[#4337D9] text-white rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all uppercase tracking-wider shadow-md hover:shadow-lg">
                       <span>VIEW FULL ANALYSIS</span>
                       <MoveRight size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
                    </button>
                 </div>
              </div>
           </div>

      </div>
      </main>
    </div>
  );
}

/* --- Helper Components --- */

function Cell({ c }) {
  // c = 0 (empty) to 5 (darkest)
  const colors = [
     'bg-slate-100', // 0
     'bg-[#E0E7FF]', // 1
     'bg-[#C7D2FE]', // 2
     'bg-[#818CF8]', // 3
     'bg-[#6366F1]', // 4
     'bg-[#4338CA]', // 5
  ];
  return <div className={`w-full h-8 rounded-lg ${colors[c]} transition-all duration-300 hover:scale-110`}></div>;
}

function VelocityBar({ label, points, width, color = 'bg-[#5043F3]' }) {
   return (
      <div className="group cursor-default">
         <div className="flex justify-between mb-1.5 sm:mb-2 text-[10px] sm:text-xs font-bold text-slate-600 tracking-wide">
            <span>{label}</span>
            <span className="text-slate-900">{points} pts</span>
         </div>
         <div className="h-2.5 sm:h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full relative group-hover:brightness-110 transition-all duration-500 ease-out`} style={{ width }}>
               {/* Shine effect */}
               <div className="absolute top-0 bottom-0 right-0 w-full bg-gradient-to-l from-white/20 to-transparent"></div>
            </div>
         </div>
      </div>
   )
}