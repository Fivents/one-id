# Facial Recognition Models Setup

## Required Models

For the facial recognition pipeline to work, you need to download the following ONNX models:

### 1. Face Detection — SCRFD (InsightFace)

Download from InsightFace model zoo:

- **Model**: `scrfd_10g_bnkps.onnx` (SCRFD 10G with keypoints)
- **Size**: ~15 MB
- **Input**: 640x640 RGB image
- **Output**: Bounding boxes + 5 landmarks (eyes, nose, mouth corners)

```bash
# Download from InsightFace
wget https://github.com/deepinsight/insightface/releases/download/v0.7/scrfd_10g_bnkps.onnx -O public/models/scrfd_10g_bnkps.onnx
```

Alternatively, use the lighter model:

- **Model**: `scrfd_2.5g_bnkps.onnx` (faster, slightly less accurate)
- **Size**: ~3 MB

### 2. Face Recognition — ArcFace (InsightFace Buffalo)

Download from InsightFace model zoo:

- **Model**: `w600k_r50.onnx` (ResNet50, WebFace600K trained)
- **Size**: ~166 MB
- **Input**: 112x112 aligned face image
- **Output**: 512-dimensional embedding vector

```bash
# Download from InsightFace
wget https://github.com/deepinsight/insightface/releases/download/v0.7/w600k_r50.onnx -O public/models/w600k_r50.onnx
```

For totems (faster inference), use the smaller model:

- **Model**: `w600k_mbf.onnx` (MobileFaceNet, lighter)
- **Size**: ~12 MB

### 3. Anti-Spoofing / Liveness — Silent-Face-Anti-Spoofing

For liveness detection, we use Human.js built-in anti-spoofing with multi-frame analysis:

- Blink detection (eye tracking)
- Head movement detection
- Texture analysis

No additional model download required — uses `@vladmandic/human` antispoof.bin.

## Directory Structure

```
public/models/
├── scrfd_10g_bnkps.onnx    # Face detection (InsightFace SCRFD)
├── w600k_r50.onnx          # Face recognition (InsightFace ArcFace)
└── README.md               # This file
```

## Model Sources

All models are from [InsightFace](https://github.com/deepinsight/insightface) and are licensed under MIT License.

- SCRFD Paper: https://arxiv.org/abs/2105.04714
- ArcFace Paper: https://arxiv.org/abs/1801.07698

## Alternative: Use CDN

If you prefer to load models from CDN instead of hosting locally:

```typescript
const MODELS_CDN = 'https://cdn.jsdelivr.net/gh/nicehero/nicefaceonnx@main/models';
// or
const MODELS_CDN = 'https://raw.githubusercontent.com/nicehero/nicefaceonnx/main/models';
```

## Verification

After downloading, verify the models:

```bash
# Check file sizes
ls -la public/models/

# Expected:
# scrfd_10g_bnkps.onnx  ~15 MB
# w600k_r50.onnx        ~166 MB
```

## Next Steps

1. Run `pnpm dev` to start the development server
2. Navigate to `/totem/debug` to test face detection
3. Check browser console for model loading status
