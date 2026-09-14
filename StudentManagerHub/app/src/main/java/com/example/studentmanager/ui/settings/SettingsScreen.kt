package com.example.studentmanager.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Switch
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.studentmanager.BuildConfig
import com.example.studentmanager.R
import com.example.studentmanager.di.AppViewModelProvider
import com.example.studentmanager.domain.model.ThemeMode
import com.example.studentmanager.ui.components.SettingsRadioRow
import com.example.studentmanager.ui.components.SettingsRow
import com.example.studentmanager.ui.components.SettingsSection

@Composable
fun SettingsScreen(
    modifier: Modifier = Modifier,
    viewModel: SettingsViewModel = viewModel(factory = AppViewModelProvider.Factory)
) {
    val themeMode by viewModel.themeMode.collectAsStateWithLifecycle()

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 4.dp),
        verticalArrangement = Arrangement.spacedBy(22.dp)
    ) {
        // ------------------------------------------------------ Appearance --
        SettingsSection(title = stringResource(R.string.settings_appearance)) {
            SettingsRadioRow(
                title = stringResource(R.string.settings_theme_system),
                subtitle = stringResource(R.string.settings_theme_system_desc),
                selected = themeMode == ThemeMode.SYSTEM,
                onSelect = { viewModel.setThemeMode(ThemeMode.SYSTEM) }
            )
            SettingsRadioRow(
                title = stringResource(R.string.settings_theme_light),
                subtitle = null,
                selected = themeMode == ThemeMode.LIGHT,
                onSelect = { viewModel.setThemeMode(ThemeMode.LIGHT) }
            )
            SettingsRadioRow(
                title = stringResource(R.string.settings_theme_dark),
                subtitle = null,
                selected = themeMode == ThemeMode.DARK,
                onSelect = { viewModel.setThemeMode(ThemeMode.DARK) }
            )
        }

        // --------------------------------------------------- Notifications --
        SettingsSection(title = stringResource(R.string.settings_notifications)) {
            SettingsRow(
                title = stringResource(R.string.settings_notification_enable),
                subtitle = stringResource(R.string.settings_coming_soon),
                icon = Icons.Default.Notifications,
                enabled = false,
                trailing = { Switch(checked = false, onCheckedChange = null, enabled = false) }
            )
            SettingsRow(
                title = stringResource(R.string.settings_notification_reminder),
                subtitle = stringResource(R.string.settings_coming_soon),
                icon = Icons.Default.Refresh,
                enabled = false
            )
            SettingsRow(
                title = stringResource(R.string.settings_notification_sound),
                subtitle = stringResource(R.string.settings_coming_soon),
                icon = Icons.Default.Notifications,
                enabled = false
            )
            SettingsRow(
                title = stringResource(R.string.settings_notification_vibration),
                subtitle = stringResource(R.string.settings_coming_soon),
                icon = Icons.Default.Notifications,
                enabled = false
            )
        }

        // ------------------------------------------------------------ Data --
        SettingsSection(title = stringResource(R.string.settings_data)) {
            SettingsRow(
                title = stringResource(R.string.settings_data_backup),
                subtitle = stringResource(R.string.settings_coming_soon),
                icon = Icons.Default.Share,
                enabled = false
            )
            SettingsRow(
                title = stringResource(R.string.settings_data_restore),
                subtitle = stringResource(R.string.settings_coming_soon),
                icon = Icons.Default.Refresh,
                enabled = false
            )
            SettingsRow(
                title = stringResource(R.string.settings_data_export),
                subtitle = stringResource(R.string.settings_coming_soon),
                icon = Icons.Default.Share,
                enabled = false
            )
            SettingsRow(
                title = stringResource(R.string.settings_data_clear),
                subtitle = stringResource(R.string.settings_coming_soon),
                icon = Icons.Default.Delete,
                enabled = false
            )
        }

        // ----------------------------------------------------- Application --
        SettingsSection(title = stringResource(R.string.settings_application)) {
            SettingsRow(
                title = stringResource(R.string.settings_version),
                subtitle = BuildConfig.VERSION_NAME,
                icon = Icons.Default.Info,
                enabled = false
            )
            SettingsRow(
                title = stringResource(R.string.settings_about),
                subtitle = stringResource(R.string.app_name),
                icon = Icons.Default.Info,
                enabled = false
            )
            SettingsRow(
                title = stringResource(R.string.settings_privacy),
                subtitle = stringResource(R.string.settings_privacy_desc),
                icon = Icons.Default.Lock,
                enabled = false
            )
        }

        Spacer(Modifier.height(8.dp))
    }
}
