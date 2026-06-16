-keepnames class com.oneid.totem.data.api.dto.TotemInfo
-if class com.oneid.totem.data.api.dto.TotemInfo
-keep class com.oneid.totem.data.api.dto.TotemInfoJsonAdapter {
    public <init>(com.squareup.moshi.Moshi);
}
