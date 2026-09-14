package com.example.studentmanager.ui.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.studentmanager.R
import com.example.studentmanager.di.AppViewModelProvider
import com.example.studentmanager.ui.components.AppCard
import com.example.studentmanager.ui.components.EmptyState
import com.example.studentmanager.ui.components.QuickActionCard
import com.example.studentmanager.ui.components.SectionHeader
import com.example.studentmanager.ui.components.StatCard
import com.example.studentmanager.ui.navigation.Routes
import com.example.studentmanager.ui.theme.AppTheme
import com.example.studentmanager.util.formatPercentage

@Composable
fun DashboardScreen(
    onNavigateToRoute: (String) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: DashboardViewModel = viewModel(factory = AppViewModelProvider.Factory)
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    DashboardContent(
        uiState = uiState,
        onNavigateToRoute = onNavigateToRoute,
        modifier = modifier
    )
}

@Composable
private fun DashboardContent(
    uiState: DashboardUiState,
    onNavigateToRoute: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 28.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // ---------------------------------------------------- Quick actions --
        item(key = "quick_actions") {
            Column {
                SectionHeader(title = stringResource(R.string.dashboard_quick_actions))
                Spacer(Modifier.height(10.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    item {
                        QuickActionCard(
                            icon = Icons.Default.Add,
                            label = stringResource(R.string.quick_add_student),
                            onClick = { onNavigateToRoute(Routes.REGISTRY) }
                        )
                    }
                    item {
                        QuickActionCard(
                            icon = Icons.Default.CheckCircle,
                            label = stringResource(R.string.quick_mark_attendance),
                            onClick = { onNavigateToRoute(Routes.ATTENDANCE) }
                        )
                    }
                    item {
                        QuickActionCard(
                            icon = Icons.Default.Star,
                            label = stringResource(R.string.quick_add_marks),
                            onClick = { onNavigateToRoute(Routes.MARKS) }
                        )
                    }
                    item {
                        QuickActionCard(
                            icon = Icons.Default.DateRange,
                            label = stringResource(R.string.quick_schedule_class),
                            onClick = { onNavigateToRoute(Routes.SCHEDULE) }
                        )
                    }
                    item {
                        QuickActionCard(
                            icon = Icons.Default.Build,
                            label = stringResource(R.string.quick_calculator),
                            onClick = { onNavigateToRoute(Routes.CALCULATOR) }
                        )
                    }
                }
            }
        }

        // -------------------------------------------------------- Overview --
        item(key = "overview") {
            Column {
                SectionHeader(title = stringResource(R.string.dashboard_overview))
                Spacer(Modifier.height(10.dp))

                StatRow {
                    StatCard(
                        label = stringResource(R.string.dashboard_stat_total_students),
                        value = uiState.totalStudents.toString(),
                        icon = Icons.Default.Person,
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                    )
                    StatCard(
                        label = stringResource(R.string.dashboard_stat_attendance_today),
                        value = formatPercentage(uiState.todayAttendancePercentage),
                        icon = Icons.Default.CheckCircle,
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                    )
                }
                Spacer(Modifier.height(12.dp))
                StatRow {
                    StatCard(
                        label = stringResource(R.string.dashboard_stat_present),
                        value = uiState.presentToday.toString(),
                        icon = Icons.Default.CheckCircle,
                        accentColor = AppTheme.statusColors.present,
                        accentContainer = AppTheme.statusColors.presentContainer,
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                    )
                    StatCard(
                        label = stringResource(R.string.dashboard_stat_absent),
                        value = uiState.absentToday.toString(),
                        icon = Icons.Default.Clear,
                        accentColor = AppTheme.statusColors.absent,
                        accentContainer = AppTheme.statusColors.absentContainer,
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                    )
                }
                Spacer(Modifier.height(12.dp))
                StatRow {
                    StatCard(
                        label = stringResource(R.string.dashboard_stat_average_marks),
                        value = formatPercentage(uiState.averagePercentage),
                        icon = Icons.Default.Star,
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                    )
                    StatCard(
                        label = stringResource(R.string.dashboard_stat_classes_today),
                        value = uiState.classesToday.toString(),
                        icon = Icons.Default.DateRange,
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                    )
                }
            }
        }

        // ------------------------------------------------- Upcoming classes --
        item(key = "upcoming_classes") {
            Column {
                SectionHeader(
                    title = stringResource(R.string.dashboard_upcoming_classes),
                    actionLabel = stringResource(R.string.nav_schedule),
                    onActionClick = { onNavigateToRoute(Routes.SCHEDULE) }
                )
                Spacer(Modifier.height(10.dp))
                AppCard(modifier = Modifier.fillMaxWidth()) {
                    if (uiState.upcomingClasses.isEmpty()) {
                        EmptyState(
                            icon = Icons.Default.DateRange,
                            title = stringResource(R.string.empty_no_classes),
                            message = stringResource(R.string.empty_no_classes_desc)
                        )
                    } else {
                        uiState.upcomingClasses.forEach { item ->
                            Text(
                                text = "${item.subjectName} — ${item.studentName}",
                                style = MaterialTheme.typography.bodyLarge
                            )
                            Text(
                                text = item.timeLabel,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(Modifier.height(8.dp))
                        }
                    }
                }
            }
        }

        // ------------------------------------------------------ Recent list --
        item(key = "recent_students") {
            Column {
                SectionHeader(
                    title = stringResource(R.string.dashboard_recent_students),
                    actionLabel = stringResource(R.string.nav_registry),
                    onActionClick = { onNavigateToRoute(Routes.REGISTRY) }
                )
                Spacer(Modifier.height(10.dp))
                AppCard(modifier = Modifier.fillMaxWidth()) {
                    if (uiState.recentStudents.isEmpty()) {
                        EmptyState(
                            icon = Icons.Default.Person,
                            title = stringResource(R.string.empty_no_students),
                            message = stringResource(R.string.empty_no_students_desc)
                        )
                    } else {
                        uiState.recentStudents.forEach { student -> StudentRow(student) }
                    }
                }
            }
        }

        item(key = "needs_attention") {
            Column {
                SectionHeader(title = stringResource(R.string.dashboard_needs_attention))
                Spacer(Modifier.height(10.dp))
                AppCard(modifier = Modifier.fillMaxWidth()) {
                    if (uiState.studentsNeedingAttention.isEmpty()) {
                        EmptyState(
                            icon = Icons.Default.Warning,
                            title = stringResource(R.string.empty_no_data),
                            message = stringResource(R.string.empty_no_data_desc)
                        )
                    } else {
                        uiState.studentsNeedingAttention.forEach { student -> StudentRow(student) }
                    }
                }
            }
        }
    }
}

/** Equal-height pair of stat cards, sized to the tallest child. */
@Composable
private fun StatRow(content: @Composable androidx.compose.foundation.layout.RowScope.() -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(IntrinsicSize.Min),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        content = content
    )
}

@Composable
private fun StudentRow(student: StudentSummaryItem) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = student.name,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = student.subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        student.trailingLabel?.let { label ->
            Text(
                text = label,
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}
