package com.jarvis.mahi.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
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
fun MobilePhoneHUD(
    viewModel: MahiViewModel,
    onOpenSettings: () -> Unit,
    onOpenTikTokIntro: () -> Unit
) {
    val sessionState by viewModel.sessionState.collectAsState()
    val isMuted by viewModel.isMuted.collectAsState()
    val activeEmotion by viewModel.activeEmotion.collectAsState()
    val calcInput by viewModel.calcInput.collectAsState()
    val calcResult by viewModel.calcResult.collectAsState()

    var currentTab by remember { mutableStateOf("home") }

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

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF020206)),
        contentAlignment = Alignment.Center
    ) {
        // Mockup Smartphone Frame Container
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
                .padding(4.dp)
                .border(6.dp, Color(0xFF18181B), RoundedCornerShape(36.dp)),
            shape = RoundedCornerShape(36.dp),
            color = Color(0xFF05050C)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Top Status Bar Mockup
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(32.dp)
                        .background(Color(0x66000000))
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "8:49 AM (NPT)",
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text("Sakraul", color = Color(0xFF06B6D4), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Icon(imageVector = Icons.Default.Wifi, contentDescription = null, tint = Color.White, modifier = Modifier.size(12.dp))
                        Icon(imageVector = Icons.Default.BatteryFull, contentDescription = null, tint = Color.White, modifier = Modifier.size(12.dp))
                    }
                }

                // Top Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "JARVIS • MAHI",
                            color = Color.White,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 16.sp
                        )
                        Text(
                            text = "SAKRAUL, NEPAL 🇳🇵",
                            color = Color(0xFF06B6D4),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = onOpenTikTokIntro,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF2D78)),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(imageVector = Icons.Default.VideoLibrary, contentDescription = null, tint = Color.White, modifier = Modifier.size(12.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("TikTok Intro", fontSize = 10.sp, color = Color.White, fontWeight = FontWeight.Bold)
                        }

                        IconButton(
                            onClick = { viewModel.toggleViewMode() },
                            modifier = Modifier
                                .size(32.dp)
                                .background(Color(0x3306B6D4), RoundedCornerShape(10.dp))
                        ) {
                            Icon(imageVector = Icons.Default.Monitor, contentDescription = "Switch View", tint = Color(0xFF06B6D4), modifier = Modifier.size(16.dp))
                        }

                        IconButton(
                            onClick = onOpenSettings,
                            modifier = Modifier
                                .size(32.dp)
                                .background(Color(0x33FFFFFF), RoundedCornerShape(10.dp))
                        ) {
                            Icon(imageVector = Icons.Default.Settings, contentDescription = "Settings", tint = Color.White, modifier = Modifier.size(16.dp))
                        }
                    }
                }

                // Main Content View
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp)
                ) {
                    when (currentTab) {
                        "chat" -> ChatModule(viewModel = viewModel)
                        "missions" -> MissionsModule(viewModel = viewModel)
                        "tools" -> {
                            Surface(
                                shape = RoundedCornerShape(24.dp),
                                color = Color(0xDC090D16),
                                modifier = Modifier
                                    .fillMaxSize()
                                    .border(1.dp, Color(0x4D06B6D4), RoundedCornerShape(24.dp))
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text("Device Calculator & Helpers", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Spacer(modifier = Modifier.height(12.dp))
                                    OutlinedTextField(
                                        value = calcInput,
                                        onValueChange = { viewModel.updateCalcInput(it) },
                                        label = { Text("Expression (e.g. 25 * 4)", color = Color(0xFF06B6D4)) },
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Button(
                                        onClick = { viewModel.evaluateCalc() },
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF06B6D4))
                                    ) {
                                        Text("Calculate", color = Color.White)
                                    }
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Surface(
                                        shape = RoundedCornerShape(12.dp),
                                        color = Color(0x660F172A),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .border(1.dp, Color(0x3306B6D4), RoundedCornerShape(12.dp))
                                    ) {
                                        Text("Result: $calcResult", color = Color(0xFF38BDF8), fontWeight = FontWeight.Bold, modifier = Modifier.padding(14.dp))
                                    }
                                }
                            }
                        }
                        else -> {
                            // Home Tab
                            Column(
                                modifier = Modifier.fillMaxSize(),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                // Avatar Display Card
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(180.dp)
                                        .clip(RoundedCornerShape(24.dp))
                                        .border(2.dp, Color(0x6606B6D4), RoundedCornerShape(24.dp))
                                        .scale(if (sessionState == SessionState.SPEAKING) pulseScale else 1f)
                                ) {
                                    Image(
                                        painter = painterResource(id = R.drawable.mahi_avatar),
                                        contentDescription = "Mahi Avatar",
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
                                    Box(
                                        modifier = Modifier
                                            .padding(10.dp)
                                            .background(Color(0x99000000), RoundedCornerShape(10.dp))
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                            .align(Alignment.TopStart)
                                    ) {
                                        Text("MAHI AI • Sakraul Companion", color = Color(0xFF38BDF8), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                    }
                                }

                                // Sakraul Weather & Festival Card
                                Surface(
                                    shape = RoundedCornerShape(16.dp),
                                    color = Color(0x661E293B),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .border(1.dp, Color(0x3306B6D4), RoundedCornerShape(16.dp))
                                        .clickable {
                                            viewModel.handleTriggerPrompt("JARVIS, check Sakraul weather and upcoming Nepali festivals for Sanam.")
                                        }
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(imageVector = Icons.Default.WbSunny, contentDescription = null, tint = Color(0xFF06B6D4), modifier = Modifier.size(24.dp))
                                            Spacer(modifier = Modifier.width(10.dp))
                                            Column {
                                                Text("Sakraul, Sarlahi Weather & Festivals", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                                Text("\"जय श्री राम, Sanam! Apna khayal rakhna ❤️\"", color = Color(0xFFCBD5E1), fontSize = 10.sp)
                                            }
                                        }
                                        Icon(imageVector = Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = Color(0xFF06B6D4), modifier = Modifier.size(16.dp))
                                    }
                                }

                                // 4 Card Grid
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                    Surface(
                                        shape = RoundedCornerShape(16.dp),
                                        color = Color(0x661E293B),
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(68.dp)
                                            .clickable { currentTab = "chat" }
                                    ) {
                                        Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.SpaceBetween) {
                                            Icon(imageVector = Icons.Default.Chat, contentDescription = null, tint = Color(0xFF06B6D4), modifier = Modifier.size(18.dp))
                                            Text("Chat", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                        }
                                    }

                                    Surface(
                                        shape = RoundedCornerShape(16.dp),
                                        color = Color(0x661E293B),
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(68.dp)
                                            .clickable { currentTab = "missions" }
                                    ) {
                                        Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.SpaceBetween) {
                                            Icon(imageVector = Icons.Default.Task, contentDescription = null, tint = Color(0xFFA855F7), modifier = Modifier.size(18.dp))
                                            Text("Missions", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                        }
                                    }
                                }

                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                    Surface(
                                        shape = RoundedCornerShape(16.dp),
                                        color = Color(0x661E293B),
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(68.dp)
                                            .clickable { currentTab = "tools" }
                                    ) {
                                        Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.SpaceBetween) {
                                            Icon(imageVector = Icons.Default.Calculate, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(18.dp))
                                            Text("Tools", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                        }
                                    }

                                    Surface(
                                        shape = RoundedCornerShape(16.dp),
                                        color = Color(0x661E293B),
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(68.dp)
                                            .clickable {
                                                viewModel.handleTriggerPrompt("JARVIS, give me Sakraul weather update.")
                                            }
                                    ) {
                                        Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.SpaceBetween) {
                                            Icon(imageVector = Icons.Default.Cloud, contentDescription = null, tint = Color(0xFF14B8A6), modifier = Modifier.size(18.dp))
                                            Text("Weather", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                        }
                                    }
                                }

                                // Emotional Tone Selector Pills
                                LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    items(EmotionalTone.entries) { emo ->
                                        val isSel = activeEmotion == emo
                                        Surface(
                                            shape = RoundedCornerShape(20.dp),
                                            color = if (isSel) Color(0xFF06B6D4) else Color(0x33FFFFFF),
                                            modifier = Modifier.clickable {
                                                viewModel.setEmotion(emo)
                                                viewModel.handleTriggerPrompt(emo.prompt)
                                            }
                                        ) {
                                            Text(
                                                text = emo.label,
                                                color = Color.White,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Medium,
                                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Central Mic Control Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xCC000000))
                        .padding(horizontal = 24.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { currentTab = "chat" }) {
                        Icon(imageVector = Icons.Default.Chat, contentDescription = "Type", tint = Color.White)
                    }

                    // Main Glowing Mic Button
                    Box(
                        modifier = Modifier
                            .size(64.dp)
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
                            modifier = Modifier.size(28.dp)
                        )
                    }

                    IconButton(onClick = { viewModel.toggleMute() }) {
                        Icon(
                            imageVector = if (isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                            contentDescription = "Mute",
                            tint = if (isMuted) Color(0xFFF59E0B) else Color.White
                        )
                    }
                }

                // Bottom Dock Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .background(Color(0xFF000000)),
                    horizontalArrangement = Arrangement.SpaceAround,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { currentTab = "home" }) {
                        Icon(imageVector = Icons.Default.Home, contentDescription = "Home", tint = if (currentTab == "home") Color(0xFF06B6D4) else Color(0xFF64748B))
                    }
                    IconButton(onClick = { currentTab = "chat" }) {
                        Icon(imageVector = Icons.Default.Chat, contentDescription = "Chat", tint = if (currentTab == "chat") Color(0xFF06B6D4) else Color(0xFF64748B))
                    }
                    IconButton(onClick = { currentTab = "missions" }) {
                        Icon(imageVector = Icons.Default.Task, contentDescription = "Missions", tint = if (currentTab == "missions") Color(0xFF06B6D4) else Color(0xFF64748B))
                    }
                    IconButton(onClick = onOpenSettings) {
                        Icon(imageVector = Icons.Default.Settings, contentDescription = "Settings", tint = Color(0xFF64748B))
                    }
                }
            }
        }
    }
}
