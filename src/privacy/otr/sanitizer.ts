import { 
  OtrSegment, 
  SanitizedTranscriptResult, 
  TranscriptUtterance 
} from '../types/otr.js';

export interface SanitizeOptions {
  /** If true, replaces utterance text with '[OFF-THE-RECORD]'. If false, drops it entirely. Default: false */
  insertPlaceholder?: boolean;
  /** Placeholder text if insertPlaceholder is true. Default: '[OFF-THE-RECORD]' */
  customPlaceholder?: string;
  /** Format of sanitizedText: whether to include speaker name. Default: true */
  includeSpeaker?: boolean;
}

/**
 * Checks if a time range [start, end] intersects with an OTR segment.
 */
function intersects(start: number, end: number, otr: OtrSegment): boolean {
  if (start === end) {
    return start >= otr.startTimeSeconds && start <= otr.endTimeSeconds;
  }
  return Math.max(start, otr.startTimeSeconds) < Math.min(end, otr.endTimeSeconds);
}

/**
 * Checks if a time range [start, end] is completely contained inside an OTR segment.
 */
function isFullyContained(start: number, end: number, otr: OtrSegment): boolean {
  return start >= otr.startTimeSeconds && end <= otr.endTimeSeconds;
}

/**
 * Strips off-the-record segments from transcript utterances to sanitize input for LLM summaries.
 */
export function stripOtrFromUtterances(
  utterances: readonly TranscriptUtterance[],
  otrSegments: readonly OtrSegment[],
  options: SanitizeOptions = {}
): SanitizedTranscriptResult {
  const insertPlaceholder = options.insertPlaceholder ?? false;
  const placeholder = options.customPlaceholder || '[OFF-THE-RECORD]';
  const includeSpeaker = options.includeSpeaker ?? true;

  if (utterances.length === 0) {
    return {
      originalUtteranceCount: 0,
      sanitizedUtteranceCount: 0,
      originalDurationSeconds: 0,
      strippedOtrDurationSeconds: 0,
      sanitizedUtterances: [],
      sanitizedText: '',
      strippedSegmentCount: 0
    };
  }

  // Calculate original duration
  const minStart = Math.min(...utterances.map(u => u.startTimeSeconds));
  const maxEnd = Math.max(...utterances.map(u => u.endTimeSeconds));
  const originalDurationSeconds = Math.max(0, maxEnd - minStart);

  if (otrSegments.length === 0) {
    const text = utterances.map(u => includeSpeaker && u.speaker ? `${u.speaker}: ${u.text}` : u.text).join('\n');
    return {
      originalUtteranceCount: utterances.length,
      sanitizedUtteranceCount: utterances.length,
      originalDurationSeconds,
      strippedOtrDurationSeconds: 0,
      sanitizedUtterances: JSON.parse(JSON.stringify(utterances)),
      sanitizedText: text,
      strippedSegmentCount: 0
    };
  }

  const sanitized: TranscriptUtterance[] = [];
  let strippedDuration = 0;
  let strippedCount = 0;

  for (const u of utterances) {
    // Check if fully inside any OTR segment
    const fullyInside = otrSegments.find(otr => isFullyContained(u.startTimeSeconds, u.endTimeSeconds, otr));

    if (fullyInside) {
      strippedDuration += (u.endTimeSeconds - u.startTimeSeconds);
      strippedCount++;
      if (insertPlaceholder) {
        sanitized.push({
          ...u,
          text: placeholder
        });
      }
      continue;
    }

    // Check if partially intersects with any OTR segment
    const intersecting = otrSegments.filter(otr => intersects(u.startTimeSeconds, u.endTimeSeconds, otr));

    if (intersecting.length === 0) {
      // Clean utterance: completely on the record
      sanitized.push({ ...u });
    } else {
      // Partial overlap: calculate overlapping duration
      let overlapSeconds = 0;
      for (const seg of intersecting) {
        const overlapStart = Math.max(u.startTimeSeconds, seg.startTimeSeconds);
        const overlapEnd = Math.min(u.endTimeSeconds, seg.endTimeSeconds);
        overlapSeconds += Math.max(0, overlapEnd - overlapStart);
      }

      strippedDuration += overlapSeconds;
      strippedCount++;

      const utteranceDuration = u.endTimeSeconds - u.startTimeSeconds;

      // If more than 50% of the utterance falls into OTR, drop or mark placeholder
      if (overlapSeconds >= utteranceDuration * 0.5) {
        if (insertPlaceholder) {
          sanitized.push({
            ...u,
            text: placeholder
          });
        }
      } else {
        // Retain with sanitization tag
        sanitized.push({
          ...u,
          text: `${u.text} ${placeholder}`.trim()
        });
      }
    }
  }

  const sanitizedText = sanitized
    .map(u => includeSpeaker && u.speaker ? `${u.speaker}: ${u.text}` : u.text)
    .join('\n');

  return {
    originalUtteranceCount: utterances.length,
    sanitizedUtteranceCount: sanitized.length,
    originalDurationSeconds,
    strippedOtrDurationSeconds: Math.round(strippedDuration * 100) / 100,
    sanitizedUtterances: sanitized,
    sanitizedText,
    strippedSegmentCount: strippedCount
  };
}

/**
 * Parses timestamp string "MM:SS" or "HH:MM:SS" into total seconds.
 */
export function parseTimestampToSeconds(ts: string): number | null {
  const parts = ts.trim().split(':').map(Number);
  if (parts.some(isNaN)) return null;

  if (parts.length === 2) {
    const [min, sec] = parts;
    return min * 60 + sec;
  }
  if (parts.length === 3) {
    const [hr, min, sec] = parts;
    return hr * 3600 + min * 60 + sec;
  }
  return null;
}

/**
 * Sanitizes plain text containing timestamps (e.g. "[02:15] Speaker: words")
 * by removing or masking lines that fall into off-the-record ranges.
 */
export function stripOtrFromTimestampedText(
  text: string,
  otrSegments: readonly OtrSegment[],
  options: SanitizeOptions = {}
): string {
  if (!text || otrSegments.length === 0) return text;

  const lines = text.split('\n');
  const result: string[] = [];
  const placeholder = options.customPlaceholder || '[OFF-THE-RECORD]';

  const tsRegex = /\[?(\d{1,2}:\d{2}(?::\d{2})?)(?:\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?))?\]?/;

  for (const line of lines) {
    const match = tsRegex.exec(line);
    if (!match) {
      result.push(line);
      continue;
    }

    const startSec = parseTimestampToSeconds(match[1]);
    const endSec = match[2] ? parseTimestampToSeconds(match[2]) : startSec;

    if (startSec === null) {
      result.push(line);
      continue;
    }

    const effectiveEnd = endSec ?? startSec;

    const isOtr = otrSegments.some(otr => intersects(startSec, effectiveEnd, otr));

    if (isOtr) {
      if (options.insertPlaceholder) {
        result.push(line.replace(line.slice(match[0].length), ` ${placeholder}`));
      }
      // If not insertPlaceholder, line is omitted entirely
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}
