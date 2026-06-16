pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    @Suppress("UnstableApiUsage")
    repositories {
        google()
        mavenCentral()
        maven("https://brother-maven.s3.amazonaws.com")
    }
}

rootProject.name = "OneIdTotem"

include(":app")
