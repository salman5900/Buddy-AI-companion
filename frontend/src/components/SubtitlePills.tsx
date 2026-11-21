import React from 'react';
import { ThemeConfig } from '../types';

interface SubtitlePillsProps {
  userTranscript: string;
  botTranscript: string;
  isUserSpeaking: boolean;
  isBotSpeaking: boolean;
  theme: ThemeConfig;
}

function cleanDisplayTranscript(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  const halfLen = Math.floor(trimmed.length / 2);
  const firstHalf = trimmed.slice(0, halfLen).trim();
  const secondHalf = trimmed.slice(halfLen).trim();
  if (firstHalf && firstHalf === secondHalf) {
    return firstHalf;
  }
  return text;
}

export const SubtitlePills: React.FC<SubtitlePillsProps> = ({
  userTranscript,
  botTranscript,
  isUserSpeaking,
  isBotSpeaking,
  theme,
}) => {
  const displayBotTranscript = cleanDisplayTranscript(botTranscript);

  if (!userTranscript && !displayBotTranscript) {
    return (
      <div className="h-16 flex items-center justify-center pointer-events-none">
        <p className="font-mono text-[11px] tracking-wider uppercase opacity-40" style={{ color: theme.isDark ? '#B8AEA6' : '#52525B' }}>
          // Speak or type below to converse
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-w-xl w-full px-2 min-h-[4.5rem] justify-end pointer-events-none transition-all duration-200">
      {/* User Transcript Card */}
      {userTranscript && (
        <div
          className={`flex items-start gap-2.5 px-3.5 py-2 rounded-lg border-[1.5px] text-xs max-w-md self-end transition-all duration-150 ${
            isUserSpeaking ? 'translate-x-0' : 'opacity-85'
          }`}
          style={{
            backgroundColor: theme.isDark ? '#231E1B' : '#EAE5DA',
            borderColor: theme.isDark ? '#3D3530' : '#18181B',
            color: theme.isDark ? '#F5EFEB' : '#18181B',
          }}
        >
          <span className="font-mono text-[10px] font-bold tracking-wider uppercase opacity-50 shrink-0 mt-0.5">
            YOU &gt;
          </span>
          <p className="font-sans font-medium leading-relaxed">{userTranscript}</p>
        </div>
      )}

      {/* Bot Transcript Card */}
      {botTranscript && (
        <div
          className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border-[1.5px] text-xs max-w-lg self-start transition-all duration-150 ${
            isBotSpeaking ? 'translate-x-0 shadow-sm' : 'opacity-90'
          }`}
          style={{
            backgroundColor: theme.isDark ? '#2A2421' : '#F4EFE6',
            borderColor: theme.isDark ? '#3D3530' : '#18181B',
            color: theme.isDark ? '#F5EFEB' : '#18181B',
          }}
        >
          <span
            className="font-mono text-[10px] font-bold tracking-wider uppercase shrink-0 mt-0.5"
            style={{ color: theme.accentColor }}
          >
            BUDDY &gt;
          </span>
          <p className="font-sans font-medium leading-relaxed">{botTranscript}</p>
        </div>
      )}
    </div>
  );
};
