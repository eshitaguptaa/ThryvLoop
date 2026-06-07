'use client';

import { useMemo, useState } from 'react';
import FeatureCardIcon from '@/components/landing_sections/FeatureCardIcon';

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

const DAYS = [
  { id: 'today', label: 'Today', dayNum: '12', focusLabel: "Today's Focus" },
  { id: 'wed', label: 'Wed', dayNum: '13', focusLabel: "Wednesday's Focus" },
  { id: 'thu', label: 'Thu', dayNum: '14', focusLabel: "Thursday's Focus" },
  { id: 'fri', label: 'Fri', dayNum: '15', focusLabel: "Friday's Focus" },
];

const INITIAL_TASKS_BY_DAY = {
  today: [
    {
      id: 'today-launch',
      title: 'Launch Review',
      style: 'urgent',
      due: 'Due in 2h',
      dueIcon: 'timer',
      showAvatars: true,
    },
    {
      id: 'today-report',
      title: 'Quarterly Report',
      time: '4:30 PM',
      timeIcon: 'event',
      style: 'default',
    },
    {
      id: 'today-call',
      title: 'Client Call',
      time: '5:00 PM',
      timeIcon: 'videocam',
      style: 'default',
      hoverAccent: 'blue',
    },
  ],
  wed: [
    {
      id: 'wed-standup',
      title: 'Team Standup',
      time: '9:00 AM',
      timeIcon: 'groups',
      style: 'default',
    },
    {
      id: 'wed-design',
      title: 'Design Review',
      style: 'urgent',
      due: 'Due at noon',
      dueIcon: 'timer',
    },
    {
      id: 'wed-sprint',
      title: 'Sprint Planning',
      time: '2:00 PM',
      timeIcon: 'event',
      style: 'default',
    },
  ],
  thu: [
    {
      id: 'thu-deck',
      title: 'Investor Deck',
      style: 'urgent',
      due: 'Due EOD',
      dueIcon: 'timer',
      showAvatars: true,
    },
    {
      id: 'thu-review',
      title: 'Code Review',
      time: '11:00 AM',
      timeIcon: 'code',
      style: 'default',
    },
    {
      id: 'thu-1on1',
      title: '1:1 with Manager',
      time: '3:30 PM',
      timeIcon: 'person',
      style: 'default',
      hoverAccent: 'blue',
    },
  ],
  fri: [
    {
      id: 'fri-recap',
      title: 'Weekly Recap',
      time: '10:00 AM',
      timeIcon: 'summarize',
      style: 'default',
    },
    {
      id: 'fri-ship',
      title: 'Ship v2.0',
      style: 'urgent',
      due: 'Before 5 PM',
      dueIcon: 'rocket_launch',
    },
    {
      id: 'fri-lunch',
      title: 'Team Lunch',
      time: '12:30 PM',
      timeIcon: 'restaurant',
      style: 'default',
      hoverAccent: 'blue',
    },
  ],
};

const INITIAL_COMPLETED = new Set(['today-report', 'wed-standup', 'thu-review']);

export default function TasksShowcase() {
  const [selectedDay, setSelectedDay] = useState('today');
  const [tasksByDay, setTasksByDay] = useState(INITIAL_TASKS_BY_DAY);
  const [completed, setCompleted] = useState(() => new Set(INITIAL_COMPLETED));
  const [draft, setDraft] = useState('');

  const activeDay = DAYS.find((d) => d.id === selectedDay) ?? DAYS[0];
  const tasks = tasksByDay[selectedDay] ?? [];

  const { doneCount, totalCount, ringPct } = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => completed.has(t.id)).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { doneCount: done, totalCount: total, ringPct: pct };
  }, [tasks, completed]);

  const toggleTask = (id) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addTask = () => {
    const title = draft.trim();
    if (!title) return;
    const id = `${selectedDay}-new-${Date.now()}`;
    setTasksByDay((prev) => ({
      ...prev,
      [selectedDay]: [
        ...prev[selectedDay],
        {
          id,
          title,
          style: 'default',
          time: activeDay.label,
          timeIcon: 'event',
        },
      ],
    }));
    setDraft('');
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl bg-card border border-border shadow-xl shadow-gray-200/50 dark:shadow-black/30 hover:shadow-2xl hover:shadow-yellow-500/10 hover:-translate-y-1 transition-all duration-300 h-full">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/30 rounded-full blur-3xl pointer-events-none group-hover:bg-yellow-400/40 transition-colors" />

      <div className="p-6 pb-2 relative z-10 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <FeatureCardIcon icon="notifications" tone="amber" size="sm" fill={1} />
          <div>
            <h3 className="text-base font-bold text-foreground leading-tight">Task Reminders</h3>
            <p className="text-[#534f96] text-[10px] font-bold uppercase tracking-wider mt-0.5">
              {activeDay.focusLabel}
            </p>
          </div>
        </div>
        <div className="relative h-12 w-12 flex items-center justify-center">
          <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
            <path
              className="text-gray-100 dark:text-muted"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="text-yellow-500 transition-all duration-500"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeDasharray={`${ringPct}, 100`}
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center leading-none">
            <span className="text-[10px] font-black text-foreground tabular-nums">
              {doneCount}/{totalCount}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 relative z-10">
        <div className="flex justify-between items-stretch gap-2">
          {DAYS.map((day) => {
            const active = selectedDay === day.id;
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setSelectedDay(day.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-lg py-2 cursor-pointer transition-colors ${
                  active
                    ? 'bg-yellow-500 text-white shadow-md'
                    : 'bg-muted border border-border hover:bg-muted/80 group/day'
                }`}
              >
                <span
                  className={`text-[8px] font-bold uppercase tracking-wider ${
                    active ? 'text-white' : 'text-muted-foreground group-hover/day:text-foreground'
                  }`}
                >
                  {day.label}
                </span>
                <span
                  className={`${active ? 'text-sm font-black' : 'text-xs font-bold text-foreground'}`}
                >
                  {day.dayNum}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 flex-grow flex flex-col gap-3 relative z-10 overflow-hidden min-h-[168px]">
        {tasks.map((task) => {
          const isDone = completed.has(task.id);
          if (task.style === 'urgent') {
            return (
              <div key={task.id} className="relative group/task cursor-pointer">
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  className={`relative w-full text-left bg-card p-3 rounded-xl border-y border-r border-border shadow-sm transition-all hover:shadow-md ${
                    isDone ? 'border-l-[3px] border-l-gray-300 opacity-70' : 'border-l-[3px] border-l-red-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isDone ? 'border-yellow-500 bg-yellow-500' : 'border-border'
                      }`}
                    >
                      {isDone && (
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start">
                        <span
                          className={`text-xs font-bold truncate pr-2 ${
                            isDone ? 'text-muted-foreground line-through' : 'text-foreground'
                          }`}
                        >
                          {task.title}
                        </span>
                        {!isDone && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white whitespace-nowrap">
                            URGENT
                          </span>
                        )}
                      </div>
                      {!isDone && (
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-medium">
                            <MaterialSymbol icon={task.dueIcon} className="text-[12px]" fill={0} />
                            <span>{task.due}</span>
                          </div>
                          {task.showAvatars && (
                            <div className="flex -space-x-1.5">
                              <img
                                alt=""
                                className="w-4 h-4 rounded-full border-2 border-card"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAseiFl0rSt5HMITynLYhO0Ombv-FcnLQzh_FiYrY7VloTeq2sRz5lMMiEhpu4U9vdE9HWcSn1167d13uHLffdrGfZuL-pnrTip0JhuKwkuZEzYqtlcM5PFgnLyEgN-aod9F-YK569KsfnftAiVGvB099w_SQn967aAgY6SSwRoiXQJnsSAu3f6TyyQZrLr03V_nKOWa9NRVquX_W_3HDt5bdI13bNzF74zQOPFs0hQFkzZW0RrAIdTlv5q3hDuWa0N90bg_Im4gmU"
                              />
                              <img
                                alt=""
                                className="w-4 h-4 rounded-full border-2 border-card"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNmdYyH1_WPqA_X7UXNAXEZ9cBL9_WPv9ofLATXvfI-At0TcqHdHfANnSg_PYCt1D9Gs0tsh_15G6ZjHEWPV_l4vYUUbW7Z4J32pXhsICvT3a24DWjqJY4PI020QOXPN8iSjB_xcoN6DnUJ6Ve7hl4py3Qyrqlcus97KKfOGbP_r1vyguyI6bvlOnt6xv7MFSBXr2EogyTomXDjnkBRBGwtJ_t8jY3I4cCdz3T9UVm2NHTcYa76491T1pzikkjDFrtvmuEucTTNPY"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            );
          }

          const hoverBorder =
            task.hoverAccent === 'blue'
              ? 'group-hover/task:border-blue-500'
              : 'group-hover/task:border-yellow-500';

          return (
            <div key={task.id} className="relative group/task cursor-pointer">
              <button
                type="button"
                onClick={() => toggleTask(task.id)}
                className={`relative w-full text-left p-3 rounded-xl border transition-colors ${
                  isDone
                    ? 'bg-muted border-border'
                    : 'bg-muted border-border hover:bg-muted/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isDone ? 'border-yellow-500 bg-yellow-500' : `border-gray-300 ${hoverBorder}`
                    }`}
                  >
                    {isDone && (
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs font-semibold transition-all ${
                          isDone
                            ? 'text-muted-foreground line-through decoration-muted-foreground decoration-2 group-hover/task:no-underline group-hover/task:text-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 shrink-0">
                    <MaterialSymbol icon={task.timeIcon} className="text-[12px]" fill={0} /> {task.time}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <div className="p-6 pt-3 mt-auto relative z-10">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-grow">
            <input
              className="w-full bg-muted border border-border rounded-lg py-2 pl-3 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 text-foreground placeholder-muted-foreground transition-shadow"
              placeholder="+ Add task..."
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTask();
              }}
            />
          </div>
          <button
            type="button"
            onClick={addTask}
            className="h-8 w-8 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95"
            aria-label="Add task"
          >
            <MaterialSymbol icon="arrow_upward" className="text-[16px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
