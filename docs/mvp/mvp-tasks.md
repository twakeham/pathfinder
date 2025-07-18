# LLM Playground and Training Tool - Task List

Based  - [x] 1.4 Set up envi  - [x] 1.7 Set up Express server with middleware (CORS, body-parser, Helmet, Morgan)
    - [x] 1.7.1 Create `src/app.js` with Express application setup
    - [x] 1.7.2 Configure CORS middleware with appropriate origins
    - [x] 1.7.3 Add body-parser middleware for JSON and URL-encoded data
    - [x] 1.7.4 Configure Helmet for security headers
    - [x] 1.7.5 Add Morgan for request logging
    - [x] 1.7.6 Create `src/server.js` to start the server configuration (.env files, config management)
    - [x] 1.4.1 Create `.env.example` file with all required environment variables
    - [x] 1.4.2 Create `.env.development` and `.env.production` files
    - [x] 1.4.3 Install and configure dotenv package
    - [x] 1.4.4 Create `src/config/config.js` to centralize environment variable access
    - [x] 1.4.5 Add validation for required environment variablese MVP PRD analysis, here are the high-level tasks required to implement the LLM Playground and Training Tool:

## Relevant Files

- `src/models/user.js` - User model with roles and authentication
- `src/models/course.js` - Course/module/lesson content structure
- `src/models/conversation.js` - Chat conversation storage and organization
- `src/models/promptTemplate.js` - Prompt template library system
- `src/controllers/authController.js` - Authentication and user management logic
- `src/controllers/courseController.js` - Course content management
- `src/controllers/chatController.js` - AI chat interface and model integration
- `src/controllers/adminController.js` - Administrative features and analytics
- `src/middleware/auth.js` - Authentication middleware and role-based access
- `src/middleware/rateLimiter.js` - Rate limiting and usage controls
- `src/services/openaiService.js` - OpenAI API integration service
- `src/services/analyticsService.js` - Analytics and reporting service
- `src/config/database.js` - MongoDB connection and configuration
- `src/routes/api.js` - API route definitions
- `src/websocket/chatSocket.js` - Real-time chat WebSocket handling
- `client/src/components/AuthPages.jsx` - Login, registration, and user management UI
- `client/src/components/CourseViewer.jsx` - Learning content display component
- `client/src/components/ChatInterface.jsx` - AI chat interface component
- `client/src/components/AdminPanel.jsx` - Administrative dashboard
- `client/src/components/Analytics.jsx` - Analytics and reporting UI
- `client/src/utils/apiClient.js` - Frontend API communication utility
- `client/src/contexts/AuthContext.jsx` - Authentication state management
- `tests/unit/models/` - Unit tests for all models
- `tests/unit/controllers/` - Unit tests for all controllers
- `tests/integration/api/` - API integration tests
- `tests/e2e/userflows/` - End-to-end user workflow tests

## Tasks

- [x] 1.0 Project Setup and Foundation
  - [x] 1.1 Initialize Node.js project with package.json and dependencies (Express, MongoDB, JWT, Socket.io, etc.)
    - [x] 1.1.1 Run `npm init -y` to create package.json
    - [x] 1.1.2 Install core dependencies: `npm install express mongoose jsonwebtoken bcryptjs cors helmet morgan`
    - [x] 1.1.3 Install WebSocket dependencies: `npm install socket.io`
    - [x] 1.1.4 Install OpenAI integration: `npm install openai`
    - [x] 1.1.5 Install development dependencies: `npm install --save-dev nodemon jest supertest`
    - [x] 1.1.6 Configure package.json scripts for dev, start, and test
  - [x] 1.2 Set up project folder structure (src/, client/, tests/, docs/, config/)
    - [x] 1.2.1 Create root directories: src/, client/, tests/, docs/, config/
    - [x] 1.2.2 Create src subdirectories: models/, controllers/, middleware/, services/, routes/, websocket/
    - [x] 1.2.3 Create tests subdirectories: unit/, integration/, e2e/
    - [x] 1.2.4 Create config subdirectories for environment-specific configurations
    - [x] 1.2.5 Create docs subdirectories for API documentation and guides
  - [x] 1.3 Configure MongoDB connection and database setup scripts
    - [x] 1.3.1 Create `src/config/database.js` with MongoDB connection logic
    - [x] 1.3.2 Add connection error handling and retry logic
    - [x] 1.3.3 Create database initialization script with collections setup
    - [x] 1.3.4 Add database seeding script for initial admin user
    - [x] 1.3.5 Create database cleanup and reset utilities for testing
  - [x] 1.4 Set up environment configuration (.env files, config management)
    - [x] 1.4.1 Create `.env.example` file with all required environment variables
    - [x] 1.4.2 Create `.env.development` and `.env.production` files
    - [x] 1.4.3 Install and configure dotenv package
    - [x] 1.4.4 Create `src/config/config.js` to centralize environment variable access
    - [x] 1.4.5 Add validation for required environment variables
  - [x] 1.5 Initialize React frontend with Create React App or Vite
    - [x] 1.5.1 Run `npx create-react-app client` or `npm create vite@latest client -- --template react`
    - [x] 1.5.2 Install React dependencies: `npm install react-router-dom axios socket.io-client`
    - [x] 1.5.3 Install UI dependencies: `npm install @mui/material @emotion/react @emotion/styled`
    - [x] 1.5.4 Configure React app structure with src/components/, src/contexts/, src/utils/
    - [x] 1.5.5 Set up React development server proxy to backend
  - [x] 1.6 Configure build scripts and development workflow
    - [x] 1.6.1 Create npm scripts for concurrent frontend/backend development
    - [x] 1.6.2 Install and configure `concurrently` package
    - [x] 1.6.3 Set up nodemon configuration for backend auto-restart
    - [x] 1.6.4 Configure build process for production deployment
    - [x] 1.6.5 Add linting and formatting scripts (ESLint, Prettier)
  - [x] 1.7 Set up basic Express server with middleware (CORS, body-parser, security headers)
    - [x] 1.7.1 Create `src/app.js` with Express application setup
    - [x] 1.7.2 Configure CORS middleware with appropriate origins
    - [x] 1.7.3 Add body-parser middleware for JSON and URL-encoded data
    - [x] 1.7.4 Configure Helmet for security headers
    - [x] 1.7.5 Add Morgan for request logging
    - [x] 1.7.6 Create `src/server.js` to start the server
  - [x] 1.8 Configure WebSocket server for real-time chat functionality
    - [x] 1.8.1 Create `src/websocket/socketServer.js` with Socket.io setup
    - [x] 1.8.2 Integrate WebSocket server with Express server
    - [x] 1.8.3 Add basic connection/disconnection event handlers
    - [x] 1.8.4 Configure CORS for WebSocket connections
    - [x] 1.8.5 Add authentication middleware for WebSocket connections
  - [x] 1.9 Set up testing framework (Jest, Supertest) and basic test structure
    - [x] 1.9.1 Configure Jest in package.json with test environment settings
    - [x] 1.9.2 Create `tests/setup.js` for test database configuration
    - [x] 1.9.3 Create helper utilities for test data creation
    - [x] 1.9.4 Set up test database connection and cleanup scripts
    - [x] 1.9.5 Create sample test files for models, controllers, and routes
  - [x] 1.10 Create Docker configuration for containerization
    - [x] 1.10.1 Create `Dockerfile` for Node.js application
    - [x] 1.10.2 Create `docker-compose.yml` with MongoDB and app services
    - [x] 1.10.3 Create `.dockerignore` file to exclude unnecessary files
    - [x] 1.10.4 Add Docker build and run scripts to package.json
    - [x] 1.10.5 Configure Docker networking for development and production
  - [x] 1.11 Generate comprehensive test cases for project setup and infrastructure
    - [x] 1.11.1 Create tests for database connection and error handling
    - [x] 1.11.2 Create tests for environment configuration loading
    - [x] 1.11.3 Create tests for Express server startup and middleware
    - [x] 1.11.4 Create tests for WebSocket server connection
    - [x] 1.11.5 Create integration tests for full application startup

- [ ] 2.0 Authentication and User Management System
  - [ ] 2.1 Create User model with roles (Admin, Instructor, User) and profile fields
    - [ ] 2.1.1 Create `src/models/user.js` with Mongoose schema
    - [ ] 2.1.2 Define user fields: email, password, firstName, lastName, department, role, isApproved, createdAt
    - [ ] 2.1.3 Add password hashing with bcrypt pre-save middleware
    - [ ] 2.1.4 Create enum validation for roles (Admin, Instructor, User)
    - [ ] 2.1.5 Add unique email validation and error handling
    - [ ] 2.1.6 Create instance methods for password comparison and JWT generation
  - [ ] 2.2 Implement JWT-based authentication system with token generation and validation
    - [ ] 2.2.1 Create `src/services/authService.js` for token operations
    - [ ] 2.2.2 Implement `generateToken()` function with user payload
    - [ ] 2.2.3 Implement `verifyToken()` function with error handling
    - [ ] 2.2.4 Add token refresh functionality
    - [ ] 2.2.5 Configure JWT secret and expiration in environment variables
  - [ ] 2.3 Create registration endpoint with admin approval requirement
    - [ ] 2.3.1 Create `src/controllers/authController.js` with register function
    - [ ] 2.3.2 Add input validation for registration fields
    - [ ] 2.3.3 Check for existing email before creating user
    - [ ] 2.3.4 Create user with `isApproved: false` status
    - [ ] 2.3.5 Send notification to admins about pending approval
    - [ ] 2.3.6 Return appropriate response for pending approval
  - [ ] 2.4 Implement login/logout functionality with secure session management
    - [ ] 2.4.1 Create login function in authController with email/password validation
    - [ ] 2.4.2 Check user approval status before allowing login
    - [ ] 2.4.3 Generate and return JWT token on successful login
    - [ ] 2.4.4 Create logout function to invalidate tokens (if using blacklist)
    - [ ] 2.4.5 Add rate limiting for login attempts
  - [ ] 2.5 Build role-based access control middleware for route protection
    - [ ] 2.5.1 Create `src/middleware/auth.js` with authentication middleware
    - [ ] 2.5.2 Extract and verify JWT from Authorization header
    - [ ] 2.5.3 Attach user information to request object
    - [ ] 2.5.4 Create role-checking middleware functions (requireAdmin, requireInstructor)
    - [ ] 2.5.5 Add error handling for invalid/expired tokens
  - [ ] 2.6 Create admin approval workflow for new user registrations
    - [ ] 2.6.1 Create approval endpoint in authController
    - [ ] 2.6.2 Add function to list pending user approvals
    - [ ] 2.6.3 Implement approve/reject user functionality
    - [ ] 2.6.4 Send email notifications to users about approval status
    - [ ] 2.6.5 Add bulk approval functionality for multiple users
  - [ ] 2.7 Implement invite-only account creation system for admins
    - [ ] 2.7.1 Create invite model to store invitation tokens
    - [ ] 2.7.2 Create invite generation endpoint for admins
    - [ ] 2.7.3 Implement invite email sending with unique links
    - [ ] 2.7.4 Create invite validation and redemption endpoint
    - [ ] 2.7.5 Auto-approve users created through invites
  - [ ] 2.8 Build user profile management (view/edit profile, change password)
    - [ ] 2.8.1 Create profile view endpoint in authController
    - [ ] 2.8.2 Create profile update endpoint with validation
    - [ ] 2.8.3 Implement change password functionality with current password verification
    - [ ] 2.8.4 Add avatar upload functionality (optional)
    - [ ] 2.8.5 Create user activity logging for profile changes
  - [ ] 2.9 Create department-based user organization system
    - [ ] 2.9.1 Create department model with name and description
    - [ ] 2.9.2 Add department reference to user model
    - [ ] 2.9.3 Create department management endpoints
    - [ ] 2.9.4 Add department filtering in user lists
    - [ ] 2.9.5 Implement department-based analytics grouping
  - [ ] 2.10 Design and implement authentication UI components (login, register, profile)
    - [ ] 2.10.1 Create `client/src/components/auth/LoginForm.jsx`
    - [ ] 2.10.2 Create `client/src/components/auth/RegisterForm.jsx`
    - [ ] 2.10.3 Create `client/src/components/auth/ProfilePage.jsx`
    - [ ] 2.10.4 Add form validation with React Hook Form
    - [ ] 2.10.5 Implement loading states and error handling
    - [ ] 2.10.6 Add responsive design with Material-UI components
  - [ ] 2.11 Add password reset functionality via email
    - [ ] 2.11.1 Create password reset token model
    - [ ] 2.11.2 Implement forgot password endpoint
    - [ ] 2.11.3 Send password reset email with secure token
    - [ ] 2.11.4 Create reset password endpoint with token validation
    - [ ] 2.11.5 Add password reset UI components
  - [ ] 2.12 Implement user management dashboard for admins
    - [ ] 2.12.1 Create `client/src/components/admin/UserManagement.jsx`
    - [ ] 2.12.2 Add user list with search and filtering
    - [ ] 2.12.3 Implement user approval/rejection interface
    - [ ] 2.12.4 Add user role modification functionality
    - [ ] 2.12.5 Create user activity monitoring dashboard
  - [ ] 2.13 Generate comprehensive test cases for all authentication and user management functionality
    - [ ] 2.13.1 Create unit tests for User model methods
    - [ ] 2.13.2 Create tests for authService token operations
    - [ ] 2.13.3 Create integration tests for auth endpoints
    - [ ] 2.13.4 Create tests for authentication middleware
    - [ ] 2.13.5 Create e2e tests for complete registration/login flows

- [ ] 3.0 Learning Content Management System
  - [ ] 3.1 Create Course model with hierarchical structure (Courses → Modules → Lessons)
    - [ ] 3.1.1 Create `src/models/course.js` with course schema (title, description, instructor, isPublished)
    - [ ] 3.1.2 Create `src/models/module.js` with module schema (title, description, courseId, order)
    - [ ] 3.1.3 Create `src/models/lesson.js` with lesson schema (title, content blocks, moduleId, order)
    - [ ] 3.1.4 Add virtual populate for course → modules → lessons relationships
    - [ ] 3.1.5 Create indexes for efficient querying by course/module hierarchy
  - [ ] 3.2 Design content block system for multiple types (text, images, code, videos, interactive prompts)
    - [ ] 3.2.1 Define content block schema with type discriminator
    - [ ] 3.2.2 Create TextBlock schema (content, formatting options)
    - [ ] 3.2.3 Create ImageBlock schema (url, alt text, caption)
    - [ ] 3.2.4 Create CodeBlock schema (language, code content, executable flag)
    - [ ] 3.2.5 Create VideoBlock schema (url, provider, duration)
    - [ ] 3.2.6 Create InteractivePromptBlock schema (prompt text, expected output, auto-execute flag)
  - [ ] 3.3 Implement course creation and editing interface for instructors/admins
    - [ ] 3.3.1 Create `src/controllers/courseController.js` with CRUD operations
    - [ ] 3.3.2 Add course creation endpoint with validation
    - [ ] 3.3.3 Implement course editing with module/lesson management
    - [ ] 3.3.4 Create course publishing/unpublishing functionality
    - [ ] 3.3.5 Add course duplication and template features
  - [ ] 3.4 Build lesson content renderer with support for all content block types
    - [ ] 3.4.1 Create `client/src/components/content/ContentBlock.jsx` as base component
    - [ ] 3.4.2 Create `TextBlock.jsx` component with rich text rendering
    - [ ] 3.4.3 Create `ImageBlock.jsx` component with lazy loading
    - [ ] 3.4.4 Create `CodeBlock.jsx` component with syntax highlighting
    - [ ] 3.4.5 Create `VideoBlock.jsx` component with embedded player
    - [ ] 3.4.6 Create `InteractivePromptBlock.jsx` with click-to-execute functionality
  - [ ] 3.5 Create interactive prompt execution system (click-to-run functionality)
    - [ ] 3.5.1 Add prompt execution handler in InteractivePromptBlock
    - [ ] 3.5.2 Integrate with chat system to auto-populate and send prompts
    - [ ] 3.5.3 Add visual indicators for executable prompts
    - [ ] 3.5.4 Create execution history tracking for prompts
    - [ ] 3.5.5 Add success/failure feedback for prompt execution
  - [ ] 3.6 Implement course navigation and progress tracking
    - [ ] 3.6.1 Create user progress model to track lesson completion
    - [ ] 3.6.2 Add navigation sidebar with course structure
    - [ ] 3.6.3 Implement breadcrumb navigation for current location
    - [ ] 3.6.4 Create progress indicators (completion percentage, badges)
    - [ ] 3.6.5 Add next/previous lesson navigation
  - [ ] 3.7 Build quiz and exercise system with automatic evaluation
    - [ ] 3.7.1 Create QuizBlock content type with question schema
    - [ ] 3.7.2 Support multiple question types (multiple choice, true/false, text input)
    - [ ] 3.7.3 Implement automatic scoring for objective questions
    - [ ] 3.7.4 Create manual review system for subjective answers
    - [ ] 3.7.5 Add quiz result storage and analytics
  - [ ] 3.8 Create completion badge system and achievement tracking
    - [ ] 3.8.1 Create badge model with criteria and design metadata
    - [ ] 3.8.2 Define badge types (course completion, quiz scores, engagement)
    - [ ] 3.8.3 Implement badge awarding logic and triggers
    - [ ] 3.8.4 Create user badge collection and display
    - [ ] 3.8.5 Add badge sharing and celebration features
  - [ ] 3.9 Implement free navigation through content (non-sequential access)
    - [ ] 3.9.1 Remove lesson order restrictions in navigation
    - [ ] 3.9.2 Add course content tree for jumping to any lesson
    - [ ] 3.9.3 Implement search within course content
    - [ ] 3.9.4 Create bookmarking system for important lessons
    - [ ] 3.9.5 Add recently viewed lessons quick access
  - [ ] 3.10 Build course browser and search functionality for learners
    - [ ] 3.10.1 Create course catalog page with filtering options
    - [ ] 3.10.2 Implement search functionality across courses and content
    - [ ] 3.10.3 Add course categories and tagging system
    - [ ] 3.10.4 Create course recommendations based on user progress
    - [ ] 3.10.5 Add course enrollment and favorites functionality
  - [ ] 3.11 Create content linking system to associate chats with lessons
    - [ ] 3.11.1 Add lesson context to chat conversations
    - [ ] 3.11.2 Create automatic lesson association when chat is opened from content
    - [ ] 3.11.3 Add lesson reference tags in chat history
    - [ ] 3.11.4 Implement chat filtering by associated lesson/course
    - [ ] 3.11.5 Create lesson-specific chat analytics
  - [ ] 3.12 Design responsive split-screen layout (content left, chat right)
    - [ ] 3.12.1 Create main layout component with resizable panels
    - [ ] 3.12.2 Implement responsive breakpoints for mobile/tablet
    - [ ] 3.12.3 Add panel collapse/expand functionality
    - [ ] 3.12.4 Create full-screen modes for content and chat
    - [ ] 3.12.5 Add layout preference saving per user
  - [ ] 3.13 Generate comprehensive test cases for all learning content management functionality
    - [ ] 3.13.1 Create unit tests for course/module/lesson models
    - [ ] 3.13.2 Create tests for content block rendering components
    - [ ] 3.13.3 Create integration tests for course creation workflow
    - [ ] 3.13.4 Create tests for progress tracking and badge awarding
    - [ ] 3.13.5 Create e2e tests for complete learning journey

- [ ] 4.0 AI Model Integration and Chat Interface
  - [ ] 4.1 Create OpenAI service integration with API key management
    - [ ] 4.1.1 Create `src/services/openaiService.js` with OpenAI client initialization
    - [ ] 4.1.2 Add API key configuration from environment variables
    - [ ] 4.1.3 Implement error handling for API failures and rate limits
    - [ ] 4.1.4 Add request/response logging for debugging
    - [ ] 4.1.5 Create API key validation and health check endpoints
  - [ ] 4.2 Implement configurable model parameters (temperature, max tokens, top-p)
    - [ ] 4.2.1 Create model configuration schema in database
    - [ ] 4.2.2 Add parameter validation and range checking
    - [ ] 4.2.3 Create parameter management UI components
    - [ ] 4.2.4 Implement parameter persistence per user session
    - [ ] 4.2.5 Add parameter reset to defaults functionality
  - [ ] 4.3 Create preset parameter configurations ("Creative", "Balanced", "Precise")
    - [ ] 4.3.1 Define preset configurations in database/config
    - [ ] 4.3.2 Create preset selection UI component
    - [ ] 4.3.3 Implement preset application to model parameters
    - [ ] 4.3.4 Add custom preset creation and saving
    - [ ] 4.3.5 Create preset sharing between users (admin feature)
  - [ ] 4.4 Build chat interface with real-time messaging via WebSockets
    - [ ] 4.4.1 Create `client/src/components/chat/ChatInterface.jsx` main component
    - [ ] 4.4.2 Implement message input component with send functionality
    - [ ] 4.4.3 Create message list component with auto-scroll
    - [ ] 4.4.4 Add WebSocket connection management and event handlers
    - [ ] 4.4.5 Implement typing indicators and connection status
    - [ ] 4.4.6 Add message formatting and markdown rendering
  - [ ] 4.5 Implement conversation storage and automatic saving
    - [ ] 4.5.1 Create `src/models/conversation.js` with message schema
    - [ ] 4.5.2 Add automatic conversation saving on message send
    - [ ] 4.5.3 Implement conversation metadata (title, participants, timestamps)
    - [ ] 4.5.4 Create conversation recovery after disconnection
    - [ ] 4.5.5 Add conversation archiving and deletion functionality
  - [ ] 4.6 Create side-by-side model comparison functionality
    - [ ] 4.6.1 Create dual chat interface component
    - [ ] 4.6.2 Implement synchronized prompt sending to multiple models
    - [ ] 4.6.3 Add model selection dropdowns for comparison
    - [ ] 4.6.4 Create response timing and cost comparison display
    - [ ] 4.6.5 Add comparison result saving and sharing
  - [ ] 4.7 Build prompt template library with categorization
    - [ ] 4.7.1 Create `src/models/promptTemplate.js` with template schema
    - [ ] 4.7.2 Add template categories and tagging system
    - [ ] 4.7.3 Create template browsing interface with search
    - [ ] 4.7.4 Implement template preview and usage statistics
    - [ ] 4.7.5 Add template rating and feedback system
  - [ ] 4.8 Implement custom prompt template creation and saving
    - [ ] 4.8.1 Create template creation form with validation
    - [ ] 4.8.2 Add template variable placeholder system
    - [ ] 4.8.3 Implement template testing and preview functionality
    - [ ] 4.8.4 Create user's personal template library
    - [ ] 4.8.5 Add template sharing and collaboration features
  - [ ] 4.9 Create conversation organization system (tags, folders, course linking)
    - [ ] 4.9.1 Add tagging system to conversation model
    - [ ] 4.9.2 Create folder/collection system for conversation grouping
    - [ ] 4.9.3 Implement conversation filtering and search
    - [ ] 4.9.4 Add course/lesson linking to conversations
    - [ ] 4.9.5 Create conversation management interface
  - [ ] 4.10 Implement conversation sharing with viewable links
    - [ ] 4.10.1 Create shareable conversation links with access tokens
    - [ ] 4.10.2 Add privacy settings for shared conversations
    - [ ] 4.10.3 Create shared conversation viewing interface
    - [ ] 4.10.4 Implement access logging for shared conversations
    - [ ] 4.10.5 Add conversation sharing analytics
  - [ ] 4.11 Build conversation export functionality (markdown format)
    - [ ] 4.11.1 Create conversation-to-markdown conversion utility
    - [ ] 4.11.2 Add export options (full conversation, date range, selected messages)
    - [ ] 4.11.3 Implement file download functionality
    - [ ] 4.11.4 Add export formatting customization
    - [ ] 4.11.5 Create bulk export for multiple conversations
  - [ ] 4.12 Create conversation history management and search
    - [ ] 4.12.1 Build conversation history interface with pagination
    - [ ] 4.12.2 Implement full-text search across conversation content
    - [ ] 4.12.3 Add advanced filtering (date, model, course, tags)
    - [ ] 4.12.4 Create conversation analytics and insights
    - [ ] 4.12.5 Add conversation backup and restore functionality
  - [ ] 4.13 Design extensible architecture for future model vendor integration
    - [ ] 4.13.1 Create abstract model provider interface
    - [ ] 4.13.2 Implement provider factory pattern for model selection
    - [ ] 4.13.3 Create standardized request/response format
    - [ ] 4.13.4 Add provider-specific configuration management
    - [ ] 4.13.5 Create provider registration and discovery system
  - [ ] 4.14 Implement error handling and fallback mechanisms for API failures
    - [ ] 4.14.1 Create comprehensive error classification system
    - [ ] 4.14.2 Implement retry logic with exponential backoff
    - [ ] 4.14.3 Add fallback to alternative models/providers
    - [ ] 4.14.4 Create user-friendly error messaging
    - [ ] 4.14.5 Add error reporting and monitoring
  - [ ] 4.15 Generate comprehensive test cases for all AI integration and chat functionality
    - [ ] 4.15.1 Create unit tests for OpenAI service integration
    - [ ] 4.15.2 Create tests for conversation storage and retrieval
    - [ ] 4.15.3 Create WebSocket integration tests
    - [ ] 4.15.4 Create tests for model comparison functionality
    - [ ] 4.15.5 Create e2e tests for complete chat workflows

- [ ] 5.0 Analytics, Rate Limiting, and Administrative Features
  - [ ] 5.1 Implement rate limiting system with configurable limits by user role
    - [ ] 5.1.1 Create `src/middleware/rateLimiter.js` with role-based limits
    - [ ] 5.1.2 Implement Redis-based rate limiting (or in-memory for MVP)
    - [ ] 5.1.3 Add rate limit configuration in database per role
    - [ ] 5.1.4 Create rate limit violation handling and user feedback
    - [ ] 5.1.5 Add rate limit monitoring and alerting
  - [ ] 5.2 Create token usage tracking and daily limit enforcement
    - [ ] 5.2.1 Create usage tracking model for token consumption
    - [ ] 5.2.2 Implement token counting middleware for API calls
    - [ ] 5.2.3 Add daily/monthly usage limit enforcement
    - [ ] 5.2.4 Create usage dashboard for users to monitor consumption
    - [ ] 5.2.5 Add usage alerts and warnings before limits
  - [ ] 5.3 Build usage analytics collection system (engagement, completion rates, chat interactions)
    - [ ] 5.3.1 Create analytics event model for user actions
    - [ ] 5.3.2 Implement event tracking middleware throughout application
    - [ ] 5.3.3 Add course engagement tracking (time spent, completion rates)
    - [ ] 5.3.4 Create chat interaction analytics (message count, model usage)
    - [ ] 5.3.5 Implement user journey tracking and funnel analysis
  - [ ] 5.4 Implement model usage pattern tracking and cost monitoring
    - [ ] 5.4.1 Create model usage logging with cost calculation
    - [ ] 5.4.2 Add cost tracking per user and organization
    - [ ] 5.4.3 Implement cost prediction and budget alerts
    - [ ] 5.4.4 Create model performance comparison analytics
    - [ ] 5.4.5 Add cost optimization recommendations
  - [ ] 5.5 Create analytics dashboard for admins and instructors
    - [ ] 5.5.1 Create `client/src/components/analytics/AnalyticsDashboard.jsx`
    - [ ] 5.5.2 Add user engagement metrics visualization
    - [ ] 5.5.3 Create course performance analytics interface
    - [ ] 5.5.4 Implement real-time usage monitoring dashboard
    - [ ] 5.5.5 Add customizable analytics reports and exports
  - [ ] 5.6 Build real-time usage monitoring and limit display for users
    - [ ] 5.6.1 Create usage indicator component for chat interface
    - [ ] 5.6.2 Add real-time usage updates via WebSockets
    - [ ] 5.6.3 Implement usage history visualization
    - [ ] 5.6.4 Create usage prediction and planning tools
    - [ ] 5.6.5 Add usage comparison between users/departments
  - [ ] 5.7 Implement admin panel for user management and system configuration
    - [ ] 5.7.1 Create `client/src/components/admin/AdminPanel.jsx` main interface
    - [ ] 5.7.2 Add system configuration management (API keys, limits)
    - [ ] 5.7.3 Implement user role and permission management
    - [ ] 5.7.4 Create system health monitoring dashboard
    - [ ] 5.7.5 Add audit logging and activity monitoring
  - [ ] 5.8 Create bulk user management capabilities
    - [ ] 5.8.1 Implement bulk user import from CSV/Excel
    - [ ] 5.8.2 Add bulk role assignment and permission changes
    - [ ] 5.8.3 Create bulk email notifications and announcements
    - [ ] 5.8.4 Implement bulk user deactivation/activation
    - [ ] 5.8.5 Add bulk usage limit adjustments
  - [ ] 5.9 Build model availability configuration per user role
    - [ ] 5.9.1 Create model permission system in database
    - [ ] 5.9.2 Add model access control middleware
    - [ ] 5.9.3 Create admin interface for model permission management
    - [ ] 5.9.4 Implement dynamic model list based on user role
    - [ ] 5.9.5 Add model cost tiers and access restrictions
  - [ ] 5.10 Implement system-wide analytics and reporting
    - [ ] 5.10.1 Create comprehensive system metrics collection
    - [ ] 5.10.2 Add performance monitoring and health checks
    - [ ] 5.10.3 Implement automated reporting generation
    - [ ] 5.10.4 Create trend analysis and insights generation
    - [ ] 5.10.5 Add data export and integration capabilities
  - [ ] 5.11 Create notification system for system events and limit warnings
    - [ ] 5.11.1 Create notification model and delivery system
    - [ ] 5.11.2 Add email notification templates and sending
    - [ ] 5.11.3 Implement in-app notification system
    - [ ] 5.11.4 Create notification preferences management
    - [ ] 5.11.5 Add notification scheduling and batching
  - [ ] 5.12 Build prompt template community sharing and moderation system
    - [ ] 5.12.1 Create community template sharing interface
    - [ ] 5.12.2 Add template moderation and approval workflow
    - [ ] 5.12.3 Implement template rating and review system
    - [ ] 5.12.4 Create template usage tracking and popularity metrics
    - [ ] 5.12.5 Add template reporting and content moderation tools
  - [ ] 5.13 Implement course-specific prompt collections for instructors
    - [ ] 5.13.1 Create course-template association system
    - [ ] 5.13.2 Add instructor template collection management
    - [ ] 5.13.3 Implement template assignment to lessons
    - [ ] 5.13.4 Create template effectiveness tracking per course
    - [ ] 5.13.5 Add template recommendation system for instructors
  - [ ] 5.14 Generate comprehensive test cases for all analytics, rate limiting, and administrative functionality
    - [ ] 5.14.1 Create unit tests for rate limiting middleware
    - [ ] 5.14.2 Create tests for analytics data collection and aggregation
    - [ ] 5.14.3 Create integration tests for admin panel functionality
    - [ ] 5.14.4 Create tests for notification system
    - [ ] 5.14.5 Create e2e tests for complete administrative workflows
