import { MeetingTemplate } from '../../../types/template.js';

export const financingConsultationTemplate: MeetingTemplate = {
  id: 're-financing-consultation',
  title: 'Property Financing & Loan Feasibility Consultation',
  description: 'Deep dive consultation to evaluate buyer loan eligibility, compare bank vs PAG-IBIG vs in-house financing structures, and prepare documentary requirements.',
  category: 'real-estate',
  icon: 'calculator',
  targetAudience: 'Property Buyers, Loan Specialists, Real Estate Brokers, Mortgage Advisors',
  suggestedDurationMinutes: 45,
  tags: ['real-estate', 'mortgage', 'bank-financing', 'pag-ibig', 'amortization', 'loan-pre-qualification'],
  sections: [
    {
      id: 'income-financial-profiling',
      title: 'Income Profiling & Debt-to-Income (DTI) Assessment',
      description: 'Audit monthly net disposable income against required amortization ratios.',
      defaultDurationMinutes: 10,
      suggestedOwnerRole: 'Mortgage / Property Specialist',
      prompts: [
        'What is your monthly gross and net disposable household income across all proven income streams?',
        'What existing monthly financial obligations or active car/personal loans are currently running?',
        'What is the buyer employment classification: regular local employee, Overseas Filipino Worker (land-based/sea-based), or business owner/self-employed?'
      ],
      sampleTalkingPoints: [
        'Target debt-service ratio (amortization ideally within 30-35% of proven gross monthly income)',
        'Option for principal borrower plus co-borrower / co-maker (spouse or immediate relative)',
        'Documentation requirements specific to OFW contracts (POEA / DMW verified contract, remittances)'
      ],
      checklist: [
        'Monthly gross household income recorded',
        'Existing loan liabilities accounted for',
        'Co-borrower eligibility verified if income augmentation needed'
      ],
      isRequired: true
    },
    {
      id: 'financing-avenues-comparison',
      title: 'Financing Channel Evaluation: Bank vs PAG-IBIG vs In-House',
      description: 'Contrast loan interest rates, fixing periods, maximum tenure, and approval speed.',
      defaultDurationMinutes: 12,
      suggestedOwnerRole: 'Mortgage / Property Specialist',
      prompts: [
        'Does the property fall within PAG-IBIG Fund loan limits and accredited developer status?',
        'Which accredited partner banks offer competitive indicative interest rates and loan fixing periods (1, 3, or 5-year fixed)?',
        'In what scenario would developer in-house financing be prudent (e.g. temporary bridge or expedited approval without strict credit history)?'
      ],
      sampleTalkingPoints: [
        'Commercial bank financing: typically 70% to 80% loanable value, 10-25 year tenure, lowest rates for prime borrowers',
        'PAG-IBIG housing loan: up to 30 years repayment, fixed terms for qualified members, lower processing rates',
        'In-house financing: higher interest rate (12-18%), shorter tenure (5-10 years), but minimal documentary scrutiny'
      ],
      checklist: [
        'Selected preferred financing avenue (Bank / PAG-IBIG / In-House)',
        'Target loan tenure determined (10, 15, 20, or 25 years)',
        'Indicative interest rate fixing period chosen'
      ],
      isRequired: true
    },
    {
      id: 'equity-downpayment-structuring',
      title: 'Equity Structure, Monthly Schedule & Balloon Options',
      description: 'Calculate the downpayment period amortization and cash flow milestones.',
      defaultDurationMinutes: 10,
      suggestedOwnerRole: 'Property Consultant',
      prompts: [
        'How many months can the remaining equity/downpayment be stretched across (e.g. 12, 24, 36, or 48 months)?',
        'Is there appetite for a balloon payment schedule or step-up monthly installments to match anticipated bonuses or asset liquidations?',
        'What is the exact spot downpayment required before loan takeout occurs?'
      ],
      sampleTalkingPoints: [
        'Sample computation breakdown: TCP minus reservation fee minus net equity installments',
        'Lump-sum / balloon payment timing alignment with seasonal client bonuses',
        'Impact of developer spot-cash or spot-downpayment discounts'
      ],
      checklist: [
        'Exact monthly equity schedule confirmed',
        'Target bank loan application window set (typically 4-6 months prior to equity completion)'
      ],
      isRequired: true
    },
    {
      id: 'closing-fees-miscellaneous-costs',
      title: 'Closing Fees, Taxes & Incidental Outlays',
      description: 'Ensure transparency regarding bank appraisal, documentary stamps, and turnover charges.',
      defaultDurationMinutes: 8,
      suggestedOwnerRole: 'Property Consultant',
      prompts: [
        'Are developer miscellaneous fees / transfer charges (usually 5% to 8% of TCP) bundled into the contract price or billed separately?',
        'What are the upfront bank loan processing expenses (appraisal fee, handling fee, mortgage redemption insurance [MRI], fire insurance)?',
        'What are the expected utility connection, electrical meter deposit, and initial working capital association fees upon turnover?'
      ],
      sampleTalkingPoints: [
        'Estimated bank loan charges (typically 2-3% of loanable amount)',
        'Mortgage Redemption Insurance (MRI) requirement and age health declarations',
        'One-time move-in and condominium association joining dues'
      ],
      checklist: [
        'Miscellaneous transfer fees breakdown provided',
        'Estimated bank charges checklist provided to client',
        'No surprise fees signed off'
      ],
      isRequired: false
    },
    {
      id: 'documentary-checklist-action-plan',
      title: 'Documentary Checklist & Submission Timeline',
      description: 'Provide an itemized checklist of legal and financial papers with strict deadlines.',
      defaultDurationMinutes: 5,
      suggestedOwnerRole: 'Property Consultant',
      prompts: [
        'Which supporting documents are readily available today versus requiring employer or bank issuance?',
        'For OFWs: is a Consularized Special Power of Attorney (SPA) or Apostilled document required for the Philippine attorney-in-fact?',
        'What is our targeted deadline to submit the completed loan application folder?'
      ],
      sampleTalkingPoints: [
        'Checklist: BIR Form 2316 / ITR, 3 months payslips, Certificate of Employment & Compensation (COEC), 6 months bank statements',
        'Government-issued valid photo IDs (passport, national ID, driver\'s license) with 3 specimen signatures',
        'Proof of billing and marital documents (Marriage Certificate or CENOMAR)'
      ],
      checklist: [
        'Document checklist handed to client',
        'SPA requirement clarified if buyer is based overseas',
        'Target submission deadline recorded on calendar'
      ],
      isRequired: true
    }
  ],
  metadata: {
    industry: 'Real Estate',
    market: 'Mortgage & Loan Structuring / Philippines',
    version: '1.0.0'
  }
};
