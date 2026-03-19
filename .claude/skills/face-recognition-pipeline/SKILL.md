---
name: face-recognition-pipeline
description: Implements and validates the facial recognition check-in pipeline including embedding matching and validation.
---

# Flow

1. Capture face
2. Generate embedding
3. Compare with stored embeddings
4. Apply confidence threshold
5. Validate constraints
6. Register check-in

## Constraints

- Respect EventAIConfig
- Avoid duplicate check-ins
- Enforce cooldown if needed

## Anti-Patterns

- Accepting low confidence matches
- Ignoring event context
