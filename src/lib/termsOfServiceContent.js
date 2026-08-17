import { SITE_NAME, getSiteUrl } from '@/lib/siteConfig';
import { PRIVACY_META } from '@/lib/privacyPolicyContent';
import { LEGAL_CONFIG } from '@/lib/legalConfig';

export const TERMS_META = {
  lastUpdated: PRIVACY_META.lastUpdated,
  effectiveDate: PRIVACY_META.effectiveDate,
  contactEmail: PRIVACY_META.supportEmail,
  privacyEmail: PRIVACY_META.contactEmail,
  grievanceEmail: PRIVACY_META.grievanceEmail,
  grievanceOfficerLabel: PRIVACY_META.grievanceOfficerLabel,
  legalEntity: PRIVACY_META.legalEntity,
  registeredAddress: PRIVACY_META.registeredAddress,
  governingLaw: PRIVACY_META.governingLaw,
  jurisdiction: PRIVACY_META.jurisdiction,
  counselNotice: LEGAL_CONFIG.counselNotice,
};

/** Plain-language highlights shown at the top of the page. */
export const TERMS_HIGHLIGHTS = [
  {
    icon: 'public',
    title: 'India & worldwide',
    description:
      'These Terms apply to all users. Indian law governs, with mandatory local consumer and data rights preserved where required.',
  },
  {
    icon: 'apps',
    title: 'Every product feature',
    description:
      'Covers Focus, Tasks, Calendar, Meet, Analytics, ThryvBot, Google sync, team workspaces, and more — as implemented in ThryvLoop.',
  },
  {
    icon: 'gavel',
    title: 'Clear liability limits',
    description:
      'The Service is provided as-is. Liability is capped where Indian and international law permits.',
  },
  {
    icon: 'policy',
    title: 'Paired with Privacy',
    description:
      'Use of the Service is also governed by our Privacy Policy, which explains how personal data is handled.',
  },
];

export const TERMS_SECTIONS = [
  {
    id: 'agreement',
    title: '1. Agreement to Terms',
    icon: 'handshake',
    blocks: [
      {
        type: 'p',
        text: `These Terms of Service ("**Terms**") are a legally binding agreement between you and **${TERMS_META.legalEntity}** ("**ThryvLoop**," "**we**," "**us**," "**our**") governing access to **${getSiteUrl()}**, the ThryvLoop web application, and related services (collectively, the "**Service**") — whether you access the Service from **India or any other country**.`,
      },
      {
        type: 'p',
        text: 'By creating an account, submitting a waitlist form, clicking acceptance, or otherwise using the Service, you agree to these Terms and our [Privacy Policy](/privacy). If you use the Service on behalf of a company or organisation, you represent that you have authority to bind that entity.',
      },
      {
        type: 'p',
        text: 'These Terms are intended to comply with applicable law in **India** (including the Information Technology Act, 2000, Consumer Protection Act, 2019, and Digital Personal Data Protection Act, 2023 where relevant) and to respect **mandatory consumer protections** in other jurisdictions. **If you do not agree, do not use the Service.**',
      },
      {
        type: 'p',
        text: 'Product help is available in our [Help Centre](/help).',
      },
    ],
  },
  {
    id: 'eligibility',
    title: '2. Eligibility & Accounts',
    icon: 'person',
    blocks: [
      {
        type: 'h3',
        text: '2.1 Who may use the Service',
      },
      {
        type: 'ul',
        items: [
          'You must be legally able to enter a binding contract in your jurisdiction;',
          '**India (DPDPA):** users under **18** require verifiable parental/guardian consent;',
          '**United States (COPPA):** we do not knowingly offer the Service to children under **13**;',
          '**EEA/UK:** minimum age per local GDPR rules (typically **16**, or lower age set by member state, not below **13**).',
        ],
      },
      {
        type: 'h3',
        text: '2.2 Account responsibilities',
      },
      {
        type: 'ul',
        items: [
          'Provide **accurate** registration information and keep it updated;',
          'Maintain confidentiality of login credentials — do not share accounts;',
          'You are responsible for **all activity** under your account;',
          'Authentication is provided through **Clerk** (email/password and/or Google social sign-in);',
          'Notify **support@thryvloop.com** immediately if you suspect unauthorised access;',
          'We may suspend accounts that appear compromised or fraudulent.',
        ],
      },
    ],
  },
  {
    id: 'service',
    title: '3. Description of the Service',
    icon: 'apps',
    blocks: [
      {
        type: 'p',
        text: `**${SITE_NAME}** is a unified productivity workspace. Current and planned features include:`,
      },
      {
        type: 'ul',
        items: [
          '**Home** — personalised dashboard with focus stats, tasks preview, calendar snapshot, sync status, and in-app notifications;',
          '**Focus** — immersive focus mode with Pomodoro-style **timer**, ambient **Spaces** (video backgrounds), **soundscape** audio, and in-session task pinning;',
          '**Tasks** — Kanban-style boards (Today\'s Focus, In Progress, Backlog) with priorities, categories, due dates, and optional assignees;',
          '**Calendar** — native events plus optional **Google Calendar** sync; meeting reminders;',
          '**Meet** — embedded **Google Meet** for online calendar events;',
          '**Analytics** — productivity charts, streaks, AI-generated insights, and **PDF export**;',
          '**ThryvBot** — AI assistant (Google Gemini) with workspace-aware chat and automated actions;',
          '**Settings** — timer, soundscape composer, theme, and **Google integrations**;',
          '**Team workspaces (B2B)** — shared org tasks and member management when enabled;',
          '**Landing waitlists** — e.g. Company Hubs early-access email signup.',
        ],
      },
      {
        type: 'p',
        text: 'We may add, modify, suspend, or discontinue features at any time. Beta or experimental features are **as-is** and may change without notice.',
      },
    ],
  },
  {
    id: 'feature-terms',
    title: '4. Feature-Specific Terms',
    icon: 'tune',
    blocks: [
      {
        type: 'h3',
        text: '4.1 Focus, timer & soundscape',
      },
      {
        type: 'p',
        text: 'Focus sessions may be **logged** for analytics (duration, timestamps). **YouTube** may power Spaces video backgrounds — your use is subject to [YouTube\'s Terms](https://www.youtube.com/t/terms). Audio soundscapes play locally/in-browser; you are responsible for volume and hearing safety.',
      },
      {
        type: 'h3',
        text: '4.2 Tasks & assignments',
      },
      {
        type: 'p',
        text: 'You are responsible for task content. Assigning tasks to others (**assigned_users**) requires that you have authority to involve them. Do not use tasks to store passwords, government IDs, or payment data.',
      },
      {
        type: 'h3',
        text: '4.3 Calendar, Gmail hub & Meet',
      },
      {
        type: 'p',
        text: 'Google integration is **optional** and requires OAuth consent. We sync calendar events and limited **Gmail metadata** (subject, sender — not bodies) into your workspace hub. Calendar times and Meet links depend on Google accuracy — **verify critical meetings independently**. Joining Meet through ThryvLoop is subject to Google\'s terms.',
      },
      {
        type: 'h3',
        text: '4.4 Analytics & PDF export',
      },
      {
        type: 'p',
        text: 'Analytics and AI insights are **informational only**, not professional, medical, legal, or financial advice. PDF export renders your data on our servers momentarily to generate a download; we do not guarantee chart accuracy for external reporting.',
      },
      {
        type: 'h3',
        text: '4.5 In-app & browser notifications',
      },
      {
        type: 'p',
        text: 'In-app notifications appear in the Service UI. **Browser push notifications** for calendar reminders require permission you grant in your browser/OS; we are not responsible if notifications fail due to device settings or browser blocks.',
      },
    ],
  },
  {
    id: 'acceptable-use',
    title: '5. Acceptable Use',
    icon: 'rule',
    blocks: [
      {
        type: 'p',
        text: 'You agree to use the Service lawfully and **not** to:',
      },
      {
        type: 'ul',
        items: [
          'Violate applicable law (including Indian IT Act, DPDPA, copyright, export controls, or employment regulations);',
          'Infringe intellectual property, privacy, or publicity rights of others;',
          'Upload malware, viruses, spam, phishing, or unlawful/obscene/harassing content;',
          'Scrape, crawl, reverse engineer, decompile, or probe the Service except as law expressly permits;',
          'Bypass authentication, rate limits, or security measures;',
          'Overload infrastructure or interfere with other users;',
          'Impersonate any person or misrepresent affiliation;',
          'Use ThryvBot/AI to generate illegal, harmful, or deceptive content;',
          'Resell, white-label, or sublicense the Service without written consent;',
          'Use the Service for high-risk activities where failure could cause death, personal injury, or environmental damage.',
        ],
      },
      {
        type: 'p',
        text: 'We may investigate, remove content, **suspend or terminate** accounts, and cooperate with authorities. No refund is owed for termination due to your breach.',
      },
    ],
  },
  {
    id: 'your-content',
    title: '6. Your Content & Data Licence',
    icon: 'folder',
    blocks: [
      {
        type: 'p',
        text: 'You retain ownership of content you submit (tasks, calendar entries, chat messages, etc.). You grant ThryvLoop a **worldwide, non-exclusive, royalty-free licence** to host, store, reproduce, process, transmit, display, and create derivative works of your content **solely to operate, secure, and improve the Service**, including AI features you invoke and backups.',
      },
      {
        type: 'p',
        text: 'You represent that: (a) you own or have rights to your content; (b) syncing Google or other third-party data is authorised; (c) bringing **third-party personal data** (email senders, assignees, attendees) into ThryvLoop is lawful for you.',
      },
      {
        type: 'p',
        text: 'Personal data is processed under our [Privacy Policy](/privacy). You may delete much of your data in-app and may delete your account via profile settings. Erasure is subject to legal retention and backup purge timelines stated in the Privacy Policy.',
      },
    ],
  },
  {
    id: 'integrations',
    title: '7. Third-Party Services',
    icon: 'link',
    blocks: [
      {
        type: 'p',
        text: 'The Service relies on and integrates with third parties, including:',
      },
      {
        type: 'ul',
        items: [
          '**Clerk** — authentication and organisation management;',
          '**Google** — sign-in, Calendar, Gmail metadata, Meet, Gemini AI;',
          '**YouTube** — Focus Spaces video embeds;',
          '**Supabase, Vercel** — infrastructure (see Privacy Policy);',
          '**Resend** — waitlist/notification email when configured.',
        ],
      },
      {
        type: 'p',
        text: 'Third-party services are governed by **their** terms and policies. We do not control outages, API changes, or discontinuation of third-party features. **We are not liable** for third-party acts except as required by applicable law.',
      },
      {
        type: 'p',
        text: 'Disconnect Google anytime in **Settings → Integrations**. Disconnecting stops future sync; stored copies may remain until you delete them or close your account.',
      },
    ],
  },
  {
    id: 'ai',
    title: '8. ThryvBot & Artificial Intelligence',
    icon: 'smart_toy',
    blocks: [
      {
        type: 'p',
        text: 'ThryvBot uses **Google Gemini** and may access summaries of your tasks, calendar, and focus data to respond.',
      },
      {
        type: 'h3',
        text: '8.1 What ThryvBot may do',
      },
      {
        type: 'ul',
        items: [
          '**Create or update tasks** (title, column, priority, due date, etc.);',
          '**Create calendar events** in your ThryvLoop/Google calendar where connected;',
          '**Read** workspace data via tool calls to answer questions;',
          'Generate **analytics insights** and daily briefings.',
        ],
      },
      {
        type: 'h3',
        text: '8.2 Your responsibilities',
      },
      {
        type: 'ul',
        items: [
          '**AI may be wrong** — always verify before acting;',
          'You are **solely responsible** for AI-initiated changes and decisions;',
          'Do not submit secrets, OTPs, government IDs, or payment data in chat;',
          'AI use is subject to **per-user rate limits**;',
          'We disclaim all warranties regarding AI accuracy and fitness for purpose;',
          'AI is **not** legal, medical, financial, tax, or HR advice.',
        ],
      },
      {
        type: 'p',
        text: 'Conversation history is stored per the Privacy Policy. We do not use your identifiable workspace content to train public AI models, consistent with our provider agreements.',
      },
    ],
  },
  {
    id: 'team',
    title: '9. Team & Enterprise Workspaces',
    icon: 'groups',
    blocks: [
      {
        type: 'p',
        text: 'When **B2B team workspaces** are enabled, organisations may provision shared environments via **Clerk Organizations**. In that context:',
      },
      {
        type: 'ul',
        items: [
          'The **organisation** is typically the data controller/fiduciary for member workplace data; ThryvLoop acts as a **processor**;',
          '**Administrators** may access member data and activity as designed (roles, shared tasks, analytics);',
          'Admins represent they have lawful authority to invite members and process colleague data;',
          'Organisations are responsible for internal policies, employment law, and member notices;',
          'Enterprise customers may execute our [Data Processing Agreement](/dpa) or request a countersigned copy at **privacy@thryvloop.com**.',
        ],
      },
      {
        type: 'p',
        text: '**Indemnity:** Organisation admins and the organisation **indemnify** ThryvLoop against claims from member misuse, unlawful data processing, or workplace disputes arising from use of the Service, except where caused by our material breach of these Terms.',
      },
    ],
  },
  {
    id: 'waitlist',
    title: '10. Waitlist & Marketing',
    icon: 'campaign',
    blocks: [
      {
        type: 'p',
        text: 'You may submit your **email** on our landing page (e.g. Company Hubs waitlist) without creating an account. By submitting, you consent to us storing your email and contacting you about the relevant product launch or updates, as described in the Privacy Policy.',
      },
      {
        type: 'p',
        text: 'You may unsubscribe from marketing emails via the link in messages or by contacting **privacy@thryvloop.com**. Service-critical transactional emails (security, legal notices) may still be sent.',
      },
    ],
  },
  {
    id: 'billing',
    title: '11. Fees & Payment',
    icon: 'payments',
    blocks: [
      {
        type: 'p',
        text: '**Current offering:** Core features may be available **free of charge**. Pricing displayed on our website is informational; checkout may not yet be active for all plans. See our [Billing & Refund Policy](/billing).',
      },
      {
        type: 'p',
        text: '**When paid plans launch:** fees will be shown before purchase; applicable taxes (including GST in India, where relevant) may apply; subscriptions renew per disclosed billing cycles unless cancelled; refunds follow our [Billing & Refund Policy](/billing) and **mandatory consumer law**; failure to pay may result in downgrade or suspension. We will name the **payment processor** in updated Terms and the Privacy Policy before collecting payment card or billing data.',
      },
    ],
  },
  {
    id: 'ip',
    title: '12. Intellectual Property',
    icon: 'copyright',
    blocks: [
      {
        type: 'p',
        text: 'ThryvLoop owns the Service, software, visual design, trademarks, documentation, and proprietary content (excluding your content and third-party materials). You receive a **limited, revocable, non-exclusive, non-transferable** licence to access and use the Service for personal or internal business purposes in accordance with these Terms.',
      },
      {
        type: 'p',
        text: 'You may not copy, modify, distribute, sell, or create derivative works of the Service except as expressly permitted. **Feedback** you provide may be used by us without restriction or compensation.',
      },
    ],
  },
  {
    id: 'privacy',
    title: '13. Privacy',
    icon: 'policy',
    blocks: [
      {
        type: 'p',
        text: 'Our [Privacy Policy](/privacy) explains how we collect, use, share, and protect personal data — including for every feature listed in these Terms. It forms part of your agreement with us. Indian users may contact our **Grievance Officer** at **grievance@thryvloop.com** for privacy grievances.',
      },
    ],
  },
  {
    id: 'availability',
    title: '14. Availability, Security & Changes',
    icon: 'cloud',
    blocks: [
      {
        type: 'ul',
        items: [
          'We strive for reliable uptime but do **not** guarantee uninterrupted or error-free service;',
          'Maintenance, updates, and third-party outages may cause downtime;',
          'We implement reasonable security measures but cannot guarantee absolute security;',
          'You are responsible for securing your devices and credentials;',
          'We may apply **rate limits** (including on AI and public APIs) to protect the Service;',
          'We may change these Terms, features, or pricing with notice where required by law.',
        ],
      },
      {
        type: 'p',
        text: '**Force majeure:** We are not liable for delay or failure due to events beyond reasonable control (natural disasters, war, government action, internet failures, third-party outages, pandemics).',
      },
    ],
  },
  {
    id: 'disclaimers',
    title: '15. Disclaimers',
    icon: 'warning',
    blocks: [
      {
        type: 'p',
        text: '**TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW**, THE SERVICE IS PROVIDED **"AS IS"** AND **"AS AVAILABLE"** WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING:',
      },
      {
        type: 'ul',
        items: [
          'MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT;',
          'Accuracy of calendar sync, Gmail metadata, Meet links, or AI/analytics output;',
          'Achievement of productivity, focus, or business results;',
          'Compatibility with all devices, browsers, or third-party accounts.',
        ],
      },
      {
        type: 'p',
        text: 'ThryvLoop is a **productivity tool**, not a substitute for professional advisers. **Consumers in India, the EEA, UK, and certain US states** may have statutory rights that these disclaimers cannot override.',
      },
    ],
  },
  {
    id: 'liability',
    title: '16. Limitation of Liability',
    icon: 'shield',
    blocks: [
      {
        type: 'p',
        text: '**To the fullest extent permitted by applicable law:**',
      },
      {
        type: 'ul',
        items: [
          'ThryvLoop and its operators, directors, employees, and affiliates are **not liable** for indirect, incidental, special, consequential, exemplary, or punitive damages, or loss of profits, revenue, data, goodwill, or business opportunity;',
          'Our **total aggregate liability** for all claims arising from or relating to the Service or these Terms is limited to the **greater of** (a) INR **10,000** / USD **120** (or local equivalent) or (b) amounts you paid us in the **12 months** before the event giving rise to the claim;',
          'Nothing excludes liability that **cannot be excluded** under law (e.g. wilful misconduct, fraud, death/personal injury caused by negligence, or non-waivable consumer/data protection rights under DPDPA, GDPR, or local consumer statutes).',
        ],
      },
    ],
  },
  {
    id: 'indemnity',
    title: '17. Indemnification',
    icon: 'balance',
    blocks: [
      {
        type: 'p',
        text: 'You agree to **defend, indemnify, and hold harmless** ThryvLoop and its operators, affiliates, and personnel from any claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising from or related to:',
      },
      {
        type: 'ul',
        items: [
          'Your use or misuse of the Service;',
          'Your content or data you sync into the Service;',
          'Violation of these Terms, the Privacy Policy, or applicable law;',
          'Violation of third-party rights (including intellectual property and privacy);',
          'Your organisation\'s administration of team workspaces or processing of member data;',
          'Disputes between you and other users or assignees.',
        ],
      },
      {
        type: 'p',
        text: 'We may assume exclusive defence of matters subject to indemnification; you will cooperate. This Section survives termination.',
      },
    ],
  },
  {
    id: 'termination',
    title: '18. Suspension & Termination',
    icon: 'block',
    blocks: [
      {
        type: 'ul',
        items: [
          '**By you:** stop using the Service and delete your account via profile settings at any time;',
          '**By us:** suspend or terminate immediately for breach, risk to the Service or users, prolonged inactivity, non-payment (when billing applies), or legal requirement;',
          '**Effect:** licences end; access ceases; data handled per Privacy Policy;',
          '**Survival:** disclaimers, liability limits, indemnity, governing law, and dispute provisions survive termination.',
        ],
      },
    ],
  },
  {
    id: 'law',
    title: '19. Governing Law & Disputes',
    icon: 'gavel',
    blocks: [
      {
        type: 'p',
        text: `These Terms are governed by the laws of the **${TERMS_META.governingLaw}**, without regard to conflict-of-law principles, **except** that mandatory consumer, employment, and data protection laws in your country of residence apply where they cannot be contracted out.`,
      },
      {
        type: 'h3',
        text: '19.1 India',
      },
      {
        type: 'p',
        text: `Indian users may raise grievances with **${TERMS_META.grievanceOfficerLabel}** at **${TERMS_META.grievanceEmail}** (acknowledgement within **24 hours**, resolution within **15 days** where applicable). Subject to mandatory law, courts at **${TERMS_META.jurisdiction}** have jurisdiction over disputes.`,
      },
      {
        type: 'h3',
        text: '19.2 EEA, UK & other regions',
      },
      {
        type: 'p',
        text: '**EEA/UK consumers** may bring proceedings in their country of residence where EU/UK consumer rules allow. Nothing in these Terms affects non-waivable rights under local consumer protection law.',
      },
      {
        type: 'h3',
        text: '19.3 Informal resolution',
      },
      {
        type: 'p',
        text: `Before filing suit, parties agree to attempt good-faith resolution by contacting **${TERMS_META.contactEmail}** or **${TERMS_META.grievanceEmail}** for **15 days**.`,
      },
    ],
  },
  {
    id: 'changes',
    title: '20. Changes to Terms',
    icon: 'update',
    blocks: [
      {
        type: 'p',
        text: 'We may revise these Terms for legal, technical, or business reasons. The **"Last updated"** date will change. **Material changes** will be notified via the Service, email, or prominent notice **before** they take effect where required by law (including Indian consumer protection rules where applicable).',
      },
      {
        type: 'p',
        text: 'Continued use after the effective date constitutes acceptance where permitted. If you disagree, discontinue use and delete your account.',
      },
    ],
  },
  {
    id: 'miscellaneous',
    title: '21. Miscellaneous',
    icon: 'info',
    blocks: [
      {
        type: 'ul',
        items: [
          '**Entire agreement:** These Terms plus the Privacy Policy constitute the entire agreement regarding the Service, superseding prior understandings on the subject;',
          '**Severability:** If any provision is unenforceable, the remainder stays in effect;',
          '**No waiver:** Failure to enforce a provision is not a waiver;',
          '**Assignment:** We may assign these Terms in a merger or sale; you may not assign without our consent;',
          '**Language:** These Terms are in English; translations are for convenience only;',
          '**No agency:** No partnership, joint venture, or employment relationship is created.',
        ],
      },
    ],
  },
  {
    id: 'contact',
    title: '22. Contact',
    icon: 'mail',
    blocks: [
      {
        type: 'p',
        text: 'Questions about these Terms:',
      },
      {
        type: 'ul',
        items: [
          `**Customer support:** ${TERMS_META.contactEmail}`,
          `**Privacy / GDPR / CCPA:** ${TERMS_META.privacyEmail}`,
          `**Grievance Officer (India):** ${TERMS_META.grievanceEmail}`,
          `**Help Centre:** [${getSiteUrl()}/help](/help)`,
          `**Privacy Policy:** [${getSiteUrl()}/privacy](/privacy)`,
        ],
      },
      {
        type: 'p',
        text: `**${TERMS_META.legalEntity}** · ${TERMS_META.registeredAddress}`,
      },
    ],
  },
];
