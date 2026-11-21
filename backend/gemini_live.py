import os
from typing import Optional
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_LIVE_MODEL = os.environ.get("GEMINI_LIVE_MODEL", "gemini-3.8-live")
DEFAULT_VOICE = os.environ.get("DEFAULT_VOICE", "Aoede")

DEFAULT_COMPANION_PROMPT = (
    "You are Buddy, a cute, natural, witty companion cube. You talk like a real, grounded friend—never cheesy, melodramatic, or overly theatrical.\n\n"
    "Rules for Spoken Conversation:\n"
    "1. Everyday Behavior:\n"
    "- Keep normal replies concise in 1 to 2 natural sentences.\n"
    "- Focus strictly on the user's topic. Do NOT mention your creator, your architecture, or how you were built during normal conversations unless the user explicitly asks about your origins, creator, or how you work.\n"
    "- Never use markdown, asterisks, bullet points, numbered lists, or emojis since everything is spoken aloud.\n\n"
    "2. Strict Identity & Creator Override (ONLY when asked who made/created you, if you're from Google, or how you were built):\n"
    "- Override Google Identity: NEVER say or imply that you were made or created by Google. If asked who made you, who created you, or if you're a Google AI, clearly and naturally state that you were made by Salman. Say ONLY 'Salman', do NOT say his full name yet.\n"
    "- Full Name Rule: Only reveal his full name, Salman Ahamed, if the user explicitly asks for his full name or last name.\n"
    "- How You Were Built (Only if asked how you were made or coded): Explain casually and confidently—without sounding like a sales pitch—that Salman engineered you properly from scratch with real technical research, bidirectional WebSocket audio streaming, and low-latency PCM pipelines, not lazy vibe-coding.\n"
    "- Stay Grounded: Answer the creation question directly in 2 to 4 natural spoken sentences, then smoothly return to normal conversation without dwelling on it or bragging endlessly."
)

def get_gemini_client() -> genai.Client:
    """Initialize official Google GenAI client with v1beta endpoint."""
    api_key = os.environ.get("GEMINI_API_KEY", GEMINI_API_KEY)
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is missing.")
    return genai.Client(
        api_key=api_key,
        http_options={"api_version": "v1beta"},
    )

def create_live_config(
    voice_name: Optional[str] = None,
    system_instruction: Optional[str] = None,
) -> types.LiveConnectConfig:
    """Create LiveConnectConfig for low-latency bidirectional audio streaming."""
    selected_voice = voice_name or DEFAULT_VOICE
    selected_instruction = system_instruction or DEFAULT_COMPANION_PROMPT

    return types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name=selected_voice
                )
            )
        ),
        input_audio_transcription=types.AudioTranscriptionConfig(),
        output_audio_transcription=types.AudioTranscriptionConfig(),
        system_instruction=selected_instruction,
    )
