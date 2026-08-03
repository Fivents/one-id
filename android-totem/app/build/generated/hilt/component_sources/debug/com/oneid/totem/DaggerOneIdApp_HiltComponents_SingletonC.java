package com.oneid.totem;

import android.app.Activity;
import android.app.Service;
import android.view.View;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.SavedStateHandle;
import androidx.lifecycle.ViewModel;
import com.google.errorprone.annotations.CanIgnoreReturnValue;
import com.oneid.totem.data.api.ApiClient;
import com.oneid.totem.data.local.TokenStorage;
import com.oneid.totem.data.local.TotemPreferences;
import com.oneid.totem.data.print.BadgeRenderer;
import com.oneid.totem.data.print.BrotherSdkPrinter;
import com.oneid.totem.data.print.PrintCoordinator;
import com.oneid.totem.data.print.PrinterConfigModule_ProvidePrinterConnectionManagerFactory;
import com.oneid.totem.data.print.PrinterConfigRepository;
import com.oneid.totem.data.print.PrinterConnectionManager;
import com.oneid.totem.data.repository.http.AuthHttpRepository;
import com.oneid.totem.data.repository.http.CheckInHttpRepository;
import com.oneid.totem.data.repository.http.PrintHttpRepository;
import com.oneid.totem.data.service.FaceProcessingServiceImpl;
import com.oneid.totem.data.service.ModelDownloader;
import com.oneid.totem.presentation.screens.checkin.code.CodeCheckInViewModel;
import com.oneid.totem.presentation.screens.checkin.code.CodeCheckInViewModel_HiltModules;
import com.oneid.totem.presentation.screens.checkin.code.CodeCheckInViewModel_HiltModules_BindsModule_Binds_LazyMapKey;
import com.oneid.totem.presentation.screens.checkin.code.CodeCheckInViewModel_HiltModules_KeyModule_Provide_LazyMapKey;
import com.oneid.totem.presentation.screens.checkin.face.FaceCheckInViewModel;
import com.oneid.totem.presentation.screens.checkin.face.FaceCheckInViewModel_HiltModules;
import com.oneid.totem.presentation.screens.checkin.face.FaceCheckInViewModel_HiltModules_BindsModule_Binds_LazyMapKey;
import com.oneid.totem.presentation.screens.checkin.face.FaceCheckInViewModel_HiltModules_KeyModule_Provide_LazyMapKey;
import com.oneid.totem.presentation.screens.checkin.qr.QrCheckInViewModel;
import com.oneid.totem.presentation.screens.checkin.qr.QrCheckInViewModel_HiltModules;
import com.oneid.totem.presentation.screens.checkin.qr.QrCheckInViewModel_HiltModules_BindsModule_Binds_LazyMapKey;
import com.oneid.totem.presentation.screens.checkin.qr.QrCheckInViewModel_HiltModules_KeyModule_Provide_LazyMapKey;
import com.oneid.totem.presentation.screens.feedback.FeedbackViewModel;
import com.oneid.totem.presentation.screens.feedback.FeedbackViewModel_HiltModules;
import com.oneid.totem.presentation.screens.feedback.FeedbackViewModel_HiltModules_BindsModule_Binds_LazyMapKey;
import com.oneid.totem.presentation.screens.feedback.FeedbackViewModel_HiltModules_KeyModule_Provide_LazyMapKey;
import com.oneid.totem.presentation.screens.login.LoginViewModel;
import com.oneid.totem.presentation.screens.login.LoginViewModel_HiltModules;
import com.oneid.totem.presentation.screens.login.LoginViewModel_HiltModules_BindsModule_Binds_LazyMapKey;
import com.oneid.totem.presentation.screens.login.LoginViewModel_HiltModules_KeyModule_Provide_LazyMapKey;
import com.oneid.totem.presentation.screens.method.MethodViewModel;
import com.oneid.totem.presentation.screens.method.MethodViewModel_HiltModules;
import com.oneid.totem.presentation.screens.method.MethodViewModel_HiltModules_BindsModule_Binds_LazyMapKey;
import com.oneid.totem.presentation.screens.method.MethodViewModel_HiltModules_KeyModule_Provide_LazyMapKey;
import com.oneid.totem.presentation.screens.printer.PrinterSetupViewModel;
import com.oneid.totem.presentation.screens.printer.PrinterSetupViewModel_HiltModules;
import com.oneid.totem.presentation.screens.printer.PrinterSetupViewModel_HiltModules_BindsModule_Binds_LazyMapKey;
import com.oneid.totem.presentation.screens.printer.PrinterSetupViewModel_HiltModules_KeyModule_Provide_LazyMapKey;
import com.oneid.totem.presentation.screens.selfregister.SelfRegisterViewModel;
import com.oneid.totem.presentation.screens.selfregister.SelfRegisterViewModel_HiltModules;
import com.oneid.totem.presentation.screens.selfregister.SelfRegisterViewModel_HiltModules_BindsModule_Binds_LazyMapKey;
import com.oneid.totem.presentation.screens.selfregister.SelfRegisterViewModel_HiltModules_KeyModule_Provide_LazyMapKey;
import com.oneid.totem.presentation.util.ConnectivityMonitor;
import dagger.hilt.android.ActivityRetainedLifecycle;
import dagger.hilt.android.ViewModelLifecycle;
import dagger.hilt.android.internal.builders.ActivityComponentBuilder;
import dagger.hilt.android.internal.builders.ActivityRetainedComponentBuilder;
import dagger.hilt.android.internal.builders.FragmentComponentBuilder;
import dagger.hilt.android.internal.builders.ServiceComponentBuilder;
import dagger.hilt.android.internal.builders.ViewComponentBuilder;
import dagger.hilt.android.internal.builders.ViewModelComponentBuilder;
import dagger.hilt.android.internal.builders.ViewWithFragmentComponentBuilder;
import dagger.hilt.android.internal.lifecycle.DefaultViewModelFactories;
import dagger.hilt.android.internal.lifecycle.DefaultViewModelFactories_InternalFactoryFactory_Factory;
import dagger.hilt.android.internal.managers.ActivityRetainedComponentManager_LifecycleModule_ProvideActivityRetainedLifecycleFactory;
import dagger.hilt.android.internal.managers.SavedStateHandleHolder;
import dagger.hilt.android.internal.modules.ApplicationContextModule;
import dagger.hilt.android.internal.modules.ApplicationContextModule_ProvideContextFactory;
import dagger.internal.DaggerGenerated;
import dagger.internal.DoubleCheck;
import dagger.internal.LazyClassKeyMap;
import dagger.internal.MapBuilder;
import dagger.internal.Preconditions;
import dagger.internal.Provider;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import javax.annotation.processing.Generated;

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
public final class DaggerOneIdApp_HiltComponents_SingletonC {
  private DaggerOneIdApp_HiltComponents_SingletonC() {
  }

  public static Builder builder() {
    return new Builder();
  }

  public static final class Builder {
    private ApplicationContextModule applicationContextModule;

    private Builder() {
    }

    public Builder applicationContextModule(ApplicationContextModule applicationContextModule) {
      this.applicationContextModule = Preconditions.checkNotNull(applicationContextModule);
      return this;
    }

    public OneIdApp_HiltComponents.SingletonC build() {
      Preconditions.checkBuilderRequirement(applicationContextModule, ApplicationContextModule.class);
      return new SingletonCImpl(applicationContextModule);
    }
  }

  private static final class ActivityRetainedCBuilder implements OneIdApp_HiltComponents.ActivityRetainedC.Builder {
    private final SingletonCImpl singletonCImpl;

    private SavedStateHandleHolder savedStateHandleHolder;

    private ActivityRetainedCBuilder(SingletonCImpl singletonCImpl) {
      this.singletonCImpl = singletonCImpl;
    }

    @Override
    public ActivityRetainedCBuilder savedStateHandleHolder(
        SavedStateHandleHolder savedStateHandleHolder) {
      this.savedStateHandleHolder = Preconditions.checkNotNull(savedStateHandleHolder);
      return this;
    }

    @Override
    public OneIdApp_HiltComponents.ActivityRetainedC build() {
      Preconditions.checkBuilderRequirement(savedStateHandleHolder, SavedStateHandleHolder.class);
      return new ActivityRetainedCImpl(singletonCImpl, savedStateHandleHolder);
    }
  }

  private static final class ActivityCBuilder implements OneIdApp_HiltComponents.ActivityC.Builder {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private Activity activity;

    private ActivityCBuilder(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
    }

    @Override
    public ActivityCBuilder activity(Activity activity) {
      this.activity = Preconditions.checkNotNull(activity);
      return this;
    }

    @Override
    public OneIdApp_HiltComponents.ActivityC build() {
      Preconditions.checkBuilderRequirement(activity, Activity.class);
      return new ActivityCImpl(singletonCImpl, activityRetainedCImpl, activity);
    }
  }

  private static final class FragmentCBuilder implements OneIdApp_HiltComponents.FragmentC.Builder {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl;

    private Fragment fragment;

    private FragmentCBuilder(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl, ActivityCImpl activityCImpl) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
      this.activityCImpl = activityCImpl;
    }

    @Override
    public FragmentCBuilder fragment(Fragment fragment) {
      this.fragment = Preconditions.checkNotNull(fragment);
      return this;
    }

    @Override
    public OneIdApp_HiltComponents.FragmentC build() {
      Preconditions.checkBuilderRequirement(fragment, Fragment.class);
      return new FragmentCImpl(singletonCImpl, activityRetainedCImpl, activityCImpl, fragment);
    }
  }

  private static final class ViewWithFragmentCBuilder implements OneIdApp_HiltComponents.ViewWithFragmentC.Builder {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl;

    private final FragmentCImpl fragmentCImpl;

    private View view;

    private ViewWithFragmentCBuilder(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl, ActivityCImpl activityCImpl,
        FragmentCImpl fragmentCImpl) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
      this.activityCImpl = activityCImpl;
      this.fragmentCImpl = fragmentCImpl;
    }

    @Override
    public ViewWithFragmentCBuilder view(View view) {
      this.view = Preconditions.checkNotNull(view);
      return this;
    }

    @Override
    public OneIdApp_HiltComponents.ViewWithFragmentC build() {
      Preconditions.checkBuilderRequirement(view, View.class);
      return new ViewWithFragmentCImpl(singletonCImpl, activityRetainedCImpl, activityCImpl, fragmentCImpl, view);
    }
  }

  private static final class ViewCBuilder implements OneIdApp_HiltComponents.ViewC.Builder {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl;

    private View view;

    private ViewCBuilder(SingletonCImpl singletonCImpl, ActivityRetainedCImpl activityRetainedCImpl,
        ActivityCImpl activityCImpl) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
      this.activityCImpl = activityCImpl;
    }

    @Override
    public ViewCBuilder view(View view) {
      this.view = Preconditions.checkNotNull(view);
      return this;
    }

    @Override
    public OneIdApp_HiltComponents.ViewC build() {
      Preconditions.checkBuilderRequirement(view, View.class);
      return new ViewCImpl(singletonCImpl, activityRetainedCImpl, activityCImpl, view);
    }
  }

  private static final class ViewModelCBuilder implements OneIdApp_HiltComponents.ViewModelC.Builder {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private SavedStateHandle savedStateHandle;

    private ViewModelLifecycle viewModelLifecycle;

    private ViewModelCBuilder(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
    }

    @Override
    public ViewModelCBuilder savedStateHandle(SavedStateHandle handle) {
      this.savedStateHandle = Preconditions.checkNotNull(handle);
      return this;
    }

    @Override
    public ViewModelCBuilder viewModelLifecycle(ViewModelLifecycle viewModelLifecycle) {
      this.viewModelLifecycle = Preconditions.checkNotNull(viewModelLifecycle);
      return this;
    }

    @Override
    public OneIdApp_HiltComponents.ViewModelC build() {
      Preconditions.checkBuilderRequirement(savedStateHandle, SavedStateHandle.class);
      Preconditions.checkBuilderRequirement(viewModelLifecycle, ViewModelLifecycle.class);
      return new ViewModelCImpl(singletonCImpl, activityRetainedCImpl, savedStateHandle, viewModelLifecycle);
    }
  }

  private static final class ServiceCBuilder implements OneIdApp_HiltComponents.ServiceC.Builder {
    private final SingletonCImpl singletonCImpl;

    private Service service;

    private ServiceCBuilder(SingletonCImpl singletonCImpl) {
      this.singletonCImpl = singletonCImpl;
    }

    @Override
    public ServiceCBuilder service(Service service) {
      this.service = Preconditions.checkNotNull(service);
      return this;
    }

    @Override
    public OneIdApp_HiltComponents.ServiceC build() {
      Preconditions.checkBuilderRequirement(service, Service.class);
      return new ServiceCImpl(singletonCImpl, service);
    }
  }

  private static final class ViewWithFragmentCImpl extends OneIdApp_HiltComponents.ViewWithFragmentC {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl;

    private final FragmentCImpl fragmentCImpl;

    private final ViewWithFragmentCImpl viewWithFragmentCImpl = this;

    private ViewWithFragmentCImpl(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl, ActivityCImpl activityCImpl,
        FragmentCImpl fragmentCImpl, View viewParam) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
      this.activityCImpl = activityCImpl;
      this.fragmentCImpl = fragmentCImpl;


    }
  }

  private static final class FragmentCImpl extends OneIdApp_HiltComponents.FragmentC {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl;

    private final FragmentCImpl fragmentCImpl = this;

    private FragmentCImpl(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl, ActivityCImpl activityCImpl,
        Fragment fragmentParam) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
      this.activityCImpl = activityCImpl;


    }

    @Override
    public DefaultViewModelFactories.InternalFactoryFactory getHiltInternalFactoryFactory() {
      return activityCImpl.getHiltInternalFactoryFactory();
    }

    @Override
    public ViewWithFragmentComponentBuilder viewWithFragmentComponentBuilder() {
      return new ViewWithFragmentCBuilder(singletonCImpl, activityRetainedCImpl, activityCImpl, fragmentCImpl);
    }
  }

  private static final class ViewCImpl extends OneIdApp_HiltComponents.ViewC {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl;

    private final ViewCImpl viewCImpl = this;

    private ViewCImpl(SingletonCImpl singletonCImpl, ActivityRetainedCImpl activityRetainedCImpl,
        ActivityCImpl activityCImpl, View viewParam) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
      this.activityCImpl = activityCImpl;


    }
  }

  private static final class ActivityCImpl extends OneIdApp_HiltComponents.ActivityC {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl = this;

    private ActivityCImpl(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl, Activity activityParam) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;


    }

    @Override
    public void injectMainActivity(MainActivity arg0) {
      injectMainActivity2(arg0);
    }

    @Override
    public DefaultViewModelFactories.InternalFactoryFactory getHiltInternalFactoryFactory() {
      return DefaultViewModelFactories_InternalFactoryFactory_Factory.newInstance(getViewModelKeys(), new ViewModelCBuilder(singletonCImpl, activityRetainedCImpl));
    }

    @Override
    public Map<Class<?>, Boolean> getViewModelKeys() {
      return LazyClassKeyMap.<Boolean>of(MapBuilder.<String, Boolean>newMapBuilder(8).put(CodeCheckInViewModel_HiltModules_KeyModule_Provide_LazyMapKey.lazyClassKeyName, CodeCheckInViewModel_HiltModules.KeyModule.provide()).put(FaceCheckInViewModel_HiltModules_KeyModule_Provide_LazyMapKey.lazyClassKeyName, FaceCheckInViewModel_HiltModules.KeyModule.provide()).put(FeedbackViewModel_HiltModules_KeyModule_Provide_LazyMapKey.lazyClassKeyName, FeedbackViewModel_HiltModules.KeyModule.provide()).put(LoginViewModel_HiltModules_KeyModule_Provide_LazyMapKey.lazyClassKeyName, LoginViewModel_HiltModules.KeyModule.provide()).put(MethodViewModel_HiltModules_KeyModule_Provide_LazyMapKey.lazyClassKeyName, MethodViewModel_HiltModules.KeyModule.provide()).put(PrinterSetupViewModel_HiltModules_KeyModule_Provide_LazyMapKey.lazyClassKeyName, PrinterSetupViewModel_HiltModules.KeyModule.provide()).put(QrCheckInViewModel_HiltModules_KeyModule_Provide_LazyMapKey.lazyClassKeyName, QrCheckInViewModel_HiltModules.KeyModule.provide()).put(SelfRegisterViewModel_HiltModules_KeyModule_Provide_LazyMapKey.lazyClassKeyName, SelfRegisterViewModel_HiltModules.KeyModule.provide()).build());
    }

    @Override
    public ViewModelComponentBuilder getViewModelComponentBuilder() {
      return new ViewModelCBuilder(singletonCImpl, activityRetainedCImpl);
    }

    @Override
    public FragmentComponentBuilder fragmentComponentBuilder() {
      return new FragmentCBuilder(singletonCImpl, activityRetainedCImpl, activityCImpl);
    }

    @Override
    public ViewComponentBuilder viewComponentBuilder() {
      return new ViewCBuilder(singletonCImpl, activityRetainedCImpl, activityCImpl);
    }

    @CanIgnoreReturnValue
    private MainActivity injectMainActivity2(MainActivity instance) {
      MainActivity_MembersInjector.injectConnectivityMonitor(instance, singletonCImpl.connectivityMonitorProvider.get());
      return instance;
    }
  }

  private static final class ViewModelCImpl extends OneIdApp_HiltComponents.ViewModelC {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ViewModelCImpl viewModelCImpl = this;

    private Provider<CodeCheckInViewModel> codeCheckInViewModelProvider;

    private Provider<FaceCheckInViewModel> faceCheckInViewModelProvider;

    private Provider<FeedbackViewModel> feedbackViewModelProvider;

    private Provider<LoginViewModel> loginViewModelProvider;

    private Provider<MethodViewModel> methodViewModelProvider;

    private Provider<PrinterSetupViewModel> printerSetupViewModelProvider;

    private Provider<QrCheckInViewModel> qrCheckInViewModelProvider;

    private Provider<SelfRegisterViewModel> selfRegisterViewModelProvider;

    private ViewModelCImpl(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl, SavedStateHandle savedStateHandleParam,
        ViewModelLifecycle viewModelLifecycleParam) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;

      initialize(savedStateHandleParam, viewModelLifecycleParam);

    }

    @SuppressWarnings("unchecked")
    private void initialize(final SavedStateHandle savedStateHandleParam,
        final ViewModelLifecycle viewModelLifecycleParam) {
      this.codeCheckInViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 0);
      this.faceCheckInViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 1);
      this.feedbackViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 2);
      this.loginViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 3);
      this.methodViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 4);
      this.printerSetupViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 5);
      this.qrCheckInViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 6);
      this.selfRegisterViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 7);
    }

    @Override
    public Map<Class<?>, javax.inject.Provider<ViewModel>> getHiltViewModelMap() {
      return LazyClassKeyMap.<javax.inject.Provider<ViewModel>>of(MapBuilder.<String, javax.inject.Provider<ViewModel>>newMapBuilder(8).put(CodeCheckInViewModel_HiltModules_BindsModule_Binds_LazyMapKey.lazyClassKeyName, ((Provider) codeCheckInViewModelProvider)).put(FaceCheckInViewModel_HiltModules_BindsModule_Binds_LazyMapKey.lazyClassKeyName, ((Provider) faceCheckInViewModelProvider)).put(FeedbackViewModel_HiltModules_BindsModule_Binds_LazyMapKey.lazyClassKeyName, ((Provider) feedbackViewModelProvider)).put(LoginViewModel_HiltModules_BindsModule_Binds_LazyMapKey.lazyClassKeyName, ((Provider) loginViewModelProvider)).put(MethodViewModel_HiltModules_BindsModule_Binds_LazyMapKey.lazyClassKeyName, ((Provider) methodViewModelProvider)).put(PrinterSetupViewModel_HiltModules_BindsModule_Binds_LazyMapKey.lazyClassKeyName, ((Provider) printerSetupViewModelProvider)).put(QrCheckInViewModel_HiltModules_BindsModule_Binds_LazyMapKey.lazyClassKeyName, ((Provider) qrCheckInViewModelProvider)).put(SelfRegisterViewModel_HiltModules_BindsModule_Binds_LazyMapKey.lazyClassKeyName, ((Provider) selfRegisterViewModelProvider)).build());
    }

    @Override
    public Map<Class<?>, Object> getHiltViewModelAssistedMap() {
      return Collections.<Class<?>, Object>emptyMap();
    }

    private static final class SwitchingProvider<T> implements Provider<T> {
      private final SingletonCImpl singletonCImpl;

      private final ActivityRetainedCImpl activityRetainedCImpl;

      private final ViewModelCImpl viewModelCImpl;

      private final int id;

      SwitchingProvider(SingletonCImpl singletonCImpl, ActivityRetainedCImpl activityRetainedCImpl,
          ViewModelCImpl viewModelCImpl, int id) {
        this.singletonCImpl = singletonCImpl;
        this.activityRetainedCImpl = activityRetainedCImpl;
        this.viewModelCImpl = viewModelCImpl;
        this.id = id;
      }

      @SuppressWarnings("unchecked")
      @Override
      public T get() {
        switch (id) {
          case 0: // com.oneid.totem.presentation.screens.checkin.code.CodeCheckInViewModel 
          return (T) new CodeCheckInViewModel(singletonCImpl.checkInHttpRepositoryProvider.get(), singletonCImpl.totemPreferencesProvider.get());

          case 1: // com.oneid.totem.presentation.screens.checkin.face.FaceCheckInViewModel 
          return (T) new FaceCheckInViewModel(singletonCImpl.checkInHttpRepositoryProvider.get(), singletonCImpl.faceProcessingServiceImplProvider.get());

          case 2: // com.oneid.totem.presentation.screens.feedback.FeedbackViewModel 
          return (T) new FeedbackViewModel(singletonCImpl.printCoordinatorProvider.get());

          case 3: // com.oneid.totem.presentation.screens.login.LoginViewModel 
          return (T) new LoginViewModel(singletonCImpl.authHttpRepositoryProvider.get());

          case 4: // com.oneid.totem.presentation.screens.method.MethodViewModel 
          return (T) new MethodViewModel(singletonCImpl.authHttpRepositoryProvider.get(), singletonCImpl.printerConfigRepositoryProvider.get(), singletonCImpl.modelDownloaderProvider.get(), singletonCImpl.totemPreferencesProvider.get());

          case 5: // com.oneid.totem.presentation.screens.printer.PrinterSetupViewModel 
          return (T) new PrinterSetupViewModel(ApplicationContextModule_ProvideContextFactory.provideContext(singletonCImpl.applicationContextModule), singletonCImpl.printerConfigRepositoryProvider.get(), singletonCImpl.providePrinterConnectionManagerProvider.get(), singletonCImpl.badgeRendererProvider.get(), singletonCImpl.printHttpRepositoryProvider.get());

          case 6: // com.oneid.totem.presentation.screens.checkin.qr.QrCheckInViewModel 
          return (T) new QrCheckInViewModel(singletonCImpl.checkInHttpRepositoryProvider.get());

          case 7: // com.oneid.totem.presentation.screens.selfregister.SelfRegisterViewModel 
          return (T) new SelfRegisterViewModel(singletonCImpl.checkInHttpRepositoryProvider.get());

          default: throw new AssertionError(id);
        }
      }
    }
  }

  private static final class ActivityRetainedCImpl extends OneIdApp_HiltComponents.ActivityRetainedC {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl = this;

    private Provider<ActivityRetainedLifecycle> provideActivityRetainedLifecycleProvider;

    private ActivityRetainedCImpl(SingletonCImpl singletonCImpl,
        SavedStateHandleHolder savedStateHandleHolderParam) {
      this.singletonCImpl = singletonCImpl;

      initialize(savedStateHandleHolderParam);

    }

    @SuppressWarnings("unchecked")
    private void initialize(final SavedStateHandleHolder savedStateHandleHolderParam) {
      this.provideActivityRetainedLifecycleProvider = DoubleCheck.provider(new SwitchingProvider<ActivityRetainedLifecycle>(singletonCImpl, activityRetainedCImpl, 0));
    }

    @Override
    public ActivityComponentBuilder activityComponentBuilder() {
      return new ActivityCBuilder(singletonCImpl, activityRetainedCImpl);
    }

    @Override
    public ActivityRetainedLifecycle getActivityRetainedLifecycle() {
      return provideActivityRetainedLifecycleProvider.get();
    }

    private static final class SwitchingProvider<T> implements Provider<T> {
      private final SingletonCImpl singletonCImpl;

      private final ActivityRetainedCImpl activityRetainedCImpl;

      private final int id;

      SwitchingProvider(SingletonCImpl singletonCImpl, ActivityRetainedCImpl activityRetainedCImpl,
          int id) {
        this.singletonCImpl = singletonCImpl;
        this.activityRetainedCImpl = activityRetainedCImpl;
        this.id = id;
      }

      @SuppressWarnings("unchecked")
      @Override
      public T get() {
        switch (id) {
          case 0: // dagger.hilt.android.ActivityRetainedLifecycle 
          return (T) ActivityRetainedComponentManager_LifecycleModule_ProvideActivityRetainedLifecycleFactory.provideActivityRetainedLifecycle();

          default: throw new AssertionError(id);
        }
      }
    }
  }

  private static final class ServiceCImpl extends OneIdApp_HiltComponents.ServiceC {
    private final SingletonCImpl singletonCImpl;

    private final ServiceCImpl serviceCImpl = this;

    private ServiceCImpl(SingletonCImpl singletonCImpl, Service serviceParam) {
      this.singletonCImpl = singletonCImpl;


    }
  }

  private static final class SingletonCImpl extends OneIdApp_HiltComponents.SingletonC {
    private final ApplicationContextModule applicationContextModule;

    private final SingletonCImpl singletonCImpl = this;

    private Provider<ModelDownloader> modelDownloaderProvider;

    private Provider<ConnectivityMonitor> connectivityMonitorProvider;

    private Provider<TotemPreferences> totemPreferencesProvider;

    private Provider<TokenStorage> tokenStorageProvider;

    private Provider<ApiClient> apiClientProvider;

    private Provider<CheckInHttpRepository> checkInHttpRepositoryProvider;

    private Provider<FaceProcessingServiceImpl> faceProcessingServiceImplProvider;

    private Provider<PrintHttpRepository> printHttpRepositoryProvider;

    private Provider<BadgeRenderer> badgeRendererProvider;

    private Provider<PrinterConfigRepository> printerConfigRepositoryProvider;

    private Provider<BrotherSdkPrinter> brotherSdkPrinterProvider;

    private Provider<PrinterConnectionManager> providePrinterConnectionManagerProvider;

    private Provider<PrintCoordinator> printCoordinatorProvider;

    private Provider<AuthHttpRepository> authHttpRepositoryProvider;

    private SingletonCImpl(ApplicationContextModule applicationContextModuleParam) {
      this.applicationContextModule = applicationContextModuleParam;
      initialize(applicationContextModuleParam);

    }

    @SuppressWarnings("unchecked")
    private void initialize(final ApplicationContextModule applicationContextModuleParam) {
      this.modelDownloaderProvider = DoubleCheck.provider(new SwitchingProvider<ModelDownloader>(singletonCImpl, 0));
      this.connectivityMonitorProvider = DoubleCheck.provider(new SwitchingProvider<ConnectivityMonitor>(singletonCImpl, 1));
      this.totemPreferencesProvider = DoubleCheck.provider(new SwitchingProvider<TotemPreferences>(singletonCImpl, 5));
      this.tokenStorageProvider = DoubleCheck.provider(new SwitchingProvider<TokenStorage>(singletonCImpl, 4));
      this.apiClientProvider = DoubleCheck.provider(new SwitchingProvider<ApiClient>(singletonCImpl, 3));
      this.checkInHttpRepositoryProvider = DoubleCheck.provider(new SwitchingProvider<CheckInHttpRepository>(singletonCImpl, 2));
      this.faceProcessingServiceImplProvider = DoubleCheck.provider(new SwitchingProvider<FaceProcessingServiceImpl>(singletonCImpl, 6));
      this.printHttpRepositoryProvider = DoubleCheck.provider(new SwitchingProvider<PrintHttpRepository>(singletonCImpl, 8));
      this.badgeRendererProvider = DoubleCheck.provider(new SwitchingProvider<BadgeRenderer>(singletonCImpl, 9));
      this.printerConfigRepositoryProvider = DoubleCheck.provider(new SwitchingProvider<PrinterConfigRepository>(singletonCImpl, 10));
      this.brotherSdkPrinterProvider = DoubleCheck.provider(new SwitchingProvider<BrotherSdkPrinter>(singletonCImpl, 12));
      this.providePrinterConnectionManagerProvider = DoubleCheck.provider(new SwitchingProvider<PrinterConnectionManager>(singletonCImpl, 11));
      this.printCoordinatorProvider = DoubleCheck.provider(new SwitchingProvider<PrintCoordinator>(singletonCImpl, 7));
      this.authHttpRepositoryProvider = DoubleCheck.provider(new SwitchingProvider<AuthHttpRepository>(singletonCImpl, 13));
    }

    @Override
    public void injectOneIdApp(OneIdApp oneIdApp) {
      injectOneIdApp2(oneIdApp);
    }

    @Override
    public Set<Boolean> getDisableFragmentGetContextFix() {
      return Collections.<Boolean>emptySet();
    }

    @Override
    public ActivityRetainedComponentBuilder retainedComponentBuilder() {
      return new ActivityRetainedCBuilder(singletonCImpl);
    }

    @Override
    public ServiceComponentBuilder serviceComponentBuilder() {
      return new ServiceCBuilder(singletonCImpl);
    }

    @CanIgnoreReturnValue
    private OneIdApp injectOneIdApp2(OneIdApp instance) {
      OneIdApp_MembersInjector.injectModelDownloader(instance, modelDownloaderProvider.get());
      return instance;
    }

    private static final class SwitchingProvider<T> implements Provider<T> {
      private final SingletonCImpl singletonCImpl;

      private final int id;

      SwitchingProvider(SingletonCImpl singletonCImpl, int id) {
        this.singletonCImpl = singletonCImpl;
        this.id = id;
      }

      @SuppressWarnings("unchecked")
      @Override
      public T get() {
        switch (id) {
          case 0: // com.oneid.totem.data.service.ModelDownloader 
          return (T) new ModelDownloader(ApplicationContextModule_ProvideContextFactory.provideContext(singletonCImpl.applicationContextModule));

          case 1: // com.oneid.totem.presentation.util.ConnectivityMonitor 
          return (T) new ConnectivityMonitor(ApplicationContextModule_ProvideContextFactory.provideContext(singletonCImpl.applicationContextModule));

          case 2: // com.oneid.totem.data.repository.http.CheckInHttpRepository 
          return (T) new CheckInHttpRepository(singletonCImpl.apiClientProvider.get());

          case 3: // com.oneid.totem.data.api.ApiClient 
          return (T) new ApiClient(singletonCImpl.tokenStorageProvider.get());

          case 4: // com.oneid.totem.data.local.TokenStorage 
          return (T) new TokenStorage(singletonCImpl.totemPreferencesProvider.get());

          case 5: // com.oneid.totem.data.local.TotemPreferences 
          return (T) new TotemPreferences(ApplicationContextModule_ProvideContextFactory.provideContext(singletonCImpl.applicationContextModule));

          case 6: // com.oneid.totem.data.service.FaceProcessingServiceImpl 
          return (T) new FaceProcessingServiceImpl(ApplicationContextModule_ProvideContextFactory.provideContext(singletonCImpl.applicationContextModule), singletonCImpl.modelDownloaderProvider.get());

          case 7: // com.oneid.totem.data.print.PrintCoordinator 
          return (T) new PrintCoordinator(singletonCImpl.printHttpRepositoryProvider.get(), singletonCImpl.badgeRendererProvider.get(), singletonCImpl.printerConfigRepositoryProvider.get(), singletonCImpl.providePrinterConnectionManagerProvider.get());

          case 8: // com.oneid.totem.data.repository.http.PrintHttpRepository 
          return (T) new PrintHttpRepository(singletonCImpl.apiClientProvider.get());

          case 9: // com.oneid.totem.data.print.BadgeRenderer 
          return (T) new BadgeRenderer();

          case 10: // com.oneid.totem.data.print.PrinterConfigRepository 
          return (T) new PrinterConfigRepository(singletonCImpl.tokenStorageProvider.get(), singletonCImpl.totemPreferencesProvider.get());

          case 11: // com.oneid.totem.data.print.PrinterConnectionManager 
          return (T) PrinterConfigModule_ProvidePrinterConnectionManagerFactory.providePrinterConnectionManager(singletonCImpl.brotherSdkPrinterProvider.get());

          case 12: // com.oneid.totem.data.print.BrotherSdkPrinter 
          return (T) new BrotherSdkPrinter(ApplicationContextModule_ProvideContextFactory.provideContext(singletonCImpl.applicationContextModule));

          case 13: // com.oneid.totem.data.repository.http.AuthHttpRepository 
          return (T) new AuthHttpRepository(singletonCImpl.apiClientProvider.get(), singletonCImpl.tokenStorageProvider.get(), singletonCImpl.totemPreferencesProvider.get());

          default: throw new AssertionError(id);
        }
      }
    }
  }
}
