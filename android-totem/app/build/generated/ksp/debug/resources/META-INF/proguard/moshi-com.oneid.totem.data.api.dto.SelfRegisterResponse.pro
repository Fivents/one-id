-keepnames class com.oneid.totem.data.api.dto.SelfRegisterResponse
-if class com.oneid.totem.data.api.dto.SelfRegisterResponse
-keep class com.oneid.totem.data.api.dto.SelfRegisterResponseJsonAdapter {
    public <init>(com.squareup.moshi.Moshi);
}
