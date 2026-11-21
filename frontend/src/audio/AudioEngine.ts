/**
 * Ultra-low latency Audio Engine for Gemini Multimodal Live API
 * Handles:
 * 1. Zero-lag 16kHz PCM capture via AudioWorklet ('/pcm-processor.js')
 * 2. Real-time RMS mic volume calculation
 * 3. Gapless 24kHz PCM scheduled playback queue
 * 4. Real-time bot output amplitude analysis (AnalyserNode)
 * 5. Instant sub-millisecond barge-in interruption stop
 */

export class AudioEngine {
  // Capture Context & Nodes
  private captureCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private micDataArray: Uint8Array | null = null;

  // Playback Context & Nodes
  private playbackCtx: AudioContext | null = null;
  private playbackAnalyser: AnalyserNode | null = null;
  private playbackDataArray: Uint8Array | null = null;
  private activeSources: AudioBufferSourceNode[] = [];
  private nextPlayTime: number = 0;

  // State
  private isMuted: boolean = false;
  private isSpeakerMode: boolean = true; // Default: Speaker Mode (half-duplex protection against speaker feedback)
  private isBotPlaying: boolean = false; // Stays true until the last queued AudioBuffer finishes + 250ms room tail
  private tailTimeout: number | null = null;
  private readonly ROOM_ECHO_TAIL_MS = 250;
  private onPcmDataCallback: ((chunk: ArrayBuffer) => void) | null = null;
  private onPlaybackEndedCallback: (() => void) | null = null;

  constructor() {}

  public isCapturing(): boolean {
    return this.captureCtx !== null && this.captureCtx.state === 'running';
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.micStream) {
      this.micStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Initialize microphone capture using AudioWorklet downsampler
   */
  public async startCapture(onPcmChunk: (chunk: ArrayBuffer) => void): Promise<void> {
    this.onPcmDataCallback = onPcmChunk;

    // Request audio stream with browser processing flags optimized for speech
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.micStream = stream;

    // Use default browser audio context sample rate to avoid hardware mismatch,
    // the pcm-processor.js worklet smoothly downsamples whatever rate to 16kHz
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.captureCtx = new AudioContextClass();

    if (this.captureCtx.state === 'suspended') {
      await this.captureCtx.resume();
    }

    // Load AudioWorklet downsampler
    await this.captureCtx.audioWorklet.addModule('/pcm-processor.js');

    this.micSource = this.captureCtx.createMediaStreamSource(stream);
    this.workletNode = new AudioWorkletNode(this.captureCtx, 'pcm-processor');

    // Create Mic Analyser for RMS volume
    this.micAnalyser = this.captureCtx.createAnalyser();
    this.micAnalyser.fftSize = 256;
    this.micAnalyser.smoothingTimeConstant = 0.3;
    this.micDataArray = new Uint8Array(this.micAnalyser.frequencyBinCount);

    // Pipe audio to worklet and analyser
    this.micSource.connect(this.workletNode);
    this.micSource.connect(this.micAnalyser);

    // Listen for 16kHz 16-bit PCM chunks (512 samples = 32ms)
    this.workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      if (this.isMuted || !this.onPcmDataCallback) {
        return;
      }

      // Acoustic Echo Gate (Half-Duplex Speaker Protection):
      // In Speaker Mode (default), while the bot is actively playing audio (or within
      // the 250ms room echo tail), DROP all microphone frames so speakers never leak
      // into the microphone and cause Gemini to self-interrupt mid-sentence!
      // In Headphones Mode (full duplex), audio is streamed continuously for hands-free voice barge-in.
      if (this.isSpeakerMode && this.isBotPlaying) {
        return;
      }

      this.onPcmDataCallback(event.data);
    };
  }

  /**
   * Initialize 24kHz playback engine
   */
  public async ensurePlaybackContext(): Promise<void> {
    if (!this.playbackCtx || this.playbackCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      
      // Attempt 24kHz context for native matching, fallback cleanly if browser overrides
      try {
        this.playbackCtx = new AudioContextClass({ sampleRate: 24000 });
      } catch {
        this.playbackCtx = new AudioContextClass();
      }

      this.playbackAnalyser = this.playbackCtx.createAnalyser();
      this.playbackAnalyser.fftSize = 256;
      this.playbackAnalyser.smoothingTimeConstant = 0.2;
      this.playbackDataArray = new Uint8Array(this.playbackAnalyser.frequencyBinCount);
      this.playbackAnalyser.connect(this.playbackCtx.destination);
    }

    if (this.playbackCtx.state === 'suspended') {
      await this.playbackCtx.resume();
    }
  }

  /**
   * Queue incoming 24kHz 16-bit signed little-endian PCM audio chunk
   */
  public queueAudioChunk(pcmChunk: ArrayBuffer): void {
    if (!this.playbackCtx || !this.playbackAnalyser) {
      return;
    }

    const int16Array = new Int16Array(pcmChunk);
    if (int16Array.length === 0) return;

    // A chunk has arrived and will be queued; mark bot as playing and cancel any tail timeout
    if (this.tailTimeout !== null) {
      clearTimeout(this.tailTimeout);
      this.tailTimeout = null;
    }
    this.isBotPlaying = true;

    // Convert Int16 PCM to Float32 [-1.0, 1.0]
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    // Create 24kHz mono AudioBuffer
    const audioBuffer = this.playbackCtx.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = this.playbackCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.playbackAnalyser);

    const currentTime = this.playbackCtx.currentTime;
    // Schedule seamlessly back-to-back
    const startTime = Math.max(currentTime, this.nextPlayTime);
    source.start(startTime);
    this.nextPlayTime = startTime + audioBuffer.duration;

    this.activeSources.push(source);

    source.onended = () => {
      const idx = this.activeSources.indexOf(source);
      if (idx !== -1) {
        this.activeSources.splice(idx, 1);
      }
      // When the last scheduled AudioBufferSourceNode finishes playing,
      // start the 250ms tail buffer before setting isBotPlaying = false
      // so acoustic room echo completely dies down before un-gating the mic.
      if (
        this.activeSources.length === 0 &&
        (!this.playbackCtx || this.playbackCtx.currentTime >= this.nextPlayTime - 0.05)
      ) {
        if (this.tailTimeout !== null) {
          clearTimeout(this.tailTimeout);
        }
        this.tailTimeout = window.setTimeout(() => {
          this.isBotPlaying = false;
          this.tailTimeout = null;
          if (this.onPlaybackEndedCallback) {
            this.onPlaybackEndedCallback();
          }
        }, this.ROOM_ECHO_TAIL_MS);
      }
    };
  }

  public setSpeakerMode(enabled: boolean): void {
    this.isSpeakerMode = enabled;
  }

  public getSpeakerMode(): boolean {
    return this.isSpeakerMode;
  }

  public getIsBotPlaying(): boolean {
    return this.isBotPlaying;
  }

  /**
   * Instant Barge-In interruption: immediately kill all queued and playing audio
   */
  public stopPlayback(): void {
    if (this.tailTimeout !== null) {
      clearTimeout(this.tailTimeout);
      this.tailTimeout = null;
    }
    this.isBotPlaying = false;

    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Source might already have ended
      }
    }
    this.activeSources = [];
    this.nextPlayTime = 0;
  }

  public setOnPlaybackEnded(callback: () => void): void {
    this.onPlaybackEndedCallback = callback;
  }

  /**
   * Calculate real-time microphone RMS volume [0.0 - 1.0]
   */
  public getMicVolume(): number {
    if (!this.micAnalyser || !this.micDataArray || this.isMuted) return 0;
    this.micAnalyser.getByteTimeDomainData(this.micDataArray);

    let sumSquares = 0;
    for (let i = 0; i < this.micDataArray.length; i++) {
      const normalized = (this.micDataArray[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / this.micDataArray.length);
    return Math.min(1.0, rms * 3.5); // Amplified scale for responsive visual glow
  }

  /**
   * Calculate real-time bot output playback RMS volume [0.0 - 1.0]
   */
  public getBotVolume(): number {
    if (!this.playbackAnalyser || !this.playbackDataArray || this.activeSources.length === 0) return 0;
    this.playbackAnalyser.getByteTimeDomainData(this.playbackDataArray);

    let sumSquares = 0;
    for (let i = 0; i < this.playbackDataArray.length; i++) {
      const normalized = (this.playbackDataArray[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / this.playbackDataArray.length);
    return Math.min(1.0, rms * 3.0);
  }

  public isBotSpeaking(): boolean {
    return this.isBotPlaying;
  }

  /**
   * Stop everything and release audio devices
   */
  public cleanup(): void {
    this.stopPlayback();

    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }

    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }

    if (this.captureCtx && this.captureCtx.state !== 'closed') {
      this.captureCtx.close();
      this.captureCtx = null;
    }

    if (this.playbackCtx && this.playbackCtx.state !== 'closed') {
      this.playbackCtx.close();
      this.playbackCtx = null;
    }

    this.onPcmDataCallback = null;
    this.onPlaybackEndedCallback = null;
  }
}
