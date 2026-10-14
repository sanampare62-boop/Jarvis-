package com.jarvis.mahi.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.jarvis.mahi.data.*
import com.jarvis.mahi.service.GeminiApiService
import com.jarvis.mahi.util.CalculatorEvaluator
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class MahiViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = UserPreferencesRepository(application)
    private val apiService = GeminiApiService()

    // Preferences Flows
    val viewMode: StateFlow<ViewMode> = repository.viewModeFlow.stateIn(
        viewModelScope, SharingStarted.Eagerly, ViewMode.MOBILE
    )

    val selectedVoice: StateFlow<String> = repository.selectedVoiceFlow.stateIn(
        viewModelScope, SharingStarted.Eagerly, "Aoede"
    )

    val speakingSpeed: StateFlow<Float> = repository.speakingSpeedFlow.stateIn(
        viewModelScope, SharingStarted.Eagerly, 1.0f
    )

    val expressiveness: StateFlow<Float> = repository.expressivenessFlow.stateIn(
        viewModelScope, SharingStarted.Eagerly, 0.85f
    )

    val emotionalIntensity: StateFlow<Float> = repository.emotionalIntensityFlow.stateIn(
        viewModelScope, SharingStarted.Eagerly, 0.9f
    )

    val isMuted: StateFlow<Boolean> = repository.isMutedFlow.stateIn(
        viewModelScope, SharingStarted.Eagerly, false
    )

    val geminiApiKey: StateFlow<String> = repository.geminiApiKeyFlow.stateIn(
        viewModelScope, SharingStarted.Eagerly, ""
    )

    // UI & Live Session State
    private val _sessionState = MutableStateFlow(SessionState.DISCONNECTED)
    val sessionState: StateFlow<SessionState> = _sessionState.asStateFlow()

    private val _userVolume = MutableStateFlow(0f)
    val userVolume: StateFlow<Float> = _userVolume.asStateFlow()

    private val _mahiVolume = MutableStateFlow(0f)
    val mahiVolume: StateFlow<Float> = _mahiVolume.asStateFlow()

    private val _activeEmotion = MutableStateFlow(EmotionalTone.HAPPY)
    val activeEmotion: StateFlow<EmotionalTone> = _activeEmotion.asStateFlow()

    private val _activeAction = MutableStateFlow<ActionNotification?>(null)
    val activeAction: StateFlow<ActionNotification?> = _activeAction.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _calcInput = MutableStateFlow("25 * 4")
    val calcInput: StateFlow<String> = _calcInput.asStateFlow()

    private val _calcResult = MutableStateFlow("100")
    val calcResult: StateFlow<String> = _calcResult.asStateFlow()

    // Chat Messages State
    private val _messages = MutableStateFlow<List<Message>>(
        listOf(
            Message(
                sender = "mahi",
                text = "Hello! I'm JARVIS • MAHI. Ask me anything in English, Hindi, or Hinglish — study help, code generation, translation, or just friendly banter! 💙",
                time = getCurrentTime()
            )
        )
    )
    val messages: StateFlow<List<Message>> = _messages.asStateFlow()

    private val _isChatLoading = MutableStateFlow(false)
    val isChatLoading: StateFlow<Boolean> = _isChatLoading.asStateFlow()

    // Missions State
    private val _missions = MutableStateFlow<List<Mission>>(
        listOf(
            Mission(
                id = "1",
                title = "Master Quantum Physics Basics",
                steps = listOf("Read wave-particle duality notes", "Solve 3 practice problems", "Review summary with Mahi"),
                activeStep = 0,
                completed = false
            ),
            Mission(
                id = "2",
                title = "Build Cyberpunk Landing Page & Android App",
                steps = listOf("Initialize project structure", "Create holographic canvas & layout", "Deploy voice integration"),
                activeStep = 1,
                completed = false
            )
        )
    )
    val missions: StateFlow<List<Mission>> = _missions.asStateFlow()

    fun toggleViewMode() {
        viewModelScope.launch {
            val nextMode = if (viewMode.value == ViewMode.MOBILE) ViewMode.DESKTOP else ViewMode.MOBILE
            repository.setViewMode(nextMode)
        }
    }

    fun setSelectedVoice(voice: String) {
        viewModelScope.launch {
            repository.setSelectedVoice(voice)
        }
    }

    fun setSpeakingSpeed(speed: Float) {
        viewModelScope.launch {
            repository.setSpeakingSpeed(speed)
        }
    }

    fun setExpressiveness(expressiveness: Float) {
        viewModelScope.launch {
            repository.setExpressiveness(expressiveness)
        }
    }

    fun setEmotionalIntensity(intensity: Float) {
        viewModelScope.launch {
            repository.setEmotionalIntensity(intensity)
        }
    }

    fun toggleMute() {
        viewModelScope.launch {
            repository.setIsMuted(!isMuted.value)
        }
    }

    fun setGeminiApiKey(key: String) {
        viewModelScope.launch {
            repository.setGeminiApiKey(key)
        }
    }

    fun toggleSession() {
        if (_sessionState.value == SessionState.DISCONNECTED) {
            _sessionState.value = SessionState.CONNECTING
            viewModelScope.launch {
                kotlinx.coroutines.delay(1000)
                _sessionState.value = SessionState.LISTENING
            }
        } else {
            _sessionState.value = SessionState.DISCONNECTED
            _userVolume.value = 0f
            _mahiVolume.value = 0f
        }
    }

    fun setEmotion(emotion: EmotionalTone) {
        _activeEmotion.value = emotion
    }

    fun dismissAction() {
        _activeAction.value = null
    }

    fun clearError() {
        _errorMessage.value = null
    }

    fun updateCalcInput(input: String) {
        _calcInput.value = input
    }

    fun evaluateCalc() {
        _calcResult.value = CalculatorEvaluator.evaluate(_calcInput.value)
    }

    fun sendChatMessage(text: String) {
        if (text.isBlank() || _isChatLoading.value) return

        val userMessage = Message(
            sender = "user",
            text = text.trim(),
            time = getCurrentTime()
        )
        _messages.value = _messages.value + userMessage
        _isChatLoading.value = true

        viewModelScope.launch {
            val replyText = apiService.sendChatMessage(
                prompt = text,
                emotion = activeEmotion.value.label,
                apiKey = geminiApiKey.value
            )
            val mahiMessage = Message(
                sender = "mahi",
                text = replyText,
                time = getCurrentTime()
            )
            _messages.value = _messages.value + mahiMessage
            _isChatLoading.value = false
        }
    }

    fun clearChat() {
        _messages.value = emptyList()
    }

    fun addMission(title: String, stepsInput: String) {
        if (title.isBlank()) return
        val stepsList = if (stepsInput.isBlank()) {
            listOf("Step 1: Plan goal", "Step 2: Execute task")
        } else {
            stepsInput.split(",").map { it.trim() }.filter { it.isNotEmpty() }
        }

        val newMission = Mission(
            title = title.trim(),
            steps = stepsList,
            activeStep = 0,
            completed = false
        )
        _missions.value = _missions.value + newMission
    }

    fun advanceMissionStep(id: String) {
        _missions.value = _missions.value.map { m ->
            if (m.id != id) m
            else {
                val nextStep = m.activeStep + 1
                if (nextStep >= m.steps.size) {
                    m.copy(completed = true, activeStep = m.steps.size - 1)
                } else {
                    m.copy(activeStep = nextStep)
                }
            }
        }
    }

    fun deleteMission(id: String) {
        _missions.value = _missions.value.filter { it.id != id }
    }

    fun handleTriggerPrompt(promptText: String) {
        if (_sessionState.value == SessionState.DISCONNECTED) {
            toggleSession()
        }
        sendChatMessage(promptText)
    }

    private fun getCurrentTime(): String {
        return SimpleDateFormat("h:mm a", Locale.getDefault()).format(Date())
    }
}
