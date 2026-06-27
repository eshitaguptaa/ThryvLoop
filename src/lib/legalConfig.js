import { SITE_NAME, getSiteUrl } from '@/lib/siteConfig';

/**
 * Central legal entity, contacts, and compliance metadata.
 * Update grievanceOfficer.name and registeredAddress before production launch.
 */
export const LEGAL_CONFIG = {
  lastUpdated: 'June 24, 2026',
  effectiveDate: 'June 24, 2026',

  companyName: SITE_NAME,
  legalEntity: 'ThryvLoop',
  legalEntityDescription: 'ThryvLoop (productivity software operator, India)',

  registeredAddress: {
    line1: 'Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    country: 'India',
  },

  grievanceOfficer: {
    name: 'Grievance Officer',
    designation: 'Data Protection & Grievance Officer',
    email: 'grievance@thryvloop.com',
  },

  emails: {
    privacy: 'privacy@thryvloop.com',
    support: 'support@thryvloop.com',
    grievance: 'grievance@thryvloop.com',
    legal: 'privacy@thryvloop.com',
  },

  governingLaw: 'Republic of India',
  jurisdiction: 'courts at Bengaluru, Karnataka, India',

  siteUrl: getSiteUrl(),

  /** Shown at the bottom of legal documents — not a substitute for counsel. */
  counselNotice:
    'These documents are provided for transparency. They are not legal advice. Have qualified counsel review them for your jurisdiction and business model before relying on them commercially.',
};

export function getRegisteredAddressFull() {
  const { line1, city, state, postalCode, country } = LEGAL_CONFIG.registeredAddress;
  const locality = [line1, city].filter(Boolean).join(', ');
  const region = [state, postalCode].filter(Boolean).join(' ');
  return [locality, region, country].filter(Boolean).join(', ');
}

export function getGrievanceOfficerLabel() {
  const { name, designation } = LEGAL_CONFIG.grievanceOfficer;
  return `${name}, ${designation}`;
}
