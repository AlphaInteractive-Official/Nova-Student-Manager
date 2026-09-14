package com.example.studentmanager.data.student

import kotlinx.coroutines.flow.Flow

/**
 * Repository that owns all student data access.
 *
 * The UI layer depends on this interface, not on [StudentDao] directly, which
 * keeps ViewModels testable and makes it easy to swap the data source later.
 */
class StudentRepository(private val dao: StudentDao) {

    /** Reactive list of all students, newest first. */
    val allStudents: Flow<List<Student>> = dao.getAll()

    /** Total student count as a reactive stream. */
    val studentCount: Flow<Int> = dao.count()

    /**
     * Live search across name, phone, class and school.
     * Returns the full list when [query] is blank.
     */
    fun search(query: String): Flow<List<Student>> =
        if (query.isBlank()) dao.getAll() else dao.search(query.trim())

    /** Inserts [student] and returns the new row id. */
    suspend fun addStudent(student: Student): Long = dao.insert(student)

    /** Saves any field changes to an existing student. */
    suspend fun updateStudent(student: Student) = dao.update(student)

    /** Permanently removes a student record. */
    suspend fun deleteStudent(student: Student) = dao.delete(student)

    /** Looks up a single student or returns null. */
    suspend fun getById(id: Long): Student? = dao.getById(id)
}
