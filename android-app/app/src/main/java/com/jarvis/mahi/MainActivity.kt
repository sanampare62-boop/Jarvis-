package com.jarvis.mahi

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.jarvis.mahi.data.ViewMode
import com.jarvis.mahi.ui.MahiViewModel
import com.jarvis.mahi.ui.components.ActionToast
import com.jarvis.mahi.ui.components.SettingsModal
import com.jarvis.mahi.ui.components.TikTokIntroModal
import com.jarvis.mahi.ui.screens.MahiCharacterHUD
import com.jarvis.mahi.ui.screens.MobilePhoneHUD

class MainActivity : ComponentActivity() {

    private val viewModel: MahiViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val viewMode by viewModel.viewMode.collectAsState()
                    val activeAction by viewModel.activeAction.collectAsState()
                    val selectedVoice by viewModel.selectedVoice.collectAsState()

                    var showSettingsModal by remember { mutableStateOf(false) }
                    var showTikTokModal by remember { mutableStateOf(false) }

                    if (viewMode == ViewMode.MOBILE) {
                        MobilePhoneHUD(
                            viewModel = viewModel,
                            onOpenSettings = { showSettingsModal = true },
                            onOpenTikTokIntro = { showTikTokModal = true }
                        )
                    } else {
                        MahiCharacterHUD(
                            viewModel = viewModel,
                            onOpenSettings = { showSettingsModal = true },
                            onOpenTikTokIntro = { showTikTokModal = true }
                        )
                    }

                    ActionToast(
                        action = activeAction,
                        onDismiss = { viewModel.dismissAction() }
                    )

                    if (showSettingsModal) {
                        SettingsModal(
                            viewModel = viewModel,
                            onDismiss = { showSettingsModal = false }
                        )
                    }

                    if (showTikTokModal) {
                        TikTokIntroModal(
                            selectedVoice = selectedVoice,
                            onDismiss = { showTikTokModal = false }
                        )
                    }
                }
            }
        }
    }
}
