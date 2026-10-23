import { MeetingTemplate } from '../../../types/template.js';

export const siteViewingTemplate: MeetingTemplate = {
  id: 're-site-viewing',
  title: 'Site Tripping & Property Inspection Review',
  description: 'Structured agenda for conducting and reviewing an on-site property tripping or model unit inspection with a client.',
  category: 'real-estate',
  icon: 'map-pin',
  targetAudience: 'Property Consultants, Licensed Real Estate Brokers, Buyers, Property Investors',
  suggestedDurationMinutes: 60,
  tags: ['real-estate', 'site-tripping', 'property-tour', 'unit-inspection', 'turnover-check'],
  sections: [
    {
      id: 'pre-tour-briefing',
      title: 'Pre-Tour Orientation & Project Model Overview',
      description: 'Set expectations at the showroom scale model before inspecting actual units or physical grounds.',
      defaultDurationMinutes: 10,
      suggestedOwnerRole: 'Property Consultant',
      prompts: [
        'What specific unit cuts and layout orientations are we inspecting today?',
        'What master plan developments and future phases surround this tower or subdivision phase?',
        'Are there ongoing construction safety guidelines to observe during the walk?'
      ],
      sampleTalkingPoints: [
        'Review scale model: tower positioning, amenity floor, ingress/egress points',
        'Highlight future development phases that may impact property value appreciation',
        'Identify exact units scheduled for physical inspection'
      ],
      checklist: [
        'Scale model and master plan introduced',
        'Price list and inventory status sheet on hand',
        'Hard hats and safety gear secured if active construction zone'
      ],
      isRequired: true
    },
    {
      id: 'unit-inspection-deliverables',
      title: 'Unit Layout, Finishes & Deliverables Inspection',
      description: 'Assess interior space utility, workmanship, delivered finishes, and natural light/ventilation.',
      defaultDurationMinutes: 20,
      suggestedOwnerRole: 'Property Consultant / Inspector',
      prompts: [
        'How does the actual room proportion and usable floor area compare to the buyer\'s expectations?',
        'What standard deliverables are included (flooring tiles, kitchen cabinetry, countertop, sanitary fixtures, AC provisions)?',
        'What is the natural airflow, acoustic buffer, and morning/afternoon sun orientation from the balcony and windows?'
      ],
      sampleTalkingPoints: [
        'Ceiling height clearance and beam drop locations',
        'Balcony view lines, privacy from adjacent towers, orientation against afternoon heat',
        'Wall partitioning flexibility (concrete shear wall vs drywall)'
      ],
      checklist: [
        'Standard deliverables vs showroom staging items clarified',
        'Window facing verified against sunlight path',
        'Provisions noted: washer/dryer hookups, fiber internet line, rangehood venting'
      ],
      isRequired: true
    },
    {
      id: 'amenities-estate-infrastructure',
      title: 'Amenities, Common Areas & Property Management',
      description: 'Inspect the common grounds, lifestyle facilities, and property management standards.',
      defaultDurationMinutes: 15,
      suggestedOwnerRole: 'Property Consultant',
      prompts: [
        'How are the common amenity decks, pools, fitness center, and function rooms maintained?',
        'What are the security access protocols (RFID, biometric elevators, 24/7 lobby concierge)?',
        'What is the elevator-to-unit ratio and expected peak-hour wait times?'
      ],
      sampleTalkingPoints: [
        'Lobby ambience, visitor registration policies, and parcel delivery storage',
        'Property management agency track record and projected monthly association dues per sqm',
        'Emergency power backup capacity (100% full backup vs selective outlets)'
      ],
      checklist: [
        'Lobby and amenity deck visited',
        'Parking ramp width and basement slot locations inspected',
        'Standby generator capacity confirmed'
      ],
      isRequired: false
    },
    {
      id: 'client-feedback-objections',
      title: 'Client Debrief, Impressions & Objection Handling',
      description: 'Capture immediate client sentiment, answer reservations, and address hesitation points.',
      defaultDurationMinutes: 10,
      suggestedOwnerRole: 'Property Consultant',
      prompts: [
        'What aspect of the property exceeded your expectations, and what created hesitation?',
        'How does this project compare against the other developments you have visited?',
        'What questions remain regarding the payment terms, turnover timeline, or association rules?'
      ],
      sampleTalkingPoints: [
        'Open discussion on space suitability or potential layout adjustments',
        'Addressing pricing or association fee comparisons with nearby competing properties',
        'Clarifying turnover readiness and developer warranty periods'
      ],
      checklist: [
        'Primary objections documented',
        'Client preference ranking noted',
        'Remaining clarification items gathered'
      ],
      isRequired: true
    },
    {
      id: 'reservation-hold-strategy',
      title: 'Unit Holding Strategy & Next Milestones',
      description: 'Protect preferred unit availability with a formal reservation or temporary hold.',
      defaultDurationMinutes: 5,
      suggestedOwnerRole: 'Property Consultant',
      prompts: [
        'Would you like to place a temporary 24-48 hour hold on the preferred unit while finalizing documents?',
        'Which payment scheme schedule would you like the developer to prepare a formal computation for?',
        'When shall we follow up to finalize the reservation agreement?'
      ],
      sampleTalkingPoints: [
        'Check real-time inventory to verify unit is still open',
        'Explain reservation fee procedure and required valid IDs',
        'Agree on next checkpoint within 24-48 hours'
      ],
      checklist: [
        'Preferred unit number and floor locked in',
        'Sample computation handed to client',
        'Follow-up milestone scheduled'
      ],
      isRequired: true
    }
  ],
  metadata: {
    industry: 'Real Estate',
    market: 'Philippines / Emerging Markets',
    version: '1.0.0'
  }
};
