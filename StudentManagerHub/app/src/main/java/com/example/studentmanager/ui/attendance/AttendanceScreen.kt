package com.example.studentmanager.ui.attendance

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.example.studentmanager.ui.components.PlaceholderScreen

@Composable
fun AttendanceScreen(modifier: Modifier = Modifier) {
    PlaceholderScreen(
        modifier = modifier,
        icon = Icons.Default.CheckCircle,
        title = "Attendance",
        description = "Mark a whole class in one pass and review attendance by day, month and year.",
        stageLabel = "Coming in Stage 4",
        plannedFeatures = listOf(
            "Mark Present / Absent / Leave for many students at once",
            "One tap Save with duplicate protection per student + session",
            "Day view for any selected date",
            "Month view with per-student totals and a calendar grid",
            "Year view with monthly percentages and charts",
            "Configurable rules for how Leave counts toward the percentage"
        )
    )
}
