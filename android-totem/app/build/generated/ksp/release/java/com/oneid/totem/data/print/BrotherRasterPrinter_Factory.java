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
public final class BrotherRasterPrinter_Factory implements Factory<BrotherRasterPrinter> {
  @Override
  public BrotherRasterPrinter get() {
    return newInstance();
  }

  public static BrotherRasterPrinter_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static BrotherRasterPrinter newInstance() {
    return new BrotherRasterPrinter();
  }

  private static final class InstanceHolder {
    static final BrotherRasterPrinter_Factory INSTANCE = new BrotherRasterPrinter_Factory();
  }
}
