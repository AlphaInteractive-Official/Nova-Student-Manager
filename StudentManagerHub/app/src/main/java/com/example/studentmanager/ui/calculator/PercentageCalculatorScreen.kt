package com.example.studentmanager.ui.calculator

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.example.studentmanager.ui.components.PlaceholderScreen

@Composable
fun PercentageCalculatorScreen(modifier: Modifier = Modifier) {
    PlaceholderScreen(
        modifier = modifier,
        icon = Icons.Default.Build,
        title = "Percentage Calculator",
        description = "A standalone tool for quick percentage maths, independent of the student database.",
        stageLabel = "Coming in Stage 9",
        plannedFeatures = listOf(
            "Marks percentage: obtained ÷ maximum × 100",
            "Marks required to reach a target percentage",
            "Percentage increase and decrease",
            "Average of several percentages",
            "Instant results as you type"
        )
    )
}
