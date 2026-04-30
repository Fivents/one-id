---
name: device-session-management
description: Manages secure sessions for devices such as totems, including authentication, expiration, and isolation from user sessions.
---

# Device Session Management

## Instructions

When handling device sessions:

1. Authenticate device using secure credential (accessCode)
2. Generate session token (hashed)
3. Store session with expiration
4. Validate session on every request

## Rules

- Device sessions must be isolated from user sessions
- Always validate expiration (expiresAt)
- Bind session to device (totemId)

## Security

- Use token hashing (never store raw tokens)
- Validate IP and userAgent if needed
- Revoke sessions on suspicious activity

## Anti-Patterns

- Reusing user session logic for devices
- Long-lived sessions without expiration
- Missing session validation

## Example

Totem logs in → creates TotemSession → used for check-in operations.
