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
public final class LocalBadgeHtmlRenderer_Factory implements Factory<LocalBadgeHtmlRenderer> {
  @Override
  public LocalBadgeHtmlRenderer get() {
    return newInstance();
  }

  public static LocalBadgeHtmlRenderer_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static LocalBadgeHtmlRenderer newInstance() {
    return new LocalBadgeHtmlRenderer();
  }

  private static final class InstanceHolder {
    static final LocalBadgeHtmlRenderer_Factory INSTANCE = new LocalBadgeHtmlRenderer_Factory();
  }
}
