'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import SpacesDrawer from '@/components/focus/SpacesDrawer';
import SoundscapeComposer from '@/components/focus/SoundscapeComposer';
import { getUserStorageJson, removeUserStorageItem, setUserStorageJson } from '@/utils/userStorage';

const navigationItems = [
  {
    name: 'Home',
    href: '/home',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    name: 'Focus',
    href: '/focus',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        {/* Corner brackets forming a square */}
        <path d="M8 4 L4 4 L4 8" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 4 L20 4 L20 8" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 16 L4 20 L8 20" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 16 L20 20 L16 20" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Center dot */}
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
    subItems: [
      {
        name: 'Spaces',
        href: '/focus/spaces',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" fill="none" />
            <path d="M3 9h18M9 3v18" stroke="currentColor" />
          </svg>
        ),
      },
      {
        name: 'Task',
        href: '/focus/task',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" fill="none" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" stroke="currentColor" fill="none" />
          </svg>
        ),
      },
      {
        name: 'Timer',
        href: '/focus/timer',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" />
            <path d="M12 6v6l4 2" stroke="currentColor" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        name: 'Music',
        href: '/focus/music',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M9 18V5l12-2v13" stroke="currentColor" fill="none" />
            <circle cx="6" cy="18" r="3" stroke="currentColor" fill="none" />
            <circle cx="18" cy="16" r="3" stroke="currentColor" fill="none" />
          </svg>
        ),
      },
    ],
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" stroke="currentColor" fill="none" />
      </svg>
    ),
  },
  {
    name: 'Analysis',
    href: '/analysis',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        {/* Line graph with wavy line */}
        <path d="M4 16 L8 12 L12 14 L16 10 L20 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Data points */}
        <circle cx="4" cy="16" r="2" fill="currentColor" />
        <circle cx="12" cy="14" r="2" fill="currentColor" />
        <circle cx="20" cy="12" r="2" fill="currentColor" />
        {/* Plus signs above first and third points */}
        <path d="M4 10 L4 12 M3 11 L5 11" stroke="currentColor" strokeWidth={1.5} />
        <path d="M20 6 L20 8 M19 7 L21 7" stroke="currentColor" strokeWidth={1.5} />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const userId = user?.id || null;
  
  // Load expanded items from localStorage
  const loadExpandedItems = () => {
    if (typeof window === 'undefined') return [];
    const saved = getUserStorageJson(userId, 'sidebar-expanded-items', 'sidebar-expanded-items');
    return saved || [];
  };

  const [expandedItems, setExpandedItems] = useState(loadExpandedItems);
  // Load initial widget states from localStorage immediately
  const loadWidgetState = (key, defaultValue = true) => {
    if (typeof window === 'undefined') return defaultValue;
    const storageKey = `focus-widget-${key}`;
    const saved = getUserStorageJson(userId, storageKey, storageKey);
    return saved !== null ? saved : defaultValue;
  };

  const [widgetStates, setWidgetStates] = useState({
    showTimer: loadWidgetState('timer', true),
    showMusic: loadWidgetState('music', true),
    showTask: loadWidgetState('task', true),
  });
  const [showSpacesDrawer, setShowSpacesDrawer] = useState(false);
  const [showSoundscapeComposer, setShowSoundscapeComposer] = useState(false);
  
  // Save expanded items to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserStorageJson(userId, 'sidebar-expanded-items', expandedItems);
    }
  }, [expandedItems, userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setExpandedItems(loadExpandedItems());
    setWidgetStates({
      showTimer: loadWidgetState('timer', true),
      showMusic: loadWidgetState('music', true),
      showTask: loadWidgetState('task', true),
    });
  }, [userId]);

  // Listen for open-soundscape-composer event from MusicWidget
  useEffect(() => {
    const handleOpenSoundscape = () => {
      setShowSoundscapeComposer(true);
    };

    window.addEventListener('open-soundscape-composer', handleOpenSoundscape);
    return () => {
      window.removeEventListener('open-soundscape-composer', handleOpenSoundscape);
    };
  }, []);
  
  // Toggle widgets using custom events (since context is in child layout)
  const toggleTimer = () => {
    // Toggle the widget state
    const newState = !widgetStates.showTimer;
    setWidgetStates(prev => ({ ...prev, showTimer: newState }));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('focus-widget-toggle', { 
        detail: { widget: 'timer', state: newState } 
      }));
    }
    if (pathname !== '/focus') {
      router.push('/focus');
    }
  };
  
  const toggleMusic = () => {
    // Toggle the widget state
    const newState = !widgetStates.showMusic;
    setWidgetStates(prev => ({ ...prev, showMusic: newState }));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('focus-widget-toggle', { 
        detail: { widget: 'music', state: newState } 
      }));
    }
    if (pathname !== '/focus') {
      router.push('/focus');
    }
  };
  
  const toggleTask = () => {
    // Toggle the widget state
    const newState = !widgetStates.showTask;
    setWidgetStates(prev => ({ ...prev, showTask: newState }));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('focus-widget-toggle', { 
        detail: { widget: 'task', state: newState } 
      }));
    }
    if (pathname !== '/focus') {
      router.push('/focus');
    }
  };
  
  // Sync widget states with FocusContext on mount
  useEffect(() => {
    // Request current widget states from Focus page
    if (typeof window !== 'undefined') {
      const handleWidgetState = (e) => {
        const { widget, state } = e.detail;
        if (widget === 'timer') {
          setWidgetStates(prev => ({ ...prev, showTimer: state }));
        } else if (widget === 'music') {
          setWidgetStates(prev => ({ ...prev, showMusic: state }));
        } else if (widget === 'task') {
          setWidgetStates(prev => ({ ...prev, showTask: state }));
        }
      };
      
      window.addEventListener('focus-widget-state', handleWidgetState);
      
      // Request initial states
      window.dispatchEvent(new CustomEvent('focus-request-state'));
      
      return () => {
        window.removeEventListener('focus-widget-state', handleWidgetState);
      };
    }
  }, []);

  // Listen for widget state updates from focus page
  useEffect(() => {
    const handleWidgetUpdate = (e) => {
      const { widget, state } = e.detail;
      if (widget === 'timer') {
        setWidgetStates(prev => ({ ...prev, showTimer: state }));
      } else if (widget === 'music') {
        setWidgetStates(prev => ({ ...prev, showMusic: state }));
      } else if (widget === 'task') {
        setWidgetStates(prev => ({ ...prev, showTask: state }));
      }
    };
    
    window.addEventListener('focus-widget-state', handleWidgetUpdate);
    
    return () => {
      window.removeEventListener('focus-widget-state', handleWidgetUpdate);
    };
  }, []);

  // Auto-expand if current path matches a parent with sub-items, and collapse when leaving
  useEffect(() => {
    if (!pathname) return;
    
    navigationItems.forEach((item) => {
      if (item.subItems) {
        const isActiveSubItem = item.subItems.some((subItem) => pathname === subItem.href);
        const isActiveParent = pathname === item.href;
        
        if (isActiveSubItem || isActiveParent) {
          // Expand if on this page
          setExpandedItems((prev) => {
            if (!prev.includes(item.name)) {
              return [...prev, item.name];
            }
            return prev;
          });
        } else {
          // Collapse when leaving the page (specifically for Focus)
          if (item.name === 'Focus' && pathname !== '/focus') {
            setExpandedItems((prev) => {
              if (prev.includes(item.name)) {
                return prev.filter((name) => name !== item.name);
              }
              return prev;
            });
          }
        }
      }
    });
  }, [pathname]);

  const toggleExpand = (itemName) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('soundscape-stop-all'));
      removeUserStorageItem(userId, 'soundscape-active-sounds');
      removeUserStorageItem(userId, 'soundscape-global-volume');
      removeUserStorageItem(userId, 'soundscape-is-playing');
      removeUserStorageItem(userId, 'soundscape-session-active');
    }
    await signOut({ redirectUrl: '/' });
  };

  return (
    <div className="fixed left-0 top-0 h-full w-24 bg-white flex flex-col items-center py-5 z-40 border-r border-gray-200 font-(--font-poppins)">
      {/* Logo/Brand Section */}
      <Link href="/home" className="mb-10 no-underline">
        <div className="w-10 h-10 flex items-center justify-center">
          <Image 
            src="/LandingPageImages/logo.png" 
            alt="ThryvLoop Logo" 
            width={40} 
            height={40}
            className="object-contain"
          />
        </div>
      </Link>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col items-center space-y-2 w-full overflow-y-auto px-2 sidebar-scroll">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedItems.includes(item.name);
          const isActiveSubItem = hasSubItems && item.subItems?.some((subItem) => pathname === subItem.href);
          const isParentActive = isActive || isActiveSubItem;

          return (
            <div key={item.name} className="w-full flex flex-col items-center">
              {hasSubItems ? (
                <button
                  onClick={() => {
                    toggleExpand(item.name);
                    // Navigate to focus page when clicking Focus
                    if (item.name === 'Focus' && pathname !== '/focus') {
                      router.push('/focus');
                    }
                  }}
                  className={`
                    flex flex-col items-center justify-center transition-all duration-200 group w-full
                  `}
                >
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 mb-1.5
                      ${
                        isParentActive
                          ? 'bg-[#5043F3]/10 text-[#5043F3]'
                          : 'bg-transparent text-gray-400 group-hover:bg-gray-100'
                      }
                    `}
                  >
                    {item.icon}
                  </div>
                  <span
                    className={`
                      text-xs font-medium transition-colors duration-200
                      ${
                        isParentActive
                          ? 'text-[#5043F3]'
                          : 'text-gray-500 group-hover:text-gray-700'
                      }
                    `}
                  >
                    {item.name}
                  </span>
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={`
                    flex flex-col items-center justify-center transition-all duration-200 no-underline group w-full
                  `}
                >
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 mb-1.5
                      ${
                        isActive
                          ? 'bg-[#5043F3]/10 text-[#5043F3]'
                          : 'bg-transparent text-gray-400 group-hover:bg-gray-100'
                      }
                    `}
                  >
                    {item.icon}
                  </div>
                  <span
                    className={`
                      text-xs font-medium transition-colors duration-200
                      ${
                        isActive
                          ? 'text-[#5043F3]'
                          : 'text-gray-500 group-hover:text-gray-700'
                      }
                    `}
                  >
                    {item.name}
                  </span>
                </Link>
              )}

              {/* Sub-items - displayed with indentation and left border indicator */}
              {hasSubItems && (
                <div 
                  className={`w-full flex flex-col items-center relative pl-2 overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded 
                      ? 'max-h-96 opacity-100 mt-3 space-y-2' 
                      : 'max-h-0 opacity-0 mt-0 space-y-0'
                  }`}
                >
                  {item.subItems?.map((subItem, index) => {
                    const isSubActive = (subItem.name === 'Spaces' && showSpacesDrawer) ||
                      (subItem.name === 'Timer' && widgetStates.showTimer) ||
                      (subItem.name === 'Music' && widgetStates.showMusic) ||
                      (subItem.name === 'Task' && widgetStates.showTask);
                    
                    // Handle widget toggling for Timer, Music, and Task, or drawer for Spaces
                    const handleSubItemClick = (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (item.name === 'Focus') {
                        if (subItem.name === 'Spaces') {
                          setShowSpacesDrawer(true);
                        } else if (subItem.name === 'Timer') {
                          toggleTimer();
                        } else if (subItem.name === 'Music') {
                          toggleMusic();
                        } else if (subItem.name === 'Task') {
                          toggleTask();
                        }
                      }
                    };
                    
                    // Use button/div for all sub-items (Spaces opens drawer, others toggle widgets)
                    const isWidgetToggle = item.name === 'Focus' && 
                      (subItem.name === 'Timer' || subItem.name === 'Music' || subItem.name === 'Task' || subItem.name === 'Spaces');
                    
                    const SubItemWrapper = isWidgetToggle ? 'div' : Link;
                    const wrapperProps = isWidgetToggle 
                      ? { onClick: handleSubItemClick, className: 'flex flex-col items-center justify-center px-2 py-1.5 rounded-lg transition-all duration-200 group cursor-pointer relative w-full' }
                      : { href: subItem.href, className: 'flex flex-col items-center justify-center px-2 py-1.5 rounded-lg transition-all duration-200 no-underline group relative w-full' };
                    
                    return (
                      <SubItemWrapper
                        key={subItem.name}
                        {...wrapperProps}
                      >
                        {/* Left border indicator */}
                        <div 
                          className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-full transition-all duration-200 ${
                            isSubActive 
                              ? 'bg-[#5043F3]' 
                              : 'bg-transparent group-hover:bg-gray-300'
                          }`}
                        ></div>
                        <div
                          className={`
                            w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 mb-1
                            ${
                              isSubActive
                                ? 'bg-[#5043F3]/10 text-[#5043F3]'
                                : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600'
                            }
                          `}
                        >
                          {subItem.icon}
                        </div>
                        <span
                          className={`
                            text-[10px] font-medium transition-colors duration-200 text-center leading-tight
                            ${
                              isSubActive
                                ? 'text-[#5043F3]'
                                : 'text-gray-500 group-hover:text-gray-700'
                            }
                          `}
                        >
                          {subItem.name}
                        </span>
                      </SubItemWrapper>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Separator above logout */}
      <div className="w-full px-4 mt-auto mb-3">
        <div className="h-px bg-gray-200"></div>
      </div>

      {/* Settings (Soundscape/Timer) Button */}
      <button
        onClick={() => setShowSoundscapeComposer(true)}
        className="flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 transition-all duration-200 mb-2 group"
        title="Settings"
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-gray-100 transition-all duration-200 mb-1.5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span className="text-xs font-medium">Settings</span>
      </button>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 transition-all duration-200 mb-2 group"
        title="Logout"
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-gray-100 transition-all duration-200 mb-1.5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" fill="none" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 8l4 4-4 4" />
          </svg>
        </div>
        <span className="text-xs font-medium">Logout</span>
      </button>

      {/* Spaces Drawer */}
      <SpacesDrawer isOpen={showSpacesDrawer} onClose={() => setShowSpacesDrawer(false)} />
      
      {/* Soundscape Composer Modal */}
      <SoundscapeComposer isOpen={showSoundscapeComposer} onClose={() => setShowSoundscapeComposer(false)} />
    </div>
  );
}

