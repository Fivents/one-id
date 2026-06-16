-keepnames class com.oneid.totem.data.api.dto.ParticipantInfo
-if class com.oneid.totem.data.api.dto.ParticipantInfo
-keep class com.oneid.totem.data.api.dto.ParticipantInfoJsonAdapter {
    public <init>(com.squareup.moshi.Moshi);
}
