package com.oneid.totem.data.print;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast",
    "deprecation",
    "nullness:initialization.field.uninitialized"
})
public final class BadgeRenderer_Factory implements Factory<BadgeRenderer> {
  @Override
  public BadgeRenderer get() {
    return newInstance();
  }

  public static BadgeRenderer_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static BadgeRenderer newInstance() {
    return new BadgeRenderer();
  }

  private static final class InstanceHolder {
    static final BadgeRenderer_Factory INSTANCE = new BadgeRenderer_Factory();
  }
}
