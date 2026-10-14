package com.jarvis.mahi.data

import androidx.annotation.Keep

@Keep
enum class SessionState {
    DISCONNECTED,
    CONNECTING,
    LISTENING,
    SPEAKING
}

@Keep
enum class ViewMode {
    MOBILE,
    DESKTOP
}

@Keep
data class Message(
    val id: String = java.util.UUID.randomUUID().toString(),
    val sender: String, // "user" or "mahi"
    val text: String,
    val time: String
)

@Keep
data class MissionStep(
    val text: String,
    val completed: Boolean = false
)

@Keep
data class Mission(
    val id: String = java.util.UUID.randomUUID().toString(),
    val title: String,
    val steps: List<String>,
    val activeStep: Int = 0,
    val completed: Boolean = false
)

@Keep
data class ActionNotification(
    val id: String,
    val type: String, // "website" or "action"
    val title: String,
    val url: String? = null,
    val action: String? = null,
    val reason: String? = null,
    val message: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)

@Keep
enum class EmotionalTone(val label: String, val prompt: String) {
    HAPPY("Happy", "JARVIS, give me a warm, bright, cheerful greeting!"),
    SERIOUS("Serious", "JARVIS, give me a calm, composed, serious announcement."),
    SAD("Sad", "JARVIS, speak with a gentle, compassionate, comforting tone."),
    PLAYFUL("Playful", "JARVIS, let us have a relaxed, spontaneous, friendly chat."),
    CARING("Caring", "JARVIS, offer tender, reassuring, emotionally connected comfort."),
    EXCITED("Excited", "JARVIS, express energetic, enthusiastic excitement!")
}
