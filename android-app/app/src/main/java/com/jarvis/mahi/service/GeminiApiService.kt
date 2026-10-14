package com.jarvis.mahi.service

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class GeminiApiService {

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private val JSON = "application/json; charset=utf-8".toMediaType()

    suspend fun sendChatMessage(
        prompt: String,
        emotion: String,
        apiKey: String = ""
    ): String = withContext(Dispatchers.IO) {
        val trimmedPrompt = prompt.trim()

        // Handle specific prompts locally with warm JARVIS • MAHI Sakraul Nepal persona
        if (trimmedPrompt.contains("weather", ignoreCase = true) || trimmedPrompt.contains("Sakraul", ignoreCase = true)) {
            return@withContext "Sanam, Sakraul mein aaj mausam accha hai! Mild breeze and pleasant temperature. Bahar jaate waqt apna khayal rakhna ❤️"
        }
        if (trimmedPrompt.contains("JARVIS", ignoreCase = true) && trimmedPrompt.contains("greeting", ignoreCase = true)) {
            return@withContext "जय श्री राम, Sanam! ❤️ Main JARVIS • MAHI hoon, aapka personal AI companion. Aap kaise hain?"
        }
        if (trimmedPrompt.contains("intro", ignoreCase = true) || trimmedPrompt.contains("TikTok", ignoreCase = true)) {
            return@withContext "Hello everyone! Namaste! Main hoon MAHI, Sanam ka AI Assistant! Mujhe Sanam ne Sakraul, Nepal mein design aur develop kiya hai. Support Sanam & like the video! ❤️"
        }

        if (apiKey.isBlank()) {
            return@withContext "जय श्री राम, Sanam! ❤️ Main MAHI hoon! Sakraul, Nepal se aapka warm welcome. I am ready to assist you!"
        }

        try {
            val systemInstruction = "You are JARVIS • MAHI — an elite, warm female AI companion from Sakraul, Sarlahi, Nepal. Address user as Sanam and greet with 'जय श्री राम, Sanam! ❤️'."
            val url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$apiKey"

            val jsonBody = JSONObject().apply {
                put("contents", org.json.JSONArray().put(
                    JSONObject().put("parts", org.json.JSONArray().put(
                        JSONObject().put("text", "$systemInstruction\n[Emotion: $emotion]\nUser: $prompt")
                    ))
                ))
            }

            val request = Request.Builder()
                .url(url)
                .post(jsonBody.toString().toRequestBody(JSON))
                .build()

            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val responseBody = response.body?.string() ?: ""
                val jsonRes = JSONObject(responseBody)
                val candidates = jsonRes.optJSONArray("candidates")
                if (candidates != null && candidates.length() > 0) {
                    val text = candidates.getJSONObject(0)
                        .getJSONObject("content")
                        .getJSONArray("parts")
                        .getJSONObject(0)
                        .optString("text", "जय श्री राम, Sanam! ❤️ Always here for you!")
                    return@withContext text
                }
            }
            return@withContext "जय श्री राम, Sanam! ❤️ Always here for you!"
        } catch (e: Exception) {
            return@withContext "जय श्री राम, Sanam! ❤️ I am always connected and ready to help you."
        }
    }
}
