import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ConnectionState, VoiceState, PersonaConfig, VoiceName, WsServerMessage, ThemeId, ChassisDesignId, DEFAULT_PERSONA_INSTRUCTION } from './types';
import { THEMES } from './themes';
import { AudioEngine } from './audio/AudioEngine';
import { CompanionCube } from './components/CompanionCube';
import { TopStatusPill } from './components/TopStatusPill';
import { SubtitlePills } from './components/SubtitlePills';
import { BottomDock } from './components/BottomDock';
import { SettingsDrawer } from './components/SettingsDrawer';
import { CameraPreview } from './components/CameraPreview';

const DEFAULT_CONFIG: PersonaConfig = {
  voice: 'Aoede',
  name: 'Buddy',
  chassisDesign: ((localStorage.getItem('ai_buddy_chassis') as ChassisDesignId) || 'cube'),
  systemInstruction: DEFAULT_PERSONA_INSTRUCTION,
};

export const App: React.FC = () => {
  // Connection and Voice States
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMode, setIsSpeakerMode] = useState(true); // Default: Speaker Mode (half-duplex protection)
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  // Subtitles / Transcripts
  const [userTranscript, setUserTranscript] = useState('');
  const [botTranscript, setBotTranscript] = useState('');
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);

  // Audio Levels (0.0 - 1.0) for responsive animations
  const [micVolume, setMicVolume] = useState(0);
  const [botVolume, setBotVolume] = useState(0);

  // Settings, Theme & Configuration
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('ai_buddy_theme');
    return (saved === 'studio' || saved === 'midnight' || saved === 'matcha' || saved === 'cyber' || saved === 'solar' || saved === 'lunar') ? saved : 'studio';
  });

  const handleSelectTheme = (id: ThemeId) => {
    setActiveThemeId(id);
    localStorage.setItem('ai_buddy_theme', id);
  };

  const theme = THEMES[activeThemeId];

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState<PersonaConfig>(DEFAULT_CONFIG);

  // Webcam Vision State & Lifecycle Refs
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [lastFramePulse, setLastFramePulse] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  // Refs for low-latency lifecycle management
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const subtitleClearTimeoutRef = useRef<number | null>(null);
  const isInterruptedRef = useRef<boolean>(false);
  const configRef = useRef<PersonaConfig>(config);
  configRef.current = config;

  // Initialize AudioEngine and cleanup on unmount
  useEffect(() => {
    audioEngineRef.current = new AudioEngine();
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.cleanup();
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 60fps Animation Loop to update mic and bot volume from AnalyserNodes
  useEffect(() => {
    const updateVolumes = () => {
      const engine = audioEngineRef.current;
      if (engine) {
        const currentMic = engine.getMicVolume();
        const currentBot = engine.getBotVolume();
        const isBotPlaying = engine.getIsBotPlaying();
        setMicVolume(currentMic);
        setBotVolume(currentBot);

        // Track voice activity for visual feedback
        setIsUserSpeaking(currentMic > 0.08);
        setIsBotSpeaking(currentBot > 0.04 || isBotPlaying);

        // Only transition visual state to listening when the AudioEngine playback queue
        // AND the 250ms room echo tail have completely drained!
        if (!isBotPlaying && voiceState === 'speaking' && currentBot < 0.02) {
          setVoiceState('listening');
        }
      }
      animFrameRef.current = requestAnimationFrame(updateVolumes);
    };

    animFrameRef.current = requestAnimationFrame(updateVolumes);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [voiceState]);

  // Manual interrupt (Spacebar or Cube click)
  const handleManualInterrupt = useCallback(() => {
    const engine = audioEngineRef.current;
    if (!engine) return;

    console.log('[Manual Interrupt] Triggered via Spacebar or Cube click.');
    isInterruptedRef.current = true;
    engine.stopPlayback();
    setVoiceState('interrupted');
    setTimeout(() => {
      setVoiceState('listening');
    }, 350);
  }, []);

  // Spacebar global keyboard listener to manually interrupt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        const engine = audioEngineRef.current;
        if (engine?.getIsBotPlaying() || voiceState === 'speaking') {
          handleManualInterrupt();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceState, handleManualInterrupt]);

  // Toggle Speaker / Headphones Mode
  const handleToggleSpeakerMode = useCallback(() => {
    setIsSpeakerMode((prev) => {
      const next = !prev;
      if (audioEngineRef.current) {
        audioEngineRef.current.setSpeakerMode(next);
      }
      return next;
    });
  }, []);

  // Toggle Webcam Vision cleanly (stops all MediaStreamTracks so LED goes off)
  const handleToggleCamera = useCallback(async () => {
    if (isCameraActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
        mediaStreamRef.current = stream;
        setIsCameraActive(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((err) => console.warn('Video play error:', err));
          }
        }, 50);
      } catch (err) {
        console.error('[Webcam] Access denied or unavailable:', err);
        alert('Camera access was denied or is unavailable on this device.');
      }
    }
  }, [isCameraActive]);

  // 1 FPS Video Frame Capture Pipeline for Gemini Multimodal Live Vision
  useEffect(() => {
    if (!isCameraActive || connectionState !== 'connected') {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      return;
    }

    const offscreenCanvas = document.createElement('canvas');

    frameIntervalRef.current = window.setInterval(() => {
      const video = videoRef.current;
      const ws = wsRef.current;
      if (!video || video.readyState < 2 || !ws || ws.readyState !== WebSocket.OPEN) {
        return;
      }

      try {
        const targetWidth = 512;
        const targetHeight = Math.round((video.videoHeight / (video.videoWidth || 1)) * targetWidth) || 512;
        offscreenCanvas.width = targetWidth;
        offscreenCanvas.height = targetHeight;
        const ctx = offscreenCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          const jpegDataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.75);
          ws.send(
            JSON.stringify({
              type: 'video_frame',
              data: jpegDataUrl,
            })
          );
          setLastFramePulse(Date.now());
        }
      } catch (err) {
        console.warn('[Video Pipeline] Frame capture error:', err);
      }
    }, 1000); // Exactly 1 FPS optimal for Gemini Multimodal Live

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
  }, [isCameraActive, connectionState]);

  // Connect to backend WebSocket and initialize Audio Worklet
  const handleConnect = useCallback(async (overrideConfig?: PersonaConfig) => {
    if (connectionState === 'connecting' || connectionState === 'connected') return;

    const activeConfig = overrideConfig || configRef.current;

    try {
      setConnectionState('connecting');
      const engine = audioEngineRef.current;
      if (!engine) throw new Error('Audio engine not initialized');

      // 1. Prepare 24kHz playback engine
      await engine.ensurePlaybackContext();

      // Set callback for when bot playback queue finishes playing all scheduled chunks naturally
      engine.setOnPlaybackEnded(() => {
        console.log('[AudioEngine] Playback queue completely drained.');
        setVoiceState((prev) => (prev === 'speaking' ? 'listening' : prev));
      });

      // 2. Open WebSocket to backend
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname || 'localhost';
      const backendPort = import.meta.env.VITE_BACKEND_PORT || '8000';
      const customWsBase = import.meta.env.VITE_WS_URL;
      const wsUrl = customWsBase
        ? `${customWsBase}?voice=${encodeURIComponent(activeConfig.voice)}`
        : `${wsProtocol}//${wsHost}:${backendPort}/ws/voice?voice=${encodeURIComponent(activeConfig.voice)}`;

      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = async () => {
        // 3. Start 16kHz microphone capture via AudioWorklet
        await engine.startCapture((pcmChunk: ArrayBuffer) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(pcmChunk);
          }
        });

        setConnectionState('connected');
        setVoiceState('listening');

        // Start periodic RTT ping
        pingIntervalRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'ping',
                timestamp: performance.now(),
              })
            );
          }
        }, 3000);
      };

      ws.onmessage = (event: MessageEvent) => {
        // Binary Frame: Incoming 24kHz PCM audio from Gemini
        if (event.data instanceof ArrayBuffer) {
          if (isInterruptedRef.current) {
            // Discard residual audio chunks for this interrupted turn
            return;
          }
          engine.queueAudioChunk(event.data);
          setVoiceState('speaking');
          return;
        }

        // Text Frame: JSON control events
        try {
          const msg: WsServerMessage = JSON.parse(event.data);

          switch (msg.type) {
            case 'interrupted':
              // Server-side barge-in interruption (e.g. in Headphones mode)
              console.log('[WebSocket] Gemini reported server-side interruption.');
              engine.stopPlayback();
              setVoiceState('interrupted');
              setTimeout(() => {
                setVoiceState('listening');
              }, 350);
              break;

            case 'user_transcript':
              if (msg.text) {
                setUserTranscript(msg.text);
                // When user finishes speech, cube enters curious thinking state
                setVoiceState('thinking');
              }
              break;

            case 'bot_transcript':
              if (msg.text) {
                setBotTranscript((prev) => (prev ? `${prev} ${msg.text}` : msg.text || ''));
                setVoiceState('speaking');
              }
              break;

            case 'turn_complete':
              console.log('[WebSocket] turn_complete received. Waiting for queued AudioBufferSourceNodes to drain.');
              isInterruptedRef.current = false;
              // Smooth Turn End & Audio Queue Drain:
              // Do NOT stop or clear playback queue, and do NOT transition voiceState to 'listening' here!
              // The AudioBufferSourceNodes continue playing buffered chunks to the end.
              // The transition to 'listening' is handled strictly by engine.setOnPlaybackEnded
              // when the final queued audio buffer finishes playing (+ 250ms room echo tail).
              if (subtitleClearTimeoutRef.current) {
                clearTimeout(subtitleClearTimeoutRef.current);
              }
              subtitleClearTimeoutRef.current = window.setTimeout(() => {
                setUserTranscript('');
                setBotTranscript('');
              }, 8000);
              break;

            case 'pong':
              if (msg.client_time) {
                setLatencyMs(performance.now() - msg.client_time);
              }
              break;

            case 'error':
              console.error('[WebSocket] Server reported error:', msg.message);
              break;
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse WebSocket JSON event:', err);
        }
      };

      ws.onerror = (e) => {
        console.error('[WebSocket ERROR] WebSocket encountered an error event:', e);
        setConnectionState('error');
      };

      ws.onclose = (event: CloseEvent) => {
        console.warn(
          `[WebSocket CLOSED] Connection closed. Code: ${event.code}, Reason: "${event.reason || 'None'}", WasClean: ${event.wasClean}`
        );
        handleDisconnect();
      };
    } catch (err) {
      console.error('Failed to start voice call:', err);
      setConnectionState('error');
      handleDisconnect();
    }
  }, [config, connectionState]);

  // Clean disconnection
  const handleDisconnect = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioEngineRef.current) {
      audioEngineRef.current.cleanup();
    }
    setConnectionState('disconnected');
    setVoiceState('idle');
    setLatencyMs(null);
  }, []);

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioEngineRef.current) {
      audioEngineRef.current.setMuted(nextMuted);
    }
  }, [isMuted]);

  // Send Text Nudge Prompt
  const handleSendTextPrompt = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setUserTranscript(text);
      setBotTranscript('');
      setVoiceState('thinking');
      wsRef.current.send(
        JSON.stringify({
          type: 'text',
          text,
        })
      );
    }
  }, []);

  // Apply personality config and reconnect if in a call
  const handleApplyAndReconnect = useCallback((overrideConfig?: PersonaConfig) => {
    const target = overrideConfig || configRef.current;
    if (connectionState === 'connected' || connectionState === 'connecting') {
      handleDisconnect();
      setTimeout(() => {
        handleConnect(target);
      }, 350);
    }
  }, [connectionState, handleConnect, handleDisconnect]);

  return (
    <div className={`relative min-h-screen w-full flex flex-col justify-between items-center p-6 overflow-hidden transition-colors duration-300 ${theme.bgClass}`}>
      {/* Header: Top Hardware Status Pill */}
      <header className="w-full flex items-center justify-center pt-1 z-20">
        <TopStatusPill
          connectionState={connectionState}
          voiceState={voiceState}
          latencyMs={latencyMs}
          activeThemeId={activeThemeId}
          onSelectTheme={handleSelectTheme}
          theme={theme}
        />
      </header>

      {/* Centerpiece: Expressive Animated Cute Companion Cube */}
      <main className="flex-1 flex flex-col items-center justify-center my-auto z-10 w-full max-w-2xl">
        <CompanionCube
          voiceState={voiceState}
          connectionState={connectionState}
          micVolume={micVolume}
          botVolume={botVolume}
          theme={theme}
          chassisDesign={config.chassisDesign}
          onPoke={() => {
            if (audioEngineRef.current?.getIsBotPlaying() || voiceState === 'speaking') {
              handleManualInterrupt();
            } else if (connectionState === 'connected' && wsRef.current) {
              handleSendTextPrompt('*Gently pokes cube*');
            }
          }}
        />

        {/* Subtitles: High-contrast editorial subtitle card */}
        <div className="mt-10 w-full flex justify-center">
          <SubtitlePills
            userTranscript={userTranscript}
            botTranscript={botTranscript}
            isUserSpeaking={isUserSpeaking}
            isBotSpeaking={isBotSpeaking}
            theme={theme}
          />
        </div>
      </main>

      {/* Real-Time Hardware Webcam Vision PiP Monitor */}
      <CameraPreview
        videoRef={videoRef}
        isActive={isCameraActive}
        isStreaming={isCameraActive && connectionState === 'connected'}
        lastFramePulse={lastFramePulse}
        onClose={handleToggleCamera}
        theme={theme}
      />

      {/* Footer: Hardware Synth Bottom Dock */}
      <footer className="w-full flex items-center justify-center pb-1 z-20">
        <BottomDock
          connectionState={connectionState}
          isMuted={isMuted}
          isSpeakerMode={isSpeakerMode}
          isCameraActive={isCameraActive}
          theme={theme}
          onToggleConnect={connectionState === 'connected' ? handleDisconnect : handleConnect}
          onToggleMute={handleToggleMute}
          onToggleSpeakerMode={handleToggleSpeakerMode}
          onToggleCamera={handleToggleCamera}
          onSendTextPrompt={handleSendTextPrompt}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </footer>

      {/* Slide-over Hardware Deck Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onChangeConfig={setConfig}
        isConnected={connectionState === 'connected'}
        onApplyAndReconnect={handleApplyAndReconnect}
        theme={theme}
      />
    </div>
  );
};

export default App;
