import React, { useEffect, useState, useRef } from 'react';
import { VoiceState, ConnectionState, ThemeConfig, ChassisDesignId } from '../types';

interface CompanionCubeProps {
  voiceState: VoiceState;
  connectionState?: ConnectionState;
  micVolume: number; // 0.0 to 1.0
  botVolume: number; // 0.0 to 1.0
  theme: ThemeConfig;
  chassisDesign?: ChassisDesignId;
  onPoke?: () => void;
}

export const CompanionCube: React.FC<CompanionCubeProps> = ({
  voiceState,
  connectionState = 'disconnected',
  micVolume,
  botVolume,
  theme,
  chassisDesign = 'cube',
  onPoke,
}) => {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const [poked, setPoked] = useState(false);
  const cubeRef = useRef<HTMLDivElement>(null);

  // Mouse tilt tracking for life-like curiosity
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 14;
      const y = (e.clientY / innerHeight - 0.5) * -14;
      setMouseOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Periodic natural blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 4500 + Math.random() * 2500);

    return () => clearInterval(blinkInterval);
  }, []);

  const handleCubeClick = () => {
    setPoked(true);
    setTimeout(() => setPoked(false), 450);
    if (onPoke) onPoke();
  };

  // Physical motion physics: cubic-bezier(0.22, 1, 0.36, 1)
  const bounceScaleY = voiceState === 'speaking' ? 1 + botVolume * 0.18 : 1;
  const bounceScaleX = voiceState === 'speaking' ? 1 - botVolume * 0.09 : 1;

  const thinkingTilt = voiceState === 'thinking' ? 5 : 0;
  const listeningTilt = voiceState === 'listening' ? -3 : 0;

  const rotateX = mouseOffset.y + (voiceState === 'listening' ? 3 : 0);
  const rotateY = mouseOffset.x + thinkingTilt + listeningTilt;

  // Active status color
  const activeColor =
    voiceState === 'listening'
      ? theme.accentListening
      : voiceState === 'speaking'
      ? theme.accentColor
      : voiceState === 'thinking'
      ? theme.accentThinking
      : theme.textMuted;

  // Active volume for visualizer
  const activeAudioVol = voiceState === 'speaking' ? botVolume : voiceState === 'listening' ? micVolume : 0.08;

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Physical Hardware Shadow */}
      <div
        className={`absolute -bottom-8 rounded-full transition-transform duration-300 pointer-events-none ${
          chassisDesign === 'boombox' ? 'w-56 h-8' : chassisDesign === 'capsule' ? 'w-36 h-7' : 'w-44 h-7'
        }`}
        style={{
          background: theme.isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(24, 24, 27, 0.18)',
          filter: 'blur(8px)',
          transform: `scale(${1 - (voiceState === 'speaking' ? botVolume * 0.12 : 0)})`,
        }}
      />

      {/* Main Miniature Hardware Robot Chassis */}
      <div
        ref={cubeRef}
        onClick={handleCubeClick}
        className={`relative cursor-pointer transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          voiceState === 'idle' || connectionState === 'disconnected' ? 'animate-float-slow' : ''
        } ${poked ? 'scale-95 rotate-3' : ''}`}
        style={{
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scaleX(${bounceScaleX}) scaleY(${bounceScaleY})`,
          transformStyle: 'preserve-3d',
        }}
      >
        {renderChassisBody({
          design: chassisDesign,
          theme,
          voiceState,
          botVolume,
          micVolume,
          activeColor,
          activeAudioVol,
          blink,
          mouseOffset,
        })}
      </div>
    </div>
  );
};

// Render the 6 distinct hardware chassis designs
function renderChassisBody({
  design,
  theme,
  voiceState,
  botVolume,
  micVolume,
  activeColor,
  activeAudioVol,
  blink,
  mouseOffset,
}: {
  design: ChassisDesignId;
  theme: ThemeConfig;
  voiceState: VoiceState;
  botVolume: number;
  micVolume: number;
  activeColor: string;
  activeAudioVol: number;
  blink: boolean;
  mouseOffset: { x: number; y: number };
}) {
  switch (design) {
    // ----------------------------------------------------
    // 1. RETRO CRT TERMINAL
    // ----------------------------------------------------
    case 'terminal':
      return (
        <div
          className={`relative w-72 h-72 rounded-[28px] ${theme.chassisBg} border-[1.5px] ${theme.chassisBorder} p-3.5 shadow-[0_14px_36px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-3px_0_rgba(0,0,0,0.15)] flex flex-col justify-between`}
        >
          {/* Top Industrial Carry Handle */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 h-4 rounded-t-lg border-[1.5px] border-b-0 border-black/40 bg-inherit shadow-xs flex items-center justify-center">
            <div className="w-16 h-1 rounded-full bg-black/25" />
          </div>

          {/* Left Heat Dissipation Vent Slots */}
          <div className="absolute -left-2 top-14 flex flex-col gap-1.5 py-2 px-0.5 rounded-l border-l border-y border-black/30 bg-inherit">
            <div className="w-1.5 h-0.5 bg-black/40 rounded-full" />
            <div className="w-1.5 h-0.5 bg-black/40 rounded-full" />
            <div className="w-1.5 h-0.5 bg-black/40 rounded-full" />
          </div>

          {/* Right Heat Dissipation Vent Slots */}
          <div className="absolute -right-2 top-14 flex flex-col gap-1.5 py-2 px-0.5 rounded-r border-r border-y border-black/30 bg-inherit">
            <div className="w-1.5 h-0.5 bg-black/40 rounded-full" />
            <div className="w-1.5 h-0.5 bg-black/40 rounded-full" />
            <div className="w-1.5 h-0.5 bg-black/40 rounded-full" />
          </div>

          {/* Recessed Curved CRT Screen */}
          <div className="w-full h-52 rounded-2xl overflow-hidden relative">
            {renderOledFaceScreen({
              theme,
              voiceState,
              botVolume,
              micVolume,
              activeColor,
              activeAudioVol,
              blink,
              customModelLabel: 'CRT-84 // MON',
              roundedClass: 'rounded-2xl',
            })}
          </div>

          {/* Lower Control Chin with Dual Rotary Knobs */}
          <div className="flex items-center justify-between px-2 pt-1 border-t border-black/15">
            {/* Left Knob: PWR / BRT */}
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full border-[1.5px] border-black/40 bg-black/10 shadow-inner flex items-center justify-center relative">
                <div className="w-2.5 h-[1.5px] bg-black/60 -rotate-45" />
              </div>
              <span className="text-[8px] font-mono font-bold opacity-60">PWR</span>
            </div>

            {/* Center Status LED */}
            <div className="flex items-center gap-1">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: activeColor }}
              />
              <span className="text-[7.5px] font-mono tracking-widest opacity-50 uppercase">LIVE</span>
            </div>

            {/* Right Knob: TUNE */}
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-mono font-bold opacity-60">TUNE</span>
              <div className="w-5 h-5 rounded-full border-[1.5px] border-black/40 bg-black/10 shadow-inner flex items-center justify-center relative">
                <div className="w-2.5 h-[1.5px] bg-black/60 rotate-45" />
              </div>
            </div>
          </div>
        </div>
      );

    // ----------------------------------------------------
    // 2. CYBER POD / CAPSULE
    // ----------------------------------------------------
    case 'capsule':
      return (
        <div
          className={`relative w-60 h-72 rounded-[56px] ${theme.chassisBg} border-[1.5px] ${theme.chassisBorder} p-3.5 shadow-[0_16px_36px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-4px_0_rgba(0,0,0,0.12)] flex flex-col justify-between items-center`}
        >
          {/* Dual Top Articulated Antenna "Ears" */}
          <div className="absolute -top-4 w-32 flex items-center justify-between pointer-events-none px-2">
            {/* Left Antenna */}
            <div
              className="flex flex-col items-center origin-bottom transition-transform duration-100"
              style={{
                transform: `rotate(-16deg) scaleY(${1 + (voiceState === 'speaking' ? botVolume * 0.2 : 0)})`,
              }}
            >
              <div className="w-3 h-3 rounded-full border border-black/30 shadow-xs" style={{ backgroundColor: activeColor }} />
              <div className="w-1 h-3.5 bg-black/40 rounded-full" />
            </div>

            {/* Right Antenna */}
            <div
              className="flex flex-col items-center origin-bottom transition-transform duration-100"
              style={{
                transform: `rotate(16deg) scaleY(${1 + (voiceState === 'speaking' ? botVolume * 0.2 : 0)})`,
              }}
            >
              <div className="w-3 h-3 rounded-full border border-black/30 shadow-xs" style={{ backgroundColor: activeColor }} />
              <div className="w-1 h-3.5 bg-black/40 rounded-full" />
            </div>
          </div>

          {/* Smooth Continuous Seam Ring */}
          <div className="absolute inset-x-3 top-1/2 h-[1px] bg-black/15 pointer-events-none" />

          {/* Oval Visor Screen */}
          <div className="w-full h-56 rounded-[42px] overflow-hidden relative shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)] mt-1">
            {renderOledFaceScreen({
              theme,
              voiceState,
              botVolume,
              micVolume,
              activeColor,
              activeAudioVol,
              blink,
              customModelLabel: 'POD-X // AI',
              roundedClass: 'rounded-[42px]',
            })}
          </div>

          {/* Bottom Capsule Base Vent */}
          <div className="flex items-center gap-1.5 py-0.5 opacity-60">
            <div className="w-1.5 h-1.5 rounded-full bg-black/40" />
            <div className="w-2.5 h-1 rounded-full bg-black/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-black/40" />
          </div>
        </div>
      );

    // ----------------------------------------------------
    // 3. POCKET SOUND DECK / BOOMBOX
    // ----------------------------------------------------
    case 'boombox':
      return (
        <div
          className={`relative w-80 h-60 rounded-2xl ${theme.chassisBg} border-[1.5px] ${theme.chassisBorder} p-3 shadow-[0_14px_36px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-3px_0_rgba(0,0,0,0.15)] flex flex-col justify-between`}
        >
          {/* Top Carry Handle Bar */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-44 h-4 rounded-t-md border-[1.5px] border-b-0 border-black/40 bg-inherit shadow-xs flex items-center justify-center">
            <div className="w-28 h-1 rounded-full bg-black/25" />
          </div>

          {/* Top Mechanical Transport Buttons */}
          <div className="flex items-center justify-between px-2 pt-0.5 border-b border-black/15 pb-1.5">
            <span className="font-mono text-[9px] font-bold tracking-widest uppercase opacity-70">
              SOUND DECK // STEREO
            </span>
            <div className="flex items-center gap-1.5">
              <button className="px-1.5 py-0.5 rounded border border-black/30 bg-black/5 text-[8px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> REC
              </button>
              <button className="px-1.5 py-0.5 rounded border border-black/30 bg-black/5 text-[8px] font-mono font-bold">
                PLAY ▶
              </button>
              <button className="px-1.5 py-0.5 rounded border border-black/30 bg-black/5 text-[8px] font-mono font-bold">
                PAUSE ❚❚
              </button>
            </div>
          </div>

          {/* Middle Sound Deck Layout: Left Woofer + Center Screen + Right Woofer */}
          <div className="flex items-center justify-between gap-2.5 my-1">
            {/* Left Circular Speaker Woofer */}
            <div className="w-14 h-14 rounded-full border-[1.5px] border-black/35 bg-black/10 shadow-inner flex items-center justify-center shrink-0 relative overflow-hidden">
              {/* Outer Woofer Ring */}
              <div className="w-11 h-11 rounded-full border border-black/25 bg-black/5 flex items-center justify-center">
                {/* Reactive Bass Cone */}
                <div
                  className="w-7 h-7 rounded-full transition-transform duration-75 flex items-center justify-center shadow-md"
                  style={{
                    backgroundColor: theme.isDark ? '#2A2421' : '#E8E3D8',
                    transform: `scale(${1 + activeAudioVol * 0.45})`,
                  }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-black/40"
                    style={{ backgroundColor: activeColor }}
                  />
                </div>
              </div>
            </div>

            {/* Center Recessed Screen */}
            <div className="flex-1 h-38 rounded-xl overflow-hidden relative">
              {renderOledFaceScreen({
                theme,
                voiceState,
                botVolume,
                micVolume,
                activeColor,
                activeAudioVol,
                blink,
                customModelLabel: 'DECK-38',
                roundedClass: 'rounded-xl',
              })}
            </div>

            {/* Right Circular Speaker Woofer */}
            <div className="w-14 h-14 rounded-full border-[1.5px] border-black/35 bg-black/10 shadow-inner flex items-center justify-center shrink-0 relative overflow-hidden">
              <div className="w-11 h-11 rounded-full border border-black/25 bg-black/5 flex items-center justify-center">
                <div
                  className="w-7 h-7 rounded-full transition-transform duration-75 flex items-center justify-center shadow-md"
                  style={{
                    backgroundColor: theme.isDark ? '#2A2421' : '#E8E3D8',
                    transform: `scale(${1 + activeAudioVol * 0.45})`,
                  }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-black/40"
                    style={{ backgroundColor: activeColor }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Cassette-Door Seam */}
          <div className="flex items-center justify-between px-2 pt-1 border-t border-black/15 text-[8.5px] font-mono opacity-60">
            <span>CH-A / AUTO-REVERSE</span>
            <span style={{ color: activeColor }}>DOLBY-NR [ACTIVE]</span>
          </div>
        </div>
      );

    // ----------------------------------------------------
    // 4. BRAUN MINIMALIST RADIO (SK4 Inspired)
    // ----------------------------------------------------
    case 'radio':
      return (
        <div
          className={`relative w-64 h-72 rounded-2xl ${theme.chassisBg} border-[1.5px] ${theme.chassisBorder} p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-3px_0_rgba(0,0,0,0.15)] flex flex-col justify-between`}
        >
          {/* Top Analog Frequency Tuning Dial Window */}
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg border border-black/20 bg-black/5 shadow-inner">
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between text-[7px] font-mono font-bold opacity-60 px-1">
                <span>88</span>
                <span>92</span>
                <span>96</span>
                <span>100</span>
                <span>104</span>
                <span>108</span>
              </div>
              {/* Dial Scale Track & Moving Indicator Needle */}
              <div className="relative w-full h-2 border-t border-black/25 flex items-center">
                <div
                  className="absolute top-0 w-1 h-3 rounded-full transition-all duration-150 -translate-x-1/2"
                  style={{
                    backgroundColor: theme.accentColor,
                    left: `${Math.max(10, Math.min(90, 50 + mouseOffset.x * 2))}%`,
                  }}
                />
              </div>
            </div>
            {/* Knurled Aluminum Tuning Wheel */}
            <div className="w-6 h-6 rounded-full border-[1.5px] border-black/40 bg-zinc-300 dark:bg-zinc-700 shadow flex items-center justify-center shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-black/40" />
            </div>
          </div>

          {/* Center OLED Display */}
          <div className="w-full h-44 rounded-xl overflow-hidden relative shadow-[inset_0_4px_12px_rgba(0,0,0,0.85)] my-1.5">
            {renderOledFaceScreen({
              theme,
              voiceState,
              botVolume,
              micVolume,
              activeColor,
              activeAudioVol,
              blink,
              customModelLabel: 'BRAUN // SK-4',
              roundedClass: 'rounded-xl',
            })}
          </div>

          {/* Bottom Acoustic Speaker Louvers / Slats */}
          <div className="flex flex-col gap-1 px-1 py-1 border-t border-black/15">
            <div className="w-full h-1 rounded-full bg-black/25 shadow-inner" />
            <div className="w-full h-1 rounded-full bg-black/25 shadow-inner" />
            <div className="w-full h-1 rounded-full bg-black/25 shadow-inner" />
          </div>
        </div>
      );

    // ----------------------------------------------------
    // 5. HEX-MECH DROID
    // ----------------------------------------------------
    case 'mech':
      return (
        <div
          className={`relative w-68 h-66 rounded-[34px] ${theme.chassisBg} border-[1.5px] ${theme.chassisBorder} p-3.5 shadow-[0_16px_36px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-4px_0_rgba(0,0,0,0.2)] flex flex-col justify-between`}
        >
          {/* 4 Reinforced Corner Armor Chamfers with Torx Bolts */}
          <div className="absolute top-2 left-2 w-3 h-3 rounded-sm border border-black/40 flex items-center justify-center bg-black/10">
            <div className="w-1.5 h-1.5 rounded-full bg-black/50" />
          </div>
          <div className="absolute top-2 right-2 w-3 h-3 rounded-sm border border-black/40 flex items-center justify-center bg-black/10">
            <div className="w-1.5 h-1.5 rounded-full bg-black/50" />
          </div>
          <div className="absolute bottom-2 left-2 w-3 h-3 rounded-sm border border-black/40 flex items-center justify-center bg-black/10">
            <div className="w-1.5 h-1.5 rounded-full bg-black/50" />
          </div>
          <div className="absolute bottom-2 right-2 w-3 h-3 rounded-sm border border-black/40 flex items-center justify-center bg-black/10">
            <div className="w-1.5 h-1.5 rounded-full bg-black/50" />
          </div>

          {/* Top Mech Telemetry Label */}
          <div className="flex items-center justify-between px-3 pt-0.5">
            <span className="text-[8.5px] font-mono font-bold tracking-widest uppercase opacity-75">
              MECH-01 // TACTICAL
            </span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-xs" style={{ backgroundColor: activeColor }} />
              <span className="w-1.5 h-1.5 rounded-xs bg-black/30" />
              <span className="w-1.5 h-1.5 rounded-xs bg-black/30" />
            </div>
          </div>

          {/* Recessed Hex-Cut Screen */}
          <div className="w-full h-46 rounded-2xl overflow-hidden relative shadow-[inset_0_4px_14px_rgba(0,0,0,0.9)] my-1">
            {renderOledFaceScreen({
              theme,
              voiceState,
              botVolume,
              micVolume,
              activeColor,
              activeAudioVol,
              blink,
              customModelLabel: 'MECH-AI // V5',
              roundedClass: 'rounded-2xl',
            })}
          </div>

          {/* Bottom Heavy Armor Seam */}
          <div className="flex items-center justify-between px-3 pb-0.5 text-[8px] font-mono opacity-60 border-t border-black/15 pt-1">
            <span>ARMOR: TITANIUM-B</span>
            <span style={{ color: activeColor }}>SHIELD: 100%</span>
          </div>
        </div>
      );

    // ----------------------------------------------------
    // DEFAULT: 6. TACTILE CUBE (Classic OP-1 / Braun)
    // ----------------------------------------------------
    case 'cube':
    default:
      return (
        <div
          className={`relative w-64 h-64 rounded-2xl ${theme.chassisBg} border-[1.5px] ${theme.chassisBorder} p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-3px_0_rgba(0,0,0,0.12)] transition-colors duration-200`}
        >
          {/* Corner Screws / Rivets */}
          <div className="absolute top-2 left-2 w-2 h-2 rounded-full border border-black/25 flex items-center justify-center">
            <div className="w-1.5 h-[0.5px] bg-black/40 rotate-45" />
          </div>
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full border border-black/25 flex items-center justify-center">
            <div className="w-1.5 h-[0.5px] bg-black/40 -rotate-45" />
          </div>
          <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full border border-black/25 flex items-center justify-center">
            <div className="w-1.5 h-[0.5px] bg-black/40 -rotate-12" />
          </div>
          <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full border border-black/25 flex items-center justify-center">
            <div className="w-1.5 h-[0.5px] bg-black/40 rotate-12" />
          </div>

          {/* Left Speaker Micro-Grille Dots */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 py-2 px-0.5 rounded-l-md border-l border-y border-black/30 bg-inherit">
            <div className="w-1 h-1 rounded-full bg-black/40 shadow-inner" />
            <div className="w-1 h-1 rounded-full bg-black/40 shadow-inner" />
            <div className="w-1 h-1 rounded-full bg-black/40 shadow-inner" />
            <div className="w-1 h-1 rounded-full bg-black/40 shadow-inner" />
          </div>

          {/* Right Speaker Micro-Grille Dots */}
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 py-2 px-0.5 rounded-r-md border-r border-y border-black/30 bg-inherit">
            <div className="w-1 h-1 rounded-full bg-black/40 shadow-inner" />
            <div className="w-1 h-1 rounded-full bg-black/40 shadow-inner" />
            <div className="w-1 h-1 rounded-full bg-black/40 shadow-inner" />
            <div className="w-1 h-1 rounded-full bg-black/40 shadow-inner" />
          </div>

          {/* Recessed OLED Screen */}
          <div className="w-full h-full rounded-xl overflow-hidden relative shadow-[inset_0_4px_12px_rgba(0,0,0,0.85)]">
            {renderOledFaceScreen({
              theme,
              voiceState,
              botVolume,
              micVolume,
              activeColor,
              activeAudioVol,
              blink,
              customModelLabel: 'TE-3.8 // AI',
              roundedClass: 'rounded-xl',
            })}
          </div>
        </div>
      );
  }
}

// Reusable Expressive OLED Face Screen across all chassis forms
function renderOledFaceScreen({
  theme,
  voiceState,
  botVolume,
  micVolume,
  activeColor,
  activeAudioVol,
  blink,
  customModelLabel = 'TE-3.8 // AI',
  roundedClass = 'rounded-xl',
}: {
  theme: ThemeConfig;
  voiceState: VoiceState;
  botVolume: number;
  micVolume: number;
  activeColor: string;
  activeAudioVol: number;
  blink: boolean;
  customModelLabel?: string;
  roundedClass?: string;
}) {
  return (
    <div
      className={`w-full h-full ${roundedClass} ${theme.screenBg} border-[1.5px] ${theme.screenBorder} p-3 flex flex-col justify-between relative overflow-hidden`}
    >
      {/* Top Screen Bezel: Model Label & Live Equalizer */}
      <div className="flex items-center justify-between w-full px-1 pt-0.5 z-10">
        <span className="font-mono text-[9px] tracking-widest uppercase font-semibold text-zinc-500">
          {customModelLabel}
        </span>

        {/* Mini Audio Waveform Visualizer */}
        <div className="flex items-center gap-[2.5px] h-3 px-1.5 py-0.5 rounded bg-black/50 border border-white/10">
          {[0.4, 0.8, 1.0, 0.6, 0.9, 0.5, 0.7].map((barScale, idx) => {
            const height = Math.max(2, Math.min(10, 2 + activeAudioVol * barScale * 12));
            return (
              <div
                key={idx}
                className="w-[2px] rounded-full transition-all duration-75"
                style={{
                  height: `${height}px`,
                  backgroundColor: activeColor,
                  opacity: voiceState === 'idle' ? 0.3 : 0.9,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Center: Expressive OLED Eyes & Cheeks */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full flex-1 gap-2.5">
        {/* Eyes Row */}
        <div className="flex items-center justify-center gap-10 w-full">
          <div className="w-12 h-12 flex items-center justify-center">
            {renderHardwareEye(voiceState, blink, true, botVolume, activeColor)}
          </div>
          <div className="w-12 h-12 flex items-center justify-center">
            {renderHardwareEye(voiceState, blink, false, botVolume, activeColor)}
          </div>
        </div>

        {/* Rosy Pixel Cheeks & Mouth Row */}
        <div className="flex items-center justify-between w-36 px-2 relative -mt-1">
          {/* Left Cheek */}
          <div
            className="w-4 h-2 rounded-sm transition-all duration-200"
            style={{
              backgroundColor: activeColor,
              opacity: voiceState === 'speaking' ? 0.75 : voiceState === 'listening' ? 0.5 : 0.25,
              filter: 'drop-shadow(0 0 4px currentColor)',
            }}
          />

          {/* Mouth */}
          <div className="flex items-center justify-center">
            {renderHardwareMouth(voiceState, botVolume, activeColor)}
          </div>

          {/* Right Cheek */}
          <div
            className="w-4 h-2 rounded-sm transition-all duration-200"
            style={{
              backgroundColor: activeColor,
              opacity: voiceState === 'speaking' ? 0.75 : voiceState === 'listening' ? 0.5 : 0.25,
              filter: 'drop-shadow(0 0 4px currentColor)',
            }}
          />
        </div>
      </div>

      {/* Bottom Screen Telemetry Readout */}
      <div className="flex items-center justify-between w-full px-1 z-10 border-t border-white/5 pt-1 text-[9px] font-mono text-zinc-500">
        <span className="uppercase">{voiceState}</span>
        <span className="tracking-tighter font-semibold" style={{ color: activeColor }}>
          ● LIVE
        </span>
      </div>

      {/* Subtle OLED Glass Glare Line */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent pointer-events-none rounded-tr-xl" />
      <div className="absolute inset-0 oled-scanlines pointer-events-none opacity-40" />
    </div>
  );
}

// Expressive Hardware Eyes
function renderHardwareEye(
  voiceState: VoiceState,
  blink: boolean,
  isLeft: boolean,
  botVolume: number,
  color: string
) {
  if (blink && voiceState !== 'speaking') {
    return <div className="w-9 h-1 rounded-full" style={{ backgroundColor: color }} />;
  }

  switch (voiceState) {
    case 'idle':
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-9 h-2.5 border-b-[3px] rounded-[50%]" style={{ borderColor: color }} />
        </div>
      );

    case 'listening':
      return (
        <div
          className="w-9 h-11 rounded-xl flex items-center justify-center transition-transform duration-100 border-2"
          style={{ borderColor: color, backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <div className="w-5 h-7 rounded-lg flex items-start justify-center pt-0.5" style={{ backgroundColor: color }}>
            <div className="w-2 h-2 rounded-sm bg-black" />
          </div>
        </div>
      );

    case 'thinking':
      return (
        <div className="w-9 h-3 flex items-center justify-center relative overflow-hidden rounded bg-black/40 border border-white/10">
          <div
            className="w-4 h-full rounded transition-all animate-pulse"
            style={{ backgroundColor: color }}
          />
        </div>
      );

    case 'speaking':
      return (
        <div
          className="flex flex-col items-center justify-center transition-transform duration-75"
          style={{ transform: `scale(${1 + botVolume * 0.15})` }}
        >
          <svg className="w-9 h-7" viewBox="0 0 36 28" fill="none">
            <path
              d="M 4 22 Q 18 2 32 22"
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );

    case 'interrupted':
      return (
        <div
          className="w-10 h-10 rounded-full border-4 flex items-center justify-center animate-bounce"
          style={{ borderColor: color }}
        >
          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color }} />
        </div>
      );

    default:
      return <div className="w-8 h-8 rounded-full" style={{ backgroundColor: color }} />;
  }
}

function renderHardwareMouth(voiceState: VoiceState, botVolume: number, color: string) {
  switch (voiceState) {
    case 'idle':
      return <div className="w-2 h-1 rounded-sm" style={{ backgroundColor: color, opacity: 0.6 }} />;

    case 'listening':
      return <div className="w-2.5 h-1.5 rounded-sm" style={{ backgroundColor: color, opacity: 0.8 }} />;

    case 'thinking':
      return <div className="w-3.5 h-1 rounded-full -rotate-3" style={{ backgroundColor: color }} />;

    case 'speaking': {
      const height = Math.max(6, Math.min(20, 8 + botVolume * 22));
      const width = Math.max(10, Math.min(18, 12 + botVolume * 12));
      return (
        <div
          className="rounded-md border transition-all duration-75"
          style={{
            height: `${height}px`,
            width: `${width}px`,
            backgroundColor: color,
            borderColor: '#FFFFFF',
          }}
        />
      );
    }

    case 'interrupted':
      return (
        <div className="w-3 h-4 rounded-full border-2" style={{ borderColor: color }} />
      );

    default:
      return null;
  }
}
