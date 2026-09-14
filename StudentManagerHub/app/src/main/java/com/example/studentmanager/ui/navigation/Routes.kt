package com.example.studentmanager.ui.navigation

import androidx.annotation.StringRes
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.ui.graphics.vector.ImageVector
import com.example.studentmanager.R

object Routes {
    const val DASHBOARD = "dashboard"
    const val REGISTRY = "registry"
    const val ATTENDANCE = "attendance"
    const val MARKS = "marks"
    const val SCHEDULE = "schedule"
    const val SETTINGS = "settings"
    const val CALCULATOR = "calculator"
    const val REPORTS = "reports"
}

/**
 * Destinations shown in the bottom bar / navigation rail. Everything else
 * (Settings, Reports, Calculator) is a secondary screen reached from the
 * dashboard or the top app bar.
 */
enum class TopLevelDestination(
    val route: String,
    @StringRes val labelRes: Int,
    val icon: ImageVector
) {
    DASHBOARD(Routes.DASHBOARD, R.string.nav_dashboard, Icons.Default.Home),
    REGISTRY(Routes.REGISTRY, R.string.nav_registry, Icons.Default.Person),
    ATTENDANCE(Routes.ATTENDANCE, R.string.nav_attendance, Icons.Default.CheckCircle),
    MARKS(Routes.MARKS, R.string.nav_marks, Icons.Default.Star),
    SCHEDULE(Routes.SCHEDULE, R.string.nav_schedule, Icons.Default.DateRange);

    companion object {
        fun fromRoute(route: String?): TopLevelDestination? =
            entries.firstOrNull { it.route == route }
    }
}

@StringRes
fun titleResForRoute(route: String?): Int = when (route) {
    Routes.DASHBOARD -> R.string.nav_dashboard
    Routes.REGISTRY -> R.string.nav_registry
    Routes.ATTENDANCE -> R.string.nav_attendance
    Routes.MARKS -> R.string.nav_marks
    Routes.SCHEDULE -> R.string.nav_schedule
    Routes.SETTINGS -> R.string.nav_settings
    Routes.CALCULATOR -> R.string.title_calculator
    Routes.REPORTS -> R.string.title_reports
    else -> R.string.app_name
}
