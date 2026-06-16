-keepnames class com.oneid.totem.data.api.dto.EventConfig
-if class com.oneid.totem.data.api.dto.EventConfig
-keep class com.oneid.totem.data.api.dto.EventConfigJsonAdapter {
    public <init>(com.squareup.moshi.Moshi);
}
