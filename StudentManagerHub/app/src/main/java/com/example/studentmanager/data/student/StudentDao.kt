package com.example.studentmanager.data.student

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

/**
 * Data Access Object for [Student].
 *
 * All read operations return [Flow] so the UI layer reacts automatically to
 * database changes without any polling.
 */
@Dao
interface StudentDao {

    // ---------------------------------------------------------------- Reads --

    /** Emits the full list, ordered newest-first, whenever it changes. */
    @Query("SELECT * FROM students ORDER BY createdAt DESC")
    fun getAll(): Flow<List<Student>>

    /**
     * Searches name, phone, className and school with a single LIKE query.
     * Emits a new list every time a matching row is inserted / updated / deleted.
     */
    @Query(
        """
        SELECT * FROM students
        WHERE name LIKE '%' || :query || '%'
           OR phone LIKE '%' || :query || '%'
           OR className LIKE '%' || :query || '%'
           OR school LIKE '%' || :query || '%'
        ORDER BY createdAt DESC
        """
    )
    fun search(query: String): Flow<List<Student>>

    /** Returns the total number of students as a reactive stream. */
    @Query("SELECT COUNT(*) FROM students")
    fun count(): Flow<Int>

    /** Returns a single student by primary key, or null if not found. */
    @Query("SELECT * FROM students WHERE id = :id")
    suspend fun getById(id: Long): Student?

    // --------------------------------------------------------------- Writes --

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insert(student: Student): Long

    @Update
    suspend fun update(student: Student)

    @Delete
    suspend fun delete(student: Student)

    @Query("DELETE FROM students WHERE id = :id")
    suspend fun deleteById(id: Long)
}
