package com.oneid.totem.data.print;

import android.content.Context;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata("dagger.hilt.android.qualifiers.ApplicationContext")
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
  private final Provider<Context> contextProvider;

  public BadgeRenderer_Factory(Provider<Context> contextProvider) {
    this.contextProvider = contextProvider;
  }

  @Override
  public BadgeRenderer get() {
    return newInstance(contextProvider.get());
  }

  public static BadgeRenderer_Factory create(javax.inject.Provider<Context> contextProvider) {
    return new BadgeRenderer_Factory(Providers.asDaggerProvider(contextProvider));
  }

  public static BadgeRenderer_Factory create(Provider<Context> contextProvider) {
    return new BadgeRenderer_Factory(contextProvider);
  }

  public static BadgeRenderer newInstance(Context context) {
    return new BadgeRenderer(context);
  }
}
