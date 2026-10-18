import type { Meeting, TranscriptUtterance, AuditLogEntry } from '../types';
import { saveAuditLog } from './storage';

/**
 * Redacts occurrences of sensitive phrases in a string
 */
export function redactText(text: string, phrases: string[]): string {
  if (!text || !phrases || phrases.length === 0) return text;
  let result = text;

  for (const phrase of phrases) {
    if (!phrase || !phrase.trim()) continue;
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    result = result.replace(regex, '[REDACTED]');
  }

  return result;
}

/**
 * Applies redaction across all transcript utterances
 */
export function redactTranscript(
  transcript: TranscriptUtterance[],
  phrases: string[]
): TranscriptUtterance[] {
  if (!transcript || phrases.length === 0) return transcript;

  return transcript.map((utt) => ({
    ...utt,
    text: redactText(utt.text, phrases),
  }));
}

/**
 * Redacts a phrase across a meeting's transcript, summary, and action items
 */
export async function redactMeetingContent(
  meeting: Meeting,
  phraseToRedact: string,
  actor: string = 'Rad (BDM)'
): Promise<Meeting> {
  const cleanPhrase = phraseToRedact.trim();
  if (!cleanPhrase) return meeting;

  const currentRedacted = meeting.redactedPhrases || [];
  if (currentRedacted.includes(cleanPhrase)) {
    return meeting; // already redacted
  }

  const updatedRedactedList = [...currentRedacted, cleanPhrase];

  const updatedTranscript = redactTranscript(meeting.transcript, updatedRedactedList);
  const updatedOverview = redactText(meeting.summary.overview, updatedRedactedList);
  const updatedPoints = meeting.summary.keyDiscussionPoints.map((p) =>
    redactText(p, updatedRedactedList)
  );
  const updatedDecisions = meeting.summary.decisionsMade.map((d) =>
    redactText(d, updatedRedactedList)
  );
  const updatedNextSteps = meeting.summary.nextSteps.map((s) =>
    redactText(s, updatedRedactedList)
  );

  const updatedActions = meeting.actionItems.map((a) => ({
    ...a,
    title: redactText(a.title, updatedRedactedList),
  }));

  const updatedMeeting: Meeting = {
    ...meeting,
    redactedPhrases: updatedRedactedList,
    transcript: updatedTranscript,
    summary: {
      ...meeting.summary,
      overview: updatedOverview,
      keyDiscussionPoints: updatedPoints,
      decisionsMade: updatedDecisions,
      nextSteps: updatedNextSteps,
    },
    actionItems: updatedActions,
  };

  // Log compliance audit event
  await saveAuditLog({
    id: `audit-redact-${Date.now()}`,
    timestamp: new Date().toISOString(),
    eventType: 'transcript_redacted',
    meetingId: meeting.id,
    meetingTitle: meeting.title,
    details: `Applied redaction rule for phrase: "${cleanPhrase}" across transcript and summary notes.`,
    actor,
  });

  return updatedMeeting;
}
