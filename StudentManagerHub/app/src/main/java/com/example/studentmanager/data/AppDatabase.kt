package com.example.studentmanager.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.studentmanager.data.student.Student
import com.example.studentmanager.data.student.StudentDao

/**
 * Single Room database for the app.
 *
 * Access via [AppDatabase.getInstance] — the companion object guarantees a
 * single shared instance across the whole process.
 */
@Database(
    entities = [Student::class],
    version = 1,
    exportSchema = false          // set to true if you add migrations later
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun studentDao(): StudentDao

    companion object {

        @Volatile
        private var instance: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "student_manager.db"
                )
                    .fallbackToDestructiveMigration()   // safe during early development
                    .build()
                    .also { instance = it }
            }
    }
}
