import { SITE_NAME, getSiteUrl } from '@/lib/siteConfig';
import {
  LEGAL_CONFIG,
  getGrievanceOfficerLabel,
  getRegisteredAddressFull,
} from '@/lib/legalConfig';

export const PRIVACY_META = {
  lastUpdated: LEGAL_CONFIG.lastUpdated,
  effectiveDate: LEGAL_CONFIG.effectiveDate,
  contactEmail: LEGAL_CONFIG.emails.privacy,
  supportEmail: LEGAL_CONFIG.emails.support,
  grievanceEmail: LEGAL_CONFIG.emails.grievance,
  grievanceOfficerName: LEGAL_CONFIG.grievanceOfficer.name,
  grievanceOfficerDesignation: LEGAL_CONFIG.grievanceOfficer.designation,
  grievanceOfficerLabel: getGrievanceOfficerLabel(),
  companyName: LEGAL_CONFIG.companyName,
  siteUrl: LEGAL_CONFIG.siteUrl,
  legalEntity: LEGAL_CONFIG.legalEntityDescription,
  registeredAddress: getRegisteredAddressFull(),
  governingLaw: LEGAL_CONFIG.governingLaw,
  jurisdiction: LEGAL_CONFIG.jurisdiction,
  counselNotice: LEGAL_CONFIG.counselNotice,
};

/** Plain-language highlights shown at the top of the page. */
export const PRIVACY_HIGHLIGHTS = [
  {
    icon: 'public',
    title: 'India & worldwide',
    description:
      'Built for Indian users and businesses, with clear rights and safeguards for international users under DPDPA, GDPR, UK GDPR, and other applicable laws.',
  },
  {
    icon: 'verified_user',
    title: 'You control your data',
    description:
      'Access, correct, erase, export, or withdraw consent for your personal data. Disconnect Google integrations anytime from Settings.',
  },
  {
    icon: 'visibility_off',
    title: 'No selling your data',
    description:
      'We do not sell or trade your personal data. We share it only with processors needed to run ThryvLoop, under contract.',
  },
  {
    icon: 'support_agent',
    title: 'Privacy support',
    description:
      'Contact our privacy team or Grievance Officer (India). International users can exercise region-specific rights as described below.',
  },
];

/**
 * Privacy Policy sections. Each block is { type: 'p' | 'ul' | 'h3', ... }.
 * Use **text** in strings for bold emphasis.
 */
export const PRIVACY_SECTIONS = [
  {
    id: 'introduction',
    title: '1. Introduction & Scope',
    icon: 'info',
    blocks: [
      {
        type: 'p',
        text: `This Privacy Policy ("**Policy**") applies to **${SITE_NAME}** ("**ThryvLoop**," "**we**," "**us**," or "**our**"), available at **${getSiteUrl()}**, and describes how we collect, use, store, share, and protect **personal data** when you use our website, web application, and related services (collectively, the "**Service**") — whether you access the Service from **India or any other country**.`,
      },
      {
        type: 'p',
        text: 'This Service is offered to **individuals and businesses globally**, with particular attention to users and organisations in **India**. By using the Service, you confirm you have read this Policy in a language you understand and agree to its terms, subject to **mandatory rights** that apply in your jurisdiction and cannot be waived.',
      },
      {
        type: 'p',
        text: 'This Policy is designed to comply with, among others:',
      },
      {
        type: 'ul',
        items: [
          '**India:** Digital Personal Data Protection Act, 2023 ("**DPDPA**"); Information Technology Act, 2000; SPDI Rules, 2011; IT (Intermediary Guidelines) Rules, 2021; Consumer Protection Act, 2019 (where applicable);',
          '**European Economic Area (EEA) & United Kingdom:** General Data Protection Regulation (EU GDPR), UK GDPR, and ePrivacy rules where applicable;',
          '**United States:** California Consumer Privacy Act / California Privacy Rights Act (CCPA/CPRA) and other state privacy laws where applicable;',
          '**Other countries:** Local data protection, consumer, and electronic communications laws that apply to your use of the Service.',
        ],
      },
      {
        type: 'p',
        text: 'This Policy must be read with our [Terms of Service](/terms). Product guidance is available in our [Help Centre](/help). If you do not agree with this Policy, **do not access or use the Service**.',
      },
    ],
  },
  {
    id: 'data-fiduciary',
    title: '2. Who Controls Your Data & Contacts',
    icon: 'corporate_fare',
    blocks: [
      {
        type: 'p',
        text: `For personal data processed through the Service (except where a business customer acts as controller/fiduciary — see Section 15), **${PRIVACY_META.legalEntity}** is:`,
      },
      {
        type: 'ul',
        items: [
          'The **Data Fiduciary** under India\'s DPDPA;',
          'The **data controller** under the EU/UK GDPR (where GDPR applies to our processing);',
          'The **business** responsible for personal information under US state privacy laws (where applicable).',
        ],
      },
      {
        type: 'h3',
        text: '2.1 Registered details',
      },
      {
        type: 'ul',
        items: [
          `**Legal / trade name:** ${PRIVACY_META.companyName}`,
          `**Registered / business address:** ${PRIVACY_META.registeredAddress}`,
          `**Website:** ${getSiteUrl()}`,
          `**Privacy enquiries (all regions):** ${PRIVACY_META.contactEmail}`,
          `**General support:** ${PRIVACY_META.supportEmail}`,
        ],
      },
      {
        type: 'h3',
        text: '2.2 Grievance Officer (India)',
      },
      {
        type: 'p',
        text: 'For users in India, we have appointed a **Grievance Officer** under applicable Indian law:',
      },
      {
        type: 'ul',
        items: [
          '**Designation:** Grievance Officer / Data Protection Contact',
          `**Name:** ${PRIVACY_META.grievanceOfficerName}`,
          `**Role:** ${PRIVACY_META.grievanceOfficerDesignation}`,
          `**Email:** ${PRIVACY_META.grievanceEmail}`,
          `**Alternate:** ${PRIVACY_META.contactEmail}`,
          '**Response timeline:** Acknowledgement within **24 hours**; resolution within **15 days** (or sooner if required by law).',
        ],
      },
      {
        type: 'p',
        text: 'Indian users who are unsatisfied may escalate to the **Data Protection Board of India** (or successor authority under the DPDPA) where they have standing under applicable law.',
      },
      {
        type: 'h3',
        text: '2.3 International privacy requests',
      },
      {
        type: 'p',
        text: `Users **outside India** should direct privacy requests, GDPR enquiries, and CCPA requests to **${PRIVACY_META.contactEmail}**. We respond within timelines required by applicable law (e.g. **30 days** under DPDPA/GDPR, **45 days** under CCPA where applicable). We do not currently maintain a separate EU representative; if that changes, we will update this Policy.`,
      },
    ],
  },
  {
    id: 'information-we-collect',
    title: '3. Personal Data We Collect',
    icon: 'database',
    blocks: [
      {
        type: 'p',
        text: '"**Personal data**" (or "**personal information**") means information relating to an identified or identifiable individual. We may collect:',
      },
      {
        type: 'h3',
        text: '3.1 Data you provide',
      },
      {
        type: 'ul',
        items: [
          '**Identity & account data:** name, email address, profile photograph, authentication credentials, and sign-in method (email/password or Google via our auth provider).',
          '**Preferences:** theme, timer settings, soundscape configuration, notification choices, and in-app settings.',
          '**Workspace content:** tasks, descriptions, statuses, priorities, categories, due dates, completion records, and productivity notes.',
          '**Calendar data:** events created in ThryvLoop and events synced from connected accounts (Section 3.3).',
          '**Communications:** ThryvBot messages, support tickets, feedback, and business enquiries.',
          '**Organisation data:** company/workspace name, team membership, roles, and shared tasks for B2B features.',
        ],
      },
      {
        type: 'h3',
        text: '3.2 Data collected automatically',
      },
      {
        type: 'ul',
        items: [
          '**Usage data:** features used, focus-session duration, page interactions, and timestamps needed for analytics and Service delivery.',
          '**Technical data:** IP address, browser type, device/OS, language, time zone, and referral source.',
          '**Log & diagnostic data:** error logs, security events, and performance metrics.',
          '**Cookies & local storage:** see Section 13.',
        ],
      },
      {
        type: 'h3',
        text: '3.3 Third-party integration data',
      },
      {
        type: 'p',
        text: 'Only with your **explicit consent** through OAuth or similar flows:',
      },
      {
        type: 'ul',
        items: [
          '**Google (optional):** account email; **Google Calendar** events (title, times, meeting/Meet links, availability); **Gmail hub data** — for recent messages we store subject line, sender ("From"), read state, received time, and a link to open in Gmail (typically the **10 most recent** items; stale items may be removed after ~14 days). We do **not** access Gmail message bodies;',
          '**Clerk (authentication):** when you sign in with Google or email, profile fields permitted by the provider; **Clerk Organizations** — org membership, roles, and invite metadata for team workspaces;',
        ],
      },
      {
        type: 'p',
        text: 'Disconnect integrations anytime via **Settings → Integrations**. OAuth tokens are stored **encrypted** on our servers. A short-lived cookie may be set during the Google connect flow. Prior synced data may remain until deleted by you or upon account closure.',
      },
      {
        type: 'h3',
        text: '3.4 Sensitive & special-category data',
      },
      {
        type: 'p',
        text: 'The Service is **not designed** to collect sensitive or special-category data (e.g. health, biometrics, racial/ethnic origin, religious beliefs, sexual orientation, government IDs, financial account numbers). **Do not** enter Aadhaar, PAN, SSN, passport numbers, bank details, medical records, or similar data into tasks, chat, or free-text fields. If you voluntarily submit such data despite this warning, you do so at your **own risk**; we may delete it without notice and process it only with safeguards to the extent we retain it.',
      },
      {
        type: 'h3',
        text: '3.5 What we do not collect knowingly',
      },
      {
        type: 'p',
        text: 'We do not knowingly collect personal data from **children** below the age required in your jurisdiction (see Section 14). We do not sell personal data or use it for cross-context behavioural advertising.',
      },
      {
        type: 'h3',
        text: '3.6 Application-specific product data',
      },
      {
        type: 'p',
        text: 'The following data is generated or stored when you use ThryvLoop features (in Supabase, browser local storage, or both):',
      },
      {
        type: 'ul',
        items: [
          '**Focus sessions** — start/end time, duration, timer mode (e.g. Pomodoro), stored for analytics;',
          '**User preferences** — theme, timer settings, soundscape mix, sidebar state, synced to your account where applicable;',
          '**Soundscape state** — active ambient layers, volumes, and saved recipes;',
          '**In-app notifications** — titles, bodies, and links shown in the Home bell (separate from Gmail sync);',
          '**Calendar reminders** — reminder offsets you set on ThryvLoop calendar events;',
          '**Tasks** — including optional **assigned_users** references to other users when you assign work;',
          '**Analytics & insights** — aggregated productivity metrics, streaks, charts, and AI-generated insight text;',
          '**PDF export** — when you export analytics, your report data is rendered **on our servers** (server-side PDF generation) and downloaded to your device; we do not retain the PDF file after delivery;',
          '**ThryvBot** — conversation history and message metadata stored per account.',
        ],
      },
      {
        type: 'h3',
        text: '3.7 Pre-account & marketing data',
      },
      {
        type: 'p',
        text: 'Before you create an account, you may submit your **email address** on our landing page (e.g. **Company Hubs waitlist** / "Notify me"). We store this in our waitlist database and may send operational emails via our email provider. Lawful basis: **consent** (by submitting the form) or **legitimate interest** in informing you about product launches, depending on your region.',
      },
      {
        type: 'h3',
        text: '3.8 Third-party individuals\' data',
      },
      {
        type: 'p',
        text: 'When you sync Gmail or assign tasks, we may process personal data about **other people** (e.g. email senders in your inbox, calendar attendees, task assignees). You are responsible for ensuring you have a lawful basis to bring that data into ThryvLoop. We process it only to provide the Service to you.',
      },
      {
        type: 'h3',
        text: '3.9 Security & abuse-prevention data',
      },
      {
        type: 'p',
        text: 'We process **IP addresses** and request metadata for rate limiting, fraud prevention, and API security (e.g. on public forms and AI endpoints). This is retained briefly in server memory and logs as described in Section 9.',
      },
    ],
  },
  {
    id: 'how-we-use',
    title: '4. Purposes of Processing',
    icon: 'settings',
    blocks: [
      {
        type: 'p',
        text: 'We process personal data for **lawful purposes** connected with the Service, including:',
      },
      {
        type: 'ul',
        items: [
          'Registering and authenticating your account;',
          'Delivering focus mode, tasks, calendar, analytics, notifications, and team workspaces;',
          'Operating **ThryvBot** (AI assistant) and generating productivity insights;',
          'Syncing with third-party services you authorise;',
          'Improving, securing, and debugging the Service;',
          'Sending service-related communications (marketing only with consent where required);',
          'Complying with legal obligations, court orders, and lawful government requests;',
          'Establishing, exercising, or defending legal claims;',
          'Preventing fraud, abuse, and unauthorised access.',
        ],
      },
      {
        type: 'p',
        text: 'We process data only for purposes **specified** in this Policy or notified at collection. We do not use personal data for incompatible purposes without fresh notice and consent where required by law.',
      },
    ],
  },
  {
    id: 'legal-bases',
    title: '5. Legal Bases for Processing',
    icon: 'balance',
    blocks: [
      {
        type: 'p',
        text: 'Depending on your location and the type of processing, we rely on one or more of the following legal bases:',
      },
      {
        type: 'h3',
        text: '5.1 India (DPDPA)',
      },
      {
        type: 'ul',
        items: [
          '**Consent** — for optional features (integrations, marketing, non-essential cookies, notifications). Consent is free, specific, informed, and withdrawable;',
          '**Legitimate uses** — where permitted without consent under DPDPA (e.g. voluntary provision for a purpose, legal compliance, employment/safeguarding in enterprise contexts);',
          '**Contract / service delivery** — to provide the Service you request, alongside consent where DPDPA requires it.',
        ],
      },
      {
        type: 'h3',
        text: '5.2 EEA & United Kingdom (GDPR)',
      },
      {
        type: 'ul',
        items: [
          '**Contract** — processing necessary to perform our agreement with you;',
          '**Consent** — optional integrations, marketing, and non-essential cookies;',
          '**Legitimate interests** — securing and improving the Service, fraud prevention, and analytics, balanced against your rights;',
          '**Legal obligation** — compliance with applicable law.',
        ],
      },
      {
        type: 'h3',
        text: '5.3 United States & other regions',
      },
      {
        type: 'p',
        text: 'Where US state laws apply, we process personal information based on consent, contractual necessity, legitimate business purposes permitted by law, or other bases recognised locally. **We do not sell or share personal information for cross-context behavioural advertising** as defined under CCPA/CPRA.',
      },
    ],
  },
  {
    id: 'consent',
    title: '6. Consent, Notice & Withdrawal',
    icon: 'how_to_reg',
    blocks: [
      {
        type: 'p',
        text: 'We provide **clear notice** of what we collect, why, how to exercise rights, grievance channels, and cross-border transfers before or at collection, as required by applicable law.',
      },
      {
        type: 'p',
        text: 'By creating an account, you consent to core processing described in this Policy where consent is the appropriate basis. **Optional processing** uses separate in-app toggles or OAuth authorisation.',
      },
      {
        type: 'p',
        text: '**To withdraw consent:** disconnect integrations, adjust cookies, unsubscribe from marketing, or email **privacy@thryvloop.com**. Withdrawal may limit Service functionality. Where required (e.g. GDPR), withdrawal does not affect prior lawful processing.',
      },
    ],
  },
  {
    id: 'sharing',
    title: '7. Sharing & Data Processors',
    icon: 'share',
    blocks: [
      {
        type: 'p',
        text: '**We do not sell, rent, or trade your personal data.** We share personal data only as follows:',
      },
      {
        type: 'h3',
        text: '7.1 Data processors (service providers)',
      },
      {
        type: 'p',
        text: 'We engage processors under contracts requiring confidentiality, security, and processing only on our instructions (including GDPR Article 28 terms where applicable):',
      },
      {
        type: 'ul',
        items: [
          '**Clerk** — authentication, identity management, and organisation membership;',
          '**Supabase** — database hosting and storage;',
          '**Google LLC** — Calendar/Gmail APIs (with your consent), **Google Gemini** (ThryvBot and analytics insights), **YouTube** (Focus Spaces background videos — YouTube may receive device/IP data when videos load), and **Google Meet** (when you join meetings from Calendar/Meet views);',
          '**Vercel** (or equivalent) — hosting and CDN;',
          '**Svix** — verified delivery of Clerk authentication webhooks;',
          '**Resend** (or equivalent) — transactional and waitlist notification email;',
          '**Email/support tools** — handling enquiries.',
        ],
      },
      {
        type: 'h3',
        text: '7.2 Within your organisation',
      },
      {
        type: 'p',
        text: 'If your employer provisions your account, **workspace administrators** may access data within that workspace per their role. Your organisation may be the data controller/fiduciary for workplace data.',
      },
      {
        type: 'h3',
        text: '7.3 Legal disclosure',
      },
      {
        type: 'p',
        text: 'We may disclose personal data when required by **applicable law**, regulation, court order, or lawful government request, or to protect rights, safety, and security where permitted by law.',
      },
      {
        type: 'h3',
        text: '7.4 Business transfers',
      },
      {
        type: 'p',
        text: 'In a merger, acquisition, or asset sale, personal data may transfer to a successor subject to this Policy or equivalent protections, with notice where required.',
      },
    ],
  },
  {
    id: 'international',
    title: '8. Cross-Border Data Transfers',
    icon: 'public',
    blocks: [
      {
        type: 'p',
        text: 'Personal data may be processed and stored **outside your country**, including in **India, the United States, the European Union**, and other locations where our processors operate. This is necessary to deliver a global cloud service.',
      },
      {
        type: 'h3',
        text: '8.1 Transfers from India',
      },
      {
        type: 'p',
        text: 'Under the **DPDPA**, transfers are permitted to countries not restricted by the Government of India, with safeguards as required. We will comply with notified restrictions.',
      },
      {
        type: 'h3',
        text: '8.2 Transfers from the EEA, UK & Switzerland',
      },
      {
        type: 'p',
        text: 'Where GDPR requires safeguards for transfers outside the EEA/UK, we rely on **Standard Contractual Clauses (SCCs)**, the UK International Data Transfer Addendum, adequacy decisions, or other lawful mechanisms. Contact **privacy@thryvloop.com** for details of safeguards applicable to your request.',
      },
      {
        type: 'h3',
        text: '8.3 Other international users',
      },
      {
        type: 'p',
        text: 'By using the Service where cross-border transfer is required and permitted, you acknowledge such transfer. We apply encryption, access controls, and processor agreements consistent with industry practice and applicable law.',
      },
    ],
  },
  {
    id: 'retention',
    title: '9. Data Retention & Erasure',
    icon: 'schedule',
    blocks: [
      {
        type: 'p',
        text: 'We retain personal data only as long as **necessary** for the purposes in this Policy or as required by applicable law:',
      },
      {
        type: 'ul',
        items: [
          '**Active accounts** — for the duration of use (paid plans, when introduced, follow the billing term disclosed at checkout);',
          '**Waitlist emails** — until you unsubscribe, the feature launches, or we delete the list after a reasonable period;',
          '**Gmail hub notifications** — rolling window; stale entries may be deleted after ~14 days;',
          '**After account closure** — up to **90 days** for backup purge and dispute resolution, unless a longer period is legally required;',
          '**Logs** — typically **30–90 days**, longer for security investigations;',
          '**ThryvBot history** — until you delete conversations or close your account;',
          '**OAuth tokens** — until disconnect or revocation.',
        ],
      },
      {
        type: 'p',
        text: 'Upon verified erasure request, we delete or anonymise data unless retention is legally required. **Anonymised aggregated data** may be retained for analytics.',
      },
    ],
  },
  {
    id: 'security',
    title: '10. Security',
    icon: 'security',
    blocks: [
      {
        type: 'p',
        text: 'We implement **reasonable technical and organisational measures** (including under Indian SPDI Rules and GDPR Article 32 where applicable), including:',
      },
      {
        type: 'ul',
        items: [
          'TLS/HTTPS encryption in transit;',
          'Encrypted storage of OAuth tokens and workspace credentials;',
          'Role-based access and row-level security in databases;',
          'Authentication controls via Clerk;',
          'Least-privilege API scopes;',
          'Internal access limitations and logging.',
        ],
      },
      {
        type: 'p',
        text: '**No system is completely secure.** Safeguard your credentials and devices. Notify **support@thryvloop.com** if you suspect unauthorised access. We are not liable for breaches caused by your negligence except where liability cannot be excluded under applicable law.',
      },
      {
        type: 'p',
        text: 'We notify affected users and regulators of personal data breaches **as required by applicable law** (e.g. DPDPA, GDPR within 72 hours to authorities where required).',
      },
    ],
  },
  {
    id: 'your-rights',
    title: '11. Your Privacy Rights',
    icon: 'person_check',
    blocks: [
      {
        type: 'p',
        text: 'Your rights depend on where you live. Below is a summary; **mandatory local rights always apply** even if not listed.',
      },
      {
        type: 'h3',
        text: '11.1 India (DPDPA — Data Principal rights)',
      },
      {
        type: 'ul',
        items: [
          '**Access** — summary of personal data and processing activities;',
          '**Correction** — rectify inaccurate or misleading data;',
          '**Erasure** — deletion when consent is withdrawn or data is no longer necessary;',
          '**Grievance redressal** — via our Grievance Officer (Section 2.2);',
          '**Nominate** — designate another person to exercise rights upon death or incapacity, as per DPDPA rules;',
          '**Withdraw consent** — for consent-based processing.',
        ],
      },
      {
        type: 'h3',
        text: '11.2 EEA & United Kingdom (GDPR)',
      },
      {
        type: 'ul',
        items: [
          '**Access, rectification, erasure** ("right to be forgotten"), and **restriction** of processing;',
          '**Data portability** — receive your data in a structured, machine-readable format where applicable;',
          '**Object** to processing based on legitimate interests or for direct marketing;',
          '**Withdraw consent** at any time;',
          '**Lodge a complaint** with your local supervisory authority (you may also contact us first).',
        ],
      },
      {
        type: 'h3',
        text: '11.3 United States (CCPA/CPRA & state laws)',
      },
      {
        type: 'ul',
        items: [
          '**Know** what personal information we collect, use, and disclose;',
          '**Delete** personal information subject to exceptions;',
          '**Correct** inaccurate personal information;',
          '**Opt out** of sale/sharing — **we do not sell or share for cross-context behavioural advertising**;',
          '**Non-discrimination** for exercising privacy rights.',
        ],
      },
      {
        type: 'h3',
        text: '11.4 Other international users',
      },
      {
        type: 'p',
        text: 'Users in Canada, Australia, Singapore, Brazil, and other jurisdictions may have additional rights under local law (access, correction, deletion, complaint to regulators). Contact **privacy@thryvloop.com** and we will honour requests to the extent legally required.',
      },
      {
        type: 'h3',
        text: '11.5 How to exercise your rights',
      },
      {
        type: 'p',
        text: `Email **${PRIVACY_META.contactEmail}** (or **${PRIVACY_META.grievanceEmail}** for India grievances) from your registered email. We verify identity before acting. Response timelines follow applicable law (typically **30 days**; **45 days** for certain US requests). You may also edit data in-app, disconnect Google, delete ThryvBot threads, and delete your account via profile settings.`,
      },
    ],
  },
  {
    id: 'ai-thryvbot',
    title: '12. ThryvBot, AI & Automated Processing',
    icon: 'smart_toy',
    blocks: [
      {
        type: 'p',
        text: 'ThryvBot uses **artificial intelligence** (including Google Gemini). Important limitations:',
      },
      {
        type: 'ul',
        items: [
          'Your prompts and relevant workspace summaries (tasks, calendar, focus time) may be sent to **Google Gemini** to generate responses, briefings, and analytics insights;',
          'ThryvBot may **take actions in your workspace** on your behalf when you ask — including **creating or updating tasks** and **creating calendar events** — using automated tool calls;',
          'Conversations are stored linked to your account;',
          '**AI output may be wrong, incomplete, or biased** — do not rely on it for legal, medical, financial, or compliance decisions;',
          '**Do not** submit passwords, OTPs, government IDs, payment data, or confidential employer information in chat;',
          'AI features are provided **"as is"** without warranty;',
          'We configure AI providers under terms that restrict use of your data to providing the Service, consistent with our provider agreements (we do not use your identifiable workspace content to train public models).',
        ],
      },
      {
        type: 'p',
        text: 'To the maximum extent permitted under **applicable law**, ThryvLoop is **not liable** for decisions based on AI-generated content. You remain responsible for verifying outputs.',
      },
      {
        type: 'p',
        text: 'Where GDPR applies, automated decision-making producing legal or similarly significant effects without human involvement is **not** used. AI assists productivity only.',
      },
    ],
  },
  {
    id: 'cookies',
    title: '13. Cookies & Local Storage',
    icon: 'cookie',
    blocks: [
      {
        type: 'p',
        text: 'We use cookies, session tokens, and browser local storage for:',
      },
      {
        type: 'ul',
        items: [
          '**Essential cookies:** authentication (Clerk), security, session continuity, and short-lived OAuth state during Google connect;',
          '**Functional storage:** theme preference (localStorage), timer/soundscape/UI state (localStorage and cloud preferences);',
          '**Browser notifications:** if you allow, we use the **Notification API** for calendar/meeting reminders — permission is requested in-browser and can be revoked in OS/browser settings;',
          '**Analytics (if enabled):** aggregated usage understanding.',
        ],
      },
      {
        type: 'p',
        text: 'Non-essential cookies are used only with consent where required (e.g. EU/UK ePrivacy, Indian law). Manage cookies via browser settings; essential cookies are required for login.',
      },
    ],
  },
  {
    id: 'children',
    title: '14. Children\'s Personal Data',
    icon: 'child_care',
    blocks: [
      {
        type: 'p',
        text: 'The Service is **not directed at children**. We do not knowingly collect children\'s personal data without appropriate parental or guardian consent:',
      },
      {
        type: 'ul',
        items: [
          '**India (DPDPA):** under **18** — verifiable parental consent required;',
          '**United States (COPPA):** under **13** — we do not knowingly collect data from children under 13;',
          '**EEA/UK (GDPR):** under **16** (or lower age set by member state, not below 13) — parental consent where required.',
        ],
      },
      {
        type: 'p',
        text: 'If you believe a child has provided personal data, contact **privacy@thryvloop.com** — we will delete it promptly unless legally required to retain it.',
      },
    ],
  },
  {
    id: 'team-workspaces',
    title: '15. Businesses & Enterprise Customers',
    icon: 'groups',
    blocks: [
      {
        type: 'p',
        text: '**For companies, startups, and teams** (in India and internationally) using ThryvLoop workspaces:',
      },
      {
        type: 'ul',
        items: [
          'Your organisation is typically the **data controller / Data Fiduciary** for employee/colleague data; ThryvLoop acts as a **processor** on your instructions;',
          '**Clerk Organizations** powers team workspaces — we sync organisation name, slug, member user IDs, and roles via webhooks;',
          'You represent lawful authority (contracts, notices, or consent) to upload colleague data and invite members;',
          'You are responsible for internal privacy notices, HR compliance, and lawful use of workspace features;',
          'Administrators may access workspace content per their role — configure roles carefully;',
          'Enterprise customers may execute our [Data Processing Agreement](/dpa) or request a countersigned copy at **privacy@thryvloop.com**.',
        ],
      },
      {
        type: 'p',
        text: '**Indemnity:** You indemnify ThryvLoop against claims from your unlawful processing of employee, contractor, or client data through the Service, except where caused by our breach of this Policy or applicable law.',
      },
    ],
  },
  {
    id: 'user-responsibilities',
    title: '16. Your Responsibilities',
    icon: 'person_alert',
    blocks: [
      {
        type: 'p',
        text: 'You agree to:',
      },
      {
        type: 'ul',
        items: [
          'Provide **accurate** information and keep credentials confidential;',
          'Use the Service lawfully under **applicable local law** (including data protection, copyright, and employment rules);',
          'Not upload unlawful, defamatory, obscene, harassing, or infringing content;',
          'Not attempt unauthorised access, scraping, reverse engineering, or disruption;',
          'Not transmit malware, spam, or phishing content;',
          'Ensure you have rights to data you sync from Google or other third parties.',
        ],
      },
      {
        type: 'p',
        text: 'Violation may result in **suspension or termination**, and reporting to authorities where required.',
      },
    ],
  },
  {
    id: 'third-party-disclaimer',
    title: '17. Third-Party Services & Links',
    icon: 'link',
    blocks: [
      {
        type: 'p',
        text: 'The Service integrates with or embeds third parties, including **Google** (Calendar, Gmail, Meet, Gemini), **YouTube** (Focus Spaces ambient video — subject to [YouTube Terms of Service](https://www.youtube.com/t/terms)), and **Clerk**. When you use these features, those providers may collect device, IP, and usage data under **their** policies. **We do not control** third-party practices.',
      },
      {
        type: 'p',
        text: 'ThryvLoop is **not responsible** for third-party acts, omissions, or outages, except to the extent we are liable as controller/fiduciary under applicable law for processors we engage.',
      },
    ],
  },
  {
    id: 'limitation-liability',
    title: '18. Disclaimers & Limitation of Liability',
    icon: 'gavel',
    blocks: [
      {
        type: 'p',
        text: '**To the fullest extent permitted by applicable law:**',
      },
      {
        type: 'ul',
        items: [
          'The Service and this Policy are provided **"as is"** and **"as available"** without warranties of any kind, express or implied;',
          'We do not warrant uninterrupted, error-free, or completely secure operation;',
          'ThryvLoop\'s **total aggregate liability** for claims relating to personal data or this Policy is limited to the **greater of** (a) INR **10,000** / USD **120** (or local equivalent) or (b) fees you paid in the **12 months** before the claim, except where liability cannot be limited (e.g. wilful misconduct, death/personal injury caused by negligence, or non-excludable statutory liability);',
          'We are **not liable** for indirect, incidental, special, consequential, or punitive damages, or loss of profits, goodwill, or business interruption, except where prohibited by law;',
          'Force majeure events relieve us from performance delays to the extent permitted.',
        ],
      },
      {
        type: 'p',
        text: 'Nothing limits rights that **cannot be waived** under DPDPA, GDPR, CCPA, or other mandatory law. **Consumers in the EEA, UK, and certain US states retain non-waivable protections** regardless of governing law below.',
      },
    ],
  },
  {
    id: 'changes',
    title: '19. Changes to This Policy',
    icon: 'update',
    blocks: [
      {
        type: 'p',
        text: 'We may update this Policy for legal, technical, or business changes. The **"Last updated"** date will change. **Material changes** will be notified via the Service, email, or prominent notice **before** they take effect where required by law.',
      },
      {
        type: 'p',
        text: 'Continued use after the effective date constitutes acceptance where permitted. If you disagree, discontinue use and request account deletion.',
      },
    ],
  },
  {
    id: 'governing-law',
    title: '20. Governing Law & Disputes',
    icon: 'balance',
    blocks: [
      {
        type: 'p',
        text: `This Policy is governed by the laws of the **${PRIVACY_META.governingLaw}**, without regard to conflict-of-law rules, **except** that mandatory consumer and data protection laws of your country of residence apply where they cannot be contracted out.`,
      },
      {
        type: 'p',
        text: `Subject to mandatory local rights, courts at **${PRIVACY_META.jurisdiction}** have **non-exclusive jurisdiction** over disputes (Indian users may be subject to exclusive jurisdiction where permitted). **EEA/UK consumers** may also bring proceedings in their country of residence where EU/UK consumer rules allow.`,
      },
      {
        type: 'p',
        text: 'Before litigation, parties shall attempt good-faith resolution via **privacy@thryvloop.com** or our Grievance Officer for **15 days**.',
      },
    ],
  },
  {
    id: 'application-features',
    title: '21. Application Features Reference',
    icon: 'apps',
    blocks: [
      {
        type: 'p',
        text: 'This section maps **ThryvLoop product areas** to data practices for transparency:',
      },
      {
        type: 'ul',
        items: [
          '**Home** — dashboard aggregates tasks, calendar, focus stats, sync status, and in-app notifications;',
          '**Focus mode** — timer sessions logged; optional **YouTube** video backgrounds; soundscape audio preferences;',
          '**Tasks** — Kanban board data; optional assignees;',
          '**Calendar** — ThryvLoop-native events plus Google sync; optional browser reminders;',
          '**Meet** — opens embedded **Google Meet** for online events;',
          '**Analytics** — charts from focus/tasks data; AI insights; optional PDF export;',
          '**ThryvBot** — AI chat with tool access to your workspace (see Section 12);',
          '**Settings** — preferences, soundscape composer, Google connect/disconnect;',
          '**Team workspaces (B2B)** — shared org tasks and member management when enabled;',
          '**Landing / waitlist** — email capture before account creation (Section 3.7).',
        ],
      },
      {
        type: 'p',
        text: '**Paid plans:** Pricing may be shown on our website. When payment processing is introduced, we will name the payment processor and update this Policy before collecting billing data. Until then, core features may be offered without payment. See our [Billing & Refund Policy](/billing).',
      },
    ],
  },
  {
    id: 'contact',
    title: '22. Contact Us',
    icon: 'mail',
    blocks: [
      {
        type: 'p',
        text: 'For privacy requests, grievances, or questions (all regions):',
      },
      {
        type: 'ul',
        items: [
          `**Privacy / GDPR / CCPA:** ${PRIVACY_META.contactEmail}`,
          `**Grievance Officer (India):** ${PRIVACY_META.grievanceOfficerLabel} · ${PRIVACY_META.grievanceEmail}`,
          `**Customer Support:** ${PRIVACY_META.supportEmail}`,
          `**Help Centre:** [${getSiteUrl()}/help](/help)`,
        ],
      },
      {
        type: 'p',
        text: `**${PRIVACY_META.legalEntity}** · ${PRIVACY_META.registeredAddress}`,
      },
    ],
  },
];
