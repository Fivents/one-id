-keepnames class com.oneid.totem.data.api.dto.LoginRequest
-if class com.oneid.totem.data.api.dto.LoginRequest
-keep class com.oneid.totem.data.api.dto.LoginRequestJsonAdapter {
    public <init>(com.squareup.moshi.Moshi);
}
