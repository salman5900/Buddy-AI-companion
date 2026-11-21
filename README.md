# AI Buddy - Ultra-Low-Latency Real-Time Voice Companion

A real-time voice companion web application powered by the **Gemini Multimodal Live API** (`gemini-3.8-live`) over bidirectional WebSockets, featuring an expressive, cute 3D-styled AI cube companion with near-zero conversational lag.

---

## Architecture Overview

```
Browser (Microphone)
   │
   ▼
AudioWorklet (`pcm-processor.js`) ──[ 16kHz Mono 16-bit PCM ]──> WebSocket Client
                                                                      │
                                                                      ▼
FastAPI Relay Server (`ws://localhost:8000/ws/voice`) <───────────────┘
   │
   ▼
Gemini Multimodal Live API (`gemini-3.8-live` via `google-genai` v1beta)
   │
   ├─► 24kHz Raw PCM Binary Audio Frames (Zero Base64 Overhead)
   ├─► Barge-in Interruption Events (`{"type": "interrupted"}`)
   └─► Real-Time Subtitles (`user_transcript`, `bot_transcript`, `turn_complete`)
   │
   ▼
Browser Playback Engine:
   ├─► Gapless Scheduled Playback Queue (24kHz Web Audio Context)
   ├─► Instant Barge-in Interruption (stops queued buffers in <1ms)
   └─► State-Reactive 3D Cube (reactive eyes, cheeks, bounce, aura glow)
```

---

## Features

- **Gemini 3.8 Live API Bidirectional Relay:** Direct WebSocket communication with Google's low-latency multimodal voice streaming.
- **Dedicated AudioWorklet Processor:** Clean downsampling from native browser audio (e.g. 48kHz) to 16kHz 16-bit signed little-endian PCM with linear interpolation in 32ms chunks.
- **Gapless 24kHz Playback Engine:** Schedules incoming 24kHz audio buffers back-to-back using Web Audio API timestamps (`audioCtx.currentTime`), eliminating audio gaps and stutter.
- **Instant Barge-in Interruption:** Intercepts Gemini's `interrupted` event and halts all playing and queued `AudioBufferSourceNode`s in <1ms so the companion stops speaking mid-syllable.
- **Expressive 3D Animated Cube Character:**
  - **Idle / Disconnected:** Sleepy half-closed eyes with gentle breathing float.
  - **Listening:** Wide attentive anime sparkle eyes, subtle tilt toward user, and dynamic cyan aura ring reacting to microphone RMS volume.
  - **Thinking:** Inquisitive squint and amber shimmer pulse immediately upon speech end to mask network turnaround.
  - **Speaking:** Happy curved eyes (`^ ^`), dynamic talking mouth, and rhythmic squash-and-stretch bounce synced in real time to the output `AnalyserNode`.
  - **Interrupted:** Surprised wide `( ° o ° )` expression before snapping back to listening.
- **Floating Controls & Customization:**
  - Status pill with live connection state, voice state, and RTT latency in milliseconds.
  - Subtle auto-fading glassmorphic subtitle pills.
  - Slide-over drawer to switch between voices (`Aoede`, `Puck`, `Kore`, `Charon`, `Fenrir`) and live system prompts/persona presets.
  - Silent text nudge prompt box for silent input.

---

## Project Structure

```
.
├── backend/
│   ├── .env                 # API keys & model configuration
│   ├── gemini_live.py       # Google GenAI Live API client setup & config
│   ├── main.py              # FastAPI app & bidirectional WebSocket relay
│   ├── requirements.txt     # Python backend dependencies
│   └── venv/                # Python virtual environment
├── frontend/
│   ├── public/
│   │   └── pcm-processor.js # AudioWorklet for 16kHz PCM downsampling
│   ├── src/
│   │   ├── audio/
│   │   │   └── AudioEngine.ts       # 16kHz capture & 24kHz scheduled playback
│   │   ├── components/
│   │   │   ├── BottomDock.tsx       # Floating call/mute/text/settings bar
│   │   │   ├── CompanionCube.tsx    # 3D expressive animated cube
│   │   │   ├── SettingsDrawer.tsx   # Voice & persona switcher
│   │   │   ├── SubtitlePills.tsx    # Real-time subtitle bubbles
│   │   │   └── TopStatusPill.tsx    # Status & RTT latency pill
│   │   ├── App.tsx          # Main state machine & orchestrator
│   │   ├── main.tsx         # React root
│   │   ├── types.ts         # TypeScript definitions
│   │   └── index.css        # Tailwind CSS styles
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

---

## Quickstart Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 2. Backend Setup

1. Open a terminal and navigate to `/backend`:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Verify or create `backend/.env` with your API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_LIVE_MODEL=gemini-3.8-live
   DEFAULT_VOICE=Aoede
   PORT=8000
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *Note: If port 8000 is occupied by another service on your machine, specify a different port (e.g. `--port 8008`) and set `VITE_BACKEND_PORT=8008` in frontend.*

---

### 3. Frontend Setup

1. Open a separate terminal and navigate to `/frontend`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5173`.
5. Click **"Start Talking"** to allow microphone permissions and begin talking to your AI companion!

---

## Controls & Usage

- **Start Talking / End Call:** Establishes the real-time WebSocket connection and starts audio streaming.
- **Mute / Unmute:** Mutes your microphone while keeping the companion connected.
- **Speaker Mode vs. Headphones Mode:**
  - **Speakers (Default):** Half-duplex acoustic echo gate that drops mic frames while the bot is outputting audio (plus a 250ms room echo tail), completely preventing speaker-to-mic acoustic feedback and false barge-in interruptions.
  - **Headphones:** Full-duplex mode where the microphone stays continuously open for hands-free voice barge-in.
- **Manual Interrupt (Barge-In):** Press **Spacebar** or click on the **Companion Cube** at any time while the bot is speaking to immediately cut off speech and return to listening.
- **Text Nudge:** Type a silent message or question into the bottom dock and press enter.
- **Poke Cube:** Click or tap on the cube companion while idle or listening to poke it playfully.
- **Personality Drawer:** Click the sliders icon on the bottom right to switch voices (`Aoede`, `Puck`, `Kore`, `Charon`, `Fenrir`) or select personality presets (Mascot, Sarcastic Buddy, Zen Pal, or custom prompt).
