import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { 
  OtrManager, 
  stripOtrFromUtterances, 
  stripOtrFromTimestampedText 
} from '../../privacy/otr/index.js';
import { TranscriptUtterance } from '../../privacy/types/index.js';

describe('Off-The-Record (OTR) Segments Engine', () => {
  it('should mark segments and consolidate overlapping or adjacent intervals', () => {
    const otr = new OtrManager();

    // Mark segment 10s -> 25s
    otr.markSegment(10, 25, { reason: 'Confidential salary discussion' });
    assert.equal(otr.getSegments().length, 1);

    // Mark overlapping segment 20s -> 40s
    otr.markSegment(20, 40, { reason: 'Compensation wrap-up' });

    // Should merge into single segment 10s -> 40s
    const segments = otr.getSegments();
    assert.equal(segments.length, 1);
    assert.equal(segments[0].startTimeSeconds, 10);
    assert.equal(segments[0].endTimeSeconds, 40);
    assert.equal(otr.getTotalOtrDurationSeconds(), 30);
  });

  it('should accurately test if a timestamp falls within an OTR segment', () => {
    const otr = new OtrManager();
    otr.markSegment(60, 120);

    assert.equal(otr.isTimestampOtr(30), false);
    assert.equal(otr.isTimestampOtr(60), true);
    assert.equal(otr.isTimestampOtr(90), true);
    assert.equal(otr.isTimestampOtr(120), true);
    assert.equal(otr.isTimestampOtr(121), false);
  });

  it('should strip off-the-record utterances completely from transcript summary input', () => {
    const otr = new OtrManager();
    // Segment from 30s to 70s is OTR
    otr.markSegment(30, 70);

    const utterances: TranscriptUtterance[] = [
      { id: 'u1', speaker: 'Alice', startTimeSeconds: 0, endTimeSeconds: 25, text: 'Let us begin with project goals.' },
      { id: 'u2', speaker: 'Bob', startTimeSeconds: 32, endTimeSeconds: 45, text: 'This secret strategy is completely off the record.' },
      { id: 'u3', speaker: 'Alice', startTimeSeconds: 48, endTimeSeconds: 68, text: 'Agreed, strictly confidential numbers here.' },
      { id: 'u4', speaker: 'Bob', startTimeSeconds: 75, endTimeSeconds: 90, text: 'Back on the record: our next sprint release date is Friday.' }
    ];

    const result = stripOtrFromUtterances(utterances, otr.getSegments(), { insertPlaceholder: false });

    assert.equal(result.originalUtteranceCount, 4);
    assert.equal(result.sanitizedUtteranceCount, 2);
    assert.equal(result.strippedSegmentCount, 2);

    assert.ok(result.sanitizedText.includes('Let us begin with project goals.'));
    assert.ok(result.sanitizedText.includes('Back on the record: our next sprint release date is Friday.'));
    assert.ok(!result.sanitizedText.includes('secret strategy'));
    assert.ok(!result.sanitizedText.includes('confidential numbers'));
  });

  it('should support placeholder mode for sanitized transcript view', () => {
    const otr = new OtrManager();
    otr.markSegment(20, 50);

    const utterances: TranscriptUtterance[] = [
      { id: 'u1', speaker: 'Alice', startTimeSeconds: 0, endTimeSeconds: 15, text: 'Public topic.' },
      { id: 'u2', speaker: 'Bob', startTimeSeconds: 25, endTimeSeconds: 45, text: 'Private discussion.' },
      { id: 'u3', speaker: 'Alice', startTimeSeconds: 60, endTimeSeconds: 80, text: 'Resuming public topic.' }
    ];

    const result = stripOtrFromUtterances(utterances, otr.getSegments(), { insertPlaceholder: true });

    assert.equal(result.sanitizedUtterances.length, 3);
    assert.equal(result.sanitizedUtterances[1].text, '[OFF-THE-RECORD]');
    assert.ok(!result.sanitizedText.includes('Private discussion.'));
  });

  it('should strip OTR lines from timestamped plain text', () => {
    const plain = `
[00:05] Alice: Welcome everyone.
[00:25] Bob: Can we speak off the record about bonus targets?
[00:45] Alice: Sure, here is the secret formula.
[01:10] Bob: Back on topic, let's look at Q4 roadmap.
    `.trim();

    const otr = new OtrManager();
    otr.markSegment(20, 50); // 20s to 50s

    const stripped = stripOtrFromTimestampedText(plain, otr.getSegments());
    assert.ok(stripped.includes('Welcome everyone.'));
    assert.ok(stripped.includes("let's look at Q4 roadmap."));
    assert.ok(!stripped.includes('secret formula'));
    assert.ok(!stripped.includes('bonus targets'));
  });
});
