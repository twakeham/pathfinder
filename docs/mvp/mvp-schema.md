# LLM Playground and Training Tool - Data Schema

This document defines the data structure for the LLM Playground and Training Tool. Each section describes a different type of information the system needs to store, along with explanations of what each field means and why it's needed.

## Users Collection

Stores information about people who use the platform - learners, instructors, and administrators.

### Fields

- **_id** (Unique ID) - A unique identifier automatically created for each user
- **email** (Text, Required, Unique) - The user's email address used for login and notifications
- **password** (Encrypted Text, Required) - The user's password, stored in encrypted format for security
- **firstName** (Text, Required) - The user's first name for personalization
- **lastName** (Text, Required) - The user's last name for identification
- **avatar** (Text, Optional) - URL link to the user's profile picture
- **role** (Text, Required) - The user's permission level: "Admin", "Instructor", or "User"
- **department** (Reference to Department, Optional) - Which department/team the user belongs to
- **isApproved** (True/False, Default: false) - Whether an admin has approved this user's account
- **isActive** (True/False, Default: true) - Whether the user's account is currently active
- **lastLogin** (Date, Optional) - When the user last logged into the platform
- **preferences** (Object, Optional) - User's personal settings and preferences
  - **theme** (Text) - UI theme preference ("light", "dark", "auto")
  - **defaultModel** (Text) - User's preferred AI model
  - **showAdvancedParams** (True/False) - Whether to show advanced AI parameters
- **createdAt** (Date, Required) - When the user account was created
- **updatedAt** (Date, Required) - When the user information was last modified

### Purpose
This collection manages user accounts, authentication, and role-based permissions throughout the platform.

---

## Departments Collection

Organizes users into groups like "Engineering", "Marketing", "Sales" for easier management and analytics.

### Fields

- **_id** (Unique ID) - A unique identifier for each department
- **name** (Text, Required, Unique) - The department name (e.g., "Engineering", "Marketing")
- **description** (Text, Optional) - A brief description of what this department does
- **createdAt** (Date, Required) - When the department was created
- **updatedAt** (Date, Required) - When the department information was last modified

### Purpose
Groups users for administrative purposes and departmental analytics reporting.

---

## Courses Collection

Stores the main learning programs that contain modules and lessons.

### Fields

- **_id** (Unique ID) - A unique identifier for each course
- **title** (Text, Required) - The course name (e.g., "Introduction to AI Prompting")
- **description** (Text, Required) - A detailed explanation of what the course covers
- **instructor** (Reference to User, Required) - The instructor who created or owns this course
- **category** (Text, Optional) - Course category (e.g., "Beginner", "Advanced", "Prompt Engineering")
- **tags** (Array of Text, Optional) - Keywords for searching and organization
- **isPublished** (True/False, Default: false) - Whether the course is available to learners
- **estimatedDuration** (Number, Optional) - Expected time to complete in minutes
- **difficulty** (Text, Optional) - Course difficulty level ("Beginner", "Intermediate", "Advanced")
- **prerequisites** (Array of Course References, Optional) - Other courses that should be completed first
- **objectives** (Array of Text, Optional) - Learning goals for this course
- **createdAt** (Date, Required) - When the course was created
- **updatedAt** (Date, Required) - When the course was last modified

### Purpose
Organizes learning content into structured programs that users can follow to develop AI skills.

---

## Modules Collection

Groups related lessons together within a course, like chapters in a book.

### Fields

- **_id** (Unique ID) - A unique identifier for each module
- **title** (Text, Required) - The module name (e.g., "Basic Prompt Structure")
- **description** (Text, Optional) - What this module covers
- **course** (Reference to Course, Required) - Which course this module belongs to
- **order** (Number, Required) - The sequence order within the course (1, 2, 3, etc.)
- **estimatedDuration** (Number, Optional) - Expected time to complete in minutes
- **createdAt** (Date, Required) - When the module was created
- **updatedAt** (Date, Required) - When the module was last modified

### Purpose
Breaks courses into manageable sections to help learners progress step by step.

---

## Lessons Collection

Individual learning units that contain the actual educational content.

### Fields

- **_id** (Unique ID) - A unique identifier for each lesson
- **title** (Text, Required) - The lesson name (e.g., "Writing Your First Prompt")
- **module** (Reference to Module, Required) - Which module this lesson belongs to
- **order** (Number, Required) - The sequence order within the module
- **contentBlocks** (Array of Objects, Required) - The actual lesson content (see Content Blocks below)
- **estimatedDuration** (Number, Optional) - Expected time to complete in minutes
- **createdAt** (Date, Required) - When the lesson was created
- **updatedAt** (Date, Required) - When the lesson was last modified

### Content Blocks Structure
Each lesson contains multiple content blocks of different types:

#### Text Block
- **type** (Text) - Always "text"
- **content** (Text) - The actual text content with formatting
- **heading** (Text, Optional) - Section heading

#### Image Block
- **type** (Text) - Always "image"
- **url** (Text) - Link to the image file
- **altText** (Text) - Description for accessibility
- **caption** (Text, Optional) - Image caption

#### Code Block
- **type** (Text) - Always "code"
- **language** (Text) - Programming language for syntax highlighting
- **code** (Text) - The actual code content
- **executable** (True/False) - Whether this code can be run

#### Video Block
- **type** (Text) - Always "video"
- **url** (Text) - Link to the video
- **provider** (Text) - Video hosting service ("youtube", "vimeo", etc.)
- **duration** (Number, Optional) - Video length in seconds

#### Interactive Prompt Block
- **type** (Text) - Always "interactive_prompt"
- **promptText** (Text) - The AI prompt to execute
- **expectedOutput** (Text, Optional) - What the AI should approximately respond with
- **autoExecute** (True/False) - Whether clicking this automatically sends the prompt
- **modelParameters** (Object, Optional) - Specific AI settings for this prompt

#### Quiz Block
- **type** (Text) - Always "quiz"
- **question** (Text) - The question being asked
- **questionType** (Text) - Type of question ("multiple_choice", "true_false", "text_input")
- **options** (Array of Text, Optional) - Answer choices for multiple choice
- **correctAnswer** (Text or Array) - The correct answer(s)
- **explanation** (Text, Optional) - Explanation of the correct answer

### Purpose
Delivers the actual educational content in various engaging formats to help users learn effectively.

---

## Conversations Collection

Stores all chat interactions between users and AI models.

### Fields

- **_id** (Unique ID) - A unique identifier for each conversation
- **user** (Reference to User, Required) - Who participated in this conversation
- **title** (Text, Optional) - User-assigned name for the conversation
- **context** (Object, Optional) - Associated learning content
  - **course** (Reference to Course, Optional) - Related course
  - **module** (Reference to Module, Optional) - Related module
  - **lesson** (Reference to Lesson, Optional) - Related lesson
- **tags** (Array of Text, Optional) - User-assigned keywords for organization
- **folder** (Text, Optional) - User-assigned folder for organization
- **messages** (Array of Objects, Required) - The actual chat messages (see Messages below)
- **isShared** (True/False, Default: false) - Whether this conversation can be viewed by others
- **shareToken** (Text, Optional) - Unique link for sharing if isShared is true
- **totalTokens** (Number, Default: 0) - Total AI tokens used in this conversation
- **totalCost** (Number, Default: 0) - Estimated cost of AI usage
- **createdAt** (Date, Required) - When the conversation started
- **updatedAt** (Date, Required) - When the last message was added

### Messages Structure
Each conversation contains an array of messages:

- **role** (Text, Required) - Who sent the message ("user" or "assistant")
- **content** (Text, Required) - The actual message text
- **model** (Text, Optional) - Which AI model generated this response
- **parameters** (Object, Optional) - AI settings used for this message
  - **temperature** (Number) - Creativity level (0.0 to 2.0)
  - **maxTokens** (Number) - Maximum response length
  - **topP** (Number) - Response diversity setting
- **tokens** (Number, Optional) - Number of AI tokens used for this message
- **cost** (Number, Optional) - Estimated cost for this message
- **timestamp** (Date, Required) - When this message was sent
- **isVisible** (True/False, Default: true) - Whether this message should be displayed

### Purpose
Maintains a complete history of user interactions with AI models for learning, sharing, and analysis.

---

## PromptTemplates Collection

Stores reusable prompts that users can apply in different situations.

### Fields

- **_id** (Unique ID) - A unique identifier for each template
- **title** (Text, Required) - Name of the prompt template
- **description** (Text, Optional) - What this template is designed to accomplish
- **promptText** (Text, Required) - The actual prompt content with placeholders
- **category** (Text, Required) - Template category ("Creative Writing", "Data Analysis", etc.)
- **tags** (Array of Text, Optional) - Keywords for searching
- **creator** (Reference to User, Required) - Who created this template
- **isPublic** (True/False, Default: false) - Whether other users can see and use this template
- **isCommunity** (True/False, Default: false) - Whether this is available in the community library
- **isApproved** (True/False, Default: false) - Whether an admin has approved this for community sharing
- **usageCount** (Number, Default: 0) - How many times this template has been used
- **rating** (Number, Optional) - Average user rating (1-5 stars)
- **ratingCount** (Number, Default: 0) - Number of users who rated this template
- **variables** (Array of Objects, Optional) - Placeholders that users can customize
  - **name** (Text) - Variable name
  - **description** (Text) - What this variable represents
  - **defaultValue** (Text, Optional) - Default value if user doesn't specify
- **modelRecommendations** (Object, Optional) - Suggested AI settings
  - **temperature** (Number) - Recommended creativity level
  - **maxTokens** (Number) - Recommended response length
- **createdAt** (Date, Required) - When the template was created
- **updatedAt** (Date, Required) - When the template was last modified

### Purpose
Allows users to save and share effective prompts, building a knowledge base of successful AI interactions.

---

## UserProgress Collection

Tracks each user's advancement through courses, modules, and lessons.

### Fields

- **_id** (Unique ID) - A unique identifier for each progress record
- **user** (Reference to User, Required) - Which user this progress belongs to
- **course** (Reference to Course, Required) - Which course this tracks
- **module** (Reference to Module, Optional) - Which module (if tracking module progress)
- **lesson** (Reference to Lesson, Optional) - Which lesson (if tracking lesson progress)
- **status** (Text, Required) - Progress status ("not_started", "in_progress", "completed")
- **completionPercentage** (Number, Default: 0) - How much is completed (0-100)
- **timeSpent** (Number, Default: 0) - Total time spent in minutes
- **lastAccessed** (Date, Optional) - When the user last viewed this content
- **completedAt** (Date, Optional) - When the user finished this content
- **quizScores** (Array of Objects, Optional) - Results from quizzes
  - **lessonId** (Reference to Lesson) - Which lesson's quiz
  - **score** (Number) - Score achieved (0-100)
  - **maxScore** (Number) - Maximum possible score
  - **completedAt** (Date) - When the quiz was taken
- **createdAt** (Date, Required) - When progress tracking started
- **updatedAt** (Date, Required) - When progress was last updated

### Purpose
Monitors user learning progress to provide personalized experiences and analytics insights.

---

## Badges Collection

Defines achievements that users can earn for completing courses and activities.

### Fields

- **_id** (Unique ID) - A unique identifier for each badge
- **name** (Text, Required) - Badge name (e.g., "AI Prompt Master")
- **description** (Text, Required) - What accomplishment this badge represents
- **icon** (Text, Optional) - URL to the badge image/icon
- **category** (Text, Required) - Badge type ("course_completion", "engagement", "quiz_performance")
- **criteria** (Object, Required) - Requirements to earn this badge
  - **type** (Text) - How to earn it ("complete_course", "quiz_score", "usage_streak")
  - **value** (Number, Optional) - Threshold value (e.g., score of 90)
  - **courseId** (Reference to Course, Optional) - Specific course if required
- **rarity** (Text, Default: "common") - Badge difficulty ("common", "rare", "legendary")
- **isActive** (True/False, Default: true) - Whether this badge can currently be earned
- **createdAt** (Date, Required) - When the badge was created
- **updatedAt** (Date, Required) - When the badge criteria was last modified

### Purpose
Motivates users through gamification and recognizes learning achievements.

---

## UserBadges Collection

Records which badges each user has earned.

### Fields

- **_id** (Unique ID) - A unique identifier for each badge award
- **user** (Reference to User, Required) - Who earned the badge
- **badge** (Reference to Badge, Required) - Which badge was earned
- **earnedAt** (Date, Required) - When the badge was awarded
- **context** (Object, Optional) - Additional information about how it was earned
  - **course** (Reference to Course, Optional) - Related course
  - **score** (Number, Optional) - Score achieved if relevant

### Purpose
Tracks user achievements and provides data for displaying earned badges.

---

## UsageTracking Collection

Records user activity for analytics and rate limiting.

### Fields

- **_id** (Unique ID) - A unique identifier for each usage record
- **user** (Reference to User, Required) - Who performed the activity
- **activityType** (Text, Required) - Type of activity ("chat_message", "lesson_view", "quiz_attempt")
- **details** (Object, Optional) - Additional information about the activity
  - **model** (Text, Optional) - AI model used if applicable
  - **tokens** (Number, Optional) - Tokens consumed if applicable
  - **cost** (Number, Optional) - Estimated cost if applicable
  - **course** (Reference to Course, Optional) - Related course
  - **lesson** (Reference to Lesson, Optional) - Related lesson
- **timestamp** (Date, Required) - When the activity occurred
- **sessionId** (Text, Optional) - Groups activities from the same session

### Purpose
Enables usage analytics, rate limiting enforcement, and cost tracking.

---

## RateLimits Collection

Defines usage limits for different user roles and individual users.

### Fields

- **_id** (Unique ID) - A unique identifier for each rate limit rule
- **type** (Text, Required) - What this limit applies to ("role" or "user")
- **roleOrUserId** (Text, Required) - Either role name or user ID
- **limitType** (Text, Required) - Type of limit ("messages_per_hour", "tokens_per_day")
- **limitValue** (Number, Required) - The actual limit number
- **resetPeriod** (Text, Required) - How often limits reset ("hourly", "daily", "monthly")
- **isActive** (True/False, Default: true) - Whether this limit is currently enforced
- **createdAt** (Date, Required) - When the limit was created
- **updatedAt** (Date, Required) - When the limit was last modified

### Purpose
Controls platform usage to manage costs and ensure fair access for all users.

---

## ModelConfigurations Collection

Stores AI model settings and availability by user role.

### Fields

- **_id** (Unique ID) - A unique identifier for each configuration
- **modelName** (Text, Required) - Name of the AI model (e.g., "gpt-4", "gpt-3.5-turbo")
- **provider** (Text, Required) - AI service provider ("openai", "anthropic", etc.)
- **isActive** (True/False, Default: true) - Whether this model is available
- **allowedRoles** (Array of Text, Required) - Which user roles can access this model
- **defaultParameters** (Object, Required) - Default settings for this model
  - **temperature** (Number) - Default creativity level
  - **maxTokens** (Number) - Default maximum response length
  - **topP** (Number) - Default diversity setting
- **costPerToken** (Number, Optional) - Cost per token for budget tracking
- **description** (Text, Optional) - Description of model capabilities
- **createdAt** (Date, Required) - When the configuration was created
- **updatedAt** (Date, Required) - When the configuration was last modified

### Purpose
Manages which AI models are available to different users and their default settings.

---

## Notifications Collection

Stores system notifications for users.

### Fields

- **_id** (Unique ID) - A unique identifier for each notification
- **user** (Reference to User, Required) - Who should receive this notification
- **type** (Text, Required) - Notification category ("system", "usage_warning", "badge_earned")
- **title** (Text, Required) - Notification headline
- **message** (Text, Required) - Detailed notification content
- **priority** (Text, Default: "normal") - Importance level ("low", "normal", "high", "urgent")
- **isRead** (True/False, Default: false) - Whether the user has seen this notification
- **actionUrl** (Text, Optional) - Link to relevant page if notification requires action
- **expiresAt** (Date, Optional) - When this notification should be automatically removed
- **createdAt** (Date, Required) - When the notification was created

### Purpose
Communicates important information to users about system events, achievements, and warnings.

---

## SystemSettings Collection

Stores application-wide configuration settings.

### Fields

- **_id** (Unique ID) - A unique identifier for each setting
- **key** (Text, Required, Unique) - Setting name (e.g., "openai_api_key", "default_user_role")
- **value** (Text, Required) - Setting value
- **description** (Text, Optional) - What this setting controls
- **isSecret** (True/False, Default: false) - Whether this should be encrypted/hidden
- **category** (Text, Optional) - Setting group ("api", "ui", "security")
- **updatedBy** (Reference to User, Optional) - Who last changed this setting
- **updatedAt** (Date, Required) - When the setting was last modified

### Purpose
Manages application configuration that admins can adjust without code changes.

---

## Data Relationships Summary

The data schema creates these key relationships:

1. **Users** belong to **Departments** and have **Roles**
2. **Courses** contain **Modules**, which contain **Lessons**
3. **Lessons** have **Content Blocks** with different types of educational material
4. **Conversations** link to **Users** and optionally to **Courses/Modules/Lessons**
5. **PromptTemplates** are created by **Users** and can be shared publicly
6. **UserProgress** tracks how **Users** advance through **Courses/Modules/Lessons**
7. **Badges** are earned by **Users** and recorded in **UserBadges**
8. **UsageTracking** monitors all **User** activities for analytics
9. **RateLimits** control **User** access based on **Roles** or individual limits
10. **ModelConfigurations** determine which AI models **Users** can access
11. **Notifications** inform **Users** about important events
12. **SystemSettings** control application behavior

This schema supports all the functional requirements from the PRD while remaining flexible for future enhancements.
