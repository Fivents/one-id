package com.oneid.totem.data.print

import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class PrinterModule {

    @Binds
    @Singleton
    abstract fun bindBrotherPrinter(impl: BrotherSdkPrinter): BrotherPrinter
}

@Module
@InstallIn(SingletonComponent::class)
object PrinterConfigModule {

    @Provides
    @Singleton
    fun providePrinterConnectionManager(
        printer: BrotherPrinter,
    ): PrinterConnectionManager = PrinterConnectionManager(printer)
}
