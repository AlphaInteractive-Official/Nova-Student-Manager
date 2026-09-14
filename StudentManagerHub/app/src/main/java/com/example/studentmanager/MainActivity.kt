package com.example.studentmanager

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.studentmanager.di.AppViewModelProvider
import com.example.studentmanager.ui.StudentManagerHubApp
import com.example.studentmanager.ui.main.MainViewModel
import com.example.studentmanager.ui.theme.StudentManagerHubTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        setContent {
            val mainViewModel: MainViewModel =
                viewModel(factory = AppViewModelProvider.Factory)
            val themeMode by mainViewModel.themeMode.collectAsStateWithLifecycle()

            StudentManagerHubTheme(themeMode = themeMode) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    StudentManagerHubApp()
                }
            }
        }
    }
}
