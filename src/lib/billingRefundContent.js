import { getSiteUrl } from '@/lib/siteConfig';
import { PRIVACY_META } from '@/lib/privacyPolicyContent';
import { LEGAL_CONFIG } from '@/lib/legalConfig';

export const BILLING_META = {
  lastUpdated: PRIVACY_META.lastUpdated,
  effectiveDate: PRIVACY_META.effectiveDate,
  contactEmail: PRIVACY_META.supportEmail,
  privacyEmail: PRIVACY_META.contactEmail,
  legalEntity: PRIVACY_META.legalEntity,
  registeredAddress: PRIVACY_META.registeredAddress,
  counselNotice: LEGAL_CONFIG.counselNotice,
};

export const BILLING_HIGHLIGHTS = [
  {
    icon: 'payments',
    title: 'Current & future plans',
    description:
      'Core features may be free today. When paid plans launch, pricing shown at checkout governs your purchase.',
  },
  {
    icon: 'receipt',
    title: 'Refunds',
    description:
      'Refund rules balance fairness with mandatory consumer protections in India, the EEA, UK, and applicable US states.',
  },
  {
    icon: 'verified',
    title: 'Checkout consent',
    description:
      'Before payment, you will confirm plan terms, billing cycle, and agree to our Terms and this Billing Policy.',
  },
  {
    icon: 'account_balance',
    title: 'Taxes & processor',
    description:
      'Applicable taxes (e.g. GST in India) may apply. We will name the payment processor before collecting card data.',
  },
];

export const BILLING_SECTIONS = [
  {
    id: 'overview',
    title: '1. Overview',
    icon: 'info',
    blocks: [
      {
        type: 'p',
        text: `This **Billing & Refund Policy** ("**Policy**") supplements our [Terms of Service](/terms) and [Privacy Policy](/privacy). It applies when you purchase a **paid plan** for **${BILLING_META.legalEntity}** ("**ThryvLoop**").`,
      },
      {
        type: 'p',
        text: '**Today:** many features are offered without charge. Pricing on our website is informational until in-app checkout is enabled. This Policy takes effect when you complete a paid purchase.',
      },
    ],
  },
  {
    id: 'plans',
    title: '2. Plans & Pricing',
    icon: 'sell',
    blocks: [
      {
        type: 'ul',
        items: [
          'Plan names, features, and prices are shown on our website and/or at **checkout** before you pay;',
          'We may change future pricing for **new** purchases with notice; existing subscriptions renew at the price disclosed at signup unless we notify you of a change per applicable law;',
          'Free tiers may have usage limits; we may modify free-tier limits with reasonable notice;',
          'Currency and taxes are displayed at checkout where applicable.',
        ],
      },
    ],
  },
  {
    id: 'checkout',
    title: '3. Checkout Consent',
    icon: 'shopping_cart',
    blocks: [
      {
        type: 'p',
        text: 'Before completing payment, you will be asked to confirm:',
      },
      {
        type: 'ul',
        items: [
          'Selected **plan**, **billing interval** (monthly, yearly, etc.), and **total price** including applicable taxes;',
          'That you agree to our [Terms of Service](/terms), [Privacy Policy](/privacy), and this Billing & Refund Policy;',
          'That subscriptions **auto-renew** unless cancelled before the renewal date (where subscription billing applies).',
        ],
      },
      {
        type: 'p',
        text: 'Completing checkout constitutes authorisation to charge your payment method for the disclosed amount.',
      },
    ],
  },
  {
    id: 'payment-processor',
    title: '4. Payment Processing',
    icon: 'credit_card',
    blocks: [
      {
        type: 'p',
        text: 'When billing launches, card and UPI payments will be processed by a **third-party payment processor** (e.g. Razorpay, Stripe, or equivalent). We will name the processor in checkout and update the Privacy Policy before collecting payment data.',
      },
      {
        type: 'p',
        text: 'We do **not** store full payment card numbers on our servers. Billing records (plan, amount, status, last four digits where provided by processor) may be retained for accounting and support.',
      },
    ],
  },
  {
    id: 'renewals',
    title: '5. Renewals & Cancellation',
    icon: 'autorenew',
    blocks: [
      {
        type: 'ul',
        items: [
          'Subscriptions renew automatically at the end of each billing period unless you cancel in account settings or as instructed at checkout;',
          'Cancellation stops **future** charges; you typically retain paid access until the end of the current period unless otherwise stated;',
          'We may suspend paid features for failed payments after reasonable notice;',
          'You may downgrade or delete your account per the Terms and Privacy Policy.',
        ],
      },
    ],
  },
  {
    id: 'refunds',
    title: '6. Refund Policy',
    icon: 'currency_exchange',
    blocks: [
      {
        type: 'p',
        text: 'Unless required by **mandatory consumer law**:',
      },
      {
        type: 'ul',
        items: [
          '**Monthly plans:** generally **non-refundable** once the billing period has started, except where we fail to provide the Service materially as described;',
          '**Annual / lifetime plans:** refund requests within **14 days** of purchase may be considered at our discretion if you have not substantially used premium features;',
          '**Duplicate charges** or **verified billing errors** are refunded in full;',
          '**Indian consumers** retain rights under the Consumer Protection Act, 2019 and applicable rules;',
          '**EEA/UK consumers** may have a **14-day withdrawal right** for distance contracts where applicable — contact support promptly.',
        ],
      },
      {
        type: 'p',
        text: `Refund requests: email **${BILLING_META.contactEmail}** from your account email with order details. Approved refunds are processed to the original payment method within **14 business days** where possible.`,
      },
    ],
  },
  {
    id: 'taxes',
    title: '7. Taxes',
    icon: 'percent',
    blocks: [
      {
        type: 'p',
        text: 'Prices may exclude or include taxes depending on your location. **GST** and other indirect taxes may be added at checkout for Indian customers where applicable. You are responsible for any taxes not collected by us where required by law.',
      },
    ],
  },
  {
    id: 'changes',
    title: '8. Changes',
    icon: 'update',
    blocks: [
      {
        type: 'p',
        text: 'We may update this Policy before launching billing or when we change payment processors. Material changes will be notified via email or in-app notice where required.',
      },
    ],
  },
  {
    id: 'contact',
    title: '9. Contact',
    icon: 'mail',
    blocks: [
      {
        type: 'ul',
        items: [
          `**Billing support:** ${BILLING_META.contactEmail}`,
          `**Privacy:** ${BILLING_META.privacyEmail}`,
          `**Terms:** [${getSiteUrl()}/terms](/terms)`,
          `**Help Centre:** [${getSiteUrl()}/help](/help)`,
        ],
      },
      {
        type: 'p',
        text: `**${BILLING_META.legalEntity}** · ${BILLING_META.registeredAddress}`,
      },
    ],
  },
];
