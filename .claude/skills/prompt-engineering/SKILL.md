---
name: prompt-engineering
description: Designs and optimizes prompts for Claude models ensuring clarity, structure, and token efficiency. Use when generating or improving prompts for APIs, workflows, or automation.
---

# Prompt Engineering

## Instructions

When creating or improving prompts:

1. Define clear objective
2. Specify output format explicitly
3. Provide structured sections:
   - context
   - instructions
   - constraints
4. Use examples (few-shot) when needed
5. Minimize unnecessary context (token efficiency)
6. Use step-by-step reasoning for complex tasks
7. Assign a role if helpful (e.g., "You are a senior backend engineer")

## Techniques

- Use structured blocks (XML or markdown sections)
- Prefer explicit instructions over implicit assumptions
- Include edge cases
- Guide output format strictly (JSON, SQL, etc.)

## Anti-Patterns

- Vague prompts
- Missing output format
- Overly long context
- No examples when task is complex

## Examples

### Example 1

Create a prompt that extracts structured JSON from text input.

### Example 2

Improve a vague prompt into a production-ready one.
