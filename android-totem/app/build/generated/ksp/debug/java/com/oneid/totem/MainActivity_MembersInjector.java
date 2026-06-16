package com.oneid.totem;

import com.oneid.totem.presentation.util.ConnectivityMonitor;
import dagger.MembersInjector;
import dagger.internal.DaggerGenerated;
import dagger.internal.InjectedFieldSignature;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import javax.annotation.processing.Generated;

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
public final class MainActivity_MembersInjector implements MembersInjector<MainActivity> {
  private final Provider<ConnectivityMonitor> connectivityMonitorProvider;

  public MainActivity_MembersInjector(Provider<ConnectivityMonitor> connectivityMonitorProvider) {
    this.connectivityMonitorProvider = connectivityMonitorProvider;
  }

  public static MembersInjector<MainActivity> create(
      Provider<ConnectivityMonitor> connectivityMonitorProvider) {
    return new MainActivity_MembersInjector(connectivityMonitorProvider);
  }

  public static MembersInjector<MainActivity> create(
      javax.inject.Provider<ConnectivityMonitor> connectivityMonitorProvider) {
    return new MainActivity_MembersInjector(Providers.asDaggerProvider(connectivityMonitorProvider));
  }

  @Override
  public void injectMembers(MainActivity instance) {
    injectConnectivityMonitor(instance, connectivityMonitorProvider.get());
  }

  @InjectedFieldSignature("com.oneid.totem.MainActivity.connectivityMonitor")
  public static void injectConnectivityMonitor(MainActivity instance,
      ConnectivityMonitor connectivityMonitor) {
    instance.connectivityMonitor = connectivityMonitor;
  }
}
