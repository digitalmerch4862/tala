export interface AudioRecorderEvents {
  onDataAvailable?: (blob: Blob) => void;
  onVolumeChange?: (volume: number) => void;
  onStateChange?: (state: 'inactive' | 'recording' | 'paused') => void;
  onTimeUpdate?: (seconds: number) => void;
}

export class AudioRecorderService {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private elapsedSeconds: number = 0;
  private timerInterval: NodeJS.Timeout | null = null;
  private isOffTheRecord: boolean = false;

  private events: AudioRecorderEvents = {};

  constructor(events: AudioRecorderEvents = {}) {
    this.events = events;
  }

  public setOffTheRecord(enabled: boolean) {
    this.isOffTheRecord = enabled;
  }

  public getIsOffTheRecord(): boolean {
    return this.isOffTheRecord;
  }

  public async start(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      return;
    }

    this.chunks = [];
    this.elapsedSeconds = 0;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up AudioContext for volume metering
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
          const source = this.audioContext.createMediaStreamSource(this.mediaStream);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 64;
          source.connect(this.analyser);
          this.startVolumeMonitoring();
        }
      } catch (e) {
        console.warn('AudioContext volume monitoring not available:', e);
      }

      // Detect supported mime type
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.mediaStream, mimeType ? { mimeType } : undefined);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0 && !this.isOffTheRecord) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.onstart = () => {
        this.startTime = Date.now();
        this.startTimer();
        this.events.onStateChange?.('recording');
      };

      this.mediaRecorder.onpause = () => {
        this.stopTimer();
        this.events.onStateChange?.('paused');
      };

      this.mediaRecorder.onresume = () => {
        this.startTimer();
        this.events.onStateChange?.('recording');
      };

      this.mediaRecorder.onstop = () => {
        this.stopTimer();
        this.stopVolumeMonitoring();
        const fullBlob = new Blob(this.chunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
        this.events.onDataAvailable?.(fullBlob);
        this.events.onStateChange?.('inactive');
        this.cleanupStream();
      };

      // Request data in chunks every 1000ms
      this.mediaRecorder.start(1000);
    } catch (err) {
      console.error('Failed to start audio recording:', err);
      throw err;
    }
  }

  public pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  public resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  public stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  public getState(): 'inactive' | 'recording' | 'paused' {
    return (this.mediaRecorder?.state as any) || 'inactive';
  }

  public getElapsedSeconds(): number {
    return this.elapsedSeconds;
  }

  private startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds += 1;
      this.events.onTimeUpdate?.(this.elapsedSeconds);
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private startVolumeMonitoring() {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const checkVolume = () => {
      if (!this.analyser || this.mediaRecorder?.state !== 'recording') {
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalized = Math.min(100, Math.round((avg / 128) * 100));

      this.events.onVolumeChange?.(this.isOffTheRecord ? 0 : normalized);
      this.animationFrameId = requestAnimationFrame(checkVolume);
    };

    this.animationFrameId = requestAnimationFrame(checkVolume);
  }

  private stopVolumeMonitoring() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
  }

  private cleanupStream() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
  }

  private getSupportedMimeType(): string | undefined {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
      return undefined;
    }
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return undefined;
  }
}
