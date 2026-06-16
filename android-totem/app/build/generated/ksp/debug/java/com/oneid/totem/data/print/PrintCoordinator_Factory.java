package com.oneid.totem.data.print;

import android.content.Context;
import com.oneid.totem.data.local.TokenStorage;
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

  private final Provider<TokenStorage> tokenStorageProvider;

  public PrintCoordinator_Factory(Provider<Context> contextProvider,
      Provider<PrintRepository> printRepositoryProvider,
      Provider<BadgeRenderer> badgeRendererProvider, Provider<TokenStorage> tokenStorageProvider) {
    this.contextProvider = contextProvider;
    this.printRepositoryProvider = printRepositoryProvider;
    this.badgeRendererProvider = badgeRendererProvider;
    this.tokenStorageProvider = tokenStorageProvider;
  }

  @Override
  public PrintCoordinator get() {
    return newInstance(contextProvider.get(), printRepositoryProvider.get(), badgeRendererProvider.get(), tokenStorageProvider.get());
  }

  public static PrintCoordinator_Factory create(javax.inject.Provider<Context> contextProvider,
      javax.inject.Provider<PrintRepository> printRepositoryProvider,
      javax.inject.Provider<BadgeRenderer> badgeRendererProvider,
      javax.inject.Provider<TokenStorage> tokenStorageProvider) {
    return new PrintCoordinator_Factory(Providers.asDaggerProvider(contextProvider), Providers.asDaggerProvider(printRepositoryProvider), Providers.asDaggerProvider(badgeRendererProvider), Providers.asDaggerProvider(tokenStorageProvider));
  }

  public static PrintCoordinator_Factory create(Provider<Context> contextProvider,
      Provider<PrintRepository> printRepositoryProvider,
      Provider<BadgeRenderer> badgeRendererProvider, Provider<TokenStorage> tokenStorageProvider) {
    return new PrintCoordinator_Factory(contextProvider, printRepositoryProvider, badgeRendererProvider, tokenStorageProvider);
  }

  public static PrintCoordinator newInstance(Context context, PrintRepository printRepository,
      BadgeRenderer badgeRenderer, TokenStorage tokenStorage) {
    return new PrintCoordinator(context, printRepository, badgeRenderer, tokenStorage);
  }
}
