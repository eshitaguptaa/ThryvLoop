/**
 * Help Centre knowledge base — categories, articles, and search helpers.
 */

export const HELP_CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'rocket_launch',
    description: 'Create your account, learn the layout, and take your first steps.',
    articles: [
      {
        id: 'what-is-thryvloop',
        question: 'What is ThryvLoop?',
        answer:
          'ThryvLoop is an all-in-one productivity workspace that combines focus sessions, task management, calendar sync, analytics, and an AI assistant (ThryvBot) in a single hub — so you spend less time switching between apps and more time doing meaningful work.',
        keywords: ['overview', 'introduction', 'product'],
      },
      {
        id: 'create-account',
        question: 'How do I create an account?',
        answer:
          'Visit the homepage and click **Get Started**, or open **Sign Up** from the navigation bar. You can register with email and password, or continue with Google. After signing up, you\'ll land on your Home dashboard at `/home`.',
        keywords: ['signup', 'register', 'sign up', 'google'],
      },
      {
        id: 'sign-in',
        question: 'How do I sign in?',
        answer:
          'Click **Sign In** on the homepage or go to `/?auth=signin`. Use the same method you registered with (email or Google). If you\'re already signed in and visit the homepage, you\'ll be redirected to `/home` automatically.',
        keywords: ['login', 'signin', 'auth'],
      },
      {
        id: 'app-navigation',
        question: 'How do I navigate the app?',
        answer:
          'Once signed in, use the **sidebar** on the left (or the menu icon on mobile) to reach Home, Focus, Calendar, Tasks, and Analysis. The gear icon opens **Settings** (timer, soundscape, and integrations). ThryvBot appears as a floating assistant on most pages.',
        keywords: ['sidebar', 'navigation', 'menu', 'layout'],
      },
      {
        id: 'first-day-checklist',
        question: 'What should I do on my first day?',
        answer:
          '1) Connect Google in **Settings → Integrations** to sync calendar and email.\n2) Add a few tasks on the **Tasks** page.\n3) Start a **Focus** session with a timer and ambient space.\n4) Check **Analysis** after a day or two to see your productivity trends.\n5) Ask **ThryvBot** for a daily briefing or help planning your day.',
        keywords: ['onboarding', 'checklist', 'first steps'],
      },
    ],
  },
  {
    id: 'account-security',
    title: 'Account & Security',
    icon: 'shield',
    description: 'Passwords, profile settings, themes, and signing out.',
    articles: [
      {
        id: 'reset-password',
        question: 'How do I reset my password?',
        answer:
          'On the sign-in modal, click **Forgot password?** and enter your email. Clerk will send a secure reset link. Follow the link to set a new password, then sign in again. If you signed up with Google only, use **Continue with Google** — no separate password is required.',
        keywords: ['password', 'forgot', 'reset', 'clerk'],
      },
      {
        id: 'change-email',
        question: 'How do I change my email address?',
        answer:
          'Open your **profile** from the sidebar (avatar at the bottom) and choose **Manage account**. In the Clerk user profile modal you can add, verify, or set a primary email address.',
        keywords: ['email', 'profile', 'account'],
      },
      {
        id: 'dark-mode',
        question: 'How do I switch between light and dark mode?',
        answer:
          'Use the **theme toggle** in the sidebar (sun/moon icon) or on the landing page navbar. Your preference is saved and applies across the entire app.',
        keywords: ['theme', 'dark', 'light', 'appearance'],
      },
      {
        id: 'sign-out',
        question: 'How do I sign out?',
        answer:
          'Click your **avatar** at the bottom of the sidebar and select **Sign out**. If you have an active focus timer, ThryvLoop will save your timer state before signing out.',
        keywords: ['logout', 'sign out', 'exit'],
      },
      {
        id: 'delete-account',
        question: 'How do I delete my account?',
        answer:
          'Open **Manage account** from your profile menu. In the Clerk profile, go to **Security** and use the account deletion option. This permanently removes your Clerk account. Contact support if you need help with associated workspace data.',
        keywords: ['delete', 'remove', 'close account'],
      },
    ],
  },
  {
    id: 'home-dashboard',
    title: 'Home Dashboard',
    icon: 'home',
    description: 'Your command centre for tasks, calendar, focus, and notifications.',
    articles: [
      {
        id: 'home-overview',
        question: 'What does the Home dashboard show?',
        answer:
          'Home gives you a personalized greeting, focus-time stats, a snapshot of today\'s tasks, upcoming calendar events, workspace sync status, quick actions (start focus, add task), and your **notifications** bell.',
        keywords: ['dashboard', 'home', 'overview'],
      },
      {
        id: 'notifications',
        question: 'How do notifications work?',
        answer:
          'Tap the **bell icon** on Home to see in-app notifications (task reminders, calendar alerts, sync updates, and more). Notifications are stored in your account and marked read when you open them. Browser notifications for calendar reminders may appear if you allow them when prompted.',
        keywords: ['notifications', 'bell', 'alerts', 'reminders'],
      },
      {
        id: 'quick-actions',
        question: 'What are Quick Actions on Home?',
        answer:
          'Quick Actions let you jump straight into common workflows — starting a focus session, opening settings, syncing your workspace, or adding a task — without hunting through the sidebar.',
        keywords: ['quick actions', 'shortcuts'],
      },
      {
        id: 'workspace-sync-status',
        question: 'What does workspace sync status mean?',
        answer:
          'The sync indicator shows whether your **Google Calendar** and **Gmail** connections are healthy. Green means recently synced; errors appear if OAuth expired or scopes were denied. Open **Settings → Integrations** to reconnect or sync manually.',
        keywords: ['sync', 'google', 'status', 'connection'],
      },
    ],
  },
  {
    id: 'focus-mode',
    title: 'Focus Mode',
    icon: 'center_focus_strong',
    description: 'Immersive spaces, timers, soundscapes, and in-session task tracking.',
    articles: [
      {
        id: 'enter-focus',
        question: 'How do I enter Focus mode?',
        answer:
          'Click **Focus** in the sidebar or use a Quick Action on Home. You\'ll enter an immersive full-screen environment with optional ambient video backgrounds, a timer, music controls, and a task bar.',
        keywords: ['focus', 'start', 'immersive'],
      },
      {
        id: 'focus-spaces',
        question: 'What are Focus Spaces?',
        answer:
          'Spaces are ambient video backgrounds (forests, cities, lo-fi scenes, etc.) that help you stay in flow. Open **Focus → Spaces** from the sidebar submenu or the spaces picker inside Focus mode. Your chosen space persists between sessions.',
        keywords: ['spaces', 'background', 'video', 'ambient'],
      },
      {
        id: 'focus-timer',
        question: 'How does the Focus timer work?',
        answer:
          'The timer supports **Pomodoro-style** focus and break intervals. Configure work duration, short break, long break, and auto-start preferences in **Settings → Focus Flow**. The timer runs in Focus mode and can be opened from the sidebar under **Focus → Timer**. Your progress is saved if you navigate away or sign out.',
        keywords: ['timer', 'pomodoro', 'break', 'intervals'],
      },
      {
        id: 'focus-music',
        question: 'How do I use Focus music and soundscapes?',
        answer:
          'Open **Focus → Music** or the soundscape controls in Focus mode. Layer ambient sounds (rain, café, white noise, etc.) and adjust volume per layer. Advanced mixing is available in **Settings → Composer**. Playback continues while you stay in Focus.',
        keywords: ['music', 'soundscape', 'audio', 'ambient sounds'],
      },
      {
        id: 'focus-task-bar',
        question: 'How do I track tasks during a focus session?',
        answer:
          'Use the **task bar widget** in Focus mode to pin a task from your board. Open **Focus → Task** in the sidebar to select which task you\'re working on. Completing tasks from Focus triggers the same celebrations as the Tasks page.',
        keywords: ['task bar', 'widget', 'pin task'],
      },
      {
        id: 'focus-fullscreen',
        question: 'Can I use fullscreen in Focus mode?',
        answer:
          'Yes. Use the fullscreen control in Focus mode or press **F11** (browser fullscreen). The sidebar is hidden on `/focus` and `/meet` routes for a distraction-free experience.',
        keywords: ['fullscreen', 'distraction free'],
      },
      {
        id: 'focus-sidebar-hidden',
        question: 'Why is the sidebar hidden in Focus mode?',
        answer:
          'Focus mode is designed to minimize distractions. Use on-screen widgets for timer, music, and tasks. Press **Escape** or navigate via keyboard shortcuts to exit when needed.',
        keywords: ['sidebar', 'hidden', 'ui'],
      },
    ],
  },
  {
    id: 'tasks',
    title: 'Tasks',
    icon: 'task_alt',
    description: 'Kanban boards, priorities, categories, and celebrations.',
    articles: [
      {
        id: 'tasks-board',
        question: 'How is the Tasks board organized?',
        answer:
          'Tasks uses a **Kanban** layout with columns: **Today\'s Focus**, **In Progress**, and **Backlog**. Drag cards between columns or use the task menu to change status. This mirrors a simple GTD-style workflow.',
        keywords: ['kanban', 'board', 'columns', 'status'],
      },
      {
        id: 'add-task',
        question: 'How do I add a new task?',
        answer:
          'On the Tasks page, click **Add task** (or the + button in a column). Enter a title, optional description, due date, priority, and category. The task appears in the column you chose.',
        keywords: ['create', 'add', 'new task'],
      },
      {
        id: 'task-priority-category',
        question: 'What are priorities and categories?',
        answer:
          '**Priority** (low, medium, high) helps you sort what matters most. **Categories** let you group tasks by project or context (e.g. Work, Personal). Both appear on task cards and filter views.',
        keywords: ['priority', 'category', 'labels', 'tags'],
      },
      {
        id: 'complete-task',
        question: 'What happens when I complete a task?',
        answer:
          'Marking a task done triggers a **celebration** — a toast and optional modal with your streak progress. Completed tasks move to a done state and contribute to your **Analysis** metrics.',
        keywords: ['complete', 'done', 'celebration', 'streak'],
      },
      {
        id: 'edit-delete-task',
        question: 'How do I edit or delete a task?',
        answer:
          'Click a task card to open its detail panel. Update fields and save, or use the delete option to remove it permanently. Changes sync to your account immediately.',
        keywords: ['edit', 'delete', 'update', 'modify'],
      },
      {
        id: 'tasks-not-syncing',
        question: 'My tasks disappeared or aren\'t saving. What should I do?',
        answer:
          'Ensure you\'re signed in and have a stable internet connection. Refresh the page. If the issue persists, sign out and back in. Tasks are stored in your account — they should reappear after re-authentication.',
        keywords: ['missing', 'lost', 'not saving', 'sync'],
      },
    ],
  },
  {
    id: 'calendar',
    title: 'Calendar & Meetings',
    icon: 'calendar_month',
    description: 'Google Calendar sync, events, reminders, and Google Meet.',
    articles: [
      {
        id: 'connect-google-calendar',
        question: 'How do I connect Google Calendar?',
        answer:
          'Open **Settings** (gear icon) → **Integrations** → **Connect Google**. Authorize calendar (and optionally Gmail) access. After connecting, events sync from your primary Google Calendar into ThryvLoop.',
        keywords: ['google', 'connect', 'oauth', 'integration'],
      },
      {
        id: 'calendar-sync',
        question: 'How often does the calendar sync?',
        answer:
          'Calendar syncs when you connect, when you click **Sync now** on the Calendar page, and during background workspace syncs. The last sync time is shown on Calendar and Home. Allow a minute after connecting for the first import.',
        keywords: ['sync', 'refresh', 'import'],
      },
      {
        id: 'create-event',
        question: 'Can I create events in ThryvLoop?',
        answer:
          'Yes. On the **Calendar** page, click a time slot or **New event**. If you granted write access to Google Calendar, events created in ThryvLoop push to your Google Calendar. Otherwise, events are stored locally in your workspace.',
        keywords: ['create', 'event', 'add', 'schedule'],
      },
      {
        id: 'calendar-reminders',
        question: 'How do calendar reminders work?',
        answer:
          'ThryvLoop can surface **browser reminders** before events start. Allow notifications when your browser prompts you. Reminders also appear as in-app notifications on Home.',
        keywords: ['reminder', 'notification', 'alert', 'before event'],
      },
      {
        id: 'google-meet',
        question: 'How do I join a Google Meet from ThryvLoop?',
        answer:
          'Events with a Google Meet link show a **Join** action on Calendar and Home. Clicking opens the meeting view at `/meet/[id]` with an embedded experience. Ensure your Google connection includes calendar access with conference data.',
        keywords: ['meet', 'video', 'join', 'meeting'],
      },
      {
        id: 'calendar-not-showing',
        question: 'My calendar events aren\'t showing up',
        answer:
          '1) Confirm Google is connected in Settings → Integrations.\n2) Click **Sync now** on the Calendar page.\n3) Check that events exist in your **primary** Google Calendar within the visible date range.\n4) If you denied calendar scope during OAuth, disconnect and reconnect, ensuring you approve calendar permissions.',
        keywords: ['missing', 'empty', 'not showing', 'troubleshoot'],
      },
    ],
  },
  {
    id: 'analysis',
    title: 'Analysis & Insights',
    icon: 'analytics',
    description: 'Productivity charts, streaks, AI insights, and PDF export.',
    articles: [
      {
        id: 'analysis-overview',
        question: 'What does the Analysis page show?',
        answer:
          'Analysis visualizes your productivity over time: focus minutes, tasks completed, streaks, weekly trends, and category breakdowns. AI-generated **insights** highlight patterns and suggest improvements.',
        keywords: ['analytics', 'charts', 'stats', 'metrics'],
      },
      {
        id: 'focus-streak',
        question: 'How are focus streaks calculated?',
        answer:
          'A streak counts consecutive days where you logged meaningful focus time. Completing focus sessions and tasks both contribute to your overall productivity score shown on Analysis.',
        keywords: ['streak', 'days', 'consistency'],
      },
      {
        id: 'ai-insights',
        question: 'What are AI insights on Analysis?',
        answer:
          'ThryvLoop analyzes your recent activity and generates short, actionable insights (e.g. best focus hours, task completion trends). Insights refresh as you accumulate more data — typically after a few days of use.',
        keywords: ['ai', 'insights', 'recommendations'],
      },
      {
        id: 'export-pdf',
        question: 'Can I export my analytics as a PDF?',
        answer:
          'Yes. Use the **Export PDF** button on the Analysis page to download a snapshot of your charts and key metrics — useful for weekly reviews or sharing progress.',
        keywords: ['pdf', 'export', 'download', 'report'],
      },
      {
        id: 'analysis-empty',
        question: 'Why is my Analysis page empty?',
        answer:
          'Analysis needs activity data. Complete focus sessions and tasks for at least one day, then revisit the page. New accounts may show placeholder states until enough data is collected.',
        keywords: ['empty', 'no data', 'new user'],
      },
    ],
  },
  {
    id: 'thryvbot',
    title: 'ThryvBot Assistant',
    icon: 'smart_toy',
    description: 'Your AI copilot for tasks, calendar, and daily planning.',
    articles: [
      {
        id: 'what-is-thryvbot',
        question: 'What is ThryvBot?',
        answer:
          'ThryvBot is ThryvLoop\'s built-in AI assistant. It can answer questions about your tasks and calendar, help plan your day, summarize your schedule, and guide you through app features. It appears as a floating chat widget on most pages (hidden during Focus and Meet for minimal distraction).',
        keywords: ['ai', 'assistant', 'chatbot', 'bot'],
      },
      {
        id: 'thryvbot-capabilities',
        question: 'What can ThryvBot do?',
        answer:
          'ThryvBot can: list and create tasks, check your calendar, suggest focus priorities, deliver a **daily briefing**, and answer how-to questions about ThryvLoop. It uses live data from your workspace when you\'re signed in.',
        keywords: ['capabilities', 'features', 'help'],
      },
      {
        id: 'thryvbot-not-responding',
        question: 'ThryvBot isn\'t responding or gives an error',
        answer:
          'Ensure you\'re signed in and online. Try starting a **new conversation** from the chat header. If errors persist, refresh the page. ThryvBot requires a valid session — sign out and back in if needed. Rate limits may apply during heavy usage.',
        keywords: ['error', 'broken', 'not working', 'slow'],
      },
      {
        id: 'thryvbot-privacy',
        question: 'Does ThryvBot use my personal data?',
        answer:
          'ThryvBot accesses your ThryvLoop workspace data (tasks, calendar summaries) to provide relevant answers. Conversations are tied to your account. Do not share sensitive credentials in chat.',
        keywords: ['privacy', 'data', 'security'],
      },
    ],
  },
  {
    id: 'settings-integrations',
    title: 'Settings & Integrations',
    icon: 'settings',
    description: 'Timer preferences, soundscape composer, and Google workspace.',
    articles: [
      {
        id: 'open-settings',
        question: 'How do I open Settings?',
        answer:
          'Click the **gear icon** at the bottom of the sidebar. Settings opens as a modal with panels: **Composer** (soundscape mixing), **Focus Flow** (timer preferences), and **Integrations** (Google connect/disconnect).',
        keywords: ['settings', 'gear', 'preferences'],
      },
      {
        id: 'google-integration',
        question: 'What does the Google integration include?',
        answer:
          'Connecting Google enables **Calendar sync** (read/write depending on scopes granted) and optional **Gmail** sync for your workspace hub. You can connect via Settings → Integrations or automatically when signing up with Google.',
        keywords: ['google', 'gmail', 'calendar', 'workspace'],
      },
      {
        id: 'disconnect-google',
        question: 'How do I disconnect Google?',
        answer:
          'Open **Settings → Integrations** and click **Disconnect** next to Google. This revokes ThryvLoop\'s access tokens. Previously synced calendar blocks may remain until cleared; new syncs stop immediately.',
        keywords: ['disconnect', 'revoke', 'remove google'],
      },
      {
        id: 'google-oauth-error',
        question: 'Google connection failed or was denied',
        answer:
          'If OAuth fails: 1) Ensure pop-ups aren\'t blocked.\n2) Try again in an incognito window with extensions disabled.\n3) On the Google consent screen, approve **all requested permissions** (especially Calendar).\n4) If you previously denied access, visit [Google Account Permissions](https://myaccount.google.com/permissions), remove ThryvLoop, and reconnect.',
        keywords: ['oauth', 'error', 'denied', 'failed', 'permissions'],
      },
      {
        id: 'soundscape-settings',
        question: 'How do I customize my soundscape?',
        answer:
          'In **Settings → Composer**, mix multiple ambient layers, adjust individual volumes, and preview combinations. Changes apply to Focus mode music playback. Mute or adjust Spaces volume separately from the Focus UI.',
        keywords: ['soundscape', 'composer', 'volume', 'mix'],
      },
      {
        id: 'timer-settings',
        question: 'How do I change timer durations?',
        answer:
          'Open **Settings → Focus Flow** to set focus interval, short break, long break, cycles before long break, and whether breaks auto-start. Settings persist across sessions and devices.',
        keywords: ['timer', 'pomodoro', 'duration', 'breaks'],
      },
    ],
  },
  {
    id: 'team-workspaces',
    title: 'Team Workspaces',
    icon: 'groups',
    description: 'Shared org workspaces for teams (when enabled).',
    articles: [
      {
        id: 'b2b-overview',
        question: 'What are Team Workspaces?',
        answer:
          'Team Workspaces let organizations collaborate on shared tasks, view team analytics, and manage members under `/o/[workspace]`. This feature is available when your deployment has B2B workspaces enabled.',
        keywords: ['team', 'org', 'workspace', 'b2b'],
      },
      {
        id: 'create-workspace',
        question: 'How do I create a team workspace?',
        answer:
          'Navigate to **Workspaces** in the sidebar (when enabled) or visit `/o`. Click **Create workspace**, enter a name, and confirm. You\'ll become the admin of the new organization.',
        keywords: ['create', 'new', 'organization'],
      },
      {
        id: 'invite-members',
        question: 'How do I invite team members?',
        answer:
          'Open your workspace → **Members**. Send email invites and assign roles (admin, member). Invitees receive a link to join the organization via Clerk.',
        keywords: ['invite', 'members', 'team', 'roles'],
      },
      {
        id: 'org-tasks',
        question: 'How do shared team tasks work?',
        answer:
          'Each workspace has its own **Tasks** board at `/o/[slug]/tasks`. Assign tasks to members, track status on the shared Kanban, and review completion in **Analytics**.',
        keywords: ['shared tasks', 'assign', 'collaboration'],
      },
      {
        id: 'b2b-not-visible',
        question: 'I don\'t see Workspaces in my sidebar',
        answer:
          'Team Workspaces may not be enabled on your plan or deployment. The personal ThryvLoop experience (Home, Focus, Tasks, etc.) is fully available without team features.',
        keywords: ['missing', 'disabled', 'not available'],
      },
    ],
  },
  {
    id: 'billing-plans',
    title: 'Billing & Plans',
    icon: 'payments',
    description: 'Subscriptions, upgrades, and support tiers.',
    articles: [
      {
        id: 'pricing-plans',
        question: 'What plans does ThryvLoop offer?',
        answer:
          'Visit the **Pricing** section on the homepage for current plans. Tiers typically include a free starter plan with core features and paid plans with advanced analytics, integrations, and priority support.',
        keywords: ['pricing', 'plans', 'free', 'pro'],
      },
      {
        id: 'upgrade-plan',
        question: 'How do I upgrade my plan?',
        answer:
          'From the homepage **Pricing** section, select the plan that fits your needs and follow the checkout flow. If you already subscribe, manage billing through the link in your account email or contact support for plan changes.',
        keywords: ['upgrade', 'subscribe', 'premium'],
      },
      {
        id: 'billing-invoices',
        question: 'Where can I find invoices?',
        answer:
          'Invoices are sent to your account email after each billing cycle. For historical invoices or billing questions, contact support with your registered email address.',
        keywords: ['invoice', 'receipt', 'billing'],
      },
      {
        id: 'cancel-subscription',
        question: 'How do I cancel my subscription?',
        answer:
          'Contact support or use the billing portal link from your subscription confirmation email. Cancellation takes effect at the end of the current billing period; you retain access until then.',
        keywords: ['cancel', 'unsubscribe', 'refund'],
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: 'build',
    description: 'Fix common issues with sync, performance, and browsers.',
    articles: [
      {
        id: 'page-not-loading',
        question: 'A page won\'t load or shows a blank screen',
        answer:
          'Hard-refresh (**Ctrl+Shift+R** or **Cmd+Shift+R**). Clear site cache. Disable ad-blockers or privacy extensions that may block Clerk or API calls. Try Chrome, Edge, or Firefox on the latest version.',
        keywords: ['blank', 'loading', 'white screen', 'stuck'],
      },
      {
        id: 'signed-in-wrong-page',
        question: 'I\'m signed in but keep getting redirected',
        answer:
          'Visiting `/` while signed in redirects to `/home` by design. Bookmark `/home` for direct access. If you\'re stuck in a redirect loop, clear cookies for the site and sign in again.',
        keywords: ['redirect', 'loop', 'home'],
      },
      {
        id: 'audio-not-playing',
        question: 'Focus music or soundscapes won\'t play',
        answer:
          'Browsers block autoplay until you interact with the page. Click anywhere in Focus mode first. Check system volume and that the tab isn\'t muted. Verify soundscape layers aren\'t muted in Settings → Composer.',
        keywords: ['audio', 'music', 'sound', 'autoplay'],
      },
      {
        id: 'video-background-issue',
        question: 'Focus Space video backgrounds are slow or stuttering',
        answer:
          'Video backgrounds require GPU decoding. Close heavy tabs, lower display resolution, or switch to a lighter space. On metered connections, consider using timer-only focus without video backgrounds.',
        keywords: ['video', 'lag', 'performance', 'spaces'],
      },
      {
        id: 'sync-errors',
        question: 'Workspace sync shows errors',
        answer:
          'Open Settings → Integrations and click **Sync now**. If errors mention expired tokens, disconnect and reconnect Google. Check [Google Account Permissions](https://myaccount.google.com/permissions) to ensure ThryvLoop has calendar access.',
        keywords: ['sync error', 'failed', 'token', 'expired'],
      },
      {
        id: 'mobile-experience',
        question: 'How well does ThryvLoop work on mobile?',
        answer:
          'ThryvLoop is optimized for desktop productivity. Mobile browsers support core features (tasks, calendar, focus) but some immersive Focus features work best on larger screens. Use the mobile sidebar menu for navigation.',
        keywords: ['mobile', 'phone', 'tablet', 'responsive'],
      },
      {
        id: 'supported-browsers',
        question: 'Which browsers are supported?',
        answer:
          'Use the latest versions of **Chrome**, **Edge**, **Firefox**, or **Safari**. Enable JavaScript and third-party cookies for auth (Clerk). WebGL helps with Focus space rendering.',
        keywords: ['browser', 'chrome', 'safari', 'firefox', 'compatibility'],
      },
    ],
  },
  {
    id: 'privacy-data',
    title: 'Privacy & Data',
    icon: 'lock',
    description: 'How your data is stored, secured, and controlled.',
    articles: [
      {
        id: 'data-storage',
        question: 'Where is my data stored?',
        answer:
          'Account authentication is handled by **Clerk**. Workspace data (tasks, calendar blocks, preferences, notifications) is stored in **Supabase** with row-level security tied to your user ID.',
        keywords: ['storage', 'database', 'supabase', 'clerk'],
      },
      {
        id: 'google-data-access',
        question: 'What Google data does ThryvLoop access?',
        answer:
          'With your consent, ThryvLoop reads (and optionally writes) **Google Calendar** events and may sync **Gmail** metadata for your workspace hub. We only access what you authorize during OAuth — review permissions on the Google consent screen.',
        keywords: ['google', 'permissions', 'scopes', 'privacy'],
      },
      {
        id: 'export-data',
        question: 'Can I export my data?',
        answer:
          'Use **Analysis → Export PDF** for productivity reports. For a full data export request, contact support with your registered email.',
        keywords: ['export', 'gdpr', 'download data'],
      },
      {
        id: 'contact-support',
        question: 'How do I contact support?',
        answer:
          'Email **support@thryvloop.com** with your account email, a description of the issue, and screenshots if possible. Include steps to reproduce the problem. Priority support is available on paid plans.',
        keywords: ['support', 'contact', 'help', 'email'],
      },
    ],
  },
];

/** Flat list of all articles with category metadata for search. */
export function getAllHelpArticles() {
  return HELP_CATEGORIES.flatMap((category) =>
    category.articles.map((article) => ({
      ...article,
      categoryId: category.id,
      categoryTitle: category.title,
      categoryIcon: category.icon,
    })),
  );
}

/** Filter articles by query (question, answer, keywords, category). */
export function searchHelpArticles(query) {
  const q = query.trim().toLowerCase();
  if (!q) return getAllHelpArticles();

  return getAllHelpArticles().filter((article) => {
    const haystack = [
      article.question,
      article.answer,
      article.categoryTitle,
      ...(article.keywords || []),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q) || q.split(/\s+/).every((word) => haystack.includes(word));
  });
}

/** Popular quick-link article ids shown in the hero. */
export const POPULAR_ARTICLE_IDS = [
  'create-account',
  'connect-google-calendar',
  'enter-focus',
  'tasks-board',
  'reset-password',
  'what-is-thryvbot',
];
