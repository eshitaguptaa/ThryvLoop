import { getSiteUrl } from '@/lib/siteConfig';
import { PRIVACY_META } from '@/lib/privacyPolicyContent';
import { LEGAL_CONFIG } from '@/lib/legalConfig';

export const DPA_META = {
  lastUpdated: PRIVACY_META.lastUpdated,
  effectiveDate: PRIVACY_META.effectiveDate,
  contactEmail: PRIVACY_META.contactEmail,
  legalEntity: PRIVACY_META.legalEntity,
  registeredAddress: PRIVACY_META.registeredAddress,
  counselNotice: LEGAL_CONFIG.counselNotice,
};

export const DPA_HIGHLIGHTS = [
  {
    icon: 'groups',
    title: 'For business customers',
    description:
      'Governs ThryvLoop as a data processor when your organisation uses team workspaces and related B2B features.',
  },
  {
    icon: 'security',
    title: 'Security commitments',
    description:
      'Describes technical and organisational measures, subprocessors, and breach notification aligned with our Privacy Policy.',
  },
  {
    icon: 'handshake',
    title: 'Request execution',
    description:
      'Email privacy@thryvloop.com to execute this DPA with your organisation before or after provisioning team access.',
  },
  {
    icon: 'policy',
    title: 'Privacy paired',
    description:
      'This DPA supplements our Privacy Policy and Terms of Service — it does not replace them.',
  },
];

export const DPA_SECTIONS = [
  {
    id: 'introduction',
    title: '1. Introduction & Scope',
    icon: 'description',
    blocks: [
      {
        type: 'p',
        text: `This **Data Processing Agreement** ("**DPA**") forms part of the agreement between **${DPA_META.legalEntity}** ("**Processor**," "**ThryvLoop**") and the business customer ("**Controller**," "**Customer**") that uses ThryvLoop **team workspaces** or other B2B features.`,
      },
      {
        type: 'p',
        text: 'Where an individual uses ThryvLoop personally (not via an organisation), the [Privacy Policy](/privacy) applies directly and this DPA does not apply unless separately agreed.',
      },
      {
        type: 'p',
        text: 'This DPA is offered to help Customers meet obligations under **DPDPA (India)**, **GDPR (EEA/UK)**, and similar laws when ThryvLoop processes **personal data** on the Customer\'s instructions.',
      },
    ],
  },
  {
    id: 'roles',
    title: '2. Roles & Instructions',
    icon: 'account_tree',
    blocks: [
      {
        type: 'ul',
        items: [
          '**Customer** determines purposes and means of processing member/colleague data in the workspace (typically **Data Fiduciary / Controller**);',
          '**ThryvLoop** processes such data **only on documented instructions** from the Customer via use of the Service, these Terms, this DPA, and the [Privacy Policy](/privacy);',
          'Customer is responsible for lawful basis, notices to members, and internal policies;',
          'Customer instructs us **not** to process special-category or highly sensitive data via the Service (see Privacy Policy).',
        ],
      },
    ],
  },
  {
    id: 'subject-matter',
    title: '3. Subject Matter & Data',
    icon: 'database',
    blocks: [
      {
        type: 'p',
        text: 'Processing relates to provision of ThryvLoop B2B features, including:',
      },
      {
        type: 'ul',
        items: [
          'Organisation membership, roles, and invitations (via **Clerk Organizations**);',
          'Shared tasks, assignees, and workspace activity;',
          'Org-level analytics where enabled;',
          'Support and security operations.',
        ],
      },
      {
        type: 'p',
        text: 'Categories of data subjects: Customer\'s employees, contractors, and invited members. Data categories mirror Section 3 of our [Privacy Policy](/privacy) as applicable to workspace use.',
      },
    ],
  },
  {
    id: 'obligations',
    title: '4. Processor Obligations',
    icon: 'verified_user',
    blocks: [
      {
        type: 'ul',
        items: [
          'Process personal data **only** on Customer instructions unless required by law;',
          'Ensure personnel with access are bound by confidentiality;',
          'Implement appropriate **technical and organisational security measures** (encryption in transit, access controls, RLS where applicable);',
          'Assist Customer with data subject requests where technically feasible, via **privacy@thryvloop.com**;',
          'Delete or return Customer personal data upon termination, subject to legal retention and backup purge cycles in the Privacy Policy;',
          'Make available information reasonably necessary to demonstrate compliance.',
        ],
      },
    ],
  },
  {
    id: 'subprocessors',
    title: '5. Subprocessors',
    icon: 'hub',
    blocks: [
      {
        type: 'p',
        text: 'Customer authorises ThryvLoop to engage subprocessors listed in **Section 9** of our [Privacy Policy](/privacy), including **Clerk**, **Supabase**, **Vercel**, **Google** (where members connect integrations), and **Resend** (transactional email).',
      },
      {
        type: 'p',
        text: 'We will notify Customers of material subprocessor changes via the Privacy Policy or email where required. Customers may object on reasonable grounds relating to data protection; if unresolved, Customer may terminate affected B2B features.',
      },
    ],
  },
  {
    id: 'transfers',
    title: '6. International Transfers',
    icon: 'public',
    blocks: [
      {
        type: 'p',
        text: 'Personal data may be processed in **India** and other countries where subprocessors operate. Transfers are subject to safeguards described in the Privacy Policy (including Standard Contractual Clauses or equivalent where required).',
      },
    ],
  },
  {
    id: 'breach',
    title: '7. Security Incidents',
    icon: 'report',
    blocks: [
      {
        type: 'p',
        text: 'We will notify the Customer **without undue delay** after becoming aware of a personal data breach affecting Customer data processed under this DPA, and provide information reasonably required for the Customer to meet regulatory obligations, to the extent known.',
      },
    ],
  },
  {
    id: 'audits',
    title: '8. Audits & Cooperation',
    icon: 'fact_check',
    blocks: [
      {
        type: 'p',
        text: 'Upon reasonable written request, we will provide summaries of security practices or certifications if available. Onsite audits are limited to once per year with 30 days\' notice, during business hours, and subject to confidentiality, unless required by a supervisory authority.',
      },
    ],
  },
  {
    id: 'liability',
    title: '9. Liability & Term',
    icon: 'gavel',
    blocks: [
      {
        type: 'p',
        text: 'Liability under this DPA is subject to the limitation of liability in our [Terms of Service](/terms), except where prohibited by applicable data protection law.',
      },
      {
        type: 'p',
        text: 'This DPA remains in effect while the Customer uses B2B features and survives termination as needed to wind down processing.',
      },
    ],
  },
  {
    id: 'execution',
    title: '10. How to Execute',
    icon: 'mail',
    blocks: [
      {
        type: 'p',
        text: `To execute this DPA with your organisation, email **${DPA_META.contactEmail}** with your company legal name, signatory details, and workspace domain. We will countersign or confirm acceptance by email.`,
      },
      {
        type: 'ul',
        items: [
          `**Privacy / DPA requests:** ${DPA_META.contactEmail}`,
          `**Grievance Officer (India):** ${PRIVACY_META.grievanceOfficerLabel} · ${PRIVACY_META.grievanceEmail}`,
          `**Help Centre:** [${getSiteUrl()}/help](/help)`,
        ],
      },
      {
        type: 'p',
        text: `**${DPA_META.legalEntity}** · ${DPA_META.registeredAddress}`,
      },
    ],
  },
];
