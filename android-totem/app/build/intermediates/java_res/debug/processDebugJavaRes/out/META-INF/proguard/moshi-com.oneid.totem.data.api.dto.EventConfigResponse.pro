-keepnames class com.oneid.totem.data.api.dto.EventConfigResponse
-if class com.oneid.totem.data.api.dto.EventConfigResponse
-keep class com.oneid.totem.data.api.dto.EventConfigResponseJsonAdapter {
    public <init>(com.squareup.moshi.Moshi);
}
