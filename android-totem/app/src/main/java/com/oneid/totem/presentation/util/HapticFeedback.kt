package com.oneid.totem.presentation.util

import android.view.HapticFeedbackConstants
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalView

@Composable
fun HapticEffect(trigger: Boolean, feedbackType: Int = HapticFeedbackConstants.CONFIRM) {
    val view = LocalView.current
    LaunchedEffect(trigger) {
        if (trigger) view.performHapticFeedback(feedbackType)
    }
}
