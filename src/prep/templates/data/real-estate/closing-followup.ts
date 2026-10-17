import { MeetingTemplate } from '../../../types/template.js';

export const closingFollowupTemplate: MeetingTemplate = {
  id: 're-closing-followup',
  title: 'Reservation & Deal Closing Milestone Follow-Up',
  description: 'Step-by-step agenda for finalizing a property reservation, signing legal documents, verifying remittances, and scheduling handover milestones.',
  category: 'real-estate',
  icon: 'file-signature',
  targetAudience: 'Licensed Brokers, Account Officers, Buyers, Closing Specialists',
  suggestedDurationMinutes: 30,
  tags: ['real-estate', 'closing', 'reservation-agreement', 'contract-signing', 'downpayment', 'kyc'],
  sections: [
    {
      id: 'unit-confirmation-terms',
      title: 'Unit Details & Final Price Confirmation',
      description: 'Review the final binding unit specifications, parking allocation, and total contract figure before signature.',
      defaultDurationMinutes: 5,
      suggestedOwnerRole: 'Closing Specialist / Broker',
      prompts: [
        'Does the final computation match the exact tower, floor level, unit number, and parking slot selection?',
        'Are all agreed promotional discounts and special payment concessions reflected accurately in the Net Total Contract Price (NTCP)?',
        'Has the buyer reviewed the unit floor layout schematic attached to the contract?'
      ],
      sampleTalkingPoints: [
        'Verification of unit details: Tower, Floor, Unit Number, Floor Area, Facing orientation',
        'Verification of parking allocation: Basement level and slot number',
        'Final Net Selling Price after discounts and VAT breakdown'
      ],
      checklist: [
        'Unit floor area and facing verified',
        'Parking slot number cross-checked',
        'Net Total Contract Price agreed and acknowledged'
      ],
      isRequired: true
    },
    {
      id: 'reservation-agreement-signing',
      title: 'Reservation Agreement (RA) Execution & Key Clauses',
      description: 'Guide the buyer through the standard clauses, forfeiture rules, and timeline obligations.',
      defaultDurationMinutes: 10,
      suggestedOwnerRole: 'Closing Specialist / Broker',
      prompts: [
        'Has the buyer read and understood the non-refundable reservation policy and 30-day document completion window?',
        'Are there specific default clauses or turnover timeline tolerances that need explicit explanation?',
        'Are all registered buyers or designated attorneys-in-fact present to sign the document pages and specimen signature cards?'
      ],
      sampleTalkingPoints: [
        'Reservation agreement clauses: validity window, forfeiture upon non-compliance, price lock guarantee',
        'Contract to Sell (CTS) transition process upon completion of full downpayment',
        'Specimen signature verification against valid government IDs'
      ],
      checklist: [
        'Reservation Agreement signed on all designated pages',
        'Buyer Information Sheet (BIS) completed in full',
        '3 specimen signatures collected per signatory'
      ],
      isRequired: true
    },
    {
      id: 'reservation-fee-clearance',
      title: 'Reservation Fee Remittance & Official Receipt Verification',
      description: 'Document the receipt and clearance of the initial reservation deposit.',
      defaultDurationMinutes: 5,
      suggestedOwnerRole: 'Account Officer / Broker',
      prompts: [
        'What payment method was used for the reservation fee (credit card slip, bank deposit, telegraphic transfer, check)?',
        'Has the transaction reference number or deposit slip copy been verified by developer treasury / finance?',
        'When will the provisional / official receipt (OR) be released to the buyer?'
      ],
      sampleTalkingPoints: [
        'Validate remittance slip or merchant credit card swipe authorization',
        'Account for foreign currency exchange clearance time if remitted from abroad',
        'Dispatch acknowledgment receipt or provisional receipt copy to buyer email'
      ],
      checklist: [
        'Proof of payment uploaded to developer portal / buyer file',
        'Official or acknowledgment receipt issued to buyer'
      ],
      isRequired: true
    },
    {
      id: 'kyc-amla-compliance',
      title: 'KYC & Regulatory Compliance Verification',
      description: 'Verify Know-Your-Customer documentation and Anti-Money Laundering (AMLA) compliance.',
      defaultDurationMinutes: 5,
      suggestedOwnerRole: 'Account Officer',
      prompts: [
        'Are two primary government-issued identification cards verified and within valid expiry dates?',
        'Is Tax Identification Number (TIN) verification slip attached for both buyer and developer records?',
        'For corporate purchases or foreign buyers: are board resolutions, articles of incorporation, or ACR/passport copies in order?'
      ],
      sampleTalkingPoints: [
        'TIN verification (Form 1904 if new TIN issuance needed for foreign/first-time buyers)',
        'Proof of billing within the last 3 months matching declared residential address',
        'AMLA declaration form completed if contract threshold triggers compliance'
      ],
      checklist: [
        '2 valid government IDs photocopied with specimen signatures',
        'TIN verified against BIR records',
        'AMLA checklist signed'
      ],
      isRequired: true
    },
    {
      id: 'downpayment-milestones-handover-roadmap',
      title: 'Downpayment Schedule & Next Milestone Calendar',
      description: 'Establish the exact payment calendar for post-dated checks and document completion.',
      defaultDurationMinutes: 5,
      suggestedOwnerRole: 'Closing Specialist / Broker',
      prompts: [
        'When is the exact due date for the 1st monthly downpayment installment (typically 30 days post-reservation)?',
        'How will subsequent monthly installments be serviced (PDCs, auto-debit arrangement, or developer bills payment portal)?',
        'When is the scheduled release of the formal Contract to Sell (CTS) for notarization?'
      ],
      sampleTalkingPoints: [
        'Issuance of Post-Dated Check (PDC) booklet or enrollment in auto-debit arrangement (ADA)',
        '30-day documentary countdown to prevent cancellation or penalty interest',
        'Key milestone roadmap: equity completion, bank guaranty issuance, unit inspection, and turnover'
      ],
      checklist: [
        '1st downpayment due date calendar invite sent',
        'PDC submission deadline established',
        'Client assigned to dedicated developer customer service officer'
      ],
      isRequired: true
    }
  ],
  metadata: {
    industry: 'Real Estate',
    market: 'Contract Closing & Handover / Philippines',
    version: '1.0.0'
  }
};
