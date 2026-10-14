package com.sanam.mahi

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.speech.tts.TextToSpeech
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.core.content.ContextCompat
import java.util.Locale

class WebAppInterface(private val context: Context) : TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null
    private var isTtsInitialized = false
    private val mainHandler = Handler(Looper.getMainLooper())

    init {
        tts = TextToSpeech(context, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = tts?.setLanguage(Locale("hi", "IN"))
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts?.setLanguage(Locale.US)
            }
            tts?.setSpeechRate(1.0f)
            tts?.setPitch(1.05f)
            isTtsInitialized = true
        }
    }

    @JavascriptInterface
    fun isAndroidApp(): Boolean {
        return true
    }

    @JavascriptInterface
    fun getAndroidAppVersion(): String {
        return "1.0.0"
    }

    @JavascriptInterface
    fun hasMicrophonePermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
    }

    @JavascriptInterface
    fun requestMicrophonePermission() {
        if (context is MainActivity) {
            mainHandler.post {
                context.requestMicPermissionDirectly()
            }
        }
    }

    @JavascriptInterface
    fun openAppSettings() {
        mainHandler.post {
            try {
                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.fromParts("package", context.packageName, null)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
            } catch (e: Exception) {
                Toast.makeText(context, "Could not open Android Settings", Toast.LENGTH_SHORT).show()
            }
        }
    }

    @JavascriptInterface
    fun getMicrophoneStatus(): String {
        return if (hasMicrophonePermission()) "GRANTED" else "DENIED"
    }

    @JavascriptInterface
    fun speakNative(text: String, languageCode: String? = null) {
        if (!isTtsInitialized || text.isBlank()) return

        if (!languageCode.isNullOrBlank()) {
            try {
                val locale = if (languageCode.contains("-")) {
                    val parts = languageCode.split("-")
                    Locale(parts[0], parts[1])
                } else {
                    Locale(languageCode)
                }
                tts?.setLanguage(locale)
            } catch (_: Exception) {}
        }

        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "JARVIS_MAHI_TTS")
    }

    @JavascriptInterface
    fun stopNativeSpeech() {
        if (isTtsInitialized) {
            tts?.stop()
        }
    }

    @JavascriptInterface
    fun showToast(message: String) {
        mainHandler.post {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }

    fun shutdown() {
        if (tts != null) {
            tts?.stop()
            tts?.shutdown()
            tts = null
            isTtsInitialized = false
        }
    }
}
