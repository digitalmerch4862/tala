export interface OtrSegment {
  id: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  reason?: string;
  markedBy?: string;
  createdAt: string;
}

export interface TranscriptUtterance {
  id: string;
  speaker?: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  text: string;
}

export interface SanitizedTranscriptResult {
  originalUtteranceCount: number;
  sanitizedUtteranceCount: number;
  originalDurationSeconds: number;
  strippedOtrDurationSeconds: number;
  sanitizedUtterances: TranscriptUtterance[];
  sanitizedText: string;
  strippedSegmentCount: number;
}
