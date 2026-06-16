package com.oneid.totem.data.local;

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
public final class TotemPreferences_Factory implements Factory<TotemPreferences> {
  private final Provider<Context> contextProvider;

  public TotemPreferences_Factory(Provider<Context> contextProvider) {
    this.contextProvider = contextProvider;
  }

  @Override
  public TotemPreferences get() {
    return newInstance(contextProvider.get());
  }

  public static TotemPreferences_Factory create(javax.inject.Provider<Context> contextProvider) {
    return new TotemPreferences_Factory(Providers.asDaggerProvider(contextProvider));
  }

  public static TotemPreferences_Factory create(Provider<Context> contextProvider) {
    return new TotemPreferences_Factory(contextProvider);
  }

  public static TotemPreferences newInstance(Context context) {
    return new TotemPreferences(context);
  }
}
