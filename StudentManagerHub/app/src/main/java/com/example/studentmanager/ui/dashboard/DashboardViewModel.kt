package com.example.studentmanager.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.studentmanager.data.student.StudentRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn

class DashboardViewModel(
    private val studentRepository: StudentRepository
) : ViewModel() {

    /**
     * Merges student count + recent list into a single UI snapshot.
     * Auto-updates whenever the database changes.
     */
    val uiState = combine(
        studentRepository.studentCount,
        studentRepository.allStudents
    ) { count, students ->
        DashboardUiState(
            isLoading = false,
            totalStudents = count,
            recentStudents = students.take(5).map { s ->
                StudentSummaryItem(
                    id = s.id,
                    name = s.name,
                    subtitle = listOfNotNull(
                        s.className.takeIf { it.isNotBlank() },
                        s.school.takeIf { it.isNotBlank() }
                    ).joinToString(" · ").ifBlank { "No class info" }
                )
            }
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = DashboardUiState(isLoading = true)
    )
}

