package com.oneid.totem.presentation.screens.feedback;

import com.oneid.totem.data.print.PrintCoordinator;
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
public final class FeedbackViewModel_Factory implements Factory<FeedbackViewModel> {
  private final Provider<PrintCoordinator> printCoordinatorProvider;

  public FeedbackViewModel_Factory(Provider<PrintCoordinator> printCoordinatorProvider) {
    this.printCoordinatorProvider = printCoordinatorProvider;
  }

  @Override
  public FeedbackViewModel get() {
    return newInstance(printCoordinatorProvider.get());
  }

  public static FeedbackViewModel_Factory create(
      javax.inject.Provider<PrintCoordinator> printCoordinatorProvider) {
    return new FeedbackViewModel_Factory(Providers.asDaggerProvider(printCoordinatorProvider));
  }

  public static FeedbackViewModel_Factory create(
      Provider<PrintCoordinator> printCoordinatorProvider) {
    return new FeedbackViewModel_Factory(printCoordinatorProvider);
  }

  public static FeedbackViewModel newInstance(PrintCoordinator printCoordinator) {
    return new FeedbackViewModel(printCoordinator);
  }
}
