import React, { useState } from 'react';
import { X, Sparkles, Volume2, Box, Check, Radio, Monitor, Disc, Cpu, Shield, Gamepad2, Tv, Sliders } from 'lucide-react';
import { VoiceName, PersonaConfig, ThemeConfig, ChassisDesignId, DEFAULT_PERSONA_INSTRUCTION } from '../types';

export { DEFAULT_PERSONA_INSTRUCTION };

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: PersonaConfig;
  onChangeConfig: (newConfig: PersonaConfig) => void;
  isConnected: boolean;
  onApplyAndReconnect: () => void;
  theme: ThemeConfig;
}

const AVAILABLE_VOICES: { id: VoiceName; name: string; tag: string; desc: string }[] = [
  { id: 'Aoede', name: 'Aoede', tag: 'Warm & Cheerful', desc: 'Melodic, warm, and friendly voice tone.' },
  { id: 'Puck', name: 'Puck', tag: 'Playful & Witty', desc: 'Lively, energetic, and curious voice tone.' },
  { id: 'Kore', name: 'Kore', tag: 'Calm & Gentle', desc: 'Soft, empathetic, and relaxed tone.' },
  { id: 'Charon', name: 'Charon', tag: 'Deep & Steady', desc: 'Low-pitched, confident, and thoughtful tone.' },
  { id: 'Fenrir', name: 'Fenrir', tag: 'Bold & Dynamic', desc: 'Strong, charismatic, and enthusiastic tone.' },
];

const CHASSIS_DESIGNS: {
  id: ChassisDesignId;
  name: string;
  tag: string;
  desc: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'cube',
    name: 'Tactile Cube',
    tag: 'Classic Default',
    desc: 'OP-1 / Braun industrial cube with hairline bevels, micro speaker grilles, and corner hex screws.',
    icon: Box,
  },
  {
    id: 'terminal',
    name: 'Retro CRT Terminal',
    tag: '80s Nostalgia',
    desc: 'Vintage desktop computer terminal with top carry handle, cooling vents, and dual rotary dials.',
    icon: Monitor,
  },
  {
    id: 'capsule',
    name: 'Cyber Pod / Capsule',
    tag: 'Aerodynamic Pod',
    desc: 'Sleek cylindrical pod with dual articulated antenna ears and continuous oval visor screen.',
    icon: Cpu,
  },
  {
    id: 'boombox',
    name: 'Pocket Sound Deck',
    tag: 'Stereo Hi-Fi',
    desc: 'Cassette boombox with twin pulsing bass woofers, metal carry bar, and tactile tape transport keys.',
    icon: Disc,
  },
  {
    id: 'radio',
    name: 'Braun SK4 Radio',
    tag: 'Dieter Rams Bauhaus',
    desc: 'Iconic tabletop radio with analog frequency tuning dial, knurled dial wheel, and acoustic louvers.',
    icon: Radio,
  },
  {
    id: 'mech',
    name: 'Hex-Mech Droid',
    tag: 'Tactical Cyber',
    desc: 'Faceted sci-fi robot chassis with reinforced corner armor plates, Torx bolts, and telemetry status.',
    icon: Shield,
  },
  {
    id: 'arcade',
    name: 'Retro Arcade Handheld',
    tag: '8-Bit Retro',
    desc: 'Vintage mini cabinet with directional D-pad cross, round A/B keycaps, and coin slot.',
    icon: Gamepad2,
  },
  {
    id: 'spacetv',
    name: '70s Space-Age TV',
    tag: 'Orb Television',
    desc: 'Space-age spherical television pod with chrome V-dipole antenna and circular bubble screen.',
    icon: Tv,
  },
  {
    id: 'synth',
    name: 'Eurorack Modular Synth',
    tag: 'Audio Rackmount',
    desc: 'Modular sound rack with gold mini patch sockets, twin stereo LED VU meters, and slider fader.',
    icon: Sliders,
  },
];

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  isConnected,
  onApplyAndReconnect,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<'designs' | 'audio'>('designs');

  if (!isOpen) return null;

  const handleVoiceSelect = (voice: VoiceName) => {
    onChangeConfig({ ...config, voice });
  };

  const handleChassisSelect = (designId: ChassisDesignId) => {
    onChangeConfig({ ...config, chassisDesign: designId });
    localStorage.setItem('ai_buddy_chassis', designId);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Hardware Deck Panel */}
      <div
        className={`relative z-10 w-full max-w-md h-full shadow-2xl border-l-[1.5px] p-6 flex flex-col justify-between overflow-y-auto ${
          theme.isDark ? 'bg-[#1C1815] border-[#3D3530] text-[#F5EFEB]' : 'bg-[#F2ECE1] border-[#18181B] text-[#18181B]'
        }`}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-black/15">
            <div className="flex items-center gap-2.5">
              <div
                className="p-2 rounded-lg border-[1.5px]"
                style={{
                  backgroundColor: theme.isDark ? '#2A2421' : '#E8E3D8',
                  borderColor: theme.isDark ? '#3D3530' : '#18181B',
                  color: theme.accentColor,
                }}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-mono tracking-wider uppercase">MOD // TUNING DECK</h2>
                <p className="text-[11px] font-mono opacity-60">Hardware Chassis &amp; Audio Voice Core</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="tactile-btn p-1.5 rounded-lg border-[1.5px] border-b-[2px] opacity-70 hover:opacity-100 transition-opacity"
              style={{
                backgroundColor: theme.isDark ? '#2A2421' : '#FAF8F5',
                borderColor: theme.isDark ? '#3D3530' : '#18181B',
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Segmented Two-Tab Navigation */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl border-[1.5px] border-black/20 bg-black/5">
            <button
              onClick={() => setActiveTab('designs')}
              className={`tactile-btn py-2 px-3 rounded-lg font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === 'designs'
                  ? theme.isDark
                    ? 'bg-[#2A2421] text-white border border-[#3D3530] shadow-xs'
                    : 'bg-[#FAF8F5] text-black border border-black/20 shadow-xs'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Box className="w-3.5 h-3.5" style={{ color: activeTab === 'designs' ? theme.accentColor : undefined }} />
              Chassis Form ({CHASSIS_DESIGNS.length})
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`tactile-btn py-2 px-3 rounded-lg font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === 'audio'
                  ? theme.isDark
                    ? 'bg-[#2A2421] text-white border border-[#3D3530] shadow-xs'
                    : 'bg-[#FAF8F5] text-black border border-black/20 shadow-xs'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" style={{ color: activeTab === 'audio' ? theme.accentListening : undefined }} />
              Voice Synthesizer
            </button>
          </div>

          {/* TAB 1: CHASSIS HARDWARE DESIGNS */}
          {activeTab === 'designs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 opacity-80">
                  <Box className="w-3.5 h-3.5" style={{ color: theme.accentColor }} />
                  Select Hardware Chassis Silhouette
                </label>
                <span className="text-[10px] font-mono opacity-50 uppercase tracking-tighter">
                  Active: {config.chassisDesign}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {CHASSIS_DESIGNS.map((d) => {
                  const isSelected = config.chassisDesign === d.id;
                  const Icon = d.icon;
                  return (
                    <button
                      key={d.id}
                      onClick={() => handleChassisSelect(d.id)}
                      className={`tactile-btn flex items-start gap-3 p-3.5 rounded-xl border-[1.5px] border-b-[3px] text-left transition-all ${
                        isSelected
                          ? theme.isDark
                            ? 'bg-[#2E2723] border-[#FBBF24] shadow-[0_2px_0_#FBBF24]'
                            : 'bg-[#FAF8F5] border-[#FF4D1C] shadow-[0_2px_0_#FF4D1C]'
                          : theme.isDark
                          ? 'bg-[#231E1B] border-[#3D3530] hover:bg-[#2A2421]'
                          : 'bg-[#EAE5DA] border-[#18181B]/40 hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-lg border-[1.5px] flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: isSelected
                            ? theme.isDark
                              ? '#3A322C'
                              : '#F5ECE1'
                            : theme.isDark
                            ? '#2A2421'
                            : '#E0DAD0',
                          borderColor: isSelected ? theme.accentColor : 'rgba(0,0,0,0.15)',
                          color: isSelected ? theme.accentColor : undefined,
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs font-mono">{d.name}</span>
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
                            style={{
                              borderColor: isSelected ? theme.accentColor : 'rgba(0,0,0,0.15)',
                              backgroundColor: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                              color: isSelected ? theme.accentColor : undefined,
                            }}
                          >
                            {d.tag}
                          </span>
                        </div>
                        <p className="text-[11px] font-sans opacity-70 mt-1 leading-snug">{d.desc}</p>
                      </div>
                      {isSelected && (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-1"
                          style={{ backgroundColor: theme.accentColor, color: '#FFFFFF' }}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: AUDIO VOICE SYNTHESIZER */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="space-y-2.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 opacity-80">
                  <Volume2 className="w-3.5 h-3.5" style={{ color: theme.accentListening }} />
                  Audio Output Voice Profile
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {AVAILABLE_VOICES.map((v) => {
                    const isSelected = config.voice === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => handleVoiceSelect(v.id)}
                        className={`tactile-btn flex items-center justify-between p-3 rounded-xl border-[1.5px] border-b-[2.5px] text-left transition-all ${
                          isSelected
                            ? theme.isDark
                              ? 'bg-[#2E2723] border-[#FBBF24] shadow-[0_2px_0_#FBBF24]'
                              : 'bg-[#FAF8F5] border-[#FF4D1C] shadow-[0_2px_0_#FF4D1C]'
                            : theme.isDark
                            ? 'bg-[#231E1B] border-[#3D3530] hover:bg-[#2A2421]'
                            : 'bg-[#EAE5DA] border-[#18181B]/40 hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs font-mono">{v.name}</span>
                            <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded border border-black/10 opacity-70">
                              {v.tag}
                            </span>
                          </div>
                          <p className="text-[11px] font-sans opacity-70 mt-0.5">{v.desc}</p>
                        </div>
                        {isSelected && (
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: theme.accentColor, color: '#FFFFFF' }}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-black/15 bg-black/5 text-[11px] font-mono opacity-80 leading-relaxed">
                <p className="font-bold uppercase text-[10px] tracking-wider mb-1">
                  Acoustic Echo Protection
                </p>
                Speaker Mode uses a half-duplex acoustic echo gate with a 250ms tail timer to prevent laptop speaker feedback from triggering false barge-ins. Toggle to Headphones mode in the dock for full-duplex hands-free voice interruption.
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-black/15 mt-6">
          <button
            onClick={() => {
              onClose();
              if (isConnected) {
                onApplyAndReconnect();
              }
            }}
            className={`tactile-btn w-full py-3 px-4 rounded-xl font-mono font-bold text-xs uppercase tracking-wider border-[1.5px] border-b-[3px] shadow-[0_2px_0_#18181B] ${theme.primaryKeycapBg} ${theme.primaryKeycapBorder}`}
          >
            {isConnected ? 'APPLY & RE-SYNC LIVE SESSION' : 'SAVE CONFIGURATION'}
          </button>
        </div>
      </div>
    </div>
  );
};
