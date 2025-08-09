---
mode: 'agent'
description: 'Create a PRD for a given feature'
---

# Rule: Generating a Product Requirements Document (PRD)

## Goal

To guide an AI assistant in creating a detailed Product Requirements Document (PRD) in Markdown format, based on an initial user prompt. The PRD should be clear, actionable, and suitable for a junior developer to understand and implement the feature.

## Process

1.  **Receive Initial Prompt:** The user provides a brief description or request for a new feature or functionality.
2.  **Ask Clarifying Questions:** Before writing the PRD, the AI *must* ask clarifying questions to gather sufficient detail. The goal is to understand the "what" and "why" of the feature, not necessarily the "how" (which the developer will figure out).  You will ask as many questions as required to gain the context required, one at a time to get what you need.  You will answer each question based on what you know of the project and sensible options, present your answer and allow me to edit or approve your understanding before moving onto the next question.  You will think deeply on the answer of each question and its context and implications before asking the next question.
3.  **Generate PRD:** Based on the initial prompt and the user's answers to the clarifying questions, generate a PRD using the structure outlined below.
4.  **Save PRD:** Save the generated document as `${input:feature}-prd.md` inside the `/docs/${input:feature}/` directory.
5.  **Create a log:** Create a markdown file `${input:feature}-log.md` in `/docs/${input:feature}/` directory which will serve as the log for the PRD.  Ensure that creation of the PRD is logged as the first entry.

## PRD Structure

The generated PRD should include the following sections:

1.  **Introduction/Overview:** Briefly describe the feature and the problem it solves. State the goal.
2.  **Goals:** List the specific, measurable objectives for this feature.
3.  **User Stories:** Detail the user narratives describing feature usage and benefits.
4.  **Functional Requirements:** List the specific functionalities the feature must have. Use clear, concise language (e.g., "The system must allow users to upload a profile picture."). Number these requirements.
5.  **Non-Goals (Out of Scope):** Clearly state what this feature will *not* include to manage scope.
6.  **Design Considerations (Optional):** Link to mockups, describe UI/UX requirements, or mention relevant components/styles if applicable.
7.  **Technical Considerations (Optional):** Mention any known technical constraints, dependencies, or suggestions (e.g., "Should integrate with the existing Auth module").
8.  **Success Metrics:** How will the success of this feature be measured? (e.g., "Increase user engagement by 10%", "Reduce support tickets related to X").
9.  **Open Questions:** List any remaining questions or areas needing further clarification.

## Target Audience

Assume the primary reader of the PRD is a **junior developer**. Therefore, requirements should be explicit, unambiguous, and avoid jargon where possible. Provide enough detail for them to understand the feature's purpose and core logic.

## Output

*   **Format:** Markdown (`.md`)
*   **Location:** `/docs/${input:feature}`
*   **Filename:** `${input:feature}-prd.md``

## Final instructions

1. Do NOT start implementing the PRD
2. Make sure to ask the user clarifying questions
3. Take the user's answers to the clarifying questions and improve the PRD

## A good example of a PRD

# LLM Playground and Training Tool - Product Requirements Document

## Introduction/Overview

The LLM Playground and Training Tool is a comprehensive educational platform designed to train employees on effective AI usage through hands-on learning experiences. The platform combines structured learning content with interactive AI model testing capabilities, allowing users to learn AI concepts while immediately applying them through a chat interface similar to ChatGPT.

The tool addresses the growing need for AI literacy in the workplace by providing both technical and non-technical employees with practical training on prompt engineering, model differences, AI safety practices, and preparing for AI integration in daily work tasks.

## Goals

1. **Enable Effective AI Education**: Provide a structured learning environment that teaches prompt writing, AI model differences, safety practices, and practical AI integration skills
2. **Support Mixed Audiences**: Accommodate both technical and non-technical users with varying AI experience levels
3. **Facilitate Hands-on Learning**: Combine theoretical content with immediate practical application through integrated chat functionality
4. **Enable Model Comparison**: Allow users to understand differences between AI models through side-by-side testing capabilities
5. **Track Learning Progress**: Monitor user engagement, completion rates, and learning outcomes for training effectiveness
6. **Ensure Scalable Architecture**: Build an extensible system that can easily support multiple AI model vendors beyond the initial OpenAI integration

## User Stories

### Learners
- As a **new employee**, I want to complete AI training courses so that I can understand how to use AI tools effectively in my job
- As a **non-technical user**, I want simplified model parameter controls with presets so that I can experiment with AI without needing deep technical knowledge
- As a **technical user**, I want access to advanced parameter controls so that I can fine-tune AI interactions for specific use cases
- As a **learner**, I want to click on prompt examples in lessons and have them automatically execute so that I can see immediate results
- As a **user**, I want to save my successful prompts as templates so that I can reuse effective prompting strategies
- As a **learner**, I want to compare two different AI models side-by-side with the same prompt so that I can understand their differences
- As a **user**, I want to organize my conversation history by course/module and custom tags so that I can easily find relevant discussions
- As a **learner**, I want to share my conversations with others so that I can demonstrate successful AI interactions or ask for help

### Instructors
- As an **instructor**, I want to create and manage course content with different types of content blocks so that I can build comprehensive AI training programs
- As an **instructor**, I want to track my students' progress and engagement so that I can identify who needs additional support
- As an **instructor**, I want to create custom prompt template collections for my courses so that I can provide targeted examples
- As an **instructor**, I want to view usage analytics to understand which content and models are most effective for learning
- As an **instructor**, I want to set up quizzes and practical exercises within courses so that I can assess student understanding

### Administrators
- As an **admin**, I want to manage user accounts and assign roles so that I can control access to the platform
- As an **admin**, I want to set token limits and rate limits by user role so that I can manage API costs and usage
- As an **admin**, I want to view system-wide analytics so that I can understand overall platform effectiveness and usage patterns
- As an **admin**, I want to configure which AI models are available to different user roles so that I can control access to expensive or advanced models
- As an **admin**, I want to approve user registrations so that I can maintain control over who accesses the platform

## Functional Requirements

### Authentication & User Management
1. The system must support custom user authentication with email/password login
2. The system must support three user roles: Admin, Instructor, and User
3. The system must require admin approval for new user registrations
4. The system must support invite-only account creation by admins
5. The system must provide basic user profile management (name, email, avatar)
6. The system must support department-based user organization
7. The system must be architected to support future SSO integration

### Learning Content Management
8. The system must support hierarchical content organization: Courses → Modules → Lessons
9. The system must support multiple content block types: text, images, code examples, embedded videos, and interactive prompt examples
10. The system must allow prompt examples in content to auto-execute when clicked
11. The system must automatically link chat conversations to the relevant course/module/lesson context
12. The system must support quiz blocks within course content
13. The system must support practical exercises with automatic evaluation
14. The system must provide completion badges for finished courses
15. The system must allow free navigation through content (no enforced sequential completion)

### AI Model Integration
16. The system must integrate with OpenAI models initially (GPT-3.5, GPT-4, etc.)
17. The system must be architected to easily add additional model vendors in the future
18. The system must support configurable model parameters (temperature, max tokens, top-p, etc.)
19. The system must provide preset parameter configurations ("Creative", "Balanced", "Precise")
20. The system must hide advanced parameters by default with option to show them
21. The system must support side-by-side model comparison with the same prompt
22. The system must use default parameters for side-by-side comparisons
23. The system must support real-time chat interactions with WebSocket connections

### Conversation & Session Management
24. The system must save all chat conversations automatically
25. The system must organize conversations by date/time
26. The system must link conversations to associated course/module/lesson content
27. The system must support custom conversation tagging and folder organization
28. The system must allow conversation export in markdown format
29. The system must support conversation sharing with viewable links within the platform
30. The system must maintain conversation history indefinitely (no automatic deletion)

### Prompt Templates & Examples
31. The system must provide a browsable prompt template library
32. The system must allow users to save custom prompt templates
33. The system must categorize prompt templates (e.g., "Creative Writing", "Data Analysis", "Code Generation")
34. The system must support community sharing of successful prompts
35. The system must allow instructors/admins to create course-specific prompt collections

### Rate Limiting & Usage Controls
36. The system must implement configurable rate limits by user role
37. The system must implement daily token limits by user and model
38. The system must track and display current usage against limits
39. The system must prevent API calls when limits are exceeded
40. The system must allow admins to adjust limits per user/role

### Analytics & Reporting
41. The system must track user engagement metrics (time spent, lessons completed, chat interactions)
42. The system must track model usage patterns and parameter preferences
43. The system must track learning progress (course completion rates, time per module)
44. The system must track token consumption and API usage costs
45. The system must identify popular prompts/templates and their success rates
46. The system must provide analytics access to both admins and instructors
47. The system must support real-time notifications for system events

### Administrative Features
48. The system must provide an admin panel for user management
49. The system must allow admins to create, edit, and delete course content
50. The system must allow admins to configure available models per user role
51. The system must provide bulk user management capabilities
52. The system must allow admins to view and manage all user conversations

## Non-Goals (Out of Scope)

- Advanced conversation search functionality (not included in initial version)
- Data retention policies and automated archiving
- Advanced caching layer (Redis) implementation
- Specific security compliance certifications (SOC 2, GDPR)
- Multi-tenant architecture (single-tenant deployment only)
- Integration with external learning management systems
- Advanced user performance analytics beyond basic engagement metrics
- Real-time collaboration features (multiple users in same chat)
- Mobile application development (web-responsive only)
- Advanced AI model fine-tuning capabilities
- Integration with company-specific APIs or databases
- Automated cost optimization features

## Design Considerations

### User Interface
- Clean, modern design similar to ChatGPT for familiar user experience
- Responsive web design for desktop and tablet usage
- Split-screen layout with learning content on left, chat interface on right
- Collapsible content panel for full-screen chat when needed
- Clear visual indicators for different user roles and permissions
- Intuitive navigation between courses, modules, and lessons

### User Experience
- Minimal onboarding process with guided tour for new users
- Progressive disclosure of advanced features based on user role
- Clear visual feedback for rate limits and usage status
- Seamless transition between learning content and chat interaction
- Contextual help and tooltips for complex features

## Technical Considerations

### Architecture
- **Backend**: Node.js with Express framework
- **Frontend**: React with modern hooks and state management
- **Database**: MongoDB for flexible document storage
- **Authentication**: JWT-based authentication system
- **Real-time**: WebSocket support for live chat and notifications
- **Deployment**: Azure cloud platform with Docker containerization

### Scalability
- Modular architecture for easy addition of new model vendors
- Abstracted model interface for consistent API across providers
- Scalable MongoDB schema design for growing user base
- Efficient state management in React for responsive UI
- API rate limiting to prevent abuse and manage costs

### Security
- Secure storage of API keys and sensitive configuration
- Input validation and sanitization for all user inputs
- Role-based access control throughout the application
- Secure session management with appropriate timeouts
- Protection against common web vulnerabilities (XSS, CSRF, etc.)

## Success Metrics

### User Adoption
- **Registration Rate**: Number of users completing registration and approval process
- **Onboarding Completion**: Percentage of approved users who complete initial platform tour
- **First Course Engagement**: Percentage of users who start at least one course within first week

### Learning Effectiveness
- **Course Completion Rate**: Percentage of users who complete at least one full course
- **Module Completion Rate**: Average percentage of modules completed per course
- **Exercise Completion**: Percentage of practical exercises completed successfully
- **Badge Acquisition**: Number of completion badges earned per user

### Platform Engagement
- **Session Duration**: Average time spent per session on the platform
- **Return Usage**: Percentage of users who return to platform within 30 days
- **Chat Interactions**: Average number of AI interactions per user per session
- **Content Engagement**: Time spent viewing learning content vs. time spent in chat

### Feature Utilization
- **Model Comparison Usage**: Percentage of users who try side-by-side model comparison
- **Template Library Usage**: Number of prompt templates used from library vs. custom created
- **Conversation Organization**: Percentage of users who organize conversations with tags/folders
- **Sharing Activity**: Number of conversations shared between users

## Open Questions

1. **Model Selection**: Which specific OpenAI models should be available at launch and how should they be prioritized by user role?

2. **Content Migration**: Is there existing training content that needs to be migrated into the new system format?

3. **Integration Timeline**: What is the expected timeline for adding the second model vendor, and which vendor should be prioritized?

4. **User Capacity**: What is the expected number of concurrent users the system should support at launch?

5. **Backup Strategy**: What are the requirements for data backup and disaster recovery?

6. **Monitoring**: What level of application monitoring and alerting is required for production deployment?

7. **Content Approval**: Should there be a content approval workflow for instructor-created courses before they become available to users?

8. **API Limits**: What are the expected API usage patterns and budget constraints for OpenAI integration?

9. **User Feedback**: Should there be built-in feedback mechanisms for users to rate course content and report issues?

10. **Localization**: Are there any requirements for supporting multiple languages in the interface or content?