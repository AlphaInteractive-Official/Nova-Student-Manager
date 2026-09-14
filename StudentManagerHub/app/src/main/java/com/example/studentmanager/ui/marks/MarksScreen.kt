package com.example.studentmanager.ui.marks

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.example.studentmanager.ui.components.PlaceholderScreen

@Composable
fun MarksScreen(modifier: Modifier = Modifier) {
    PlaceholderScreen(
        modifier = modifier,
        icon = Icons.Default.Star,
        title = "Marks & Results",
        description = "Record every test, unit exam and final, and see percentages calculated automatically.",
        stageLabel = "Coming in Stage 5",
        plannedFeatures = listOf(
            "Subjects with optional max marks, colour and active status",
            "Multiple exams per subject per student",
            "Automatic percentage from obtained / maximum marks",
            "Subject, exam and overall percentages",
            "Marks dashboard: average, highest, lowest, subject-wise performance",
            "Performance trend charts across exams"
        )
    )
}
