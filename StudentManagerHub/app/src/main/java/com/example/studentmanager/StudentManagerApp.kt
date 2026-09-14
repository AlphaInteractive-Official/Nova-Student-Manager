package com.example.studentmanager

import android.app.Application
import com.example.studentmanager.di.AppContainer

class StudentManagerApp : Application() {

    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
