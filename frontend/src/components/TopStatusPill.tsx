import React from 'react';
import { ConnectionState, VoiceState, ThemeId, ThemeConfig } from '../types';

interface TopStatusPillProps {
  connectionState: ConnectionState;
  voiceState: VoiceState;
  latencyMs: number | null;
  activeThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  theme: ThemeConfig;
}

export const TopStatusPill: React.FC<TopStatusPillProps> = ({
  connectionState,
  voiceState,
  latencyMs,
  activeThemeId,
  onSelectTheme,
  theme,
}) => {
  const isConnected = connectionState === 'connected';

  const getStateTag = () => {
    switch (voiceState) {
      case 'listening':
        return { label: 'LISTENING', color: theme.accentListening };
      case 'thinking':
        return { label: 'THINKING', color: theme.accentThinking };
      case 'speaking':
        return { label: 'SPEAKING', color: theme.accentColor };
      case 'interrupted':
        return { label: 'INTERRUPTED', color: '#EF4444' };
      case 'idle':
      default:
        return {
          label: isConnected ? 'STANDBY' : 'OFFLINE',
          color: isConnected ? '#10B981' : '#71717A',
        };
    }
  };

  const stateTag = getStateTag();

  return (
    <header className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl border-[1.5px] font-mono text-xs shadow-sm backdrop-blur-sm transition-colors duration-200"
      style={{
        backgroundColor: theme.isDark ? 'rgba(35, 30, 27, 0.9)' : 'rgba(232, 227, 216, 0.95)',
        borderColor: theme.isDark ? '#3D3530' : '#18181B',
      }}
    >
      {/* Power LED Indicator & Connection Status */}
      <div className="flex items-center gap-2 pr-2 border-r border-black/15">
        <span
          className={`w-2 h-2 rounded-full transition-colors duration-200 ${
            isConnected ? 'animate-pulse' : ''
          }`}
          style={{
            backgroundColor: isConnected ? '#10B981' : '#71717A',
            boxShadow: isConnected ? '0 0 6px #10B981' : 'none',
          }}
        />
        <span className="font-bold tracking-wider text-[11px]" style={{ color: isConnected ? (theme.isDark ? '#F5EFEB' : '#18181B') : '#71717A' }}>
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Voice State Badge */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-black/10 bg-black/5">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stateTag.color }} />
        <span className="font-semibold text-[10.5px] tracking-tight" style={{ color: stateTag.color }}>
          {stateTag.label}
        </span>
      </div>

      {/* Latency Clock */}
      {isConnected && latencyMs !== null && (
        <div className="flex items-center gap-1 text-[11px] tabular-nums font-mono opacity-80" style={{ color: theme.isDark ? '#B8AEA6' : '#52525B' }}>
          <span className="text-[9px] text-zinc-400">RTT:</span>
          <span>{Math.round(latencyMs)}ms</span>
        </div>
      )}

      {/* Hardware Model Identification */}
      <div className="hidden sm:block text-[10px] tracking-widest uppercase font-mono pl-1 border-l border-black/15 text-zinc-500">
        MOD-3.8
      </div>

      {/* Compact 3-Dot Hardware Theme Switcher */}
      <div className="flex items-center gap-1.5 pl-2 border-l border-black/15">
        {/* Studio Cream */}
        <button
          onClick={() => onSelectTheme('studio')}
          title="Studio Cream (Default)"
          className={`w-3.5 h-3.5 rounded-full border transition-all ${
            activeThemeId === 'studio'
              ? 'ring-2 ring-[#FF4D1C] scale-110 border-[#18181B]'
              : 'border-[#18181B]/40 hover:scale-105'
          }`}
          style={{ backgroundColor: '#E8E3D8' }}
        />

        {/* Midnight Espresso */}
        <button
          onClick={() => onSelectTheme('midnight')}
          title="Midnight Espresso (Dark)"
          className={`w-3.5 h-3.5 rounded-full border transition-all ${
            activeThemeId === 'midnight'
              ? 'ring-2 ring-[#FBBF24] scale-110 border-[#F5EFEB]'
              : 'border-[#3D3530] hover:scale-105'
          }`}
          style={{ backgroundColor: '#231E1B' }}
        />

        {/* Botanical Matcha */}
        <button
          onClick={() => onSelectTheme('matcha')}
          title="Botanical Matcha"
          className={`w-3.5 h-3.5 rounded-full border transition-all ${
            activeThemeId === 'matcha'
              ? 'ring-2 ring-[#0F5E54] scale-110 border-[#1F2D2A]'
              : 'border-[#1F2D2A]/40 hover:scale-105'
          }`}
          style={{ backgroundColor: '#E4EAE1' }}
        />
      </div>
    </header>
  );
};
