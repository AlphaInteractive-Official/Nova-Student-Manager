package com.example.studentmanager.ui.reports

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.List
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.example.studentmanager.ui.components.PlaceholderScreen

@Composable
fun ReportsScreen(modifier: Modifier = Modifier) {
    PlaceholderScreen(
        modifier = modifier,
        icon = Icons.Default.List,
        title = "Reports",
        description = "Attendance and marks reports filtered by student, date range, month, year or subject.",
        stageLabel = "Coming in Stage 10",
        plannedFeatures = listOf(
            "Attendance report: total classes, present, absent, leave, percentage",
            "Marks report: per student, per subject, per exam, with averages",
            "Filter by student, month, year or subject",
            "Architecture ready for PDF and CSV export"
        )
    )
}
