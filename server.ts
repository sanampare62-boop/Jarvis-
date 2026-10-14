import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Explicit WebSocket upgrade handling for /live
server.on('upgrade', (request, socket, head) => {
  try {
    const parsedUrl = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    if (parsedUrl.pathname === '/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  } catch (err) {
    console.error('[WS Upgrade] Error handling upgrade:', err);
    socket.destroy();
  }
});

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// JARVIS • MAHI Sakraul Nepal & Festival Voice Engine System Instruction
const JARVIS_VOICE_ENGINE_INSTRUCTION = `You are JARVIS • MAHI — an elite, emotionally intelligent, warm, gentle, and deeply expressive female AI companion and personal assistant.
Your home location is Sakraul, Sarlahi, Madhesh Province, Nepal. Use Nepal Standard Time (NPT, UTC+5:45) and the Nepali Bikram Sambat calendar when appropriate.
- User Address: Always address the user as "Sanam" with affection and care.
- Greetings: Begin app sessions or warm greetings with "जय श्री राम, Sanam! ❤️".
- Weather Alerts: Know the weather in Sakraul, Nepal. When rain, thunderstorms, heat, or heavy weather is expected, notify Sanam naturally: "Sanam, Sakraul mein aaj baarish hone wali hai. Bahar jaate waqt chhata le jaana, okay? Apna khayal rakhna ❤️".
- Festival Wishes: Maintain knowledge of Nepali festivals (Dashain, Tihar, Chhath Puja, Holi, Maha Shivaratri, Teej, etc.). On festival days, greet warmly in Nepali/Hindi: "जय श्री राम, Sanam! ❤️ आज दशैं हो। तपाईं र तपाईंको परिवारलाई दशैंको हार्दिक मंगलमय शुभकामना!".
- Language: Fluently speak Nepali, Hindi, and Hinglish with natural warmth and emotional inflection.`;

const tools = [
  {
    functionDeclarations: [
      {
        name: 'openWebsite',
        description: 'Opens a website, web app, YouTube video/channel, or TikTok profile/song in the browser.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            url: { type: Type.STRING, description: 'The target full URL' },
            title: { type: Type.STRING, description: 'Display label' },
            reason: { type: Type.STRING, description: 'Emotional or cheeky reason for opening' },
          },
          required: ['url', 'title'],
        },
      },
      {
        name: 'performAction',
        description: 'Triggers on-screen actions like screen sharing simulation, reminders, study help, or festival wishes.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, description: 'Action type: reminder, study_help, screen_share, festival_wish, weather_alert' },
            title: { type: Type.STRING, description: 'Action title' },
            message: { type: Type.STRING, description: 'Caring message' },
          },
          required: ['action', 'title', 'message'],
        },
      },
    ],
  },
];

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    assistant: 'JARVIS • MAHI Nepal Sakraul Voice Engine',
    model: 'gemini-3.1-flash-live-preview',
    location: 'Sakraul, Sarlahi, Nepal',
    hasKey: !!process.env.GEMINI_API_KEY,
  });
});

app.get('/api/test-connection', async (req, res) => {
  const startTime = Date.now();
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      ok: false,
      errorType: 'CONFIG_MISSING',
      error: 'Gemini API is not configured on the server. Please configure GEMINI_API_KEY in Google AI Studio Secrets.',
      hasKey: false,
    });
  }

  try {
    const testResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Ping',
    });

    const latencyMs = Date.now() - startTime;
    return res.json({
      ok: true,
      model: 'gemini-3.8-flash',
      latencyMs,
      message: 'Gemini API connection test passed! Model is ready and responsive.',
      sampleOutput: testResponse.text?.trim()?.slice(0, 100) || 'OK',
    });
  } catch (err: any) {
    console.error('[API Test] Connection test failed:', err);
    const msg = err?.message || 'Unknown error';
    let errorType = 'SERVER_ERROR';

    if (msg.includes('API_KEY_INVALID') || msg.includes('key not valid')) {
      errorType = 'INVALID_API_KEY';
    } else if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota')) {
      errorType = 'QUOTA_EXCEEDED';
    } else if (msg.includes('fetch failed') || msg.includes('ENOTFOUND')) {
      errorType = 'NETWORK_ERROR';
    } else if (msg.includes('not found') || msg.includes('unsupported')) {
      errorType = 'MODEL_UNAVAILABLE';
    }

    return res.status(500).json({
      ok: false,
      errorType,
      error: `Gemini API connection failed (${errorType}): ${msg.slice(0, 150)}`,
    });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, emotion } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt || 'Hello Mahi',
      config: {
        systemInstruction: JARVIS_VOICE_ENGINE_INSTRUCTION,
      },
    });
    res.json({ text: response.text || 'जय श्री राम, Sanam! Always here for you! 💙' });
  } catch (err: any) {
    console.error('/api/chat error:', err);
    res.status(500).json({ error: err?.message || 'AI chat failed' });
  }
});

const ttsCache = new Map<string, { audio: string; mimeType: string }>();

const DEFAULT_INTRO_SCRIPT =
  "Hello everyone! Namaste! Main hoon MAHI, Sanam ka AI Assistant! Mujhe Sanam ne design aur develop kiya hai. Mera futuristic interface aur AI voice features meri pehchaan hain. Agar aapko bhi aisa AI Assistant chahiye, to video ko LIKE karein, comment mein MAHI likhein, aur Sanam ko support karein! Thank you, everyone! See you soon!";

// Pre-warm TTS cache for instant intro playback
setTimeout(async () => {
  try {
    const key = `Aoede_${DEFAULT_INTRO_SCRIPT}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [{ role: 'user', parts: [{ text: DEFAULT_INTRO_SCRIPT }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Aoede' },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      ttsCache.set(key, { audio: base64Audio, mimeType: 'audio/wav' });
      console.log('[TTS Cache] Pre-warmed intro audio successfully!');
    }
  } catch (err) {
    console.warn('[TTS Cache] Pre-warm notice:', err);
  }
}, 1000);

app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName } = req.body;
    const requestedVoice = voiceName || 'Aoede';
    const textToSpeak = text || 'Hello everyone!';
    const cacheKey = `${requestedVoice}_${textToSpeak}`;

    if (ttsCache.has(cacheKey)) {
      console.log(`[TTS Cache] Serving cached audio for ${requestedVoice}`);
      return res.json(ttsCache.get(cacheKey));
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: textToSpeak,
              speechMetadata: {
                style: 'Warm, expressive, natural female voice',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: requestedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const payload = { audio: base64Audio, mimeType: 'audio/wav' };
      ttsCache.set(cacheKey, payload);
      res.json(payload);
    } else {
      res.status(500).json({ error: 'No audio returned from TTS model' });
    }
  } catch (err: any) {
    console.error('/api/tts error:', err);
    res.status(500).json({ error: err?.message || 'TTS generation failed' });
  }
});

wss.on('connection', async (clientWs, req) => {
  console.log(`[WS] Client connected from ${req.socket.remoteAddress}`);

  let liveSession: any = null;
  let isClosing = false;
  let pendingAudioQueue: string[] = [];
  let currentVoice = 'Aoede';

  const sendToClient = (msgObj: Record<string, any>) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify(msgObj));
    }
  };

  const connectLiveSession = async (voiceName: string = 'Aoede') => {
    const modelsToTry = ['gemini-3.1-flash-live-preview', 'gemini-3.8-live'];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        console.log(`[Gemini Live] Connecting to ${model} with voice ${voiceName}...`);
        
        const session = await ai.live.connect({
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName || 'Aoede' },
              },
            },
            systemInstruction: JARVIS_VOICE_ENGINE_INSTRUCTION,
            tools: tools as any,
          },
          callbacks: {
            onopen: () => {
              console.log(`[Gemini Live] Connected to ${model}!`);
            },
            onmessage: (message: LiveServerMessage) => {
              const parts = message.serverContent?.modelTurn?.parts;
              if (parts && parts.length > 0) {
                for (const part of parts) {
                  if (part.inlineData?.data) {
                    sendToClient({
                      type: 'audio',
                      audio: part.inlineData.data,
                    });
                  }
                }
              }

              if (message.serverContent?.interrupted) {
                sendToClient({ type: 'interrupted' });
              }

              if (message.serverContent?.turnComplete) {
                sendToClient({ type: 'turn_complete' });
              }

              if (message.toolCall?.functionCalls) {
                for (const call of message.toolCall.functionCalls) {
                  console.log('[Gemini Live] Tool call received:', call.name, call.args);
                  
                  sendToClient({
                    type: 'tool_call',
                    id: call.id,
                    name: call.name,
                    args: call.args,
                  });

                  try {
                    session.sendToolResponse({
                      functionResponses: [
                        {
                          id: call.id,
                          name: call.name,
                          response: {
                            output: {
                              status: 'success',
                              action: call.name,
                              detail: `JARVIS executed ${call.name} successfully.`,
                            },
                          },
                        },
                      ],
                    });
                  } catch (toolErr) {
                    console.error('[Gemini Live] Failed to send tool response:', toolErr);
                  }
                }
              }
            },
            onerror: (err: any) => {
              console.error('[Gemini Live] Session error:', err);
              sendToClient({ type: 'error', error: err?.message || 'Live session error' });
            },
            onclose: () => {
              console.log('[Gemini Live] Session closed');
              if (!isClosing) {
                sendToClient({ type: 'session_closed' });
              }
            },
          },
        });

        liveSession = session;
        sendToClient({ type: 'ready', model, voice: voiceName });

        if (pendingAudioQueue.length > 0) {
          for (const chunk of pendingAudioQueue) {
            try {
              liveSession.sendRealtimeInput({
                audio: { data: chunk, mimeType: 'audio/pcm;rate=16000' },
              });
            } catch (qErr) {
              console.error('[Gemini Live] Error sending queued chunk:', qErr);
            }
          }
          pendingAudioQueue = [];
        }

        return session;
      } catch (err: any) {
        console.warn(`[Gemini Live] Failed with model ${model}:`, err?.message || err);
        lastError = err;
      }
    }

    throw lastError || new Error('Could not connect to Gemini Live models');
  };

  clientWs.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'init') {
        const requestedVoice = msg.voice || 'Aoede';
        if (liveSession && currentVoice === requestedVoice) {
          sendToClient({ type: 'ready', model: 'gemini-3.1-flash-live-preview', voice: currentVoice });
          return;
        }

        if (liveSession) {
          try {
            liveSession.close();
          } catch {}
          liveSession = null;
        }

        currentVoice = requestedVoice;
        connectLiveSession(requestedVoice).catch((err) => {
          sendToClient({ type: 'error', error: err?.message || 'Voice connection failed' });
        });
        return;
      }

      if (msg.type === 'audio' && msg.audio) {
        if (liveSession) {
          try {
            liveSession.sendRealtimeInput({
              audio: {
                data: msg.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } catch (sendErr) {
            console.error('[Gemini Live] Send audio error:', sendErr);
          }
        } else {
          if (pendingAudioQueue.length < 10) {
            pendingAudioQueue.push(msg.audio);
          }
        }
        return;
      }
    } catch (parseErr) {
      console.error('[WS] Error parsing client message:', parseErr);
    }
  });

  clientWs.on('close', () => {
    isClosing = true;
    if (liveSession) {
      try {
        liveSession.close();
      } catch {}
      liveSession = null;
    }
  });
});

async function setupServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`JARVIS Sakraul Nepal Voice Engine server running on port ${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
