package com.example.studentmanager.data.student

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * A single student record stored in the local Room database.
 *
 * Only [name] is required; every other field is optional so tutors can
 * add a student quickly and fill in details later.
 */
@Entity(tableName = "students")
data class Student(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    /** Display name — the only mandatory field. */
    val name: String,

    /** Contact phone number (optional). */
    val phone: String = "",

    /** Class / grade label, e.g. "10-A" (optional). */
    val className: String = "",

    /** School or institution name (optional). */
    val school: String = "",

    /** Free-form notes about the student (optional). */
    val notes: String = "",

    /** Unix epoch milliseconds when the record was first created. */
    val createdAt: Long = System.currentTimeMillis()
)
