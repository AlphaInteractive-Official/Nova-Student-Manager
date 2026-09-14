package com.example.studentmanager.ui.dashboard

/** A row in the "Upcoming classes" list. Populated from Stage 6. */
data class UpcomingClassItem(
    val id: Long,
    val studentName: String,
    val subjectName: String,
    val timeLabel: String,
    val platformLabel: String? = null
)

/** A row in the "Recently added" / "Requires attention" lists. Stage 2+. */
data class StudentSummaryItem(
    val id: Long,
    val name: String,
    val subtitle: String,
    val trailingLabel: String? = null
)

data class DashboardUiState(
    val isLoading: Boolean = false,
    val totalStudents: Int = 0,
    val presentToday: Int = 0,
    val absentToday: Int = 0,
    /** Null when no attendance has been recorded today. */
    val todayAttendancePercentage: Double? = null,
    /** Null when no marks have been recorded yet. */
    val averagePercentage: Double? = null,
    val classesToday: Int = 0,
    val nextClass: UpcomingClassItem? = null,
    val upcomingClasses: List<UpcomingClassItem> = emptyList(),
    val recentStudents: List<StudentSummaryItem> = emptyList(),
    val studentsNeedingAttention: List<StudentSummaryItem> = emptyList()
)
