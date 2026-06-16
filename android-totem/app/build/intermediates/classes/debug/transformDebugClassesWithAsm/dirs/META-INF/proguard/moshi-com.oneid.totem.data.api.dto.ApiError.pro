-keepnames class com.oneid.totem.data.api.dto.ApiError
-if class com.oneid.totem.data.api.dto.ApiError
-keep class com.oneid.totem.data.api.dto.ApiErrorJsonAdapter {
    public <init>(com.squareup.moshi.Moshi);
}
