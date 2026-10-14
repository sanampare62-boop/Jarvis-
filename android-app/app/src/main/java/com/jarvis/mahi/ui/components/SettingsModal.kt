package com.jarvis.mahi.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.jarvis.mahi.ui.MahiViewModel

@Composable
fun SettingsModal(
    viewModel: MahiViewModel,
    onDismiss: () -> Unit
) {
    val selectedVoice by viewModel.selectedVoice.collectAsState()
    val speakingSpeed by viewModel.speakingSpeed.collectAsState()
    val expressiveness by viewModel.expressiveness.collectAsState()
    val emotionalIntensity by viewModel.emotionalIntensity.collectAsState()
    val apiKey by viewModel.geminiApiKey.collectAsState()

    var apiKeyInput by remember { mutableStateOf(apiKey) }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color(0xFA090D16),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, Color(0xFF06B6D4), RoundedCornerShape(24.dp))
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .background(Color(0x3306B6D4), RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Tune,
                                contentDescription = null,
                                tint = Color(0xFF06B6D4),
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Voice Engine Controls",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                text = "Customize JARVIS parameters",
                                color = Color(0xFF06B6D4),
                                fontSize = 11.sp
                            )
                        }
                    }

                    IconButton(onClick = onDismiss) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Color.White)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Speaking Speed
                Text(
                    text = "Speaking Speed: ${String.format("%.1f", speakingSpeed)}x",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Slider(
                    value = speakingSpeed,
                    onValueChange = { viewModel.setSpeakingSpeed(it) },
                    valueRange = 0.7f..1.4f,
                    colors = SliderDefaults.colors(thumbColor = Color(0xFF06B6D4), activeTrackColor = Color(0xFF06B6D4))
                )

                // Expressiveness
                Text(
                    text = "Expressiveness: ${(expressiveness * 100).toInt()}%",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Slider(
                    value = expressiveness,
                    onValueChange = { viewModel.setExpressiveness(it) },
                    valueRange = 0.5f..1.0f,
                    colors = SliderDefaults.colors(thumbColor = Color(0xFF06B6D4), activeTrackColor = Color(0xFF06B6D4))
                )

                // Emotional Intensity
                Text(
                    text = "Emotional Intensity: ${(emotionalIntensity * 100).toInt()}%",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Slider(
                    value = emotionalIntensity,
                    onValueChange = { viewModel.setEmotionalIntensity(it) },
                    valueRange = 0.5f..1.2f,
                    colors = SliderDefaults.colors(thumbColor = Color(0xFF06B6D4), activeTrackColor = Color(0xFF06B6D4))
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Voice Personas
                Text("Voice Persona:", color = Color(0xFF94A3B8), fontSize = 11.sp)
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("Aoede", "Kore", "Zephyr", "Charon").forEach { voice ->
                        val isSelected = selectedVoice == voice
                        Button(
                            onClick = { viewModel.setSelectedVoice(voice) },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isSelected) Color(0x3306B6D4) else Color(0x33FFFFFF)
                            ),
                            border = if (isSelected) androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF06B6D4)) else null,
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(2.dp)
                        ) {
                            Text(voice, fontSize = 10.sp, color = if (isSelected) Color(0xFF38BDF8) else Color.White)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // API Key Placeholder Input
                OutlinedTextField(
                    value = apiKeyInput,
                    onValueChange = {
                        apiKeyInput = it
                        viewModel.setGeminiApiKey(it)
                    },
                    placeholder = { Text("Gemini API Key (Optional)", fontSize = 11.sp, color = Color(0xFF64748B)) },
                    label = { Text("Gemini API Key", fontSize = 11.sp, color = Color(0xFF06B6D4)) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFF06B6D4),
                        unfocusedBorderColor = Color(0x33FFFFFF),
                        focusedContainerColor = Color(0x66000000),
                        unfocusedContainerColor = Color(0x66000000),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF06B6D4)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Apply Settings", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
