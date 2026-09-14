# Room / Compose / Navigation ship their own consumer rules.
# Add project-specific rules here as the app grows.

# ─── Room ──────────────────────────────────────────────────────────────────────
# Keep Room entity/DAO classes so R8 does not strip them during minification.
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *
-keep @androidx.room.Dao class *
-keepclassmembers class * extends androidx.room.RoomDatabase {
    abstract *;
}
# Keep generated Room implementations
-keep class **_Impl { *; }
-keep class **_Impl$* { *; }

# ─── Kotlin ────────────────────────────────────────────────────────────────────
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep class kotlin.Metadata { *; }
