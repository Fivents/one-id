package com.oneid.totem;

import android.app.Activity;
import android.app.Service;
import android.view.View;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.SavedStateHandle;
import androidx.lifecycle.ViewModel;
import com.oneid.totem.data.db.ActiveEventResolver;
import com.oneid.totem.data.db.CheckInDao;
import com.oneid.totem.data.db.DatabaseManager;
import com.oneid.totem.data.db.DatabaseModule_ProvideActiveEventResolverFactory;
import com.oneid.totem.data.db.DatabaseModule_ProvideCheckInDaoFactory;
import com.oneid.totem.data.db.DatabaseModule_ProvideDatabaseManagerFactory;
import com.oneid.totem.data.db.DatabaseModule_ProvideFaceDaoFactory;
import com.oneid.totem.data.db.DatabaseModule_ProvidePrintDaoFactory;
import com.oneid.totem.data.db.DatabaseModule_ProvideSelfRegisterDaoFactory;
import com.oneid.totem.data.db.FaceDao;
import com.oneid.totem.data.db.PrintDao;
import com.oneid.totem.data.db.SelfRegisterDao;
import com.oneid.totem.data.local.TotemPreferences;
import com.oneid.totem.data.print.BadgeRenderer;
import com.oneid.totem.data.print.LocalBadgeHtmlRenderer;
import com.oneid.totem.data.print.PrintCoordinator;
import com.oneid.totem.data.repository.impl.AuthRepositoryImpl;
import com.oneid.totem.data.repository.impl.CheckInRepositoryImpl;
import com.oneid.totem.data.repository.impl.PrintRepositoryImpl;
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
      return LazyClassKeyMap.<Boolean>of(MapBuilder.<String, Boolean>newMapBuilder(7).put(CodeCheckInViewModel_HiltModules_KeyModule_Provide_LazyMapKey.lazyClassKeyName, CodeCheckInViewModel_HiltModules.KeyModule.provide()).put(FaceCheckInViewModel_HiltModules_KeyModule_Provide_LazyMapKey.lazyClassKeyName, FaceCheckInViewModel_HiltModules.KeyModule.provide()).put(FeedbackViewModel_HiltModules_KeyModule_Provide_LazyMapKey.lazyClassKeyName, FeedbackViewModel_HiltModules.KeyModule.provide()).put(LoginViewModel_HiltModules_KeyModule_Provide_LazyMapKey.lazyClassKeyName, LoginViewModel_HiltModules.KeyModule.provide()).put(MethodViewModel_HiltModules_KeyModule_Provide_LazyMapKey.lazyClassKeyName, MethodViewModel_HiltModules.KeyModule.provide()).put(QrCheckInViewModel_HiltModules_KeyModule_Provide_LazyMapKey.lazyClassKeyName, QrCheckInViewModel_HiltModules.KeyModule.provide()).put(SelfRegisterViewModel_HiltModules_KeyModule_Provide_LazyMapKey.lazyClassKeyName, SelfRegisterViewModel_HiltModules.KeyModule.provide()).build());
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
      this.qrCheckInViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 5);
      this.selfRegisterViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 6);
    }

    @Override
    public Map<Class<?>, javax.inject.Provider<ViewModel>> getHiltViewModelMap() {
      return LazyClassKeyMap.<javax.inject.Provider<ViewModel>>of(MapBuilder.<String, javax.inject.Provider<ViewModel>>newMapBuilder(7).put(CodeCheckInViewModel_HiltModules_BindsModule_Binds_LazyMapKey.lazyClassKeyName, ((Provider) codeCheckInViewModelProvider)).put(FaceCheckInViewModel_HiltModules_BindsModule_Binds_LazyMapKey.lazyClassKeyName, ((Provider) faceCheckInViewModelProvider)).put(FeedbackViewModel_HiltModules_BindsModule_Binds_LazyMapKey.lazyClassKeyName, ((Provider) feedbackViewModelProvider)).put(LoginViewModel_HiltModules_BindsModule_Binds_LazyMapKey.lazyClassKeyName, ((Provider) loginViewModelProvider)).put(MethodViewModel_HiltModules_BindsModule_Binds_LazyMapKey.lazyClassKeyName, ((Provider) methodViewModelProvider)).put(QrCheckInViewModel_HiltModules_BindsModule_Binds_LazyMapKey.lazyClassKeyName, ((Provider) qrCheckInViewModelProvider)).put(SelfRegisterViewModel_HiltModules_BindsModule_Binds_LazyMapKey.lazyClassKeyName, ((Provider) selfRegisterViewModelProvider)).build());
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
          return (T) new CodeCheckInViewModel(singletonCImpl.checkInRepositoryImplProvider.get());

          case 1: // com.oneid.totem.presentation.screens.checkin.face.FaceCheckInViewModel 
          return (T) new FaceCheckInViewModel(singletonCImpl.checkInRepositoryImplProvider.get(), singletonCImpl.faceProcessingServiceImplProvider.get());

          case 2: // com.oneid.totem.presentation.screens.feedback.FeedbackViewModel 
          return (T) new FeedbackViewModel(singletonCImpl.printCoordinatorProvider.get());

          case 3: // com.oneid.totem.presentation.screens.login.LoginViewModel 
          return (T) new LoginViewModel(singletonCImpl.authRepositoryImplProvider.get());

          case 4: // com.oneid.totem.presentation.screens.method.MethodViewModel 
          return (T) new MethodViewModel(singletonCImpl.authRepositoryImplProvider.get(), singletonCImpl.modelDownloaderProvider.get());

          case 5: // com.oneid.totem.presentation.screens.checkin.qr.QrCheckInViewModel 
          return (T) new QrCheckInViewModel(singletonCImpl.checkInRepositoryImplProvider.get());

          case 6: // com.oneid.totem.presentation.screens.selfregister.SelfRegisterViewModel 
          return (T) new SelfRegisterViewModel(singletonCImpl.checkInRepositoryImplProvider.get());

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

    private Provider<DatabaseManager> provideDatabaseManagerProvider;

    private Provider<TotemPreferences> totemPreferencesProvider;

    private Provider<ModelDownloader> modelDownloaderProvider;

    private Provider<ConnectivityMonitor> connectivityMonitorProvider;

    private Provider<CheckInDao> provideCheckInDaoProvider;

    private Provider<FaceDao> provideFaceDaoProvider;

    private Provider<SelfRegisterDao> provideSelfRegisterDaoProvider;

    private Provider<ActiveEventResolver> provideActiveEventResolverProvider;

    private Provider<CheckInRepositoryImpl> checkInRepositoryImplProvider;

    private Provider<FaceProcessingServiceImpl> faceProcessingServiceImplProvider;

    private Provider<PrintDao> providePrintDaoProvider;

    private Provider<LocalBadgeHtmlRenderer> localBadgeHtmlRendererProvider;

    private Provider<PrintRepositoryImpl> printRepositoryImplProvider;

    private Provider<BadgeRenderer> badgeRendererProvider;

    private Provider<PrintCoordinator> printCoordinatorProvider;

    private Provider<AuthRepositoryImpl> authRepositoryImplProvider;

    private SingletonCImpl(ApplicationContextModule applicationContextModuleParam) {
      this.applicationContextModule = applicationContextModuleParam;
      initialize(applicationContextModuleParam);

    }

    @SuppressWarnings("unchecked")
    private void initialize(final ApplicationContextModule applicationContextModuleParam) {
      this.provideDatabaseManagerProvider = DoubleCheck.provider(new SwitchingProvider<DatabaseManager>(singletonCImpl, 0));
      this.totemPreferencesProvider = DoubleCheck.provider(new SwitchingProvider<TotemPreferences>(singletonCImpl, 1));
      this.modelDownloaderProvider = DoubleCheck.provider(new SwitchingProvider<ModelDownloader>(singletonCImpl, 2));
      this.connectivityMonitorProvider = DoubleCheck.provider(new SwitchingProvider<ConnectivityMonitor>(singletonCImpl, 3));
      this.provideCheckInDaoProvider = DoubleCheck.provider(new SwitchingProvider<CheckInDao>(singletonCImpl, 5));
      this.provideFaceDaoProvider = DoubleCheck.provider(new SwitchingProvider<FaceDao>(singletonCImpl, 6));
      this.provideSelfRegisterDaoProvider = DoubleCheck.provider(new SwitchingProvider<SelfRegisterDao>(singletonCImpl, 7));
      this.provideActiveEventResolverProvider = DoubleCheck.provider(new SwitchingProvider<ActiveEventResolver>(singletonCImpl, 8));
      this.checkInRepositoryImplProvider = DoubleCheck.provider(new SwitchingProvider<CheckInRepositoryImpl>(singletonCImpl, 4));
      this.faceProcessingServiceImplProvider = DoubleCheck.provider(new SwitchingProvider<FaceProcessingServiceImpl>(singletonCImpl, 9));
      this.providePrintDaoProvider = DoubleCheck.provider(new SwitchingProvider<PrintDao>(singletonCImpl, 12));
      this.localBadgeHtmlRendererProvider = DoubleCheck.provider(new SwitchingProvider<LocalBadgeHtmlRenderer>(singletonCImpl, 13));
      this.printRepositoryImplProvider = DoubleCheck.provider(new SwitchingProvider<PrintRepositoryImpl>(singletonCImpl, 11));
      this.badgeRendererProvider = DoubleCheck.provider(new SwitchingProvider<BadgeRenderer>(singletonCImpl, 14));
      this.printCoordinatorProvider = DoubleCheck.provider(new SwitchingProvider<PrintCoordinator>(singletonCImpl, 10));
      this.authRepositoryImplProvider = DoubleCheck.provider(new SwitchingProvider<AuthRepositoryImpl>(singletonCImpl, 15));
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

    private OneIdApp injectOneIdApp2(OneIdApp instance) {
      OneIdApp_MembersInjector.injectDatabaseManager(instance, provideDatabaseManagerProvider.get());
      OneIdApp_MembersInjector.injectPrefs(instance, totemPreferencesProvider.get());
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
          case 0: // com.oneid.totem.data.db.DatabaseManager 
          return (T) DatabaseModule_ProvideDatabaseManagerFactory.provideDatabaseManager();

          case 1: // com.oneid.totem.data.local.TotemPreferences 
          return (T) new TotemPreferences(ApplicationContextModule_ProvideContextFactory.provideContext(singletonCImpl.applicationContextModule));

          case 2: // com.oneid.totem.data.service.ModelDownloader 
          return (T) new ModelDownloader(ApplicationContextModule_ProvideContextFactory.provideContext(singletonCImpl.applicationContextModule));

          case 3: // com.oneid.totem.presentation.util.ConnectivityMonitor 
          return (T) new ConnectivityMonitor(ApplicationContextModule_ProvideContextFactory.provideContext(singletonCImpl.applicationContextModule));

          case 4: // com.oneid.totem.data.repository.impl.CheckInRepositoryImpl 
          return (T) new CheckInRepositoryImpl(singletonCImpl.provideCheckInDaoProvider.get(), singletonCImpl.provideFaceDaoProvider.get(), singletonCImpl.provideSelfRegisterDaoProvider.get(), singletonCImpl.provideActiveEventResolverProvider.get(), singletonCImpl.provideDatabaseManagerProvider.get(), singletonCImpl.totemPreferencesProvider.get());

          case 5: // com.oneid.totem.data.db.CheckInDao 
          return (T) DatabaseModule_ProvideCheckInDaoFactory.provideCheckInDao(singletonCImpl.provideDatabaseManagerProvider.get());

          case 6: // com.oneid.totem.data.db.FaceDao 
          return (T) DatabaseModule_ProvideFaceDaoFactory.provideFaceDao(singletonCImpl.provideDatabaseManagerProvider.get());

          case 7: // com.oneid.totem.data.db.SelfRegisterDao 
          return (T) DatabaseModule_ProvideSelfRegisterDaoFactory.provideSelfRegisterDao(singletonCImpl.provideDatabaseManagerProvider.get());

          case 8: // com.oneid.totem.data.db.ActiveEventResolver 
          return (T) DatabaseModule_ProvideActiveEventResolverFactory.provideActiveEventResolver(singletonCImpl.provideDatabaseManagerProvider.get());

          case 9: // com.oneid.totem.data.service.FaceProcessingServiceImpl 
          return (T) new FaceProcessingServiceImpl(ApplicationContextModule_ProvideContextFactory.provideContext(singletonCImpl.applicationContextModule), singletonCImpl.modelDownloaderProvider.get());

          case 10: // com.oneid.totem.data.print.PrintCoordinator 
          return (T) new PrintCoordinator(ApplicationContextModule_ProvideContextFactory.provideContext(singletonCImpl.applicationContextModule), singletonCImpl.printRepositoryImplProvider.get(), singletonCImpl.badgeRendererProvider.get(), singletonCImpl.totemPreferencesProvider.get());

          case 11: // com.oneid.totem.data.repository.impl.PrintRepositoryImpl 
          return (T) new PrintRepositoryImpl(singletonCImpl.providePrintDaoProvider.get(), singletonCImpl.localBadgeHtmlRendererProvider.get(), singletonCImpl.provideDatabaseManagerProvider.get(), singletonCImpl.totemPreferencesProvider.get());

          case 12: // com.oneid.totem.data.db.PrintDao 
          return (T) DatabaseModule_ProvidePrintDaoFactory.providePrintDao(singletonCImpl.provideDatabaseManagerProvider.get());

          case 13: // com.oneid.totem.data.print.LocalBadgeHtmlRenderer 
          return (T) new LocalBadgeHtmlRenderer();

          case 14: // com.oneid.totem.data.print.BadgeRenderer 
          return (T) new BadgeRenderer(ApplicationContextModule_ProvideContextFactory.provideContext(singletonCImpl.applicationContextModule));

          case 15: // com.oneid.totem.data.repository.impl.AuthRepositoryImpl 
          return (T) new AuthRepositoryImpl(singletonCImpl.provideActiveEventResolverProvider.get(), singletonCImpl.totemPreferencesProvider.get());

          default: throw new AssertionError(id);
        }
      }
    }
  }
}
