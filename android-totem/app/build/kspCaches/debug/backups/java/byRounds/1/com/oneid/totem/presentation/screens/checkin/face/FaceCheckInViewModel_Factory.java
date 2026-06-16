package com.oneid.totem.presentation.screens.checkin.face;

import com.oneid.totem.data.service.FaceProcessingService;
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
public final class FaceCheckInViewModel_Factory implements Factory<FaceCheckInViewModel> {
  private final Provider<CheckInRepository> checkInRepositoryProvider;

  private final Provider<FaceProcessingService> faceProcessingServiceProvider;

  public FaceCheckInViewModel_Factory(Provider<CheckInRepository> checkInRepositoryProvider,
      Provider<FaceProcessingService> faceProcessingServiceProvider) {
    this.checkInRepositoryProvider = checkInRepositoryProvider;
    this.faceProcessingServiceProvider = faceProcessingServiceProvider;
  }

  @Override
  public FaceCheckInViewModel get() {
    return newInstance(checkInRepositoryProvider.get(), faceProcessingServiceProvider.get());
  }

  public static FaceCheckInViewModel_Factory create(
      javax.inject.Provider<CheckInRepository> checkInRepositoryProvider,
      javax.inject.Provider<FaceProcessingService> faceProcessingServiceProvider) {
    return new FaceCheckInViewModel_Factory(Providers.asDaggerProvider(checkInRepositoryProvider), Providers.asDaggerProvider(faceProcessingServiceProvider));
  }

  public static FaceCheckInViewModel_Factory create(
      Provider<CheckInRepository> checkInRepositoryProvider,
      Provider<FaceProcessingService> faceProcessingServiceProvider) {
    return new FaceCheckInViewModel_Factory(checkInRepositoryProvider, faceProcessingServiceProvider);
  }

  public static FaceCheckInViewModel newInstance(CheckInRepository checkInRepository,
      FaceProcessingService faceProcessingService) {
    return new FaceCheckInViewModel(checkInRepository, faceProcessingService);
  }
}
