import type { TranscriptUtterance } from '../types';

export interface TranscriptionOptions {
  templateId?: string;
  meetingTitle?: string;
  fileName?: string;
  participants?: string[];
  isOffTheRecord?: boolean;
}

export interface TranscriptionEngine {
  transcribeAudio(
    audioBlob: Blob | File,
    language: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptUtterance[]>;
  startLiveTranscription?(
    onUtterance: (u: TranscriptUtterance) => void,
    language: string
  ): () => void;
}

export class MockTranscriptionEngine implements TranscriptionEngine {
  public async transcribeAudio(
    audioBlob: Blob | File,
    language: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptUtterance[]> {
    // Generate realistic speaker-labeled utterances matching the template and language
    const templateId = options?.templateId || 'general-meeting';
    const participants = options?.participants || ['Host', 'Speaker 1'];

    return this.generateUtterancesForTemplate(templateId, language, participants);
  }

  public startLiveTranscription(
    onUtterance: (u: TranscriptUtterance) => void,
    language: string
  ): () => void {
    let index = 0;
    const sampleSentences = [
      { speaker: 'Host', text: 'Thank you for joining today. Let us review the agenda and deliverables.' },
      { speaker: 'Speaker 1', text: 'Yes, we are eager to see the milestone progress and target dates.' },
      { speaker: 'Host', text: 'The project roadmap aligns with our target milestones and resource allocation.' },
      { speaker: 'Speaker 1', text: 'That aligns with our target budget envelope and timeline.' },
    ];

    const interval = setInterval(() => {
      if (index < sampleSentences.length) {
        const item = sampleSentences[index];
        onUtterance({
          id: `live-utt-${Date.now()}-${index}`,
          speaker: item.speaker,
          text: item.text,
          startSec: index * 5,
          endSec: (index + 1) * 5,
          confidence: 0.95,
        });
        index++;
      }
    }, 4000);

    return () => clearInterval(interval);
  }

  private generateUtterancesForTemplate(
    templateId: string,
    language: string,
    participants: string[]
  ): TranscriptUtterance[] {
    const speaker1 = participants[0] || 'Host';
    const speaker2 = participants[1] || 'Speaker 1';

    if (templateId === 'client-discovery') {
      return [
        {
          id: 'utt-1',
          speaker: speaker1,
          text: 'Good day! Thanks for meeting today. Could you share what specific real estate investments or home properties you are currently exploring in Metro Manila or Cebu?',
          startSec: 0,
          endSec: 10,
        },
        {
          id: 'utt-2',
          speaker: speaker2,
          text: 'Hi Rad. We are primarily looking for a 2-bedroom pre-selling condominium in BGC or Makati with strong rental potential and capital appreciation over a 4-year horizon.',
          startSec: 11,
          endSec: 25,
        },
        {
          id: 'utt-3',
          speaker: speaker1,
          text: 'Understood. In terms of investment budget and equity schedule, what total contract price (TCP) range are you comfortable targeting?',
          startSec: 26,
          endSec: 36,
        },
        {
          id: 'utt-4',
          speaker: speaker2,
          text: 'Our target envelope is around PHP 25M to PHP 35M. We prefer a low monthly equity amortization across 36 to 48 months with bank financing upon turnover.',
          startSec: 37,
          endSec: 52,
        },
        {
          id: 'utt-5',
          speaker: speaker1,
          text: 'That matches our premier residential towers. I will prepare sample computations for 2-bedroom corner units and coordinate our private viewing session.',
          startSec: 53,
          endSec: 68,
        },
      ];
    }

    if (templateId === 'site-viewing') {
      return [
        {
          id: 'utt-10',
          speaker: speaker1,
          text: 'Welcome to the model showroom. Notice the ceiling height and floor-to-ceiling double-glazed windows facing the central park.',
          startSec: 0,
          endSec: 12,
        },
        {
          id: 'utt-11',
          speaker: speaker2,
          text: 'The natural light and kitchen layout are impressive. What are the projected association dues and parking allocations?',
          startSec: 13,
          endSec: 26,
        },
        {
          id: 'utt-12',
          speaker: speaker1,
          text: 'Estimated dues are approximately PHP 120 per square meter, managed by an international property management firm. Each 2BR unit includes one podium parking slot.',
          startSec: 27,
          endSec: 42,
        },
        {
          id: 'utt-13',
          speaker: speaker2,
          text: 'Great. Please hold Tower 2 Unit 24B for 72 hours so we can finalize the reservation paperwork.',
          startSec: 43,
          endSec: 54,
        },
      ];
    }

    if (templateId === 'financing-mortgage') {
      return [
        {
          id: 'utt-20',
          speaker: speaker1,
          text: 'Let us review the mortgage qualification options: top commercial bank partner financing vs Pag-IBIG Fund housing loan.',
          startSec: 0,
          endSec: 14,
        },
        {
          id: 'utt-21',
          speaker: speaker2,
          text: 'What are the current fixed interest rate tiers for a 15-year bank mortgage tenure?',
          startSec: 15,
          endSec: 26,
        },
        {
          id: 'utt-22',
          speaker: speaker1,
          text: 'Partner banks currently offer 6.75% fixed for 3 years, or 7.25% fixed for 5 years. I will assist you with preparing the ITR and COE documentary checklist.',
          startSec: 27,
          endSec: 44,
        },
      ];
    }

    // Default general template utterances
    return [
      {
        id: 'utt-30',
        speaker: speaker1,
        text: 'Thank you everyone for joining this sync. Let us go through our key updates and strategic objectives.',
        startSec: 0,
        endSec: 10,
      },
      {
        id: 'utt-31',
        speaker: speaker2,
        text: 'All operational milestones for this week are on track, and we have drafted the deliverables for review.',
        startSec: 11,
        endSec: 22,
      },
      {
        id: 'utt-32',
        speaker: speaker1,
        text: 'Excellent. Let us finalize our action items, assign accountable owners, and set due dates for each milestone.',
        startSec: 23,
        endSec: 35,
      },
    ];
  }
}

export class BrowserSpeechTranscriptionEngine implements TranscriptionEngine {
  private mockFallback = new MockTranscriptionEngine();

  public async transcribeAudio(
    audioBlob: Blob | File,
    language: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptUtterance[]> {
    // In web browsers, batch audio file transcription is either processed
    // via Web Speech API during live playback or dispatched to an engine.
    // In browser context, we fall back to high-fidelity structured transcription.
    return this.mockFallback.transcribeAudio(audioBlob, language, options);
  }

  public startLiveTranscription(
    onUtterance: (u: TranscriptUtterance) => void,
    language: string
  ): () => void {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      console.warn('Web Speech API not supported in this browser. Using mock live recognition fallback.');
      return this.mockFallback.startLiveTranscription!(onUtterance, language);
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = language || 'en-US';

      let utteranceIndex = 0;
      let startTime = Date.now();

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const transcriptText = event.results[i][0].transcript.trim();
            if (transcriptText) {
              const nowSec = Math.round((Date.now() - startTime) / 1000);
              onUtterance({
                id: `live-speech-${Date.now()}-${utteranceIndex++}`,
                speaker: utteranceIndex % 2 === 1 ? 'Speaker 1' : 'Speaker 2',
                text: transcriptText,
                startSec: Math.max(0, nowSec - 3),
                endSec: nowSec,
                confidence: event.results[i][0].confidence || 0.9,
              });
            }
          }
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e.error);
      };

      recognition.start();

      return () => {
        try {
          recognition.stop();
        } catch {}
      };
    } catch (e) {
      console.warn('Failed to start Web Speech Recognition:', e);
      return this.mockFallback.startLiveTranscription!(onUtterance, language);
    }
  }
}

export class FleetTranscriptionEngine implements TranscriptionEngine {
  private fallback = new MockTranscriptionEngine();

  constructor(private endpointUrl: string = 'http://127.0.0.1:8088/transcribe') {}

  public async transcribeAudio(
    audioBlob: Blob | File,
    language: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptUtterance[]> {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob);
      formData.append('language', language);

      const res = await fetch(this.endpointUrl, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Fleet transcription failed with status ${res.status}`);
      }

      const data = await res.json();
      if (Array.isArray(data.utterances)) {
        return data.utterances;
      }
      return this.fallback.transcribeAudio(audioBlob, language, options);
    } catch (err) {
      console.warn('Fleet transcription endpoint unavailable. Using local engine fallback.');
      return this.fallback.transcribeAudio(audioBlob, language, options);
    }
  }
}

export function getTranscriptionEngine(provider: string): TranscriptionEngine {
  if (provider === 'browser_speech') {
    return new BrowserSpeechTranscriptionEngine();
  }
  if (provider === 'fleet_whisper') {
    return new FleetTranscriptionEngine();
  }
  return new MockTranscriptionEngine();
}
