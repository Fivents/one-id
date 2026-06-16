package com.oneid.totem.presentation.screens.selfregister;

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
public final class SelfRegisterViewModel_Factory implements Factory<SelfRegisterViewModel> {
  private final Provider<CheckInRepository> checkInRepositoryProvider;

  public SelfRegisterViewModel_Factory(Provider<CheckInRepository> checkInRepositoryProvider) {
    this.checkInRepositoryProvider = checkInRepositoryProvider;
  }

  @Override
  public SelfRegisterViewModel get() {
    return newInstance(checkInRepositoryProvider.get());
  }

  public static SelfRegisterViewModel_Factory create(
      javax.inject.Provider<CheckInRepository> checkInRepositoryProvider) {
    return new SelfRegisterViewModel_Factory(Providers.asDaggerProvider(checkInRepositoryProvider));
  }

  public static SelfRegisterViewModel_Factory create(
      Provider<CheckInRepository> checkInRepositoryProvider) {
    return new SelfRegisterViewModel_Factory(checkInRepositoryProvider);
  }

  public static SelfRegisterViewModel newInstance(CheckInRepository checkInRepository) {
    return new SelfRegisterViewModel(checkInRepository);
  }
}
