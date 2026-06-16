-keepnames class com.oneid.totem.data.api.dto.PrintConfigResponse
-if class com.oneid.totem.data.api.dto.PrintConfigResponse
-keep class com.oneid.totem.data.api.dto.PrintConfigResponseJsonAdapter {
    public <init>(com.squareup.moshi.Moshi);
}
