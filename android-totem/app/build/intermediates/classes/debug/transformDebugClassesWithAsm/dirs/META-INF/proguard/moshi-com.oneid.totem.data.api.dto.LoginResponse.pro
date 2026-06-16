-keepnames class com.oneid.totem.data.api.dto.LoginResponse
-if class com.oneid.totem.data.api.dto.LoginResponse
-keep class com.oneid.totem.data.api.dto.LoginResponseJsonAdapter {
    public <init>(com.squareup.moshi.Moshi);
}
