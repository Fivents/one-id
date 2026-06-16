#!/bin/bash
# Downloads and sets up Brother Print SDK for Android.
# Requires: curl, unzip
set -euo pipefail

SDK_URL="https://download.brother.com/pub/com/brotherdriver/printersdk/android/PrintSDKVer10.0.1.zip"
OUTPUT_DIR="app/libs"

mkdir -p "$OUTPUT_DIR"

if ls "$OUTPUT_DIR"/brother*.aar 1>/dev/null 2>&1; then
    echo "Brother SDK AAR already present in $OUTPUT_DIR"
    ls -la "$OUTPUT_DIR"/brother*.aar
    exit 0
fi

echo "Downloading Brother Print SDK for Android..."
echo "URL: $SDK_URL"
echo ""
echo "NOTE: Brother requires acceptance of their EULA for the SDK."
echo "Please download manually from:"
echo "  https://support.brother.com/g/s/es/dev/en/printersdk/index.html"
echo ""
echo "After downloading, extract the ZIP and place the AAR file(s) in:"
echo "  $(pwd)/$OUTPUT_DIR/"
echo ""
echo "Expected files: BrotherPrintSDK.aar (or similar)"

exit 1
