import React, { useEffect, useState } from 'react';
import { X, Eye } from 'lucide-react';
import { ThemeConfig } from '../types';

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  isStreaming: boolean; // True when WebSocket is connected and sending frames
  lastFramePulse: number; // Timestamp of latest captured frame for visual blink
  onClose: () => void;
  theme: ThemeConfig;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  videoRef,
  isActive,
  isStreaming,
  lastFramePulse,
  onClose,
  theme,
}) => {
  const [pulseActive, setPulseActive] = useState(false);

  // Trigger momentary border/indicator glow on each 1 FPS frame transmission
  useEffect(() => {
    if (!lastFramePulse) return;
    setPulseActive(true);
    const timer = setTimeout(() => setPulseActive(false), 240);
    return () => clearTimeout(timer);
  }, [lastFramePulse]);

  if (!isActive) return null;

  return (
    <div
      className={`fixed right-6 top-1/2 -translate-y-1/2 z-30 w-56 sm:w-64 rounded-3xl p-3 border-[1.5px] border-b-[3.5px] shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] animate-fade-in ${
        theme.chassisBg
      } ${theme.chassisBorder} ${
        pulseActive
          ? theme.isDark
            ? 'ring-2 ring-amber-400/80 shadow-[0_0_18px_rgba(251,191,36,0.3)]'
            : 'ring-2 ring-orange-500/80 shadow-[0_0_18px_rgba(255,77,28,0.35)]'
          : ''
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/15">
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-150 ${
              isStreaming
                ? pulseActive
                  ? 'bg-amber-400 scale-125 shadow-xs'
                  : 'bg-emerald-500 animate-pulse'
                : 'bg-zinc-400'
            }`}
          />
          <span className="font-mono text-[9px] font-bold tracking-wider uppercase opacity-80">
            {isStreaming ? 'CAM // LIVE 1 FPS' : 'CAM // PREVIEW'}
          </span>
        </div>

        <button
          onClick={onClose}
          className="tactile-btn p-1 rounded-md border border-black/25 opacity-70 hover:opacity-100 transition-opacity bg-black/5 hover:bg-black/10"
          title="Turn off camera"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Recessed Hardware Optical Viewfinder */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#111215] border-[1.5px] border-black/40 shadow-inner">
        {/* Mirrored Live Selfie Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />

        {/* Tactical Crosshair / Viewfinder Corner Brackets */}
        <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t-[1.5px] border-l-[1.5px] border-white/50 pointer-events-none" />
        <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t-[1.5px] border-r-[1.5px] border-white/50 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b-[1.5px] border-l-[1.5px] border-white/50 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b-[1.5px] border-r-[1.5px] border-white/50 pointer-events-none" />

        {/* Viewfinder Telemetry Watermarks */}
        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[8px] font-mono text-white/70 pointer-events-none drop-shadow-xs">
          <span className="tracking-widest uppercase">OPTIC-01</span>
          <span className="opacity-60">512px // JPEG</span>
        </div>

        {/* Subtle Scanlines & Glare */}
        <div className="absolute inset-0 oled-scanlines pointer-events-none opacity-25" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/10 to-transparent pointer-events-none rounded-tr-2xl" />
      </div>

      {/* Bottom Telemetry Status Line */}
      <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-black/10 text-[8.5px] font-mono opacity-70">
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" style={{ color: theme.accentColor }} />
          <span>VISION READY</span>
        </span>
        <span className="tracking-tighter uppercase font-semibold" style={{ color: theme.accentListening }}>
          {isStreaming ? 'FEEDING CUBE' : 'STANDBY'}
        </span>
      </div>
    </div>
  );
};
