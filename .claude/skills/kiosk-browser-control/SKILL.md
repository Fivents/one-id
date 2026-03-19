---
name: kiosk-browser-control
description: Enforces secure kiosk mode in browsers to restrict user actions on physical totems and prevent unauthorized interaction.
---

# Kiosk Browser Control

## Instructions

When implementing kiosk mode:

1. Run browser in kiosk/fullscreen mode
2. Disable navigation controls:
   - back button
   - address bar
   - context menu
3. Prevent keyboard shortcuts:
   - ALT+TAB
   - CTRL+W
   - F12 (dev tools)

## Frontend Controls

- Disable right-click
- Block key events
- Prevent page exit

## Backend Safeguards

- Validate all actions server-side
- Do not trust UI restrictions alone

## OS-Level (Recommended)

- Use Chrome kiosk mode:
  --kiosk
  --disable-infobars
  --no-first-run

## Anti-Patterns

- Relying only on frontend restrictions
- Allowing navigation outside app
- Exposing system UI

## Example

Totem runs locked browser → user cannot exit or access system.
