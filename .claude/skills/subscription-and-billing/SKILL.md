---
name: subscription-and-billing
description: Enforces plan limits, feature access, and subscription lifecycle.
---

# Rules

## Always Validate

- Organization has active subscription
- Feature is enabled

## Use

- PlanFeature for feature flags

## Anti-Patterns

- Hardcoding limits
- Ignoring subscription expiration
