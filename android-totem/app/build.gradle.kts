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

val env = loadEnv()
val modelUrl = env["NEXT_PUBLIC_ARCFACE_ONNX_REMOTE_URL"] ?: "https://huggingface.co/onnx-community/arcface-onnx/resolve/main/arcface.onnx"

android {
    namespace = "com.oneid.totem"
    compileSdk = 35

    // FlatDir for local Brother AAR
    lint {
        abortOnError = false
    }

    defaultConfig {
        applicationId = "com.oneid.totem"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        buildConfigField("String", "API_BASE_URL", "\"https://one-id-lyart.vercel.app/\"")
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

    // HTTP (Retrofit + Next.js)
    implementation(libs.retrofit)
    implementation(libs.retrofit.converter.gson)
    implementation(libs.okhttp.logging)
    implementation(libs.gson)

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

    // ZXing
    implementation(libs.zxing.core)

    // JWT
    implementation(libs.jwt.core)
    implementation(libs.jwt.impl)
    implementation(libs.jwt.jackson)

    // Brother Print SDK (download from https://support.brother.com and place AAR in app/libs/)
    implementation(fileTree("libs") { include("*.aar") })

    // Test
    testImplementation(libs.junit)
    testImplementation(libs.mockk)
    testImplementation(libs.coroutines.test)
    testImplementation(libs.robolectric)
}
