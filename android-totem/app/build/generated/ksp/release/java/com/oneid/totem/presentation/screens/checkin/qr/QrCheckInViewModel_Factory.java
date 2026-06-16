package com.oneid.totem.presentation.screens.checkin.qr;

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
public final class QrCheckInViewModel_Factory implements Factory<QrCheckInViewModel> {
  private final Provider<CheckInRepository> checkInRepositoryProvider;

  public QrCheckInViewModel_Factory(Provider<CheckInRepository> checkInRepositoryProvider) {
    this.checkInRepositoryProvider = checkInRepositoryProvider;
  }

  @Override
  public QrCheckInViewModel get() {
    return newInstance(checkInRepositoryProvider.get());
  }

  public static QrCheckInViewModel_Factory create(
      javax.inject.Provider<CheckInRepository> checkInRepositoryProvider) {
    return new QrCheckInViewModel_Factory(Providers.asDaggerProvider(checkInRepositoryProvider));
  }

  public static QrCheckInViewModel_Factory create(
      Provider<CheckInRepository> checkInRepositoryProvider) {
    return new QrCheckInViewModel_Factory(checkInRepositoryProvider);
  }

  public static QrCheckInViewModel newInstance(CheckInRepository checkInRepository) {
    return new QrCheckInViewModel(checkInRepository);
  }
}
