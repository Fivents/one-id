-keepnames class com.oneid.totem.data.api.dto.QrCheckInRequest
-if class com.oneid.totem.data.api.dto.QrCheckInRequest
-keep class com.oneid.totem.data.api.dto.QrCheckInRequestJsonAdapter {
    public <init>(com.squareup.moshi.Moshi);
}
-if class com.oneid.totem.data.api.dto.QrCheckInRequest
-keepnames class kotlin.jvm.internal.DefaultConstructorMarker
-keepclassmembers class com.oneid.totem.data.api.dto.QrCheckInRequest {
    public synthetic <init>(java.lang.String,java.lang.String,int,kotlin.jvm.internal.DefaultConstructorMarker);
}
