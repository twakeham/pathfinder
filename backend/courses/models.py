from django.conf import settings
from django.db import models
from django.utils.text import slugify


def _generate_unique_slug(instance: models.Model, value: str, *, field_name: str, scope_filter: dict | None = None, max_length: int = 220) -> str:
    """Generate a unique slug for the given model instance.

    If scope_filter is provided, uniqueness is ensured within that scope (e.g., per course/module).
    """
    base_slug = slugify(value)[:max_length]
    if not base_slug:
        base_slug = "item"

    ModelClass = instance.__class__
    scope_filter = scope_filter or {}

    slug = base_slug
    suffix = 1
    qs = ModelClass.objects.filter(**scope_filter).values_list(field_name, flat=True)
    existing = set(filter(None, qs))

    while slug in existing:
        suffix += 1
        suffix_str = f"-{suffix}"
        slug = (base_slug[: max_length - len(suffix_str)] + suffix_str)

    return slug


class Course(models.Model):
    """Top-level course container."""

    title: str = models.CharField(max_length=200)
    slug: str = models.SlugField(max_length=220, unique=True, blank=True)
    description: str = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses",
    )

    is_published: bool = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title", "-created_at"]

    def __str__(self) -> str:  # pragma: no cover - simple representation
        return self.title

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = _generate_unique_slug(self, self.title, field_name="slug", max_length=220)
        super().save(*args, **kwargs)


class Module(models.Model):
    """A section within a course, used to group lessons."""

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="modules")

    title: str = models.CharField(max_length=200)
    slug: str = models.SlugField(max_length=220, blank=True)
    description: str = models.TextField(blank=True)

    order: int = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ["order", "id"]
        unique_together = ("course", "slug")

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.course.title} · {self.title}"

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            scope = {"course": self.course}
            self.slug = _generate_unique_slug(self, self.title, field_name="slug", scope_filter=scope, max_length=220)
        super().save(*args, **kwargs)


class Lesson(models.Model):
    """An individual lesson within a module."""

    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="lessons")

    title: str = models.CharField(max_length=200)
    slug: str = models.SlugField(max_length=220, blank=True)

    content: str = models.TextField(blank=True)
    duration_minutes: int | None = models.PositiveIntegerField(null=True, blank=True)

    order: int = models.PositiveIntegerField(default=0, db_index=True)
    is_published: bool = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "id"]
        unique_together = ("module", "slug")

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.module.course.title} · {self.module.title} · {self.title}"

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            scope = {"module": self.module}
            self.slug = _generate_unique_slug(self, self.title, field_name="slug", scope_filter=scope, max_length=220)
        super().save(*args, **kwargs)


# Content blocks (3.2)
class ContentBlock(models.Model):
    """Typed content block associated with a Lesson.

    The `data` field stores type-specific payload. Examples by type:
      - text: {"content": "...", "format": "markdown|plain"}
      - image: {"url": "https://...", "caption": "...", "alt": "..."}
      - code: {"language": "python", "code": "...", "show_line_numbers": true}
      - video: {"url": "https://...", "provider": "youtube|vimeo|file", "start": 0, "end": null}
      - prompt: {"prompt": "...", "placeholder": "..."}"
    """

    TYPE_TEXT = "text"
    TYPE_IMAGE = "image"
    TYPE_CODE = "code"
    TYPE_VIDEO = "video"
    TYPE_PROMPT = "prompt"

    BLOCK_TYPE_CHOICES = [
        (TYPE_TEXT, "Text"),
        (TYPE_IMAGE, "Image"),
        (TYPE_CODE, "Code"),
        (TYPE_VIDEO, "Video"),
        (TYPE_PROMPT, "Interactive Prompt"),
    ]

    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="content_blocks")

    block_type: str = models.CharField(max_length=20, choices=BLOCK_TYPE_CHOICES)
    title: str = models.CharField(max_length=200, blank=True)
    data: dict = models.JSONField(default=dict, blank=True)

    order: int = models.PositiveIntegerField(default=0, db_index=True)
    is_published: bool = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:  # pragma: no cover
        label = self.title or self.block_type
        return f"{self.lesson} · {label}"


class LessonProgress(models.Model):
    """Tracks a user's completion state for a lesson."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="lesson_progress")
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="progress")

    is_completed: bool = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "lesson")
        indexes = [
            models.Index(fields=["user", "lesson"]),
            models.Index(fields=["lesson"]),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.user} · {self.lesson} · {'done' if self.is_completed else 'pending'}"


class Badge(models.Model):
    """A badge that can be awarded to users, optionally tied to a course."""

    code: str = models.SlugField(max_length=120, unique=True)
    name: str = models.CharField(max_length=200)
    description: str = models.TextField(blank=True)
    image_url: str = models.URLField(blank=True)

    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True, related_name="badges")
    threshold_percent: int = models.PositiveIntegerField(default=100)
    is_active: bool = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name", "code"]

    def __str__(self) -> str:  # pragma: no cover
        return self.name


class UserBadge(models.Model):
    """A record of a badge awarded to a user."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="badges")
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name="awards")
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "badge")
        ordering = ["-awarded_at", "badge_id"]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.user} · {self.badge}"


# Quizzes and Exercises (3.5)
class Quiz(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="quizzes")
    title: str = models.CharField(max_length=200)
    description: str = models.TextField(blank=True)
    order: int = models.PositiveIntegerField(default=0, db_index=True)
    is_published: bool = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Assessment settings
    attempts_allowed: int | None = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Number of attempts allowed, 0 for unlimited",
    )
    time_limit_minutes: int | None = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Time limit in minutes, null for no limit",
    )
    instructions: str = models.TextField(
        blank=True,
        help_text="Instructions shown to students before taking the quiz",
    )
    randomize_questions: bool = models.BooleanField(
        default=False,
        help_text="Randomize question order for each attempt",
    )
    show_results_immediately: bool = models.BooleanField(
        default=True,
        help_text="Show results immediately after submission",
    )
    questions_to_show: int | None = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Number of questions to show per attempt; leave blank to show all",
    )

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.lesson} · {self.title}"


class QuizQuestion(models.Model):
    TYPE_MCQ = "mcq"
    TYPE_SHORT = "short"

    QUESTION_TYPE_CHOICES = [
        (TYPE_MCQ, "Multiple Choice"),
        (TYPE_SHORT, "Short Answer"),
    ]

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    text: str = models.TextField()
    question_type: str = models.CharField(max_length=10, choices=QUESTION_TYPE_CHOICES, default=TYPE_MCQ)
    data: dict = models.JSONField(default=dict, blank=True)  # e.g., {"answers": ["..."], "case_insensitive": true}
    order: int = models.PositiveIntegerField(default=0, db_index=True)
    points: int = models.PositiveIntegerField(default=1, help_text="Points awarded for correct answer")
    is_required: bool = models.BooleanField(default=True, help_text="Whether this question must be answered")
    explanation: str = models.TextField(blank=True, help_text="Explanation shown after answering (optional)")

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:  # pragma: no cover
        return f"Q{self.pk} {self.text[:40]}..."


class QuizChoice(models.Model):
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, related_name="choices")
    text: str = models.CharField(max_length=500)
    is_correct: bool = models.BooleanField(default=False)
    order: int = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:  # pragma: no cover
        return self.text


class QuizSubmission(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quiz_submissions")
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="submissions")
    submitted_at = models.DateTimeField(auto_now_add=True)
    score = models.FloatField(default=0.0)
    max_score = models.FloatField(default=0.0)

    class Meta:
        ordering = ["-submitted_at", "id"]
        indexes = [models.Index(fields=["user", "quiz"])]


class QuizAnswer(models.Model):
    submission = models.ForeignKey(QuizSubmission, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(QuizChoice, on_delete=models.SET_NULL, null=True, blank=True)
    text_answer: str | None = models.TextField(null=True, blank=True)
    is_correct: bool = models.BooleanField(default=False)

    class Meta:
        unique_together = ("submission", "question")


class Exercise(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="exercises")
    title: str = models.CharField(max_length=200)
    description: str = models.TextField(blank=True)
    data: dict = models.JSONField(default=dict, blank=True)  # e.g., {"expected_keywords": ["..."], "min_matches": 2}
    order: int = models.PositiveIntegerField(default=0, db_index=True)
    is_published: bool = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.lesson} · {self.title}"


class ExerciseSubmission(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="exercise_submissions")
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name="submissions")
    submitted_at = models.DateTimeField(auto_now_add=True)
    content: str = models.TextField()
    score = models.FloatField(default=0.0)
    max_score = models.FloatField(default=1.0)
    feedback: str = models.TextField(blank=True)

    class Meta:
        ordering = ["-submitted_at", "id"]
        indexes = [models.Index(fields=["user", "exercise"])]


# Prompt template library (3.6)
class PromptTemplateCategory(models.Model):
    name: str = models.CharField(max_length=120)
    slug: str = models.SlugField(max_length=140, unique=True, blank=True)
    description: str = models.TextField(blank=True)
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True, related_name="children")
    is_active: bool = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name", "slug"]

    def __str__(self) -> str:  # pragma: no cover
        return self.name

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = _generate_unique_slug(self, self.name, field_name="slug", max_length=140)
        super().save(*args, **kwargs)


class PromptTemplate(models.Model):
    title: str = models.CharField(max_length=200)
    slug: str = models.SlugField(max_length=220, unique=True, blank=True)
    description: str = models.TextField(blank=True)
    content: str = models.TextField(help_text="Template content with {placeholders}.")

    variables: list[str] = models.JSONField(default=list, blank=True, help_text="List of variable names used in content")
    tags: list[str] = models.JSONField(default=list, blank=True)
    default_params: dict = models.JSONField(default=dict, blank=True)

    category = models.ForeignKey(PromptTemplateCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="templates")
    is_active: bool = models.BooleanField(default=True)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="prompt_templates")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title", "slug"]

    def __str__(self) -> str:  # pragma: no cover
        return self.title

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = _generate_unique_slug(self, self.title, field_name="slug", max_length=220)
        # Normalize tags to lowercase unique
        if isinstance(self.tags, list):
            seen = set()
            norm = []
            for t in self.tags:
                s = str(t).strip().lower()
                if s and s not in seen:
                    seen.add(s)
                    norm.append(s)
            self.tags = norm
        super().save(*args, **kwargs)


# Course-specific prompt collections (3.7)
class CoursePromptCollection(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="prompt_collections")

    title: str = models.CharField(max_length=200)
    slug: str = models.SlugField(max_length=220, blank=True)
    description: str = models.TextField(blank=True)
    tags: list[str] = models.JSONField(default=list, blank=True)

    order: int = models.PositiveIntegerField(default=0, db_index=True)
    is_active: bool = models.BooleanField(default=True)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="prompt_collections")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["course_id", "order", "title", "id"]
        unique_together = ("course", "slug")

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.course.title} · {self.title}"

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            scope = {"course": self.course}
            self.slug = _generate_unique_slug(self, self.title, field_name="slug", scope_filter=scope, max_length=220)
        # Normalize tags
        if isinstance(self.tags, list):
            seen = set()
            norm = []
            for t in self.tags:
                s = str(t).strip().lower()
                if s and s not in seen:
                    seen.add(s)
                    norm.append(s)
            self.tags = norm
        super().save(*args, **kwargs)


class CoursePromptItem(models.Model):
    collection = models.ForeignKey(CoursePromptCollection, on_delete=models.CASCADE, related_name="items")
    template = models.ForeignKey(PromptTemplate, on_delete=models.CASCADE, related_name="course_items")

    title: str = models.CharField(max_length=200, blank=True, help_text="Optional display title; defaults to template title")
    slug: str = models.SlugField(max_length=220, blank=True)
    description: str = models.TextField(blank=True)

    content_override: str = models.TextField(blank=True, help_text="Optional content to override the template content")
    variables_override: list[str] = models.JSONField(default=list, blank=True)
    params_override: dict = models.JSONField(default=dict, blank=True)
    tags_override: list[str] = models.JSONField(default=list, blank=True)

    order: int = models.PositiveIntegerField(default=0, db_index=True)
    is_active: bool = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["collection_id", "order", "id"]
        unique_together = ("collection", "slug")
        indexes = [models.Index(fields=["collection", "order"])]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.collection} · {self.display_title}"

    @property
    def display_title(self) -> str:
        return self.title or self.template.title

    def save(self, *args, **kwargs) -> None:
        # Generate slug based on display title within collection
        if not self.slug:
            base = self.title or self.template.title
            scope = {"collection": self.collection}
            self.slug = _generate_unique_slug(self, base, field_name="slug", scope_filter=scope, max_length=220)
        # Normalize tag overrides
        if isinstance(self.tags_override, list):
            seen = set()
            norm = []
            for t in self.tags_override:
                s = str(t).strip().lower()
                if s and s not in seen:
                    seen.add(s)
                    norm.append(s)
            self.tags_override = norm
        super().save(*args, **kwargs)
