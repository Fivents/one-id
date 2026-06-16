plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt.android)
    alias(libs.plugins.ksp)
}

fun loadEnv(): Map<String, String> {
    val envFile = rootProject.file(".env")
    if (!envFile.exists()) return emptyMap()
    return envFile.readLines()
        .map { it.trim() }
        .filter { it.isNotBlank() && !it.startsWith("#") }
        .associate { line ->
            val eq = line.indexOf('=')
            if (eq > 0) line.substring(0, eq).trim() to line.substring(eq + 1).trim().removeSurrounding("\"")
            else line.trim() to ""
        }
}

fun parseDatabaseUrl(url: String): Map<String, String> {
    if (!url.contains("://")) return emptyMap()
    try {
        val withoutScheme = url.substringAfter("://")
        val userInfo = withoutScheme.substringBefore("@")
        val hostPortDb = withoutScheme.substringAfter("@")
        val query = if (hostPortDb.contains("?")) hostPortDb.substringAfter("?") else ""
        val hostPort = hostPortDb.substringBefore("/").substringBefore("?")
        val db = hostPortDb.substringAfter("/").substringBefore("?")

        val user = userInfo.substringBefore(":")
        val password = if (userInfo.contains(":")) userInfo.substringAfter(":") else ""

        val host = hostPort.substringBefore(":")
        val port = hostPort.substringAfter(":", "5432").ifBlank { "5432" }

        val sslMode = if (query.contains("sslmode=")) query.substringAfter("sslmode=").substringBefore("&") else "require"

        return mapOf(
            "DB_HOST" to host,
            "DB_PORT" to port,
            "DB_NAME" to db,
            "DB_USER" to user,
            "DB_PASSWORD" to password,
            "DB_SSL" to sslMode,
        )
    } catch (_: Exception) {
        return emptyMap()
    }
}

val env = loadEnv()
val dbUrl = env["DATABASE_URL"] ?: ""
val dbConfig = if (dbUrl.isNotBlank()) parseDatabaseUrl(dbUrl) else emptyMap()

val dbHost = dbConfig["DB_HOST"] ?: env["DB_HOST"] ?: "localhost"
val dbPort = dbConfig["DB_PORT"] ?: env["DB_PORT"] ?: "5432"
val dbName = dbConfig["DB_NAME"] ?: env["DB_NAME"] ?: "fivents"
val dbUser = dbConfig["DB_USER"] ?: env["DB_USER"] ?: "postgres"
val dbPassword = dbConfig["DB_PASSWORD"] ?: env["DB_PASSWORD"] ?: ""
val dbSsl = dbConfig["DB_SSL"] ?: env["DB_SSL"] ?: "require"
val modelUrl = env["NEXT_PUBLIC_ARCFACE_ONNX_REMOTE_URL"] ?: "https://huggingface.co/onnx-community/arcface-onnx/resolve/main/arcface.onnx"

android {
    namespace = "com.oneid.totem"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.oneid.totem"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        buildConfigField("String", "DB_HOST", "\"$dbHost\"")
        buildConfigField("String", "DB_PORT", "\"$dbPort\"")
        buildConfigField("String", "DB_NAME", "\"$dbName\"")
        buildConfigField("String", "DB_USER", "\"$dbUser\"")
        buildConfigField("String", "DB_PASSWORD", "\"$dbPassword\"")
        buildConfigField("String", "DB_SSL", "\"$dbSsl\"")
        buildConfigField("String", "MODEL_DOWNLOAD_URL", "\"$modelUrl\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
        debug {
            applicationIdSuffix = ".debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        jniLibs.pickFirsts.add("lib/arm64-v8a/libcreatedata.so")
        jniLibs.pickFirsts.add("lib/armeabi-v7a/libcreatedata.so")
        jniLibs.pickFirsts.add("lib/x86_64/libcreatedata.so")
        jniLibs.pickFirsts.add("lib/x86/libcreatedata.so")
        resources.pickFirsts.add("META-INF/*")
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    // Compose
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.graphics)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    implementation(libs.compose.material.icons)
    debugImplementation(libs.compose.ui.tooling)

    // AndroidX
    implementation(libs.core.ktx)
    implementation(libs.activity.compose)
    implementation(libs.navigation.compose)
    implementation(libs.lifecycle.runtime.compose)
    implementation(libs.lifecycle.viewmodel.compose)
    implementation(libs.datastore.preferences)
    implementation(libs.security.crypto)

    // Hilt
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)

    // Database (PostgreSQL direto)
    implementation(libs.postgresql)

    // CameraX
    implementation(libs.camerax.core)
    implementation(libs.camerax.camera2)
    implementation(libs.camerax.lifecycle)
    implementation(libs.camerax.view)

    // ML Kit
    implementation(libs.mlkit.barcode)
    implementation(libs.mlkit.face)

    // ONNX Runtime
    implementation(libs.onnxruntime)

    // Coroutines
    implementation(libs.coroutines.core)
    implementation(libs.coroutines.android)

    // Image Loading
    implementation(libs.coil.compose)

    // Brother Print SDK (download from https://support.brother.com and place AAR in app/libs/)
    implementation(fileTree("libs") { include("*.aar") })
}
