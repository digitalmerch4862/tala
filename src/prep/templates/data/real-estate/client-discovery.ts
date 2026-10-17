import { MeetingTemplate } from '../../../types/template.js';

export const clientDiscoveryTemplate: MeetingTemplate = {
  id: 're-client-discovery',
  title: 'Client Property Discovery & Buyer Profiling',
  description: 'Initial consultation structure to qualify a prospective property buyer, assess motivations, budget parameters, preferred locations, and purchasing timeline.',
  category: 'real-estate',
  icon: 'house-search',
  targetAudience: 'Real Estate Brokers, Property Consultants, Sales Directors, Prospective Buyers',
  suggestedDurationMinutes: 45,
  tags: ['real-estate', 'buyer-qualification', 'discovery', 'preselling', 'rfo', 'philippine-property'],
  sections: [
    {
      id: 'buyer-background-motivation',
      title: 'Buyer Background & Purchase Purpose',
      description: 'Understand the personal and economic driver behind the property acquisition.',
      defaultDurationMinutes: 10,
      suggestedOwnerRole: 'Property Consultant',
      prompts: [
        'Is the purchase intended for primary family residence, vacation home, retirement, or rental investment (long-term lease vs Airbnb)?',
        'What triggered your property search today, and what is your target move-in or turnover timeline?',
        'Who are the key decision-makers involved in approving the final unit selection?'
      ],
      sampleTalkingPoints: [
        'Current residential status (renting vs owner) and relocation drivers',
        'Investment yield expectations and target rental demographic if an investment',
        'Target turnover window: Ready-for-Occupancy (RFO) vs pre-selling milestone (2-4 years)'
      ],
      checklist: [
        'Primary purpose noted (end-use vs rental investment)',
        'Decision-making parties identified (buyer, spouse, co-borrower)',
        'Target completion / turnover horizon established'
      ],
      isRequired: true
    },
    {
      id: 'budget-financial-readiness',
      title: 'Budget Parameters & Financial Readiness',
      description: 'Establish the realistic price ceiling, equity allocation, and preferred monthly outflow.',
      defaultDurationMinutes: 10,
      suggestedOwnerRole: 'Property Consultant',
      prompts: [
        'What is your target total contract price (TCP) range, including taxes and transfer fees?',
        'What is your comfortable monthly amortization budget for the equity/downpayment period?',
        'Do you plan to leverage bank mortgage financing, PAG-IBIG housing loan, spot cash, or in-house developer terms?'
      ],
      sampleTalkingPoints: [
        'Total contract price range (e.g., ₱4.5M - ₱12M)',
        'Spot downpayment readiness vs stretched monthly equity installments',
        'Income profile: locally employed, Overseas Filipino Worker (OFW), or business owner'
      ],
      checklist: [
        'Maximum TCP ceiling documented',
        'Monthly installment tolerance confirmed',
        'Buyer income category recorded for subsequent financing pre-screening'
      ],
      isRequired: true
    },
    {
      id: 'property-location-preferences',
      title: 'Location Corridors & Property Specifications',
      description: 'Map out geographic preferences, property types, and space requirements.',
      defaultDurationMinutes: 10,
      suggestedOwnerRole: 'Property Consultant',
      prompts: [
        'Which central business districts, emerging suburban growth corridors, or townships are you prioritizing?',
        'What property typology best fits your needs: high-rise condo, mid-rise enclave, single-detached home, or residential lot?',
        'What unit layout and floor area are essential (studio, 1BR, 2BR-3BR, balcony, tandem unit)?'
      ],
      sampleTalkingPoints: [
        'Preferred areas: Makati, BGC, Ortigas, Nuvali, Alabang, Cavite-Laguna corridor, Cebu, Clark',
        'Space requirements: minimum square meters, dedicated home-office space, maid\'s quarters',
        'Floor preference and view orientation (morning sun / east-facing, unobstructed skyline view, amenity deck view)'
      ],
      checklist: [
        'Target locations ranked by priority',
        'Minimum bedroom, bathroom, and parking space count confirmed',
        'Specific density and developer tier preferences noted'
      ],
      isRequired: true
    },
    {
      id: 'amenities-non-negotiables',
      title: 'Lifestyle Amenities & Non-Negotiables',
      description: 'Filter must-have building features, estate lifestyle amenities, and potential deal-breakers.',
      defaultDurationMinutes: 8,
      suggestedOwnerRole: 'Property Consultant',
      prompts: [
        'What amenities will your family actively use on a weekly basis (lap pool, fitness center, co-working lounge, pet park)?',
        'Are there strict policy requirements such as pet-friendliness, Airbnb/short-term lease licensing, or EV charging stations?',
        'How critical is immediate walking proximity to international schools, tertiary hospitals, or mass transit stations?'
      ],
      sampleTalkingPoints: [
        'Pet policy and building weight restrictions',
        'Property management track record and association dues expectations',
        'Accessibility: access to expressways (SLEX, NLEX, Skyway, CALAX) and public transport nodes'
      ],
      checklist: [
        'Pet friendliness requirement verified',
        'Parking requirement confirmed (tandem vs single slot)',
        'Non-negotiable deal breakers listed'
      ],
      isRequired: false
    },
    {
      id: 'next-steps-shortlist-schedule',
      title: 'Curated Project Shortlist & Site Tripping Schedule',
      description: 'Agree on matching developer projects and lock down an on-site or virtual viewing date.',
      defaultDurationMinutes: 7,
      suggestedOwnerRole: 'Property Consultant',
      prompts: [
        'From our 2-3 shortlisted matching properties, which project showroom or site would you like to inspect first?',
        'What date and time slot works best for your schedule for an accompanied site tripping?',
        'Would you like sample computation sheets prepared prior to the visit?'
      ],
      sampleTalkingPoints: [
        'Review 2 shortlisted projects that hit budget and location criteria',
        'Set tripping logistics: pickup arrangements or on-site showroom meeting point',
        'Commitment on preliminary computation preparation'
      ],
      checklist: [
        'Selected 2-3 projects matching criteria',
        'Calendar invite sent for site tripping date',
        'Sent sample computation schedules for review'
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
