package com.oneid.totem.presentation.navigation

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.oneid.totem.presentation.screens.checkin.code.CodeCheckInScreen
import com.oneid.totem.presentation.screens.checkin.face.FaceCheckInScreen
import com.oneid.totem.presentation.screens.checkin.qr.QrCheckInScreen
import com.oneid.totem.presentation.screens.feedback.FeedbackScreen
import com.oneid.totem.presentation.screens.login.LoginScreen
import com.oneid.totem.presentation.screens.method.MethodScreen
import com.oneid.totem.presentation.screens.selfregister.SelfRegisterScreen

object Routes {
    const val LOGIN = "login"
    const val METHOD = "method"
    const val SELF_REGISTER = "self_register"
    const val FACE_CHECK_IN = "face_checkin"
    const val QR_CHECK_IN = "qr_checkin"
    const val CODE_CHECK_IN = "code_checkin"
    const val FEEDBACK = "feedback/{type}/{name}/{epId}/{checkInId}"

    fun feedback(type: String, name: String, eventParticipantId: String = "", checkInId: String = "") =
        "feedback/$type/$name/$eventParticipantId/$checkInId"
}

private const val DURATION = 300

@Composable
fun NavGraph(navController: NavHostController = rememberNavController()) {
    NavHost(navController = navController, startDestination = Routes.LOGIN) {

        composable(
            route = Routes.LOGIN,
            enterTransition = { fadeIn(tween(DURATION)) },
            exitTransition = { fadeOut(tween(DURATION)) },
        ) {
            LoginScreen(onLoginSuccess = {
                navController.navigate(Routes.METHOD) {
                    popUpTo(Routes.LOGIN) { inclusive = true }
                }
            })
        }

        composable(
            route = Routes.METHOD,
            enterTransition = { slideInHorizontally(tween(DURATION)) { it } },
            exitTransition = { slideOutHorizontally(tween(DURATION)) { -it / 3 } },
            popEnterTransition = { slideInHorizontally(tween(DURATION)) { -it / 3 } },
            popExitTransition = { slideOutHorizontally(tween(DURATION)) { it } },
        ) {
            MethodScreen(
                onNavigateToFace = { navController.navigate(Routes.FACE_CHECK_IN) },
                onNavigateToQr = { navController.navigate(Routes.QR_CHECK_IN) },
                onNavigateToCode = { navController.navigate(Routes.CODE_CHECK_IN) },
                onNavigateToSelfRegister = { navController.navigate(Routes.SELF_REGISTER) },
                onLogout = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(0) { inclusive = true }
                    }
                },
            )
        }

        composable(
            route = Routes.SELF_REGISTER,
            enterTransition = { slideInHorizontally(tween(DURATION)) { it } },
            exitTransition = { slideOutHorizontally(tween(DURATION)) { -it / 3 } },
            popEnterTransition = { slideInHorizontally(tween(DURATION)) { -it / 3 } },
            popExitTransition = { slideOutHorizontally(tween(DURATION)) { it } },
        ) {
            SelfRegisterScreen(
                onSuccess = { checkInId, epId, participantName ->
                    navController.navigate(Routes.feedback("success", participantName, epId, checkInId))
                },
                onBack = { navController.popBackStack() },
            )
        }

        composable(
            route = Routes.FACE_CHECK_IN,
            enterTransition = { slideInHorizontally(tween(DURATION)) { it } },
            exitTransition = { slideOutHorizontally(tween(DURATION)) { -it / 3 } },
            popEnterTransition = { slideInHorizontally(tween(DURATION)) { -it / 3 } },
            popExitTransition = { slideOutHorizontally(tween(DURATION)) { it } },
        ) {
            FaceCheckInScreen(
                onSuccess = { checkInId, epId, participantName ->
                    navController.navigate(Routes.feedback("success", participantName, epId, checkInId)) {
                        popUpTo(Routes.METHOD)
                    }
                },
                onError = { message ->
                    navController.navigate(Routes.feedback("error", message)) {
                        popUpTo(Routes.METHOD)
                    }
                },
                onBack = { navController.popBackStack() },
            )
        }

        composable(
            route = Routes.QR_CHECK_IN,
            enterTransition = { slideInHorizontally(tween(DURATION)) { it } },
            exitTransition = { slideOutHorizontally(tween(DURATION)) { -it / 3 } },
            popEnterTransition = { slideInHorizontally(tween(DURATION)) { -it / 3 } },
            popExitTransition = { slideOutHorizontally(tween(DURATION)) { it } },
        ) {
            QrCheckInScreen(
                onSuccess = { checkInId, epId, participantName ->
                    navController.navigate(Routes.feedback("success", participantName, epId, checkInId)) {
                        popUpTo(Routes.METHOD)
                    }
                },
                onBack = { navController.popBackStack() },
            )
        }

        composable(
            route = Routes.CODE_CHECK_IN,
            enterTransition = { slideInHorizontally(tween(DURATION)) { it } },
            exitTransition = { slideOutHorizontally(tween(DURATION)) { -it / 3 } },
            popEnterTransition = { slideInHorizontally(tween(DURATION)) { -it / 3 } },
            popExitTransition = { slideOutHorizontally(tween(DURATION)) { it } },
        ) {
            CodeCheckInScreen(
                onSuccess = { checkInId, epId, participantName ->
                    navController.navigate(Routes.feedback("success", participantName, epId, checkInId)) {
                        popUpTo(Routes.METHOD)
                    }
                },
                onBack = { navController.popBackStack() },
            )
        }

        composable(
            route = Routes.FEEDBACK,
            arguments = listOf(
                navArgument("type") { type = NavType.StringType },
                navArgument("name") { type = NavType.StringType },
                navArgument("epId") { type = NavType.StringType },
                navArgument("checkInId") { type = NavType.StringType },
            ),
            enterTransition = { slideInVertically(tween(DURATION)) { it } + fadeIn(tween(DURATION)) },
            exitTransition = { slideOutVertically(tween(DURATION)) { it } + fadeOut(tween(DURATION)) },
        ) { backStackEntry ->
            val type = backStackEntry.arguments?.getString("type") ?: "success"
            val name = backStackEntry.arguments?.getString("name") ?: ""
            val epId = backStackEntry.arguments?.getString("epId") ?: ""
            val checkInId = backStackEntry.arguments?.getString("checkInId") ?: ""
            FeedbackScreen(
                type = type,
                name = name,
                eventParticipantId = epId,
                checkInId = checkInId,
                onDone = {
                    navController.navigate(Routes.METHOD) {
                        popUpTo(Routes.METHOD) { inclusive = true }
                    }
                },
            )
        }
    }
}
