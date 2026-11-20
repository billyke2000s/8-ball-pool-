plugins { id("com.android.application") }

android {
    namespace = "com.obskyra.eightball"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.obskyra.eightball"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "0.1.0"
    }
    buildTypes { release { isMinifyEnabled = false } }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    sourceSets.getByName("main").assets.srcDirs("../../docs")
}
