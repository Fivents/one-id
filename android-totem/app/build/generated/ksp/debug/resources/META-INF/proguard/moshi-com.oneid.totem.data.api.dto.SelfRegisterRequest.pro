-keepnames class com.oneid.totem.data.api.dto.SelfRegisterRequest
-if class com.oneid.totem.data.api.dto.SelfRegisterRequest
-keep class com.oneid.totem.data.api.dto.SelfRegisterRequestJsonAdapter {
    public <init>(com.squareup.moshi.Moshi);
}
-if class com.oneid.totem.data.api.dto.SelfRegisterRequest
-keepnames class kotlin.jvm.internal.DefaultConstructorMarker
-keepclassmembers class com.oneid.totem.data.api.dto.SelfRegisterRequest {
    public synthetic <init>(java.lang.String,java.lang.String,java.lang.String,java.lang.String,java.lang.String,java.lang.String,int,kotlin.jvm.internal.DefaultConstructorMarker);
}
