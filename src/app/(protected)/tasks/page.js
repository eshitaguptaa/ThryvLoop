'use client';

import { useState } from 'react';

export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [quickCapture, setQuickCapture] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const tasks = {
    'todaysFocus': [
      {
        id: 1,
        category: 'Finance',
        categoryColor: 'bg-purple-100 text-purple-700',
        title: 'Finalize Q3 Budget Deck',
        assignedUsers: [
          { name: 'Alex', avatar: 'https://i.pravatar.cc/150?u=alex' },
          { name: 'Sarah', avatar: 'https://i.pravatar.cc/150?u=sarah' }
        ],
        dueTime: 'Due 2:00 PM',
        priority: { level: 'High Priority', color: 'bg-red-500' }
      },
      {
        id: 2,
        category: 'Hiring',
        categoryColor: 'bg-blue-100 text-blue-700',
        title: 'Review Intern Candidates',
        assignedUsers: [],
        dueTime: '5:00 PM',
        priority: { level: 'Medium Priority', color: 'bg-orange-500' }
      }
    ],
    'inProgress': [
      {
        id: 3,
        category: 'Dev',
        categoryColor: 'bg-orange-100 text-orange-700',
        title: 'API Integration w/ Vendor',
        assignedUsers: [
          { name: 'Mike', avatar: 'https://i.pravatar.cc/150?u=mike' }
        ],
        dueTime: 'Thu',
        priority: { level: 'High Priority', color: 'bg-red-500' }
      },
      {
        id: 4,
        category: 'Legal',
        categoryColor: 'bg-green-100 text-green-700',
        title: 'Update Compliance Docs',
        assignedUsers: [],
        priority: { level: 'Low Priority', color: 'bg-gray-400' }
      }
    ],
    'backlog': [
      {
        id: 5,
        category: 'Finance',
        categoryColor: 'bg-purple-100 text-purple-700',
        title: 'Research Competitor UI',
        assignedUsers: [],
        priority: null
      },
      {
        id: 6,
        category: 'Project',
        categoryColor: 'bg-blue-100 text-blue-700',
        title: 'Schedule Team Lunch',
        assignedUsers: [],
        priority: null
      }
    ]
  };

  const highPriorityCount = tasks.todaysFocus.filter(t => t.priority?.level === 'High Priority').length + 
                            tasks.inProgress.filter(t => t.priority?.level === 'High Priority').length;

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#1A1A1A] px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6 md:px-8 md:pt-10 md:pb-8 lg:px-12 lg:pt-12 lg:pb-10 font-[var(--font-poppins)]">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-8">
          {/* Top Row */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 gap-4">
            {/* Left Side */}
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                My Tasks
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                You have <span className="text-red-500 font-bold">{highPriorityCount} high-priority</span> tasks pending.
              </p>
              
              {/* Quick Capture */}
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Quick capture"
                  value={quickCapture}
                  onChange={(e) => setQuickCapture(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-gray-700 shadow-sm hover:shadow-md transition-shadow"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Right Side */}
            <div className="flex flex-col gap-4 w-full lg:w-auto">
              {/* View and New Task */}
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium hidden sm:inline">View</span>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-xl transition-all ${
                      viewMode === 'list' 
                        ? 'bg-gray-200 text-gray-900 shadow-sm' 
                        : 'bg-white text-gray-400 hover:text-gray-600 border-2 border-gray-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-xl transition-all ${
                      viewMode === 'grid' 
                        ? 'bg-gray-200 text-gray-900 shadow-sm' 
                        : 'bg-white text-gray-400 hover:text-gray-600 border-2 border-gray-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>
                
                <button className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-all flex items-center gap-1.5 sm:gap-2 shadow-lg hover:shadow-xl text-xs sm:text-sm whitespace-nowrap">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Task</span>
                </button>
              </div>
              
              {/* Search and Filter */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative flex-1 min-w-0">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-xs sm:text-sm text-gray-700 shadow-sm hover:shadow-md transition-shadow"
                  />
                </div>
                
                <button className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-1.5 sm:gap-2 text-gray-700 font-medium shadow-sm hover:shadow-md text-xs sm:text-sm whitespace-nowrap">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="hidden sm:inline">Filter</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Task Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Today's Focus Column */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-purple-500 rounded-full shrink-0 shadow-sm"></div>
                <h2 className="text-base font-bold text-gray-900">Today's Focus</h2>
              </div>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              {tasks.todaysFocus.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shrink-0 shadow-sm"></div>
                <h2 className="text-base font-bold text-gray-900">In Progress</h2>
              </div>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              {tasks.inProgress.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>

          {/* Backlog Column */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-gray-300 rounded-full shrink-0 shadow-sm"></div>
                <h2 className="text-base font-bold text-gray-900">Backlog</h2>
              </div>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              {tasks.backlog.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function TaskCard({ task }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.2)] transition-all duration-300 border-2 border-gray-100/60 relative group">
      {/* Checkmark Icon */}
      <button className="absolute top-4 right-4 w-5 h-5 flex items-center justify-center text-gray-300 hover:text-gray-400 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Category Badge */}
      <div className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold mb-3 ${task.categoryColor}`}>
        {task.category}
      </div>

      {/* Task Title */}
      <h3 className="text-base font-bold text-gray-900 mb-3 pr-8">
        {task.title}
      </h3>

      {/* Priority Indicator (Vertical Bar) */}
      {task.priority && (
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-1 h-4 ${task.priority.color} rounded-full`}></div>
          <span className="text-xs font-medium text-gray-700">{task.priority.level}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        {/* Left Side - Due Time */}
        {task.dueTime && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{task.dueTime}</span>
          </div>
        )}
        
        {/* Right Side - Assigned Users */}
        {task.assignedUsers && task.assignedUsers.length > 0 && (
          <div className="flex items-center -space-x-2">
            {task.assignedUsers.map((user, index) => (
              <div
                key={index}
                className="w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-gray-200"
                title={user.name}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
