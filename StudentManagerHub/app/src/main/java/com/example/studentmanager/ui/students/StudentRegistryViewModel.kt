package com.example.studentmanager.ui.students

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.studentmanager.data.student.Student
import com.example.studentmanager.data.student.StudentRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

/** UI state for the student registry screen. */
data class StudentRegistryUiState(
    val students: List<Student> = emptyList(),
    val searchQuery: String = "",
    val isLoading: Boolean = false
)

@OptIn(ExperimentalCoroutinesApi::class)
class StudentRegistryViewModel(
    private val repository: StudentRepository
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    /**
     * Reactive student list that re-queries whenever the search text changes.
     * Returns all students when query is blank.
     */
    val students: StateFlow<List<Student>> = _searchQuery
        .flatMapLatest { query -> repository.search(query) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList()
        )

    // ---------------------------------------------------------------- Actions

    fun onSearchQueryChange(query: String) {
        _searchQuery.value = query
    }

    fun clearSearch() {
        _searchQuery.value = ""
    }

    /**
     * Adds a new student. Trims all text fields; name must be non-blank.
     * Returns true on success, false if name is empty.
     */
    fun addStudent(
        name: String,
        phone: String,
        className: String,
        school: String,
        notes: String
    ): Boolean {
        val trimmedName = name.trim()
        if (trimmedName.isBlank()) return false

        viewModelScope.launch {
            repository.addStudent(
                Student(
                    name = trimmedName,
                    phone = phone.trim(),
                    className = className.trim(),
                    school = school.trim(),
                    notes = notes.trim()
                )
            )
        }
        return true
    }

    /** Permanently deletes the given student. */
    fun deleteStudent(student: Student) {
        viewModelScope.launch { repository.deleteStudent(student) }
    }
}
