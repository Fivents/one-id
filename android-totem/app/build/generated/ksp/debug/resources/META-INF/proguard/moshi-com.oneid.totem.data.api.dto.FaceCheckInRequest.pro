-keepnames class com.oneid.totem.data.api.dto.FaceCheckInRequest
-if class com.oneid.totem.data.api.dto.FaceCheckInRequest
-keep class com.oneid.totem.data.api.dto.FaceCheckInRequestJsonAdapter {
    public <init>(com.squareup.moshi.Moshi);
}
-if class com.oneid.totem.data.api.dto.FaceCheckInRequest
-keepnames class kotlin.jvm.internal.DefaultConstructorMarker
-keepclassmembers class com.oneid.totem.data.api.dto.FaceCheckInRequest {
    public synthetic <init>(java.lang.String,java.util.List,int,java.lang.Double,java.lang.Boolean,int,kotlin.jvm.internal.DefaultConstructorMarker);
}
