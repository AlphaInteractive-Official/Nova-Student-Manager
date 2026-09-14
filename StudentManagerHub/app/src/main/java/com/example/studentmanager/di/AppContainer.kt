package com.example.studentmanager.di

import android.content.Context
import com.example.studentmanager.data.AppDatabase
import com.example.studentmanager.data.settings.ThemePreferences
import com.example.studentmanager.data.student.StudentRepository

/**
 * Manual dependency container.
 *
 * Holds application-scoped singletons. The UI layer picks them up through
 * [AppViewModelProvider] without knowing about Room or DataStore directly.
 */
class AppContainer(context: Context) {

    private val appContext: Context = context.applicationContext

    val themePreferences: ThemePreferences = ThemePreferences(appContext)

    // ------------------------------------------------------------------ DB --

    private val database: AppDatabase = AppDatabase.getInstance(appContext)

    val studentRepository: StudentRepository = StudentRepository(database.studentDao())
}
