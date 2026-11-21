import os
import json
import asyncio
import logging
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from google.genai import types

from gemini_live import (
    get_gemini_client,
    create_live_config,
    GEMINI_LIVE_MODEL,
    DEFAULT_VOICE,
    DEFAULT_COMPANION_PROMPT,
)

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ai-buddy")

load_dotenv()

app = FastAPI(title="AI Buddy - Gemini 3.8 Live Voice Companion")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
@app.get("/")
async def health_check():
    return {
        "status": "online",
        "service": "AI Buddy Live Voice Backend",
        "model": GEMINI_LIVE_MODEL,
        "default_voice": DEFAULT_VOICE,
    }

@app.websocket("/ws/voice")
async def voice_websocket(
    websocket: WebSocket,
    voice: Optional[str] = Query(default=None),
    persona: Optional[str] = Query(default=None),
):
    """
    Ultra-low-latency bidirectional relay between client browser and Gemini Multimodal Live API.
    - Client -> Gemini: 16kHz PCM binary audio frames & JSON text/control messages.
    - Gemini -> Client: 24kHz PCM binary audio frames & JSON event messages (interrupted, transcriptions).
    Keeps session alive across multi-turn conversations.
    """
    await websocket.accept()
    logger.info("Client connected to /ws/voice with voice=%s", voice)

    selected_voice = voice or DEFAULT_VOICE
    # The configuration prompt is internal to the backend; cannot be overridden from outside
    client = get_gemini_client()
    config = create_live_config(
        voice_name=selected_voice,
        system_instruction=DEFAULT_COMPANION_PROMPT,
    )

    try:
        async with client.aio.live.connect(model=GEMINI_LIVE_MODEL, config=config) as session:
            logger.info("Connected to Gemini Multimodal Live session (%s)", GEMINI_LIVE_MODEL)
            await websocket.send_json({
                "type": "status",
                "message": "Connected to Gemini Multimodal Live API",
                "voice": selected_voice,
                "model": GEMINI_LIVE_MODEL,
            })

            async def receive_from_client():
                """Relay audio bytes and text from browser to Gemini Live session."""
                try:
                    while True:
                        msg = await websocket.receive()
                        if msg.get("type") == "websocket.disconnect":
                            logger.info("Client requested WebSocket disconnect.")
                            break

                        # Binary frame: 16kHz 16-bit PCM mic audio
                        if "bytes" in msg and msg["bytes"]:
                            pcm_bytes = msg["bytes"]
                            await session.send_realtime_input(
                                audio=types.Blob(
                                    data=pcm_bytes,
                                    mime_type="audio/pcm;rate=16000",
                                )
                            )

                        # Text frame: JSON control messages
                        elif "text" in msg and msg["text"]:
                            try:
                                payload = json.loads(msg["text"])
                                msg_type = payload.get("type")

                                if msg_type == "text" and "text" in payload:
                                    logger.info("Forwarding text prompt to Gemini: %s", payload["text"])
                                    await session.send_client_content(
                                        turns=[
                                            types.Content(
                                                role="user",
                                                parts=[types.Part.from_text(text=payload["text"])]
                                            )
                                        ],
                                        turn_complete=True,
                                    )

                                elif msg_type == "ping":
                                    # Immediate RTT heartbeat response
                                    await websocket.send_json({
                                        "type": "pong",
                                        "client_time": payload.get("timestamp"),
                                    })
                            except json.JSONDecodeError:
                                logger.warning("Non-JSON text frame received: %s", msg["text"][:100])
                except WebSocketDisconnect:
                    logger.info("Client disconnected from WebSocket.")
                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    logger.error("Error in receive_from_client: %s", e, exc_info=True)

            async def send_to_client():
                """
                Stream audio frames and transcription events from Gemini Live session to browser.
                Wrapped in a while True loop to keep the session alive continuously across multi-turn interactions.
                """
                try:
                    while True:
                        try:
                            async for response in session.receive():
                                sc = response.server_content
                                if not sc:
                                    continue

                                # 1. Barge-In Interruption Event
                                if sc.interrupted:
                                    logger.info("Gemini reported user interruption (barge-in).")
                                    await websocket.send_json({"type": "interrupted"})

                                # 2. Real-time User Audio Transcription
                                if sc.input_transcription and sc.input_transcription.text:
                                    await websocket.send_json({
                                        "type": "user_transcript",
                                        "text": sc.input_transcription.text,
                                        "finished": getattr(sc.input_transcription, "finished", False),
                                    })

                                # 3. Real-time Bot Output Audio Transcription
                                if sc.output_transcription and sc.output_transcription.text:
                                    await websocket.send_json({
                                        "type": "bot_transcript",
                                        "text": sc.output_transcription.text,
                                        "finished": getattr(sc.output_transcription, "finished", False),
                                    })

                                # 4. Raw Binary PCM Audio Stream (Zero Base64 overhead)
                                if sc.model_turn and sc.model_turn.parts:
                                    for part in sc.model_turn.parts:
                                        if part.inline_data and part.inline_data.data:
                                            await websocket.send_bytes(part.inline_data.data)
                                        elif part.text:
                                            await websocket.send_json({
                                                "type": "bot_transcript",
                                                "text": part.text,
                                                "finished": False,
                                            })

                                # 5. Turn Complete Event
                                if sc.turn_complete:
                                    logger.info("Turn complete from Gemini. Remaining alive for subsequent turns.")
                                    await websocket.send_json({"type": "turn_complete"})

                            # The generator session.receive() ended for this interaction
                            logger.info("Gemini turn generator finished; awaiting next turn in receive loop.")
                        except asyncio.CancelledError:
                            raise
                        except WebSocketDisconnect:
                            raise
                        except Exception as turn_err:
                            logger.error("Error during session.receive(): %s", turn_err, exc_info=True)
                            # Break the while loop if the underlying Gemini session failed
                            break

                except WebSocketDisconnect:
                    logger.info("Client disconnected during streaming.")
                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    logger.error("Error in send_to_client: %s", e, exc_info=True)

            # Run both streaming tasks concurrently; cancel when either finishes
            task_rx = asyncio.create_task(receive_from_client(), name="receive_from_client")
            task_tx = asyncio.create_task(send_to_client(), name="send_to_client")

            done, pending = await asyncio.wait(
                [task_rx, task_tx],
                return_when=asyncio.FIRST_COMPLETED,
            )

            for task in done:
                if not task.cancelled() and task.exception():
                    exc = task.exception()
                    logger.error("Task %s ended with exception: %s", task.get_name(), exc, exc_info=exc)

            for task in pending:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

    except WebSocketDisconnect:
        logger.info("WebSocket connection closed cleanly by client.")
    except Exception as e:
        logger.error("Unhandled error establishing or maintaining Gemini Live session: %s", e, exc_info=True)
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e),
            })
        except Exception:
            pass
    finally:
        logger.info("Session ended for client.")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
