import type { MeetingTemplate } from '../types/template.js';

// Real Estate Templates
import { clientDiscoveryTemplate } from './data/real-estate/client-discovery.js';
import { siteViewingTemplate } from './data/real-estate/site-viewing.js';
import { developerBrokerCallTemplate } from './data/real-estate/developer-broker-call.js';
import { financingConsultationTemplate } from './data/real-estate/financing-consultation.js';
import { closingFollowupTemplate } from './data/real-estate/closing-followup.js';

// General Templates
import { teamStandupTemplate } from './data/general/team-standup.js';
import { clientCallTemplate } from './data/general/client-call.js';
import { oneOnOneTemplate } from './data/general/one-on-one.js';
import { salesCallTemplate } from './data/general/sales-call.js';
import { projectPlanningTemplate } from './data/general/project-planning.js';
import { weeklyTeamSyncTemplate } from './data/general/weekly-team-sync.js';
import { projectKickoffTemplate } from './data/general/project-kickoff.js';
import { retrospectiveTemplate } from './data/general/retrospective.js';

export const REAL_ESTATE_TEMPLATES: readonly MeetingTemplate[] = [
  clientDiscoveryTemplate,
  siteViewingTemplate,
  developerBrokerCallTemplate,
  financingConsultationTemplate,
  closingFollowupTemplate
];

export const GENERAL_TEMPLATES: readonly MeetingTemplate[] = [
  teamStandupTemplate,
  clientCallTemplate,
  oneOnOneTemplate,
  salesCallTemplate,
  projectPlanningTemplate,
  weeklyTeamSyncTemplate,
  projectKickoffTemplate,
  retrospectiveTemplate
];

export const BUILTIN_TEMPLATES: readonly MeetingTemplate[] = [
  ...REAL_ESTATE_TEMPLATES,
  ...GENERAL_TEMPLATES
];
