package com.oneid.totem.presentation.navigation

import android.net.Uri
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
import com.oneid.totem.presentation.screens.printer.PrinterSetupScreen
import com.oneid.totem.presentation.screens.selfregister.SelfRegisterScreen

object Routes {
    const val LOGIN = "login"
    const val METHOD = "method"
    const val SELF_REGISTER = "self_register"
    const val FACE_CHECK_IN = "face_checkin"
    const val QR_CHECK_IN = "qr_checkin"
    const val CODE_CHECK_IN = "code_checkin"
    const val PRINTER_SETUP = "printer_setup"

    /**
     * Query params em vez de segmentos de caminho: um segmento `{arg}` do Navigation exige
     * pelo menos um caractere, então um checkInId vazio (auto-cadastro sem check-in) ou um
     * nome com "/" quebravam a navegação. Como query, o que não é informado simplesmente
     * cai no default.
     */
    const val FEEDBACK =
        "feedback?type={type}&name={name}&epId={epId}&checkInId={checkInId}&accessCode={accessCode}"

    const val FEEDBACK_SUCCESS = "success"
    const val FEEDBACK_ERROR = "error"

    /** Cadastro feito sem check-in automático: mostra o código em vez de imprimir o badge. */
    const val FEEDBACK_REGISTERED = "registered"

    fun feedback(
        type: String,
        name: String,
        eventParticipantId: String = "",
        checkInId: String = "",
        accessCode: String = "",
    ): String {
        val params = buildList {
            add("type" to type)
            add("name" to name)
            if (eventParticipantId.isNotBlank()) add("epId" to eventParticipantId)
            if (checkInId.isNotBlank()) add("checkInId" to checkInId)
            if (accessCode.isNotBlank()) add("accessCode" to accessCode)
        }
        return "feedback?" + params.joinToString("&") { (key, value) ->
            "$key=${Uri.encode(value)}"
        }
    }
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
                onNavigateToPrinterSetup = { navController.navigate(Routes.PRINTER_SETUP) },
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
                onSuccess = { registration ->
                    val route = if (registration.checkedIn) {
                        Routes.feedback(
                            type = Routes.FEEDBACK_SUCCESS,
                            name = registration.participant.name,
                            eventParticipantId = registration.eventParticipantId,
                            checkInId = registration.checkInId.orEmpty(),
                        )
                    } else {
                        // Sem check-in automático não há badge pra imprimir ainda: a tela
                        // mostra o código de acesso pra pessoa seguir pro check-in.
                        Routes.feedback(
                            type = Routes.FEEDBACK_REGISTERED,
                            name = registration.participant.name,
                            accessCode = registration.participant.accessCode.orEmpty(),
                        )
                    }
                    navController.navigate(route) { popUpTo(Routes.METHOD) }
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
                    navController.navigate(Routes.feedback(Routes.FEEDBACK_SUCCESS, participantName, epId, checkInId)) {
                        popUpTo(Routes.METHOD)
                    }
                },
                onError = { message ->
                    navController.navigate(Routes.feedback(Routes.FEEDBACK_ERROR, message)) {
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
                    navController.navigate(Routes.feedback(Routes.FEEDBACK_SUCCESS, participantName, epId, checkInId)) {
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
                    navController.navigate(Routes.feedback(Routes.FEEDBACK_SUCCESS, participantName, epId, checkInId)) {
                        popUpTo(Routes.METHOD)
                    }
                },
                onBack = { navController.popBackStack() },
            )
        }

        composable(
            route = Routes.PRINTER_SETUP,
            enterTransition = { slideInHorizontally(tween(DURATION)) { it } },
            exitTransition = { slideOutHorizontally(tween(DURATION)) { -it / 3 } },
            popEnterTransition = { slideInHorizontally(tween(DURATION)) { -it / 3 } },
            popExitTransition = { slideOutHorizontally(tween(DURATION)) { it } },
        ) {
            PrinterSetupScreen(onBack = { navController.popBackStack() })
        }

        composable(
            route = Routes.FEEDBACK,
            arguments = listOf(
                navArgument("type") { type = NavType.StringType; defaultValue = Routes.FEEDBACK_SUCCESS },
                navArgument("name") { type = NavType.StringType; defaultValue = "" },
                navArgument("epId") { type = NavType.StringType; defaultValue = "" },
                navArgument("checkInId") { type = NavType.StringType; defaultValue = "" },
                navArgument("accessCode") { type = NavType.StringType; defaultValue = "" },
            ),
            enterTransition = { slideInVertically(tween(DURATION)) { it } + fadeIn(tween(DURATION)) },
            exitTransition = { slideOutVertically(tween(DURATION)) { it } + fadeOut(tween(DURATION)) },
        ) { backStackEntry ->
            val type = backStackEntry.arguments?.getString("type") ?: Routes.FEEDBACK_SUCCESS
            val name = backStackEntry.arguments?.getString("name") ?: ""
            val epId = backStackEntry.arguments?.getString("epId") ?: ""
            val checkInId = backStackEntry.arguments?.getString("checkInId") ?: ""
            val accessCode = backStackEntry.arguments?.getString("accessCode") ?: ""
            FeedbackScreen(
                type = type,
                name = name,
                eventParticipantId = epId,
                checkInId = checkInId,
                accessCode = accessCode,
                onDone = {
                    navController.navigate(Routes.METHOD) {
                        popUpTo(Routes.METHOD) { inclusive = true }
                    }
                },
            )
        }
    }
}
