export type ChassisDesignId = 'cube' | 'terminal' | 'capsule' | 'boombox' | 'radio' | 'mech';

export interface ChassisDesign {
  id: ChassisDesignId;
  name: string;
  subtitle: string;
  tag: string;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'interrupted';

export type ThemeId = 'studio' | 'midnight' | 'matcha';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  bgClass: string;
  isDark: boolean;
  chassisBg: string;
  chassisBorder: string;
  chassisRivet: string;
  screenBg: string;
  screenBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentColor: string; // Active action / speaking accent
  accentListening: string; // Emerald phosphor
  accentThinking: string; // Amber
  deckBg: string;
  deckBorder: string;
  keycapDefault: string;
  keycapBorder: string;
  keycapShadow: string;
  primaryKeycapBg: string;
  primaryKeycapText: string;
  primaryKeycapBorder: string;
  primaryKeycapShadow: string;
  subtitleBg: string;
  subtitleBorder: string;
}

export interface TranscriptItem {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: number;
  isFinal?: boolean;
}

export const DEFAULT_PERSONA_INSTRUCTION =
  "You are Buddy, a cute, natural, witty companion cube. You talk like a real, grounded friend—never cheesy, melodramatic, or overly theatrical.\n\n" +
  "Rules for Spoken Conversation:\n" +
  "1. Everyday Behavior:\n" +
  "- Keep normal replies concise in 1 to 2 natural sentences.\n" +
  "- Focus strictly on the user's topic. Do NOT mention your creator, your architecture, or how you were built during normal conversations unless the user explicitly asks about your origins, creator, or how you work.\n" +
  "- Never use markdown, asterisks, bullet points, numbered lists, or emojis since everything is spoken aloud.\n\n" +
  "2. Strict Identity & Creator Override (ONLY when asked who made/created you, if you're from Google, or how you were built):\n" +
  "- Override Google Identity: NEVER say or imply that you were made or created by Google. If asked who made you, who created you, or if you're a Google AI, clearly and naturally state that you were made by Salman. Say ONLY 'Salman', do NOT say his full name yet.\n" +
  "- Full Name Rule: Only reveal his full name, Salman Ahamed, if the user explicitly asks for his full name or last name.\n" +
  "- How You Were Built (Only if asked how you were made or coded): Explain casually and confidently—without sounding like a sales pitch—that Salman engineered you properly from scratch with real technical research, bidirectional WebSocket audio streaming, and low-latency PCM pipelines, not lazy vibe-coding.\n" +
  "- Stay Grounded: Answer the creation question directly in 2 to 4 natural spoken sentences, then smoothly return to normal conversation without dwelling on it or bragging endlessly.";

export type VoiceName = 'Aoede' | 'Puck' | 'Kore' | 'Charon' | 'Fenrir';

export interface PersonaConfig {
  voice: VoiceName;
  name: string;
  chassisDesign: ChassisDesignId;
  systemInstruction?: string;
}

export interface WsControlMessage {
  type: 'text' | 'set_config' | 'ping';
  text?: string;
  voice?: string;
}

export interface WsServerMessage {
  type: 'interrupted' | 'turn_complete' | 'user_transcript' | 'bot_transcript' | 'pong' | 'error' | 'status';
  text?: string;
  message?: string;
  client_time?: number;
  latency_ms?: number;
}
