# OneID

Plataforma de credenciamento com check-in multimodal (Face, QR e Código) para eventos.

## Stack

- Next.js App Router
- Prisma + PostgreSQL (pgvector)
- Transformers.js para extração facial ArcFace no cliente

## Configuração

1. Instale dependências:

```bash
pnpm install
```

2. Gere o client Prisma:

```bash
pnpm prisma generate
```

3. Rode a aplicação:

```bash
pnpm dev
```

## Modelos de IA em `public/` (download reproduzível)

Este README documenta somente os modelos de IA salvos localmente em `public/models`.

Modelos usados hoje:

- `public/models/arcface/onnx/model.onnx` (embedding facial ArcFace, 512d)
- `public/models/mediapipe/blaze_face_short_range.tflite` (detecção facial MediaPipe no navegador)

### Download automático de todos os modelos

```bash
mkdir -p public/models/arcface/onnx public/models/mediapipe

curl -L "https://huggingface.co/onnx-community/arcface-onnx/resolve/main/arcface.onnx" \
	-o public/models/arcface/onnx/model.onnx

curl -L "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite" \
	-o public/models/mediapipe/blaze_face_short_range.tflite
```

### Variáveis opcionais de caminho

```bash
NEXT_PUBLIC_ARCFACE_ONNX_PATH=/models/arcface/onnx/model.onnx
NEXT_PUBLIC_MEDIAPIPE_FACE_DETECTOR_MODEL_PATH=/models/mediapipe/blaze_face_short_range.tflite
```

## Fluxo de Totem

Rotas do novo fluxo dedicado:

- `/totem` login do totem
- `/totem/method` seleção de método habilitado no evento
- `/totem/face` check-in por reconhecimento facial
- `/totem/qr` check-in por QR
- `/totem/code` check-in por código

Após resultado (sucesso/erro), o totem retorna automaticamente para seleção de método em 3 segundos.

## Check-in multimodal

Regras aplicadas no backend:

- Escopo por evento ativo do totem
- Respeito aos flags do evento: `faceEnabled`, `qrEnabled`, `codeEnabled`
- Threshold facial vindo de `event_ai_configs.confidence_threshold`
- Lookup de QR/Código no participante do evento (com fallback para credenciais da pessoa vinculada)

## Observações

- Sem chamadas para APIs externas de IA no fluxo de reconhecimento.
- O código legado de runtime facial baseado em worker foi removido.
