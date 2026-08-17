'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useUser, useAuth } from '@clerk/nextjs';
import { useFocus } from '@/contexts/FocusContext';
import { useCelebration } from '@/contexts/CelebrationContext';
import {
  getSupabaseClient,
  setSupabaseAuthToken,
  getUserStorageItem,
  setUserStorageItem,
  removeUserStorageItem,
  setUserStorageJson,
} from '@/utils/userStorage';
import { getDefaultTaskBarPosition } from '@/lib/focusWidgetLayout';

const FOCUS_TASK_ID_KEY = 'focus-current-task-id';

export default function FocusTaskBar() {
  const { setShowTaskBar, setShowTask } = useFocus();
  const { showCelebration } = useCelebration();
  const { user } = useUser();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const userId = user?.id || null;

  const [tasks, setTasks] = useState([]);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const [dropdownRect, setDropdownRect] = useState(null);

  const [position, setPosition] = useState(null);
  const [size, setSize] = useState({ width: 400, height: 56 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });
  const widgetRef = useRef(null);
  const userPositionedRef = useRef(false);

  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    setTasksLoading(true);
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        setTasks([]);
        return;
      }
      setSupabaseAuthToken(token);
      const supabase = getSupabaseClient();
      if (!supabase) {
        setTasks([]);
        return;
      }
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('user_id', userId)
        .or('column_key.eq.todaysFocus,column_key.eq.inProgress')
        .is('completed_at', null)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('FocusTaskBar fetch tasks:', error);
        setTasks([]);
        return;
      }
      const list = (data || []).map((r) => ({ id: r.id, title: r.title || 'Untitled' }));
      setTasks(list);
      const savedId = getUserStorageItem(userId, FOCUS_TASK_ID_KEY, FOCUS_TASK_ID_KEY);
      if (savedId && list.some((t) => String(t.id) === String(savedId))) {
        setCurrentTaskId(savedId);
      } else if (list.length > 0 && !savedId) {
        setCurrentTaskId(list[0].id);
        setUserStorageItem(userId, FOCUS_TASK_ID_KEY, String(list[0].id));
      } else {
        setCurrentTaskId(null);
      }
    } catch (e) {
      console.error('FocusTaskBar fetch error:', e);
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, [userId, getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) {
      setTasksLoading(false);
      return;
    }
    fetchTasks();
  }, [isLoaded, isSignedIn, userId, fetchTasks]);

  useEffect(() => {
    if (typeof window === 'undefined' || !userId || currentTaskId == null) return;
    setUserStorageItem(userId, FOCUS_TASK_ID_KEY, String(currentTaskId));
  }, [currentTaskId, userId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const insideTrigger = triggerRef.current && triggerRef.current.contains(e.target);
      const insideDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
      if (!insideTrigger && !insideDropdown) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!dropdownOpen || !triggerRef.current) {
      setDropdownRect(null);
      return;
    }
    const updateRect = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownRect({
          top: rect.bottom + 4,
          left: rect.left,
          width: Math.max(rect.width, 220),
        });
      }
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [dropdownOpen]);


  const completeTask = useCallback(async () => {
    if (!currentTaskId || !userId) return;
    const task = tasks.find((t) => String(t.id) === String(currentTaskId));
    const taskTitle = task?.title || 'Task';
    setCompletingId(currentTaskId);
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) return;
      setSupabaseAuthToken(token);
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const { error } = await supabase
        .from('tasks')
        .update({
          column_key: 'done',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentTaskId)
        .eq('user_id', userId);
      if (error) throw error;
      showCelebration({ type: 'task', taskTitle });
      setCurrentTaskId(null);
      removeUserStorageItem(userId, FOCUS_TASK_ID_KEY);
      await fetchTasks();
    } catch (e) {
      console.error('Complete task failed:', e);
    } finally {
      setCompletingId(null);
    }
  }, [currentTaskId, userId, tasks, getToken, showCelebration, fetchTasks]);

  const currentTask = tasks.find((t) => String(t.id) === String(currentTaskId));
  const displayTitle = currentTask?.title ?? (tasksLoading ? 'Loading…' : 'No task selected');

  const applyDefaultLayout = useCallback(() => {
    if (typeof window === 'undefined') return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const baseWidth = 450;
    const baseHeight = 56;
    const minWidth = Math.min(300, vw * 0.7);
    const maxWidth = Math.min(550, vw * 0.85);
    const minHeight = Math.min(48, vh * 0.06);
    const maxHeight = Math.min(80, vh * 0.09);
    const widthScale = Math.min(1, vw / 1440);
    const heightScale = Math.min(1, vh / 900);
    const scale = Math.min(widthScale, heightScale, 1.2);
    setSize({
      width: Math.max(minWidth, Math.min(maxWidth, baseWidth * scale)),
      height: Math.max(minHeight, Math.min(maxHeight, baseHeight * scale)),
    });
    setPosition(getDefaultTaskBarPosition());
  }, []);

  // Initialize default position and size
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updatePositionAndSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const baseWidth = 450;
      const baseHeight = 56;
      const minWidth = Math.min(300, vw * 0.7);
      const maxWidth = Math.min(550, vw * 0.85);
      const minHeight = Math.min(48, vh * 0.06);
      const maxHeight = Math.min(80, vh * 0.09);
      const widthScale = Math.min(1, vw / 1440);
      const heightScale = Math.min(1, vh / 900);
      const scale = Math.min(widthScale, heightScale, 1.2);
      setSize({
        width: Math.max(minWidth, Math.min(maxWidth, baseWidth * scale)),
        height: Math.max(minHeight, Math.min(maxHeight, baseHeight * scale)),
      });
      if (!userPositionedRef.current) {
        setPosition(getDefaultTaskBarPosition());
      }
    };
    updatePositionAndSize();
    const handleFullscreenChange = () => setTimeout(updatePositionAndSize, 100);
    window.addEventListener('focus-fullscreen-change', handleFullscreenChange);
    window.addEventListener('resize', updatePositionAndSize);
    return () => {
      window.removeEventListener('focus-fullscreen-change', handleFullscreenChange);
      window.removeEventListener('resize', updatePositionAndSize);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !position) return;
    setUserStorageJson(userId, 'focus-taskbar-position', position);
  }, [position, userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (size.width >= 250 && size.height >= 48) {
      setUserStorageJson(userId, 'focus-taskbar-size', size);
    }
  }, [size, userId]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        removeUserStorageItem(userId, 'focus-taskbar-position');
        removeUserStorageItem(userId, 'focus-taskbar-size');
      }
    };
  }, [userId]);

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      removeUserStorageItem(userId, 'focus-taskbar-position');
      removeUserStorageItem(userId, 'focus-taskbar-size');
    }
    userPositionedRef.current = false;
    applyDefaultLayout();
    setShowTaskBar(false);
    setShowTask(false);
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('.resize-handle') || e.target.closest('a')) return;
    if (!position) return;
    userPositionedRef.current = true;
    setIsDragging(true);
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      });
    }
  };

  const handleResizeStart = (e, handle) => {
    e.stopPropagation();
    e.preventDefault();
    userPositionedRef.current = true;
    setIsResizing(true);
    setResizeHandle(handle);
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect && position) {
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
        left: position.x,
        top: position.y,
      });
    }
  };

  useEffect(() => {
    if (!isDragging || !position) return;
    const handleMouseMove = (e) => {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      const halfWidth = size.width / 2;
      const halfHeight = size.height / 2;
      setPosition({
        x: Math.max(halfWidth, Math.min(newX, window.innerWidth - halfWidth)),
        y: Math.max(halfHeight, Math.min(newY, window.innerHeight - halfHeight)),
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, size]);

  useEffect(() => {
    if (!isResizing || !resizeHandle || !position) return;
    const handleMouseMove = (e) => {
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.left;
      let newY = resizeStart.top;
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      if (resizeHandle.includes('right')) newWidth = Math.max(250, resizeStart.width + deltaX);
      if (resizeHandle.includes('left')) {
        newWidth = Math.max(250, resizeStart.width - deltaX);
        newX = resizeStart.left + deltaX;
      }
      if (resizeHandle.includes('bottom')) newHeight = Math.max(48, resizeStart.height + deltaY);
      if (resizeHandle.includes('top')) {
        newHeight = Math.max(48, resizeStart.height - deltaY);
        newY = resizeStart.top + deltaY;
      }
      const halfWidth = newWidth / 2;
      const halfHeight = newHeight / 2;
      setPosition({
        x: Math.max(halfWidth, Math.min(newX, window.innerWidth - halfWidth)),
        y: Math.max(halfHeight, Math.min(newY, window.innerHeight - halfHeight)),
      });
      setSize({ width: newWidth, height: newHeight });
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeHandle, resizeStart, position]);

  if (!position) return null;

  const scale = Math.min(size.width / 400, size.height / 56);
  const paddingX = Math.max(16, 24 * scale);
  const paddingY = Math.max(12, 14 * scale);
  const iconSize = Math.max(16, 20 * scale);
  const fontSize = Math.max(12, 14 * scale);

  return (
    <div
      ref={widgetRef}
      className="fixed z-30 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className={`bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 flex items-center pointer-events-auto relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isResizing ? 'select-none' : ''}`}
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          paddingLeft: `${paddingX}px`,
          paddingRight: `${paddingX}px`,
          paddingTop: `${paddingY}px`,
          paddingBottom: `${paddingY}px`,
          gap: `${Math.max(8, 12 * scale)}px`,
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Resize handles */}
        <div className="resize-handle absolute top-0 left-0 w-6 h-6 cursor-nwse-resize z-20" style={{ background: 'transparent' }} onMouseDown={(e) => handleResizeStart(e, 'top-left')} />
        <div className="resize-handle absolute top-0 right-0 w-6 h-6 cursor-nesw-resize z-20" style={{ background: 'transparent' }} onMouseDown={(e) => handleResizeStart(e, 'top-right')} />
        <div className="resize-handle absolute bottom-0 left-0 w-6 h-6 cursor-nesw-resize z-20" style={{ background: 'transparent' }} onMouseDown={(e) => handleResizeStart(e, 'bottom-left')} />
        <div className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-20" style={{ background: 'transparent' }} onMouseDown={(e) => handleResizeStart(e, 'bottom-right')} />
        <div className="resize-handle absolute top-0 left-1/2 -translate-x-1/2 w-12 h-6 cursor-ns-resize z-20" style={{ background: 'transparent' }} onMouseDown={(e) => handleResizeStart(e, 'top')} />
        <div className="resize-handle absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-6 cursor-ns-resize z-20" style={{ background: 'transparent' }} onMouseDown={(e) => handleResizeStart(e, 'bottom')} />
        <div className="resize-handle absolute left-0 top-1/2 -translate-y-1/2 w-6 h-12 cursor-ew-resize z-20" style={{ background: 'transparent' }} onMouseDown={(e) => handleResizeStart(e, 'left')} />
        <div className="resize-handle absolute right-0 top-1/2 -translate-y-1/2 w-6 h-12 cursor-ew-resize z-20" style={{ background: 'transparent' }} onMouseDown={(e) => handleResizeStart(e, 'right')} />

        {/* Content above resize handles so buttons are clickable */}
        <div className="relative z-30 flex items-center flex-1 min-w-0 gap-2">
          <div className="rounded-full bg-purple-400/20 flex items-center justify-center shrink-0" style={{ width: `${iconSize}px`, height: `${iconSize}px` }}>
            <svg className="text-purple-400" fill="currentColor" viewBox="0 0 24 24" style={{ width: `${iconSize * 0.6}px`, height: `${iconSize * 0.6}px` }}>
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>

          <div ref={triggerRef} className="flex-1 min-w-0 relative flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen((o) => !o);
              }}
              className="text-left text-white font-medium truncate hover:bg-white/10 rounded px-1 -mx-1 transition-colors flex-1 min-w-0 cursor-pointer flex items-center gap-1"
              style={{ fontSize: `${fontSize}px` }}
            >
              <span className="truncate">
                Focusing on: {displayTitle}
              </span>
              <svg className="w-4 h-4 text-white/60 shrink-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {dropdownOpen && typeof document !== 'undefined' && dropdownRect && createPortal(
            <div
              ref={dropdownRef}
              className="fixed py-1 rounded-xl bg-black/90 backdrop-blur-md border border-white/10 shadow-xl max-h-48 overflow-y-auto"
              style={{
                top: dropdownRect.top,
                left: dropdownRect.left,
                width: dropdownRect.width,
                zIndex: 9999,
              }}
            >
              {tasks.length === 0 && !tasksLoading && (
                <div className="px-3 py-2 text-white/70 text-sm">
                  No tasks. <Link href="/tasks" className="text-purple-400 hover:underline" onClick={() => setDropdownOpen(false)}>Open Tasks</Link>
                </div>
              )}
              {tasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setCurrentTaskId(t.id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${String(currentTaskId) === String(t.id) ? 'bg-purple-500/30 text-white' : 'text-white/90 hover:bg-white/10'}`}
                >
                  {t.title}
                </button>
              ))}
              <Link href="/tasks" onClick={() => setDropdownOpen(false)} className="block px-3 py-2 text-sm text-purple-400 hover:bg-white/10">
                Open Tasks →
              </Link>
            </div>,
            document.body
          )}

        {currentTaskId && (
          <button
            type="button"
            onClick={completeTask}
            disabled={!!completingId}
            className="shrink-0 px-2 py-1 rounded-lg bg-emerald-500/30 text-emerald-200 hover:bg-emerald-500/50 text-xs font-medium disabled:opacity-50 cursor-pointer"
          >
            {completingId ? '…' : 'Complete'}
          </button>
        )}

        <button
          onClick={handleClose}
          className="w-6 h-6 flex items-center justify-center text-white/70 hover:text-white transition-colors rounded hover:bg-white/10 shrink-0 cursor-pointer"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        </div>
      </div>
    </div>
  );
}
