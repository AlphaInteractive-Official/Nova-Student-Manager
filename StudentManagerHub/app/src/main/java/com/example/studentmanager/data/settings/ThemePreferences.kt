package com.example.studentmanager.data.settings

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.example.studentmanager.domain.model.ThemeMode
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.settingsDataStore: DataStore<Preferences> by preferencesDataStore(
    name = "app_settings"
)

/**
 * Single source of truth for user preferences. Stage 7 adds notification
 * preferences to the same DataStore file.
 */
class ThemePreferences(private val context: Context) {

    private val themeModeKey = stringPreferencesKey(KEY_THEME_MODE)

    val themeMode: Flow<ThemeMode> = context.settingsDataStore.data
        .map { prefs -> ThemeMode.fromStorageKey(prefs[themeModeKey]) }

    suspend fun setThemeMode(mode: ThemeMode) {
        context.settingsDataStore.edit { prefs ->
            prefs[themeModeKey] = mode.storageKey
        }
    }

    private companion object {
        const val KEY_THEME_MODE = "theme_mode"
    }
}
