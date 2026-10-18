import type { MeetingTemplate } from '../../../types/template.js';

export const developerBrokerCallTemplate: MeetingTemplate = {
  id: 're-developer-broker-call',
  title: 'Developer-Broker Alignment & Project Inventory Call',
  description: 'Coordination sync between developer sales channel heads and real estate brokerages regarding project launches, fast-moving inventory, commission incentives, and co-broker terms.',
  category: 'real-estate',
  icon: 'briefcase',
  targetAudience: 'Developer Channel Managers, Real Estate Brokers, Agency Principals, Realty Team Leaders',
  suggestedDurationMinutes: 30,
  tags: ['real-estate', 'developer-call', 'brokerage', 'inventory-update', 'commission-terms', 'co-broker'],
  sections: [
    {
      id: 'pipeline-launch-milestones',
      title: 'Project Pipeline & New Phase Launches',
      description: 'Review upcoming master-planned launches, tower releases, and construction milestones.',
      defaultDurationMinutes: 7,
      suggestedOwnerRole: 'Developer Sales Manager',
      prompts: [
        'What new phases, towers, or residential clusters are slated for release this quarter?',
        'What is the current construction completion percentage across ongoing projects?',
        'Are there changes to planned turnover schedules or master-planned commercial additions?'
      ],
      sampleTalkingPoints: [
        'Upcoming priority selling / VIP preview dates',
        'Turnover milestone dates for sold-out buildings',
        'Master plan commercial infrastructure progress (retail strip, clubhouses, access roads)'
      ],
      checklist: [
        'Launch calendar dates updated',
        'Target turnover advisories noted for current buyer communication'
      ],
      isRequired: true
    },
    {
      id: 'fast-moving-inventory-promos',
      title: 'Available Inventory & Special Promotional Schemes',
      description: 'Highlight high-yield units, reopened prime cuts, and current promotional incentives.',
      defaultDurationMinutes: 8,
      suggestedOwnerRole: 'Developer Sales Manager',
      prompts: [
        'What are the fast-moving units and newly reopened prime cuts (corner units, balcony units)?',
        'What promotional terms are active this month (zero interest stretched equity, discounted reservation fees, appliance bundle vouchers)?',
        'Are there bulk purchase discounts available for investor syndicates?'
      ],
      sampleTalkingPoints: [
        'Reopened inventory list with updated availability matrix',
        'Special payment promos: e.g., 10% downpayment over 36 months + balloon or spot discount',
        'Furnishing packages or early move-in promo mechanics for RFO projects'
      ],
      checklist: [
        'Fresh inventory sheet / pricelist downloaded',
        'Promo validity cut-off dates logged'
      ],
      isRequired: true
    },
    {
      id: 'broker-commissions-incentives',
      title: 'Commission Schedules, Tiers & Accreditation Renewal',
      description: 'Clarify commission release timelines, target volume overrides, and accreditation compliance.',
      defaultDurationMinutes: 8,
      suggestedOwnerRole: 'Brokerage Principal / Developer Channel Manager',
      prompts: [
        'What are the current commission percentages for standard broker accounts versus premier partner tiers?',
        'What are the release milestones (e.g., 50% upon full reservation & downpayment clearance, balance upon loan takeout / deed of sale)?',
        'What quarterly sales contests, travel incentives, or cash bonuses are active for producing agents?'
      ],
      sampleTalkingPoints: [
        'Commission percentage tiers and qualifying sales volume brackets',
        'Turnaround time for voucher processing and VAT / withholding tax documentation',
        'Status of brokerage annual accreditation and PRC/DHSUD registration renewals'
      ],
      checklist: [
        'Commission release schedule verified',
        'Incentive qualification thresholds noted',
        'Accreditation status confirmed'
      ],
      isRequired: true
    },
    {
      id: 'collateral-support-activation',
      title: 'Marketing Collaterals, Showroom Access & Joint Activations',
      description: 'Align on marketing materials, digital assets, and co-hosted client events.',
      defaultDurationMinutes: 7,
      suggestedOwnerRole: 'Brokerage Marketing Lead / Developer Channel Manager',
      prompts: [
        'Are high-resolution 3D renders, approved social media marketing collaterals, and unbranded walk-through videos available?',
        'What is the protocol for booking developer showroom suites or VIP conference rooms for private buyer presentations?',
        'Can the developer co-sponsor an open house event, broker blitz, or webinars for OFW investor networks?'
      ],
      sampleTalkingPoints: [
        'Access to official cloud drive for high-res project collaterals and computation templates',
        'Showroom VIP lounge booking calendar and food & beverage accommodation',
        'Joint event schedule: dates, invite quota, developer speaker support'
      ],
      checklist: [
        'Cloud collateral drive link shared',
        'Private client presentation suite booking procedure confirmed',
        'Date set for upcoming joint broker open house'
      ],
      isRequired: false
    }
  ],
  metadata: {
    industry: 'Real Estate',
    market: 'Developer-Broker Channel / Philippines',
    version: '1.0.0'
  }
};
