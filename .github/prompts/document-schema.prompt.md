---
mode: 'agent'
description: 'Create a PRD for a given feature'
---

# Rule: Documenting the data schema defined by a PRD

## Goal

To guide an AI assistant in creating a detailed data schema document in Markdown format, based on a Product Requirements Document (PRD). The schema should be clear, actionable, and suitable for a junior developer to understand and implement the data structure.  It should be plain language and possible for a non-technical person to understand with descriptions of the fields

## Process

1.  **Receive Initial Prompt:** The user provides a PRD.
2.  **Generate schema:** Based on the initial prompt generate a schema.
3.  **Save PRD:** Save the generated document as `${input:feature}-schema.md` inside the `/docs/${input:feature}/` directory.


## Target Audience

Assume the primary reader of the PRD is a **junior developer**. Therefore, requirements should be explicit, unambiguous, and avoid jargon where possible. Provide enough detail for them to understand the feature's purpose and core logic.