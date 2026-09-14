package com.example.studentmanager.ui.schedule

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.example.studentmanager.ui.components.PlaceholderScreen

@Composable
fun ScheduleScreen(modifier: Modifier = Modifier) {
    PlaceholderScreen(
        modifier = modifier,
        icon = Icons.Default.DateRange,
        title = "Class Schedule",
        description = "Plan one-off and recurring classes, with reminders that fire even when the app is closed.",
        stageLabel = "Coming in Stage 6–8",
        plannedFeatures = listOf(
            "Schedule a class for one or several students",
            "Start time, duration, subject and notes",
            "Recurring patterns: weekdays, custom day sets, start/end dates",
            "Google Meet, Zoom, Teams or a custom meeting URL",
            "Reminder 5 / 10 / 15 / 30 minutes before, or at class time",
            "Notification action that opens the saved meeting link",
            "Alarms restored automatically after a device reboot"
        )
    )
}
