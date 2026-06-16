-keepnames class com.oneid.totem.data.api.dto.SessionResponse
-if class com.oneid.totem.data.api.dto.SessionResponse
-keep class com.oneid.totem.data.api.dto.SessionResponseJsonAdapter {
    public <init>(com.squareup.moshi.Moshi);
}
