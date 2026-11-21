import React, { useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Send, SlidersHorizontal, Volume2, Headphones, Video, VideoOff } from 'lucide-react';
import { ConnectionState, ThemeConfig } from '../types';

interface BottomDockProps {
  connectionState: ConnectionState;
  isMuted: boolean;
  isSpeakerMode: boolean;
  isCameraActive: boolean;
  theme: ThemeConfig;
  onToggleConnect: () => void;
  onToggleMute: () => void;
  onToggleSpeakerMode: () => void;
  onToggleCamera: () => void;
  onSendTextPrompt: (text: string) => void;
  onOpenSettings: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  connectionState,
  isMuted,
  isSpeakerMode,
  isCameraActive,
  theme,
  onToggleConnect,
  onToggleMute,
  onToggleSpeakerMode,
  onToggleCamera,
  onSendTextPrompt,
  onOpenSettings,
}) => {
  const [textInput, setTextInput] = useState('');

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !isConnected) return;
    onSendTextPrompt(textInput.trim());
    setTextInput('');
  };

  return (
    <div
      className={`flex items-center gap-2 p-2.5 rounded-2xl border-[1.5px] max-w-2xl w-full mx-4 shadow-md transition-colors duration-200 ${theme.deckBg} ${theme.deckBorder}`}
    >
      {/* Primary Connect / End Call Keycap */}
      <button
        onClick={onToggleConnect}
        disabled={isConnecting}
        className={`tactile-btn flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider border-[1.5px] border-b-[3px] transition-all ${
          isConnected
            ? 'bg-rose-600 hover:bg-rose-700 text-white border-zinc-900 shadow-[0_2px_0_#18181B]'
            : isConnecting
            ? 'bg-amber-500 text-zinc-900 border-zinc-900'
            : `${theme.primaryKeycapBg} ${theme.primaryKeycapBorder} ${theme.primaryKeycapShadow}`
        }`}
        title={isConnected ? 'End voice session' : 'Engage voice session'}
      >
        {isConnected ? (
          <>
            <PhoneOff className="w-3.5 h-3.5" />
            <span>DISENGAGE</span>
          </>
        ) : isConnecting ? (
          <span>SYNCING...</span>
        ) : (
          <>
            <Phone className="w-3.5 h-3.5" />
            <span>ENGAGE</span>
          </>
        )}
      </button>

      {/* Real-Time Camera Vision Toggle Keycap */}
      <button
        onClick={onToggleCamera}
        className={`tactile-btn p-2.5 rounded-xl border-[1.5px] border-b-[3px] transition-all flex items-center justify-center ${
          isCameraActive
            ? theme.isDark
              ? 'bg-[#2E2723] text-[#FBBF24] border-[#FBBF24] shadow-[0_2px_0_#FBBF24]'
              : 'bg-[#FAF8F5] text-[#FF4D1C] border-[#FF4D1C] shadow-[0_2px_0_#FF4D1C]'
            : `${theme.keycapDefault} ${theme.keycapBorder} ${theme.keycapShadow}`
        }`}
        title={isCameraActive ? 'Turn off camera vision (stops webcam)' : 'Turn on camera vision (see expressions & surroundings)'}
      >
        {isCameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4 opacity-75" />}
      </button>

      {/* Mic Mute / Unmute Keycap */}
      <button
        onClick={onToggleMute}
        disabled={!isConnected}
        className={`tactile-btn p-2.5 rounded-xl border-[1.5px] border-b-[3px] transition-all ${
          !isConnected
            ? 'opacity-40 cursor-not-allowed border-black/20 bg-black/5'
            : isMuted
            ? 'bg-rose-100 text-rose-700 border-rose-900 shadow-[0_2px_0_#881337]'
            : `${theme.keycapDefault} ${theme.keycapBorder} ${theme.keycapShadow}`
        }`}
        title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>

      {/* Speaker / Headphones Mode Keycap */}
      <button
        onClick={onToggleSpeakerMode}
        className={`tactile-btn flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-[11px] font-bold uppercase border-[1.5px] border-b-[3px] transition-all ${
          theme.keycapDefault
        } ${theme.keycapBorder} ${theme.keycapShadow}`}
        title={
          isSpeakerMode
            ? 'Speaker Mode (Echo-Proof): Mic auto-drops while bot speaks to prevent false interrupts. Click cube or press Space to interrupt.'
            : 'Headphones Mode (Full Duplex): Mic stays open for hands-free voice barge-in.'
        }
      >
        {isSpeakerMode ? (
          <>
            <Volume2 className="w-3.5 h-3.5" style={{ color: theme.accentColor }} />
            <span className="hidden sm:inline">SPK</span>
          </>
        ) : (
          <>
            <Headphones className="w-3.5 h-3.5" style={{ color: theme.accentListening }} />
            <span className="hidden sm:inline">HDP</span>
          </>
        )}
      </button>

      {/* Recessed Hardware Command Slot (Text Nudge) */}
      <form onSubmit={handleSendText} className="flex-1 flex items-center gap-1.5 relative">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={isConnected ? 'MSG // TYPE NUDGE...' : 'STANDBY // CONNECT FIRST'}
          disabled={!isConnected}
          className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border-[1.5px] transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none ${
            theme.isDark
              ? 'bg-[#181412] border-[#3D3530] text-[#F5EFEB] placeholder:text-zinc-600 focus:border-[#FBBF24]'
              : 'bg-[#F2ECE1] border-[#18181B] text-[#18181B] placeholder:text-zinc-500 focus:border-[#FF4D1C]'
          } shadow-inner`}
        />
        {textInput.trim() && (
          <button
            type="submit"
            className="absolute right-1.5 tactile-btn p-1.5 rounded-lg bg-[#18181B] text-white hover:bg-zinc-800 transition-transform"
            title="Send text prompt"
          >
            <Send className="w-3 h-3" />
          </button>
        )}
      </form>

      {/* Settings / Customize Hardware Drawer Keycap */}
      <button
        onClick={onOpenSettings}
        className={`tactile-btn p-2.5 rounded-xl border-[1.5px] border-b-[3px] transition-all ${theme.keycapDefault} ${theme.keycapBorder} ${theme.keycapShadow}`}
        title="Hardware Persona & Voice Tuning"
      >
        <SlidersHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
};
