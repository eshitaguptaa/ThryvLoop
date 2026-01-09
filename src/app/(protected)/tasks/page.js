'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Calendar, Clock, User, Edit2, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';

// Category colors mapping
const categoryColors = {
  'Finance': 'bg-purple-100 text-purple-700',
  'Hiring': 'bg-blue-100 text-blue-700',
  'Dev': 'bg-orange-100 text-orange-700',
  'Legal': 'bg-green-100 text-green-700',
  'Project': 'bg-blue-100 text-blue-700',
  'Marketing': 'bg-pink-100 text-pink-700',
  'Design': 'bg-yellow-100 text-yellow-700',
  'Other': 'bg-gray-100 text-gray-700',
};

// Priority options
const priorityOptions = [
  { level: 'High Priority', color: 'bg-red-500', label: 'High' },
  { level: 'Medium Priority', color: 'bg-orange-500', label: 'Medium' },
  { level: 'Low Priority', color: 'bg-gray-400', label: 'Low' },
];

// Default tasks
const defaultTasks = {
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
      dueDate: new Date().toISOString(),
      priority: { level: 'High Priority', color: 'bg-red-500' },
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      category: 'Hiring',
      categoryColor: 'bg-blue-100 text-blue-700',
      title: 'Review Intern Candidates',
      assignedUsers: [],
      dueTime: '5:00 PM',
      dueDate: new Date().toISOString(),
      priority: { level: 'Medium Priority', color: 'bg-orange-500' },
      createdAt: new Date().toISOString(),
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
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      priority: { level: 'High Priority', color: 'bg-red-500' },
      createdAt: new Date().toISOString(),
    },
    {
      id: 4,
      category: 'Legal',
      categoryColor: 'bg-green-100 text-green-700',
      title: 'Update Compliance Docs',
      assignedUsers: [],
      dueDate: new Date(Date.now() + 172800000).toISOString(),
      priority: { level: 'Low Priority', color: 'bg-gray-400' },
      createdAt: new Date().toISOString(),
    }
  ],
  'backlog': [
    {
      id: 5,
      category: 'Finance',
      categoryColor: 'bg-purple-100 text-purple-700',
      title: 'Research Competitor UI',
      assignedUsers: [],
      priority: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 6,
      category: 'Project',
      categoryColor: 'bg-blue-100 text-blue-700',
      title: 'Schedule Team Lunch',
      assignedUsers: [],
      priority: null,
      createdAt: new Date().toISOString(),
    }
  ]
};

export default function TasksPage() {
  const [tasks, setTasks] = useState(defaultTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickCapture, setQuickCapture] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Load tasks from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTasks = localStorage.getItem('thryv-tasks');
      if (savedTasks) {
        try {
          setTasks(JSON.parse(savedTasks));
        } catch (e) {
          console.error('Error loading tasks:', e);
        }
      }
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('thryv-tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Generate unique ID
  const generateId = () => {
    return Date.now() + Math.random();
  };

  // Format due time
  const formatDueTime = (dueDate) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Due ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays === -1) {
      return 'Yesterday';
    } else if (diffDays < 7 && diffDays > -7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Add task
  const addTask = (taskData) => {
    const newTask = {
      id: generateId(),
      category: taskData.category || 'Other',
      categoryColor: categoryColors[taskData.category] || categoryColors['Other'],
      title: taskData.title,
      assignedUsers: taskData.assignedUsers || [],
      dueTime: taskData.dueDate ? formatDueTime(taskData.dueDate) : null,
      dueDate: taskData.dueDate || null,
      priority: taskData.priority || null,
      createdAt: new Date().toISOString(),
    };

    const column = taskData.column || 'backlog';
    setTasks(prev => ({
      ...prev,
      [column]: [...prev[column], newTask]
    }));
  };

  // Update task
  const updateTask = (taskId, updates) => {
    setTasks(prev => {
      const newTasks = { ...prev };
      Object.keys(newTasks).forEach(column => {
        const index = newTasks[column].findIndex(t => t.id === taskId);
        if (index !== -1) {
          const updatedTask = {
            ...newTasks[column][index],
            ...updates,
            categoryColor: categoryColors[updates.category] || newTasks[column][index].categoryColor,
            dueTime: updates.dueDate ? formatDueTime(updates.dueDate) : newTasks[column][index].dueTime,
          };
          newTasks[column][index] = updatedTask;
        }
      });
      return newTasks;
    });
  };

  // Delete task
  const deleteTask = (taskId) => {
    setTasks(prev => {
      const newTasks = { ...prev };
      Object.keys(newTasks).forEach(column => {
        newTasks[column] = newTasks[column].filter(t => t.id !== taskId);
      });
      return newTasks;
    });
  };

  // Move task between columns
  const moveTask = (taskId, fromColumn, toColumn) => {
    if (fromColumn === toColumn) return;

    setTasks(prev => {
      const task = prev[fromColumn].find(t => t.id === taskId);
      if (!task) return prev;

      return {
        ...prev,
        [fromColumn]: prev[fromColumn].filter(t => t.id !== taskId),
        [toColumn]: [...prev[toColumn], task]
      };
    });
  };

  // Complete task (move to completed or delete)
  const completeTask = (taskId) => {
    deleteTask(taskId);
  };

  // Handle quick capture
  const handleQuickCapture = (e) => {
    if (e.key === 'Enter' && quickCapture.trim()) {
      addTask({
        title: quickCapture.trim(),
        column: 'backlog',
      });
      setQuickCapture('');
    }
  };

  // Filter tasks
  const filterTasks = (taskList) => {
    let filtered = taskList;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(task => task.category === filterCategory);
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => {
        if (filterPriority === 'none') return !task.priority;
        return task.priority?.level === filterPriority;
      });
    }

    return filtered;
  };

  // Get all unique categories
  const categories = Array.from(new Set(
    Object.values(tasks).flat().map(t => t.category)
  ));

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
                  onKeyDown={handleQuickCapture}
                  className="w-full pl-4 pr-10 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-gray-700 shadow-sm hover:shadow-md transition-shadow"
                />
                <button
                  onClick={() => {
                    if (quickCapture.trim()) {
                      addTask({ title: quickCapture.trim(), column: 'backlog' });
                      setQuickCapture('');
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
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
                
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setIsModalOpen(true);
                  }}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-all flex items-center gap-1.5 sm:gap-2 shadow-lg hover:shadow-xl text-xs sm:text-sm whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                
                <div className="relative">
                  <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-1.5 sm:gap-2 text-gray-700 font-medium shadow-sm hover:shadow-md text-xs sm:text-sm whitespace-nowrap"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span className="hidden sm:inline">Filter</span>
                    {(filterCategory !== 'all' || filterPriority !== 'all') && (
                      <span className="ml-1 w-2 h-2 bg-orange-500 rounded-full"></span>
                    )}
                  </button>
                  
                  {showFilterMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4 z-50">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">Category</label>
                          <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">Priority</label>
                          <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="all">All Priorities</option>
                            <option value="High Priority">High Priority</option>
                            <option value="Medium Priority">Medium Priority</option>
                            <option value="Low Priority">Low Priority</option>
                            <option value="none">No Priority</option>
                          </select>
                        </div>
                        {(filterCategory !== 'all' || filterPriority !== 'all') && (
                          <button
                            onClick={() => {
                              setFilterCategory('all');
                              setFilterPriority('all');
                            }}
                            className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Task Columns - Grid View */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Today's Focus Column */}
            <TaskColumn
              title="Today's Focus"
              color="purple"
              columnKey="todaysFocus"
              tasks={filterTasks(tasks.todaysFocus)}
              onMoveTask={(taskId, toColumn) => moveTask(taskId, 'todaysFocus', toColumn)}
              onCompleteTask={completeTask}
              onEditTask={(task) => {
                setEditingTask({ ...task, column: 'todaysFocus' });
                setIsModalOpen(true);
              }}
              onDeleteTask={deleteTask}
              draggedTask={draggedTask}
              draggedFromColumn={draggedFromColumn}
              dragOverColumn={dragOverColumn}
              onDragStart={(task, fromColumn) => {
                setDraggedTask(task);
                setDraggedFromColumn(fromColumn);
              }}
              onDragEnd={() => {
                setDraggedTask(null);
                setDraggedFromColumn(null);
                setDragOverColumn(null);
              }}
              onDragOver={(column) => setDragOverColumn(column)}
              onDrop={(toColumn) => {
                if (draggedTask && draggedFromColumn && toColumn !== draggedFromColumn) {
                  moveTask(draggedTask.id, draggedFromColumn, toColumn);
                }
                setDraggedTask(null);
                setDraggedFromColumn(null);
                setDragOverColumn(null);
              }}
              viewMode={viewMode}
            />

            {/* In Progress Column */}
            <TaskColumn
              title="In Progress"
              color="orange"
              columnKey="inProgress"
              tasks={filterTasks(tasks.inProgress)}
              onMoveTask={(taskId, toColumn) => moveTask(taskId, 'inProgress', toColumn)}
              onCompleteTask={completeTask}
              onEditTask={(task) => {
                setEditingTask({ ...task, column: 'inProgress' });
                setIsModalOpen(true);
              }}
              onDeleteTask={deleteTask}
              draggedTask={draggedTask}
              draggedFromColumn={draggedFromColumn}
              dragOverColumn={dragOverColumn}
              onDragStart={(task, fromColumn) => {
                setDraggedTask(task);
                setDraggedFromColumn(fromColumn);
              }}
              onDragEnd={() => {
                setDraggedTask(null);
                setDraggedFromColumn(null);
                setDragOverColumn(null);
              }}
              onDragOver={(column) => setDragOverColumn(column)}
              onDrop={(toColumn) => {
                if (draggedTask && draggedFromColumn && toColumn !== draggedFromColumn) {
                  moveTask(draggedTask.id, draggedFromColumn, toColumn);
                }
                setDraggedTask(null);
                setDraggedFromColumn(null);
                setDragOverColumn(null);
              }}
              viewMode={viewMode}
            />

            {/* Backlog Column */}
            <TaskColumn
              title="Backlog"
              color="gray"
              columnKey="backlog"
              tasks={filterTasks(tasks.backlog)}
              onMoveTask={(taskId, toColumn) => moveTask(taskId, 'backlog', toColumn)}
              onCompleteTask={completeTask}
              onEditTask={(task) => {
                setEditingTask({ ...task, column: 'backlog' });
                setIsModalOpen(true);
              }}
              onDeleteTask={deleteTask}
              draggedTask={draggedTask}
              draggedFromColumn={draggedFromColumn}
              dragOverColumn={dragOverColumn}
              onDragStart={(task, fromColumn) => {
                setDraggedTask(task);
                setDraggedFromColumn(fromColumn);
              }}
              onDragEnd={() => {
                setDraggedTask(null);
                setDraggedFromColumn(null);
                setDragOverColumn(null);
              }}
              onDragOver={(column) => setDragOverColumn(column)}
              onDrop={(toColumn) => {
                if (draggedTask && draggedFromColumn && toColumn !== draggedFromColumn) {
                  moveTask(draggedTask.id, draggedFromColumn, toColumn);
                }
                setDraggedTask(null);
                setDraggedFromColumn(null);
                setDragOverColumn(null);
              }}
              viewMode={viewMode}
            />

          </div>
        ) : (
          /* List View */
          <div className="space-y-6">
            {/* All Tasks in List Format */}
            <div className="bg-white rounded-xl p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border-2 border-gray-100/60">
              <div className="space-y-4">
                {/* Today's Focus Tasks */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverColumn('todaysFocus');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggedTask && draggedFromColumn && 'todaysFocus' !== draggedFromColumn) {
                      moveTask(draggedTask.id, draggedFromColumn, 'todaysFocus');
                    }
                    setDraggedTask(null);
                    setDraggedFromColumn(null);
                    setDragOverColumn(null);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      if (dragOverColumn === 'todaysFocus') {
                        setDragOverColumn(null);
                      }
                    }
                  }}
                  className={`rounded-lg transition-all ${
                    dragOverColumn === 'todaysFocus' ? 'bg-blue-50 border-2 border-dashed border-blue-300 p-4' : 'p-0 border-2 border-transparent'
                  }`}
                >
                  {(filterTasks(tasks.todaysFocus).length > 0 || dragOverColumn === 'todaysFocus') && (
                    <>
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-2.5 h-2.5 bg-purple-500 rounded-full shrink-0 shadow-sm"></div>
                        <h3 className="text-base font-bold text-gray-900">Today's Focus</h3>
                        <span className="text-xs text-gray-500 font-medium">({filterTasks(tasks.todaysFocus).length})</span>
                      </div>
                      {filterTasks(tasks.todaysFocus).length > 0 ? (
                        <div className="space-y-3">
                          {filterTasks(tasks.todaysFocus).map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              currentColumn="todaysFocus"
                              onMoveTask={(taskId, toColumn) => moveTask(taskId, 'todaysFocus', toColumn)}
                              onCompleteTask={completeTask}
                              onEditTask={(task) => {
                                setEditingTask({ ...task, column: 'todaysFocus' });
                                setIsModalOpen(true);
                              }}
                              onDeleteTask={deleteTask}
                              onDragStart={(task, fromColumn) => {
                                setDraggedTask(task);
                                setDraggedFromColumn(fromColumn);
                              }}
                              onDragEnd={() => {
                                setDraggedTask(null);
                                setDraggedFromColumn(null);
                                setDragOverColumn(null);
                              }}
                              isDragging={draggedTask?.id === task.id}
                              viewMode={viewMode}
                            />
                          ))}
                        </div>
                      ) : (
                        dragOverColumn === 'todaysFocus' && (
                          <div className="text-center py-8 text-blue-500 font-medium text-sm">
                            Drop task here
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>

                {/* In Progress Tasks */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverColumn('inProgress');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggedTask && draggedFromColumn && 'inProgress' !== draggedFromColumn) {
                      moveTask(draggedTask.id, draggedFromColumn, 'inProgress');
                    }
                    setDraggedTask(null);
                    setDraggedFromColumn(null);
                    setDragOverColumn(null);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      if (dragOverColumn === 'inProgress') {
                        setDragOverColumn(null);
                      }
                    }
                  }}
                  className={`rounded-lg transition-all ${
                    dragOverColumn === 'inProgress' ? 'bg-blue-50 border-2 border-dashed border-blue-300 p-4' : 'p-0 border-2 border-transparent'
                  }`}
                >
                  {(filterTasks(tasks.inProgress).length > 0 || dragOverColumn === 'inProgress') && (
                    <>
                      <div className="flex items-center gap-2.5 mb-4 mt-6">
                        <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shrink-0 shadow-sm"></div>
                        <h3 className="text-base font-bold text-gray-900">In Progress</h3>
                        <span className="text-xs text-gray-500 font-medium">({filterTasks(tasks.inProgress).length})</span>
                      </div>
                      {filterTasks(tasks.inProgress).length > 0 ? (
                        <div className="space-y-3">
                          {filterTasks(tasks.inProgress).map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              currentColumn="inProgress"
                              onMoveTask={(taskId, toColumn) => moveTask(taskId, 'inProgress', toColumn)}
                              onCompleteTask={completeTask}
                              onEditTask={(task) => {
                                setEditingTask({ ...task, column: 'inProgress' });
                                setIsModalOpen(true);
                              }}
                              onDeleteTask={deleteTask}
                              onDragStart={(task, fromColumn) => {
                                setDraggedTask(task);
                                setDraggedFromColumn(fromColumn);
                              }}
                              onDragEnd={() => {
                                setDraggedTask(null);
                                setDraggedFromColumn(null);
                                setDragOverColumn(null);
                              }}
                              isDragging={draggedTask?.id === task.id}
                              viewMode={viewMode}
                            />
                          ))}
                        </div>
                      ) : (
                        dragOverColumn === 'inProgress' && (
                          <div className="text-center py-8 text-blue-500 font-medium text-sm">
                            Drop task here
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>

                {/* Backlog Tasks */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverColumn('backlog');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggedTask && draggedFromColumn && 'backlog' !== draggedFromColumn) {
                      moveTask(draggedTask.id, draggedFromColumn, 'backlog');
                    }
                    setDraggedTask(null);
                    setDraggedFromColumn(null);
                    setDragOverColumn(null);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      if (dragOverColumn === 'backlog') {
                        setDragOverColumn(null);
                      }
                    }
                  }}
                  className={`rounded-lg transition-all ${
                    dragOverColumn === 'backlog' ? 'bg-blue-50 border-2 border-dashed border-blue-300 p-4' : 'p-0 border-2 border-transparent'
                  }`}
                >
                  {(filterTasks(tasks.backlog).length > 0 || dragOverColumn === 'backlog') && (
                    <>
                      <div className="flex items-center gap-2.5 mb-4 mt-6">
                        <div className="w-2.5 h-2.5 bg-gray-300 rounded-full shrink-0 shadow-sm"></div>
                        <h3 className="text-base font-bold text-gray-900">Backlog</h3>
                        <span className="text-xs text-gray-500 font-medium">({filterTasks(tasks.backlog).length})</span>
                      </div>
                      {filterTasks(tasks.backlog).length > 0 ? (
                        <div className="space-y-3">
                          {filterTasks(tasks.backlog).map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              currentColumn="backlog"
                              onMoveTask={(taskId, toColumn) => moveTask(taskId, 'backlog', toColumn)}
                              onCompleteTask={completeTask}
                              onEditTask={(task) => {
                                setEditingTask({ ...task, column: 'backlog' });
                                setIsModalOpen(true);
                              }}
                              onDeleteTask={deleteTask}
                              onDragStart={(task, fromColumn) => {
                                setDraggedTask(task);
                                setDraggedFromColumn(fromColumn);
                              }}
                              onDragEnd={() => {
                                setDraggedTask(null);
                                setDraggedFromColumn(null);
                                setDragOverColumn(null);
                              }}
                              isDragging={draggedTask?.id === task.id}
                              viewMode={viewMode}
                            />
                          ))}
                        </div>
                      ) : (
                        dragOverColumn === 'backlog' && (
                          <div className="text-center py-8 text-blue-500 font-medium text-sm">
                            Drop task here
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>

                {/* Empty State */}
                {filterTasks(tasks.todaysFocus).length === 0 && 
                 filterTasks(tasks.inProgress).length === 0 && 
                 filterTasks(tasks.backlog).length === 0 &&
                 !dragOverColumn && (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    No tasks found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          onSave={(taskData) => {
            if (editingTask) {
              updateTask(editingTask.id, taskData);
            } else {
              addTask(taskData);
            }
            setIsModalOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Click outside to close filter menu */}
      {showFilterMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowFilterMenu(false)}
        />
      )}
    </div>
  );
}

function TaskColumn({ 
  title, 
  color, 
  columnKey,
  tasks, 
  onMoveTask, 
  onCompleteTask, 
  onEditTask, 
  onDeleteTask,
  draggedTask,
  draggedFromColumn,
  dragOverColumn,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  viewMode = 'grid'
}) {
  const colorClasses = {
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    gray: 'bg-gray-300',
  };

  const isDragOver = dragOverColumn === columnKey;
  const isDraggingFromHere = draggedFromColumn === columnKey;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOver(columnKey);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop(columnKey);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear drag over if we're actually leaving the column area
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverColumn === columnKey) {
        onDragOver(null);
      }
    }
  };

  return (
    <div 
      className="flex flex-col"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 ${colorClasses[color]} rounded-full shrink-0 shadow-sm`}></div>
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <span className="text-xs text-gray-500 font-medium">({tasks.length})</span>
        </div>
      </div>
      
      <div 
        className={`flex flex-col gap-4 min-h-[200px] transition-all duration-200 rounded-xl ${
          isDragOver 
            ? 'bg-blue-50 border-2 border-dashed border-blue-300 p-2' 
            : 'p-0 border-2 border-transparent'
        }`}
      >
        {tasks.length === 0 ? (
          <div className={`text-center py-8 text-gray-400 text-sm ${isDragOver ? 'text-blue-500 font-medium' : ''}`}>
            {isDragOver ? 'Drop task here' : 'No tasks found'}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              currentColumn={columnKey}
              onMoveTask={onMoveTask}
              onCompleteTask={onCompleteTask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={draggedTask?.id === task.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TaskCard({ 
  task, 
  currentColumn, 
  onMoveTask, 
  onCompleteTask, 
  onEditTask, 
  onDeleteTask,
  onDragStart,
  onDragEnd,
  isDragging,
  viewMode = 'grid'
}) {
  const [showMenu, setShowMenu] = useState(false);

  const columnOptions = [
    { value: 'todaysFocus', label: "Today's Focus" },
    { value: 'inProgress', label: 'In Progress' },
    { value: 'backlog', label: 'Backlog' },
  ].filter(opt => opt.value !== currentColumn);

  const handleDragStart = (e) => {
    // Prevent drag if clicking on menu button or its children
    const target = e.target;
    if (target.closest('button') || target.closest('[draggable="false"]') || showMenu) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id.toString());
    // Add a slight delay to allow the drag image to be set
    setTimeout(() => {
      onDragStart(task, currentColumn);
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.preventDefault();
    onDragEnd();
  };

  return (
    <div 
      draggable={!showMenu}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`bg-white rounded-xl p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.2)] transition-all duration-300 border-2 border-gray-100/60 relative group ${
        showMenu ? 'cursor-default' : 'cursor-move'
      } ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      } ${
        viewMode === 'list' ? 'shadow-sm hover:shadow-md' : ''
      }`}
      style={showMenu ? { pointerEvents: 'none' } : {}}
    >
      {/* Menu Button */}
      <div 
        className="absolute top-4 right-4 z-10" 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto' }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setShowMenu(!showMenu);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          draggable={false}
          className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
        
        {showMenu && (
          <div 
            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border-2 border-gray-200 py-2 z-[1000] pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            draggable={false}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('Edit clicked');
                onEditTask(task);
                setShowMenu(false);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              draggable={false}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 flex items-center gap-2 cursor-pointer transition-all duration-200 rounded-none first:rounded-t-lg"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            <div className="px-2 py-1">
              <div className="text-xs font-semibold text-gray-500 px-2 mb-1">Move to:</div>
              {columnOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('Move to clicked:', opt.value);
                    onMoveTask(task.id, opt.value);
                    setShowMenu(false);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                  draggable={false}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 cursor-pointer transition-all duration-200 rounded-none"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="border-t border-gray-200 my-1"></div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('Complete clicked');
                onCompleteTask(task.id);
                setShowMenu(false);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              draggable={false}
              className="w-full px-4 py-2.5 text-left text-sm text-green-700 hover:bg-green-50 hover:text-green-800 active:bg-green-100 flex items-center gap-2 cursor-pointer transition-all duration-200 rounded-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Complete
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('Delete clicked');
                onDeleteTask(task.id);
                setShowMenu(false);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              draggable={false}
              className="w-full px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50 hover:text-red-800 active:bg-red-100 flex items-center gap-2 cursor-pointer transition-all duration-200 rounded-none last:rounded-b-lg"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Category Badge */}
      <div className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold mb-3 ${task.categoryColor}`}>
        {task.category}
      </div>

      {/* Task Title */}
      <h3 className="text-base font-bold text-gray-900 mb-3 pr-8">
        {task.title}
      </h3>

      {/* Priority Indicator */}
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
            <Clock className="w-4 h-4" />
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

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-[999]"
          onClick={(e) => {
            setShowMenu(false);
          }}
          onMouseDown={(e) => {
            // Only close if clicking directly on the overlay, not on menu
            if (e.target === e.currentTarget) {
              setShowMenu(false);
            }
          }}
        />
      )}
    </div>
  );
}

function TaskModal({ task, onClose, onSave }) {
  const [title, setTitle] = useState(task?.title || '');
  const [category, setCategory] = useState(task?.category || 'Other');
  const [priority, setPriority] = useState(task?.priority?.level || '');
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.split('T')[0] : '');
  const [dueTime, setDueTime] = useState(task?.dueDate ? task.dueDate.split('T')[1]?.slice(0, 5) : '');
  const [column, setColumn] = useState(task?.column || 'backlog');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dateTime = dueDate && dueTime
      ? new Date(`${dueDate}T${dueTime}`).toISOString()
      : dueDate
      ? new Date(`${dueDate}T12:00`).toISOString()
      : null;

    const priorityObj = priority
      ? priorityOptions.find(p => p.level === priority)
      : null;

    onSave({
      title: title.trim(),
      category,
      priority: priorityObj,
      dueDate: dateTime,
      column,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {Object.keys(categoryColors).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">No Priority</option>
                {priorityOptions.map(opt => (
                  <option key={opt.level} value={opt.level}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Due Time
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Column
            </label>
            <select
              value={column}
              onChange={(e) => setColumn(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="todaysFocus">Today's Focus</option>
              <option value="inProgress">In Progress</option>
              <option value="backlog">Backlog</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors shadow-lg"
            >
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
