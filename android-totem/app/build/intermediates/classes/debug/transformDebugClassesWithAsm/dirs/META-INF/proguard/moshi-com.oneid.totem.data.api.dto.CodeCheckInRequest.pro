-keepnames class com.oneid.totem.data.api.dto.CodeCheckInRequest
-if class com.oneid.totem.data.api.dto.CodeCheckInRequest
-keep class com.oneid.totem.data.api.dto.CodeCheckInRequestJsonAdapter {
    public <init>(com.squareup.moshi.Moshi);
}
-if class com.oneid.totem.data.api.dto.CodeCheckInRequest
-keepnames class kotlin.jvm.internal.DefaultConstructorMarker
-keepclassmembers class com.oneid.totem.data.api.dto.CodeCheckInRequest {
    public synthetic <init>(java.lang.String,java.lang.String,int,kotlin.jvm.internal.DefaultConstructorMarker);
}
