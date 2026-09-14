package com.example.studentmanager.ui

import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.studentmanager.R
import com.example.studentmanager.ui.navigation.AppNavigationBar
import com.example.studentmanager.ui.navigation.AppNavigationRail
import com.example.studentmanager.ui.navigation.Routes
import com.example.studentmanager.ui.navigation.StudentManagerNavHost
import com.example.studentmanager.ui.navigation.TopLevelDestination
import com.example.studentmanager.ui.navigation.titleResForRoute

/**
 * Root shell. Chooses a navigation rail on tablets / landscape and a bottom
 * bar on phones, and hosts the shared top app bar.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentManagerHubApp(modifier: Modifier = Modifier) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val topLevelDestination = TopLevelDestination.fromRoute(currentRoute)
    val showNavigation = topLevelDestination != null

    BoxWithConstraints(modifier = modifier.fillMaxSize()) {
        // 600dp is the Material breakpoint between compact and medium windows.
        val useNavigationRail = maxWidth >= 600.dp

        Row(modifier = Modifier.fillMaxSize()) {
            if (useNavigationRail && showNavigation) {
                AppNavigationRail(
                    currentRoute = currentRoute,
                    onNavigate = navController::navigateToTopLevel
                )
            }

            Scaffold(
                containerColor = MaterialTheme.colorScheme.background,
                topBar = {
                    TopAppBar(
                        title = { Text(stringResource(titleResForRoute(currentRoute))) },
                        navigationIcon = {
                            if (!showNavigation) {
                                IconButton(onClick = { navController.popBackStack() }) {
                                    Icon(
                                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                        contentDescription = stringResource(R.string.action_back)
                                    )
                                }
                            }
                        },
                        actions = {
                            if (currentRoute != Routes.SETTINGS) {
                                IconButton(onClick = { navController.navigateTo(Routes.SETTINGS) }) {
                                    Icon(
                                        imageVector = Icons.Default.Settings,
                                        contentDescription = stringResource(R.string.action_settings)
                                    )
                                }
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(
                            containerColor = MaterialTheme.colorScheme.background,
                            titleContentColor = MaterialTheme.colorScheme.onBackground,
                            navigationIconContentColor = MaterialTheme.colorScheme.onBackground,
                            actionIconContentColor = MaterialTheme.colorScheme.onBackground
                        )
                    )
                },
                bottomBar = {
                    if (!useNavigationRail && showNavigation) {
                        AppNavigationBar(
                            currentRoute = currentRoute,
                            onNavigate = navController::navigateToTopLevel
                        )
                    }
                }
            ) { innerPadding ->
                StudentManagerNavHost(
                    navController = navController,
                    modifier = Modifier.padding(innerPadding)
                )
            }
        }
    }
}

/** Plain push used by quick actions and the settings icon. */
fun NavHostController.navigateTo(route: String) {
    navigate(route) { launchSingleTop = true }
}

/** Bottom-bar / rail navigation: single instance, state preserved per tab. */
fun NavHostController.navigateToTopLevel(destination: TopLevelDestination) {
    navigate(destination.route) {
        popUpTo(graph.findStartDestination().id) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}
