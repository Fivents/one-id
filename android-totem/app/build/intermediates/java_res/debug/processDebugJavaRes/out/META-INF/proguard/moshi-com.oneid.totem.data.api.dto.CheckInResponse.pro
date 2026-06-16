-keepnames class com.oneid.totem.data.api.dto.CheckInResponse
-if class com.oneid.totem.data.api.dto.CheckInResponse
-keep class com.oneid.totem.data.api.dto.CheckInResponseJsonAdapter {
    public <init>(com.squareup.moshi.Moshi);
}
