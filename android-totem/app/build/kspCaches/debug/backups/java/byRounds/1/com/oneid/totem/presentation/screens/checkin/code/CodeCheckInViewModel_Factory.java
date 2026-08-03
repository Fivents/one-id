package com.oneid.totem.presentation.screens.checkin.code;

import com.oneid.totem.data.local.TotemPreferences;
import com.oneid.totem.domain.repository.CheckInRepository;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata
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
public final class CodeCheckInViewModel_Factory implements Factory<CodeCheckInViewModel> {
  private final Provider<CheckInRepository> checkInRepositoryProvider;

  private final Provider<TotemPreferences> totemPreferencesProvider;

  public CodeCheckInViewModel_Factory(Provider<CheckInRepository> checkInRepositoryProvider,
      Provider<TotemPreferences> totemPreferencesProvider) {
    this.checkInRepositoryProvider = checkInRepositoryProvider;
    this.totemPreferencesProvider = totemPreferencesProvider;
  }

  @Override
  public CodeCheckInViewModel get() {
    return newInstance(checkInRepositoryProvider.get(), totemPreferencesProvider.get());
  }

  public static CodeCheckInViewModel_Factory create(
      javax.inject.Provider<CheckInRepository> checkInRepositoryProvider,
      javax.inject.Provider<TotemPreferences> totemPreferencesProvider) {
    return new CodeCheckInViewModel_Factory(Providers.asDaggerProvider(checkInRepositoryProvider), Providers.asDaggerProvider(totemPreferencesProvider));
  }

  public static CodeCheckInViewModel_Factory create(
      Provider<CheckInRepository> checkInRepositoryProvider,
      Provider<TotemPreferences> totemPreferencesProvider) {
    return new CodeCheckInViewModel_Factory(checkInRepositoryProvider, totemPreferencesProvider);
  }

  public static CodeCheckInViewModel newInstance(CheckInRepository checkInRepository,
      TotemPreferences totemPreferences) {
    return new CodeCheckInViewModel(checkInRepository, totemPreferences);
  }
}
