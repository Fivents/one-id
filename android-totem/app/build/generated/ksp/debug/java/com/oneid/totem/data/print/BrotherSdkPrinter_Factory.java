package com.oneid.totem.data.print;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata("javax.inject.Singleton")
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
public final class BrotherSdkPrinter_Factory implements Factory<BrotherSdkPrinter> {
  @Override
  public BrotherSdkPrinter get() {
    return newInstance();
  }

  public static BrotherSdkPrinter_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static BrotherSdkPrinter newInstance() {
    return new BrotherSdkPrinter();
  }

  private static final class InstanceHolder {
    static final BrotherSdkPrinter_Factory INSTANCE = new BrotherSdkPrinter_Factory();
  }
}
