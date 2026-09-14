package com.example.studentmanager.di

import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.CreationExtras
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.example.studentmanager.StudentManagerApp
import com.example.studentmanager.ui.dashboard.DashboardViewModel
import com.example.studentmanager.ui.main.MainViewModel
import com.example.studentmanager.ui.settings.SettingsViewModel
import com.example.studentmanager.ui.students.StudentRegistryViewModel

object AppViewModelProvider {

    val Factory = viewModelFactory {
        initializer { MainViewModel(app().container.themePreferences) }
        initializer { SettingsViewModel(app().container.themePreferences) }
        initializer { DashboardViewModel(app().container.studentRepository) }
        initializer { StudentRegistryViewModel(app().container.studentRepository) }
    }
}

private fun CreationExtras.app(): StudentManagerApp =
    this[ViewModelProvider.AndroidViewModelFactory.APPLICATION_KEY] as StudentManagerApp

