package com.example.studentmanager.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.example.studentmanager.ui.attendance.AttendanceScreen
import com.example.studentmanager.ui.calculator.PercentageCalculatorScreen
import com.example.studentmanager.ui.dashboard.DashboardScreen
import com.example.studentmanager.ui.marks.MarksScreen
import com.example.studentmanager.ui.reports.ReportsScreen
import com.example.studentmanager.ui.schedule.ScheduleScreen
import com.example.studentmanager.ui.settings.SettingsScreen
import com.example.studentmanager.ui.students.StudentRegistryScreen

@Composable
fun StudentManagerNavHost(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = Routes.DASHBOARD,
        modifier = modifier
    ) {
        composable(Routes.DASHBOARD) {
            DashboardScreen(onNavigateToRoute = navController::navigateTo)
        }
        composable(Routes.REGISTRY) {
            StudentRegistryScreen()
        }
        composable(Routes.ATTENDANCE) {
            AttendanceScreen()
        }
        composable(Routes.MARKS) {
            MarksScreen()
        }
        composable(Routes.SCHEDULE) {
            ScheduleScreen()
        }
        composable(Routes.SETTINGS) {
            SettingsScreen()
        }
        composable(Routes.CALCULATOR) {
            PercentageCalculatorScreen()
        }
        composable(Routes.REPORTS) {
            ReportsScreen()
        }
    }
}
