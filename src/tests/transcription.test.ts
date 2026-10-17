import { describe, it, expect } from 'vitest';
import { MockTranscriptionEngine } from '../services/transcription';
import { SUPPORTED_LANGUAGES } from '../languages/languages';

describe('Tala Transcription Engine & 92 Languages', () => {
  const engine = new MockTranscriptionEngine();

  it('verifies 92 languages registry contains required languages', () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(92);

    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toContain('fil-PH'); // Filipino
    expect(codes).toContain('ceb-PH'); // Cebuano / Bisaya
    expect(codes).toContain('ilo-PH'); // Ilocano
    expect(codes).toContain('en-US'); // English (US)
    expect(codes).toContain('zh-CN'); // Mandarin
    expect(codes).toContain('ja-JP'); // Japanese
    expect(codes).toContain('es-ES'); // Spanish
  });

  it('transcribes audio with speaker diarization labels and timestamps', async () => {
    const mockBlob = new Blob(['mock audio stream'], { type: 'audio/webm' });

    const utterances = await engine.transcribeAudio(mockBlob, 'fil-PH', {
      templateId: 'client-discovery',
      meetingTitle: 'Client Consultation',
      participants: ['Rad (BDM)', 'Buyer Atty. Tan'],
    });

    expect(utterances.length).toBeGreaterThan(0);
    expect(utterances[0].speaker).toBe('Rad (BDM)');
    expect(utterances[1].speaker).toBe('Buyer Atty. Tan');
    expect(utterances[0].startSec).toBe(0);
    expect(utterances[0].endSec).toBeGreaterThan(0);
    expect(utterances[0].text.length).toBeGreaterThan(10);
  });
});
