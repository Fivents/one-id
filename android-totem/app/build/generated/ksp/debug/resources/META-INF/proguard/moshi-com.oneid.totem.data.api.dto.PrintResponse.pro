-keepnames class com.oneid.totem.data.api.dto.PrintResponse
-if class com.oneid.totem.data.api.dto.PrintResponse
-keep class com.oneid.totem.data.api.dto.PrintResponseJsonAdapter {
    public <init>(com.squareup.moshi.Moshi);
}
