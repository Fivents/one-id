---
name: ai-threshold-tuning
description: Tunes AI confidence thresholds and detection parameters to balance false positives and false negatives. Use for facial recognition and event AI configuration.
---

# AI Threshold Tuning

## Instructions

When working with AI thresholds:

1. Identify the model output (confidence score)
2. Define acceptable false positive rate
3. Define acceptable false negative rate
4. Adjust threshold accordingly

## Rules

- Higher threshold → fewer false positives, more false negatives
- Lower threshold → more matches, higher risk of incorrect matches

## For Facial Recognition

- Use EventAIConfig:
  - confidenceThreshold
  - maxFaces
  - minFaceSize
- Validate real-world conditions (lighting, camera angle)

## Validation Strategy

- Test with:
  - known matches
  - known non-matches
- Measure:
  - precision
  - recall

## Anti-Patterns

- Using fixed threshold for all events
- Ignoring environment differences
- Accepting low-confidence matches

## Example

Adjust threshold from 0.75 → 0.85 for high-security events.
