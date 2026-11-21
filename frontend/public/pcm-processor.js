// AudioWorkletProcessor to capture mic audio, downsample to 16kHz mono, and convert to 16-bit PCM
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetRate = 16000;
    this.chunkSize = 512; // 32ms chunks at 16kHz (1024 bytes)
    this.outputBuffer = new Int16Array(this.chunkSize);
    this.outputIndex = 0;

    // Resampling state
    this.resampleRatio = sampleRate / this.targetRate;
    this.resampleIndex = 0.0;
    this.prevSample = 0.0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) {
      return true;
    }

    const channelData = input[0];

    // Case 1: Browser context is already 16kHz
    if (Math.abs(sampleRate - this.targetRate) < 1) {
      for (let i = 0; i < channelData.length; i++) {
        const s = Math.max(-1, Math.min(1, channelData[i]));
        this.outputBuffer[this.outputIndex++] = s < 0 ? s * 0x8000 : s * 0x7FFF;

        if (this.outputIndex >= this.chunkSize) {
          const bufferCopy = this.outputBuffer.slice().buffer;
          this.port.postMessage(bufferCopy, [bufferCopy]);
          this.outputBuffer = new Int16Array(this.chunkSize);
          this.outputIndex = 0;
        }
      }
      return true;
    }

    // Case 2: General resampling with linear interpolation
    for (let i = 0; i < channelData.length; i++) {
      const currentSample = channelData[i];

      while (this.resampleIndex < 1.0) {
        const interpolated = this.prevSample + this.resampleIndex * (currentSample - this.prevSample);
        const s = Math.max(-1, Math.min(1, interpolated));
        this.outputBuffer[this.outputIndex++] = s < 0 ? s * 0x8000 : s * 0x7FFF;

        if (this.outputIndex >= this.chunkSize) {
          const bufferCopy = this.outputBuffer.slice().buffer;
          this.port.postMessage(bufferCopy, [bufferCopy]);
          this.outputBuffer = new Int16Array(this.chunkSize);
          this.outputIndex = 0;
        }

        this.resampleIndex += this.resampleRatio;
      }

      this.resampleIndex -= 1.0;
      this.prevSample = currentSample;
    }

    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
