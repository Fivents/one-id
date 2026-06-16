-keepnames class com.oneid.totem.data.api.dto.PrintRequest
-if class com.oneid.totem.data.api.dto.PrintRequest
-keep class com.oneid.totem.data.api.dto.PrintRequestJsonAdapter {
    public <init>(com.squareup.moshi.Moshi);
}
-if class com.oneid.totem.data.api.dto.PrintRequest
-keepnames class kotlin.jvm.internal.DefaultConstructorMarker
-keepclassmembers class com.oneid.totem.data.api.dto.PrintRequest {
    public synthetic <init>(java.lang.String,java.lang.String,int,kotlin.jvm.internal.DefaultConstructorMarker);
}
