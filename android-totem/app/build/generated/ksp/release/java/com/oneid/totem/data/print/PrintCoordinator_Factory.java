package com.oneid.totem.data.print;

import android.content.Context;
import com.oneid.totem.data.local.TotemPreferences;
import com.oneid.totem.domain.repository.PrintRepository;
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
public final class PrintCoordinator_Factory implements Factory<PrintCoordinator> {
  private final Provider<Context> contextProvider;

  private final Provider<PrintRepository> printRepositoryProvider;

  private final Provider<BadgeRenderer> badgeRendererProvider;

  private final Provider<TotemPreferences> prefsProvider;

  public PrintCoordinator_Factory(Provider<Context> contextProvider,
      Provider<PrintRepository> printRepositoryProvider,
      Provider<BadgeRenderer> badgeRendererProvider, Provider<TotemPreferences> prefsProvider) {
    this.contextProvider = contextProvider;
    this.printRepositoryProvider = printRepositoryProvider;
    this.badgeRendererProvider = badgeRendererProvider;
    this.prefsProvider = prefsProvider;
  }

  @Override
  public PrintCoordinator get() {
    return newInstance(contextProvider.get(), printRepositoryProvider.get(), badgeRendererProvider.get(), prefsProvider.get());
  }

  public static PrintCoordinator_Factory create(javax.inject.Provider<Context> contextProvider,
      javax.inject.Provider<PrintRepository> printRepositoryProvider,
      javax.inject.Provider<BadgeRenderer> badgeRendererProvider,
      javax.inject.Provider<TotemPreferences> prefsProvider) {
    return new PrintCoordinator_Factory(Providers.asDaggerProvider(contextProvider), Providers.asDaggerProvider(printRepositoryProvider), Providers.asDaggerProvider(badgeRendererProvider), Providers.asDaggerProvider(prefsProvider));
  }

  public static PrintCoordinator_Factory create(Provider<Context> contextProvider,
      Provider<PrintRepository> printRepositoryProvider,
      Provider<BadgeRenderer> badgeRendererProvider, Provider<TotemPreferences> prefsProvider) {
    return new PrintCoordinator_Factory(contextProvider, printRepositoryProvider, badgeRendererProvider, prefsProvider);
  }

  public static PrintCoordinator newInstance(Context context, PrintRepository printRepository,
      BadgeRenderer badgeRenderer, TotemPreferences prefs) {
    return new PrintCoordinator(context, printRepository, badgeRenderer, prefs);
  }
}
