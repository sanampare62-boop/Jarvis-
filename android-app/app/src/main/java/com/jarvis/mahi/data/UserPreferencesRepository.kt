package com.jarvis.mahi.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "mahi_preferences")

class UserPreferencesRepository(private val context: Context) {

    private object PreferencesKeys {
        val VIEW_MODE = stringPreferencesKey("mahi_view_mode")
        val SELECTED_VOICE = stringPreferencesKey("mahi_selected_voice")
        val SPEAKING_SPEED = floatPreferencesKey("mahi_speaking_speed")
        val EXPRESSIVENESS = floatPreferencesKey("mahi_expressiveness")
        val EMOTIONAL_INTENSITY = floatPreferencesKey("mahi_emotional_intensity")
        val IS_MUTED = booleanPreferencesKey("mahi_is_muted")
        val GEMINI_API_KEY = stringPreferencesKey("gemini_api_key")
    }

    val viewModeFlow: Flow<ViewMode> = context.dataStore.data.map { preferences ->
        when (preferences[PreferencesKeys.VIEW_MODE]) {
            "desktop" -> ViewMode.DESKTOP
            else -> ViewMode.MOBILE
        }
    }

    val selectedVoiceFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.SELECTED_VOICE] ?: "Aoede"
    }

    val speakingSpeedFlow: Flow<Float> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.SPEAKING_SPEED] ?: 1.0f
    }

    val expressivenessFlow: Flow<Float> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.EXPRESSIVENESS] ?: 0.85f
    }

    val emotionalIntensityFlow: Flow<Float> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.EMOTIONAL_INTENSITY] ?: 0.9f
    }

    val isMutedFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.IS_MUTED] ?: false
    }

    val geminiApiKeyFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.GEMINI_API_KEY] ?: ""
    }

    suspend fun setViewMode(mode: ViewMode) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.VIEW_MODE] = if (mode == ViewMode.DESKTOP) "desktop" else "mobile"
        }
    }

    suspend fun setSelectedVoice(voice: String) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.SELECTED_VOICE] = voice
        }
    }

    suspend fun setSpeakingSpeed(speed: Float) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.SPEAKING_SPEED] = speed
        }
    }

    suspend fun setExpressiveness(expressiveness: Float) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.EXPRESSIVENESS] = expressiveness
        }
    }

    suspend fun setEmotionalIntensity(intensity: Float) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.EMOTIONAL_INTENSITY] = intensity
        }
    }

    suspend fun setIsMuted(isMuted: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.IS_MUTED] = isMuted
        }
    }

    suspend fun setGeminiApiKey(key: String) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.GEMINI_API_KEY] = key
        }
    }
}
