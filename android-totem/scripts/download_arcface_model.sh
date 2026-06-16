#!/bin/bash
# Downloads ArcFace MobileFaceNet ONNX model for the Android totem app.
# Places it in app/src/main/assets/ for ONNX Runtime Mobile inference.
set -euo pipefail

MODEL_URL="https://github.com/deepinsight/insightface/releases/download/v0.7/mobilefacenet.onnx"
OUTPUT_DIR="app/src/main/assets"
OUTPUT_FILE="$OUTPUT_DIR/arcface_mobilefacenet.onnx"

mkdir -p "$OUTPUT_DIR"

if [ -f "$OUTPUT_FILE" ]; then
    echo "Model already exists: $OUTPUT_FILE"
    exit 0
fi

echo "Downloading ArcFace MobileFaceNet ONNX model..."
curl -L -o "$OUTPUT_FILE" "$MODEL_URL"

if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(wc -c < "$OUTPUT_FILE")
    echo "Downloaded ($FILE_SIZE bytes) to $OUTPUT_FILE"
else
    echo "ERROR: Download failed. Place the model manually at $OUTPUT_FILE"
    echo "Alternative source: https://github.com/opencv/opencv_zoo/tree/master/models/face_recognition/arcface"
    exit 1
fi
