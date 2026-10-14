package com.jarvis.mahi.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jarvis.mahi.R
import com.jarvis.mahi.data.EmotionalTone
import com.jarvis.mahi.data.SessionState
import com.jarvis.mahi.ui.MahiViewModel
import com.jarvis.mahi.ui.components.ChatModule
import com.jarvis.mahi.ui.components.MissionsModule

@Composable
fun MahiCharacterHUD(
    viewModel: MahiViewModel,
    onOpenSettings: () -> Unit,
    onOpenTikTokIntro: () -> Unit
) {
    val sessionState by viewModel.sessionState.collectAsState()
    val isMuted by viewModel.isMuted.collectAsState()
    val activeEmotion by viewModel.activeEmotion.collectAsState()
    val selectedVoice by viewModel.selectedVoice.collectAsState()

    var activeTab by remember { mutableStateOf("Voice Engine") }

    val isLive = sessionState != SessionState.DISCONNECTED

    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF05050C))
    ) {
        // Top Cyber Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(
                            brush = Brush.linearGradient(listOf(Color(0xFF06B6D4), Color(0xFF2563EB))),
                            shape = RoundedCornerShape(12.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(imageVector = Icons.Default.AutoAwesome, contentDescription = null, tint = Color.White)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "JARVIS • MAHI",
                        color = Color.White,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 18.sp
                    )
                    Text(
                        text = "Ultimate AI Companion v10.0 • Sakraul, Nepal 🇳🇵",
                        color = Color(0xFF06B6D4),
                        fontSize = 10.sp
                    )
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = onOpenTikTokIntro,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF2D78)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(imageVector = Icons.Default.VideoLibrary, contentDescription = null, tint = Color.White)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("TikTok Intro", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }

                Button(
                    onClick = { viewModel.toggleViewMode() },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0x3306B6D4)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF06B6D4)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(imageVector = Icons.Default.Smartphone, contentDescription = null, tint = Color(0xFF38BDF8))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Phone View", color = Color(0xFF38BDF8), fontSize = 12.sp)
                }
            }
        }

        // Main Grid Workspace
        Row(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Left Sidebar Modules Menu
            Surface(
                modifier = Modifier
                    .width(180.dp)
                    .fillMaxHeight()
                    .border(1.dp, Color(0x3306B6D4), RoundedCornerShape(20.dp)),
                shape = RoundedCornerShape(20.dp),
                color = Color(0x99090D16)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = "SYSTEM MODULES",
                        color = Color(0xFF06B6D4),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )

                    listOf(
                        "Chat" to Icons.Default.Chat,
                        "Voice Engine" to Icons.Default.Mic,
                        "Missions" to Icons.Default.Task,
                        "Calculator & Tools" to Icons.Default.Calculate,
                        "Weather" to Icons.Default.WbSunny
                    ).forEach { (name, icon) ->
                        val isSelected = activeTab == name
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (isSelected) Color(0x3306B6D4) else Color.Transparent,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 2.dp)
                                .clickable {
                                    activeTab = name
                                    if (name == "Weather") {
                                        viewModel.handleTriggerPrompt("JARVIS, give me weather updates for Sakraul Sarlahi Nepal.")
                                    }
                                }
                        ) {
                            Row(
                                modifier = Modifier.padding( horizontal = 10.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = icon,
                                    contentDescription = null,
                                    tint = if (isSelected) Color(0xFF06B6D4) else Color(0xFF94A3B8),
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = name,
                                    color = if (isSelected) Color.White else Color(0xFFCBD5E1),
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            }
                        }
                    }
                }
            }

            // Central Stage
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight()
            ) {
                when (activeTab) {
                    "Chat" -> ChatModule(viewModel = viewModel)
                    "Missions" -> MissionsModule(viewModel = viewModel)
                    else -> {
                        // Avatar Voice Stage
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(280.dp, 360.dp)
                                    .clip(RoundedCornerShape(28.dp))
                                    .border(2.dp, Color(0x6606B6D4), RoundedCornerShape(28.dp))
                                    .scale(if (sessionState == SessionState.SPEAKING) pulseScale else 1f)
                            ) {
                                Image(
                                    painter = painterResource(id = R.drawable.mahi_avatar),
                                    contentDescription = "JARVIS Mahi",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(
                                            Brush.verticalGradient(
                                                colors = listOf(Color.Transparent, Color(0xCC05050C))
                                            )
                                        )
                                )
                            }
                        }
                    }
                }
            }

            // Right Panel: Emotional Tones
            Surface(
                modifier = Modifier
                    .width(170.dp)
                    .fillMaxHeight()
                    .border(1.dp, Color(0x3306B6D4), RoundedCornerShape(20.dp)),
                shape = RoundedCornerShape(20.dp),
                color = Color(0x99090D16)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = "EMOTIONAL TONES",
                        color = Color(0xFF06B6D4),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )

                    EmotionalTone.entries.forEach { emo ->
                        val isSel = activeEmotion == emo
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (isSel) Color(0x3306B6D4) else Color.Transparent,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 2.dp)
                                .clickable {
                                    viewModel.setEmotion(emo)
                                    viewModel.handleTriggerPrompt(emo.prompt)
                                }
                        ) {
                            Text(
                                text = emo.label,
                                color = if (isSel) Color(0xFF38BDF8) else Color(0xFFCBD5E1),
                                fontSize = 11.sp,
                                fontWeight = if (isSel) FontWeight.Bold else FontWeight.Normal,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp)
                            )
                        }
                    }
                }
            }
        }

        // Bottom HUD Control Ring
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onOpenSettings) {
                    Icon(imageVector = Icons.Default.Settings, contentDescription = "Settings", tint = Color.White)
                }

                IconButton(onClick = { viewModel.setSelectedVoice(if (selectedVoice == "Aoede") "Kore" else "Aoede") }) {
                    Icon(imageVector = Icons.Default.VolumeUp, contentDescription = "Voice", tint = Color(0xFF06B6D4))
                }

                // Central Mic Button
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .background(
                            brush = Brush.radialGradient(
                                colors = if (isLive) listOf(Color(0xFFFF2D78), Color(0xFFE11D48))
                                else listOf(Color(0xFF06B6D4), Color(0xFF2563EB))
                            ),
                            shape = CircleShape
                        )
                        .clickable { viewModel.toggleSession() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (isLive) Icons.Default.CallEnd else Icons.Default.Mic,
                        contentDescription = "Talk",
                        tint = Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                }

                IconButton(onClick = { activeTab = "Chat" }) {
                    Icon(imageVector = Icons.Default.Chat, contentDescription = "Chat", tint = Color.White)
                }

                IconButton(onClick = { viewModel.toggleMute() }) {
                    Icon(
                        imageVector = if (isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                        contentDescription = "Mute",
                        tint = if (isMuted) Color(0xFFF59E0B) else Color.White
                    )
                }
            }
        }
    }
}
