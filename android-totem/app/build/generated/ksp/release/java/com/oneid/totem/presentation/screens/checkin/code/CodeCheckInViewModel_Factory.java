package com.oneid.totem.presentation.screens.checkin.code;

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

  public CodeCheckInViewModel_Factory(Provider<CheckInRepository> checkInRepositoryProvider) {
    this.checkInRepositoryProvider = checkInRepositoryProvider;
  }

  @Override
  public CodeCheckInViewModel get() {
    return newInstance(checkInRepositoryProvider.get());
  }

  public static CodeCheckInViewModel_Factory create(
      javax.inject.Provider<CheckInRepository> checkInRepositoryProvider) {
    return new CodeCheckInViewModel_Factory(Providers.asDaggerProvider(checkInRepositoryProvider));
  }

  public static CodeCheckInViewModel_Factory create(
      Provider<CheckInRepository> checkInRepositoryProvider) {
    return new CodeCheckInViewModel_Factory(checkInRepositoryProvider);
  }

  public static CodeCheckInViewModel newInstance(CheckInRepository checkInRepository) {
    return new CodeCheckInViewModel(checkInRepository);
  }
}
