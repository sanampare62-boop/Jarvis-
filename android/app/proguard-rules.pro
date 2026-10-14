# Keep JavaScript Interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep WebKit and AndroidX classes
-keep class androidx.webkit.** { *; }
-keepclassmembers class com.sanam.mahi.WebAppInterface {
    public *;
}
