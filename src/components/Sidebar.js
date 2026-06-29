'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import SpacesDrawer from '@/components/focus/SpacesDrawer';
import SoundscapeEngineProvider from '@/components/soundscape/SoundscapeEngineProvider';
import SoundscapeComposer from '@/components/focus/SoundscapeComposer';
import { normalizeSettingsPanel } from '@/lib/openFocusSettings';
import { getUserStorageJson, removeUserStorageItem, setUserStorageJson } from '@/utils/userStorage';
import { suspendClerkAuthRequests } from '@/lib/clerkSupabaseToken';
import { pauseAndFlushFocusTimerOnLogout } from '@/lib/focusTimerPersist';
import { markAuthLogoutTransition } from '@/lib/authTransition';
import { B2B_WORKSPACES_ENABLED } from '@/lib/featureFlags';
import { LogOut, Settings } from 'lucide-react';

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
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" fill="none" />
            <path d="M3 9h18M9 3v18" stroke="currentColor" />
          </svg>
        ),
      },
      {
        name: 'Task',
        href: '/focus/task',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" fill="none" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" stroke="currentColor" fill="none" />
          </svg>
        ),
      },
      {
        name: 'Timer',
        href: '/focus/timer',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" />
            <path d="M12 6v6l4 2" stroke="currentColor" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        name: 'Music',
        href: '/focus/music',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M9 18V5l12-2v13" stroke="currentColor" fill="none" />
            <circle cx="6" cy="18" r="3" stroke="currentColor" fill="none" />
            <circle cx="18" cy="16" r="3" stroke="currentColor" fill="none" />
          </svg>
        ),
      },
    ],
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
  {
    name: 'Workspaces',
    href: '/o',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

const visibleNavigationItems = B2B_WORKSPACES_ENABLED
  ? navigationItems
  : navigationItems.filter((item) => item.name !== 'Workspaces');

export default function Sidebar({ className = '' }) {
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
  const [composerInitialPanel, setComposerInitialPanel] = useState('composer');
  const [integrationsOAuth, setIntegrationsOAuth] = useState(null);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const searchParams = useSearchParams();

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
    const handleOpenSoundscape = (e) => {
      setComposerInitialPanel(normalizeSettingsPanel(e.detail?.panel));
      setShowSoundscapeComposer(true);
    };

    window.addEventListener('open-soundscape-composer', handleOpenSoundscape);
    return () => {
      window.removeEventListener('open-soundscape-composer', handleOpenSoundscape);
    };
  }, []);

  // After Google OAuth, open settings on Focus Flow → Integrations
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected !== 'google' && !error) return;

    setComposerInitialPanel('integrations');
    setShowSoundscapeComposer(true);
    setIntegrationsOAuth({ connected, error });

    const params = new URLSearchParams(searchParams.toString());
    params.delete('connected');
    params.delete('error');
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);
  
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
    setMobileMoreOpen(false);
    markAuthLogoutTransition();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('soundscape-stop-all'));
      removeUserStorageItem(userId, 'soundscape-active-sounds');
      removeUserStorageItem(userId, 'soundscape-global-volume');
      removeUserStorageItem(userId, 'soundscape-is-playing');
      removeUserStorageItem(userId, 'soundscape-session-active');
      removeUserStorageItem(userId, 'focus-spaces-paused');
    }
    await pauseAndFlushFocusTimerOnLogout();
    suspendClerkAuthRequests();
    await signOut({ redirectUrl: '/' });
  };

  const mobilePrimaryItems = visibleNavigationItems.filter((item) =>
    ['Home', 'Focus', 'Calendar', 'Tasks'].includes(item.name)
  );

  const mobileMoreItems = visibleNavigationItems.filter((item) =>
    ['Analysis', 'Workspaces'].includes(item.name)
  );

  const sidebarIconBoxClass = '[&_svg]:w-6 [&_svg]:h-6 [&_svg]:shrink-0';
  const sidebarFooterIconBoxClass = '[&_svg]:w-5 [&_svg]:h-5 [&_svg]:shrink-0';
  const sidebarIconTrackClass = 'w-12 mx-auto shrink-0';

  const renderNavIcon = (item, isActive) => (
    <div
      className={`
        flex items-center justify-center transition-all duration-200 ${sidebarIconBoxClass}
        md:w-12 md:h-12 md:rounded-full md:mb-1.5
        w-10 h-10 rounded-xl
        ${
          isActive
            ? 'bg-[#5043F3]/10 text-[#5043F3]'
            : 'bg-transparent text-muted-foreground group-hover:bg-muted'
        }
      `}
    >
      {item.icon}
    </div>
  );

  return (
    <SoundscapeEngineProvider>
    <>
    <div className={`hidden lg:flex fixed left-0 top-0 h-full w-24 bg-card flex-col items-center py-5 z-40 border-r border-border font-(--font-poppins) ${className}`}>
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
      <nav className="flex-1 flex flex-col items-center space-y-2 w-full min-h-0 overflow-y-auto pb-6 sidebar-scroll sidebar-icon-track">
        {visibleNavigationItems.map((item) => {
          const isActive =
            pathname === item.href
            || (item.href === '/o' && !!pathname && pathname.startsWith('/o/'))
            || (item.href === '/calendar' && !!pathname && pathname.startsWith('/calendar'));
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
                      ${sidebarIconTrackClass} h-12 rounded-full flex items-center justify-center transition-all duration-200 mb-1.5 ${sidebarIconBoxClass}
                      ${
                        isParentActive
                          ? 'bg-[#5043F3]/10 text-[#5043F3]'
                          : 'bg-transparent text-muted-foreground group-hover:bg-muted'
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
                          : 'text-muted-foreground group-hover:text-foreground'
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
                      ${sidebarIconTrackClass} h-12 rounded-full flex items-center justify-center transition-all duration-200 mb-1.5 ${sidebarIconBoxClass}
                      ${
                        isActive
                          ? 'bg-[#5043F3]/10 text-[#5043F3]'
                          : 'bg-transparent text-muted-foreground group-hover:bg-muted'
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
                          : 'text-muted-foreground group-hover:text-foreground'
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
                              : 'bg-transparent group-hover:bg-border'
                          }`}
                        ></div>
                        <div
                          className={`
                            w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 mb-1 ${sidebarIconBoxClass}
                            ${
                              isSubActive
                                ? 'bg-[#5043F3]/10 text-[#5043F3]'
                                : 'bg-muted text-muted-foreground group-hover:bg-muted group-hover:text-foreground'
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
                                : 'text-muted-foreground group-hover:text-foreground'
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

      {/* Footer — icon track matches nav column above */}
      <div className="w-full shrink-0 flex flex-col items-center gap-2 pb-2 overflow-y-scroll sidebar-icon-track">
        <div className="w-full mb-1">
          <div className="h-px bg-border" />
        </div>

        {/* Settings (Soundscape/Timer) Button */}
        <button
          type="button"
          onClick={() => {
            setComposerInitialPanel('composer');
            setShowSoundscapeComposer(true);
          }}
          className="flex flex-col items-center justify-center w-full text-muted-foreground hover:text-foreground transition-all duration-200 group"
          title="Settings"
        >
          <div className={`${sidebarIconTrackClass} h-12 rounded-full flex items-center justify-center group-hover:bg-muted transition-all duration-200 mb-1.5 ${sidebarFooterIconBoxClass}`}>
            <Settings className="w-5 h-5" strokeWidth={2} aria-hidden />
          </div>
          <span className="text-xs font-medium">Settings</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-full text-muted-foreground hover:text-foreground transition-all duration-200 group"
          title="Logout"
        >
          <div className={`${sidebarIconTrackClass} h-12 rounded-full flex items-center justify-center group-hover:bg-muted transition-all duration-200 mb-1.5 ${sidebarFooterIconBoxClass}`}>
            <LogOut className="w-5 h-5" strokeWidth={2} aria-hidden />
          </div>
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </div>

    {/* Mobile bottom navigation */}
    <nav
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 ${className}`}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around gap-1">
        {mobilePrimaryItems.map((item) => {
          const isActive =
            pathname === item.href
            || (item.href === '/focus' && !!pathname && pathname.startsWith('/focus'));

          if (item.name === 'Focus') {
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  if (pathname !== '/focus') router.push('/focus');
                }}
                className="group flex flex-1 flex-col items-center justify-center min-w-0 py-1"
              >
                {renderNavIcon(item, isActive || pathname?.startsWith('/focus'))}
                <span
                  className={`text-[10px] font-medium truncate ${
                    isActive || pathname?.startsWith('/focus')
                      ? 'text-[#5043F3]'
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.name}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className="group flex flex-1 flex-col items-center justify-center min-w-0 py-1 no-underline"
            >
              {renderNavIcon(item, isActive)}
              <span
                className={`text-[10px] font-medium truncate ${
                  isActive ? 'text-[#5043F3]' : 'text-muted-foreground'
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMobileMoreOpen(true)}
          className="group flex flex-1 flex-col items-center justify-center min-w-0 py-1"
          aria-label="More navigation options"
        >
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground group-hover:bg-muted transition-all duration-200 ${sidebarIconBoxClass}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">More</span>
        </button>
      </div>
    </nav>

    {mobileMoreOpen && (
      <div className="lg:hidden fixed inset-0 z-50">
        <button
          type="button"
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileMoreOpen(false)}
          aria-label="Close menu"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">More</h2>
            <button
              type="button"
              onClick={() => setMobileMoreOpen(false)}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {mobileMoreItems.map((item) => {
              const isActive =
                pathname === item.href
                || (item.href === '/o' && !!pathname && pathname.startsWith('/o/'));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMoreOpen(false)}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-3 no-underline transition-colors ${sidebarIconBoxClass} ${
                    isActive
                      ? 'border-[#5043F3]/30 bg-[#5043F3]/10 text-[#5043F3]'
                      : 'border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setMobileMoreOpen(false);
                setComposerInitialPanel('composer');
                setShowSoundscapeComposer(true);
              }}
              className={`flex items-center gap-3 rounded-xl border border-border px-3 py-3 text-foreground hover:bg-muted transition-colors ${sidebarIconBoxClass}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">Settings</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-foreground hover:bg-muted transition-colors [&_svg]:w-6 [&_svg]:h-6 [&_svg]:shrink-0"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" fill="none" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 8l4 4-4 4" />
            </svg>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    )}

    <SpacesDrawer isOpen={showSpacesDrawer} onClose={() => setShowSpacesDrawer(false)} />

    <SoundscapeComposer
      isOpen={showSoundscapeComposer}
      onClose={() => {
        setShowSoundscapeComposer(false);
        setComposerInitialPanel('composer');
        setIntegrationsOAuth(null);
      }}
      initialPanel={composerInitialPanel}
      integrationsOAuth={integrationsOAuth}
      onIntegrationsOAuthConsumed={() => setIntegrationsOAuth(null)}
    />
    </>
    </SoundscapeEngineProvider>
  );
}

