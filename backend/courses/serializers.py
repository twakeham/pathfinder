from rest_framework import serializers
import re

from .models import (
    Course,
    Module,
    Lesson,
    ContentBlock,
    LessonProgress,
    Badge,
    UserBadge,
    Quiz,
    QuizQuestion,
    QuizChoice,
    QuizSubmission,
    QuizAnswer,
    Exercise,
    ExerciseSubmission,
    PromptTemplateCategory,
    PromptTemplate,
    CoursePromptCollection,
    CoursePromptItem,
)

VAR_PATTERN = re.compile(r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}")


class CourseSerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    slug = serializers.ReadOnlyField()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "created_by",
            "is_published",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("slug", "created_at", "updated_at")

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        return super().create(validated_data)


class ModuleSerializer(serializers.ModelSerializer):
    slug = serializers.ReadOnlyField()
    course_title = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = [
            "id",
            "course",
            "course_title",
            "title",
            "slug",
            "description",
            "order",
        ]
        read_only_fields = ("slug",)

    def get_course_title(self, obj):
        return obj.course.title if obj.course else None


class LessonSerializer(serializers.ModelSerializer):
    slug = serializers.ReadOnlyField()
    course = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    module_title = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            "id",
            "module",
            "course",
            "course_title",
            "module_title",
            "title",
            "slug",
            "content",
            "duration_minutes",
            "order",
            "is_published",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("slug", "created_at", "updated_at")

    def get_course(self, obj):
        return obj.module.course.id if obj.module and obj.module.course else None

    def get_course_title(self, obj):
        return obj.module.course.title if obj.module and obj.module.course else None

    def get_module_title(self, obj):
        return obj.module.title if obj.module else None


class ContentBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentBlock
        fields = [
            "id",
            "lesson",
            "block_type",
            "title",
            "data",
            "order",
            "is_published",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("created_at", "updated_at")


class LessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonProgress
        fields = [
            "id",
            "user",
            "lesson",
            "is_completed",
            "completed_at",
        ]
        read_only_fields = ("user",)


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = [
            "id",
            "code",
            "name",
            "description",
            "image_url",
            "course",
            "threshold_percent",
            "is_active",
            "created_at",
        ]


class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)
    badge_id = serializers.PrimaryKeyRelatedField(queryset=Badge.objects.all(), source="badge", write_only=True)

    class Meta:
        model = UserBadge
        fields = [
            "id",
            "user",
            "badge",
            "badge_id",
            "awarded_at",
        ]
        read_only_fields = ("user", "badge", "awarded_at")


class QuizChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizChoice
        fields = ["id", "text", "is_correct", "order"]


class QuizQuestionSerializer(serializers.ModelSerializer):
    choices = QuizChoiceSerializer(many=True, required=False)

    class Meta:
        model = QuizQuestion
        fields = [
            "id",
            "text",
            "question_type",
            "data",
            "order",
            "points",
            "is_required",
            "explanation",
            "choices",
        ]

    def create(self, validated_data):
        choices_data = validated_data.pop("choices", [])
        question = QuizQuestion.objects.create(**validated_data)
        for idx, c in enumerate(choices_data, start=1):
            data = dict(c) if isinstance(c, dict) else {}
            order = data.pop("order", idx)
            QuizChoice.objects.create(question=question, order=order, **data)
        return question


class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, required=False)

    class Meta:
        model = Quiz
        fields = [
            "id",
            "lesson",
            "title",
            "description",
            "order",
            "is_published",
            "created_at",
            "updated_at",
            "attempts_allowed",
            "time_limit_minutes",
            "instructions",
            "randomize_questions",
            "show_results_immediately",
            "questions_to_show",
            "questions",
        ]
        read_only_fields = ("created_at", "updated_at")

    def create(self, validated_data):
        questions_data = validated_data.pop("questions", [])
        quiz = super().create(validated_data)
        for q_idx, q in enumerate(questions_data, start=1):
            choices = q.pop("choices", [])
            question = QuizQuestion.objects.create(quiz=quiz, order=q.get("order", q_idx), **q)
            for c_idx, c in enumerate(choices, start=1):
                QuizChoice.objects.create(question=question, order=c.get("order", c_idx), **c)
        return quiz

    def update(self, instance, validated_data):
        # For brevity, only update fields, not replacing nested children here
        return super().update(instance, validated_data)


class QuizAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAnswer
        fields = ["id", "question", "selected_choice", "text_answer", "is_correct"]
        read_only_fields = ("is_correct",)


class QuizSubmissionSerializer(serializers.ModelSerializer):
    answers = QuizAnswerSerializer(many=True)

    class Meta:
        model = QuizSubmission
        fields = ["id", "user", "quiz", "submitted_at", "score", "max_score", "answers"]
        read_only_fields = ("user", "submitted_at", "score", "max_score")

    def create(self, validated_data):
        answers_data = validated_data.pop("answers", [])
        submission = QuizSubmission.objects.create(**validated_data)

        # Auto-evaluate
        score = 0.0
        max_score = 0.0
        for ans in answers_data:
            question = ans["question"]
            selected_choice = ans.get("selected_choice")
            text_answer = ans.get("text_answer")

            is_correct = False
            if question.question_type == QuizQuestion.TYPE_MCQ and selected_choice:
                is_correct = bool(getattr(selected_choice, "is_correct", False))
                QuizAnswer.objects.create(
                    submission=submission,
                    question=question,
                    selected_choice=selected_choice,
                    is_correct=is_correct,
                )
                max_score += 1
                if is_correct:
                    score += 1
            else:
                # Short answer: naive contains check from data["answers"]
                expected = (question.data or {}).get("answers", [])
                txt = (text_answer or "").strip().lower()
                if (question.data or {}).get("case_insensitive", True):
                    expected = [str(e).strip().lower() for e in expected]
                is_correct = any(e in txt for e in expected) if expected else False
                QuizAnswer.objects.create(
                    submission=submission,
                    question=question,
                    text_answer=text_answer,
                    is_correct=is_correct,
                )
                max_score += 1
                if is_correct:
                    score += 1

        submission.score = score
        submission.max_score = max_score or 1.0
        submission.save()
        return submission


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ["id", "lesson", "title", "description", "data", "order", "is_published", "created_at"]
        read_only_fields = ("created_at",)


class ExerciseSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseSubmission
        fields = ["id", "user", "exercise", "submitted_at", "content", "score", "max_score", "feedback"]
        read_only_fields = ("user", "submitted_at", "score", "max_score", "feedback")


class PromptTemplateCategorySerializer(serializers.ModelSerializer):
    slug = serializers.ReadOnlyField()

    class Meta:
        model = PromptTemplateCategory
        fields = ["id", "name", "slug", "description", "parent", "is_active", "created_at", "updated_at"]
        read_only_fields = ("slug", "created_at", "updated_at")


class PromptTemplateSerializer(serializers.ModelSerializer):
    slug = serializers.ReadOnlyField()
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = PromptTemplate
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "content",
            "variables",
            "tags",
            "default_params",
            "category",
            "is_active",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("slug", "created_by", "created_at", "updated_at")

    def validate(self, attrs):
        content = attrs.get("content", self.instance.content if self.instance else "")
        declared_vars = set(attrs.get("variables", self.instance.variables if self.instance else []))
        found_vars = set(VAR_PATTERN.findall(content))
        missing = found_vars - declared_vars
        if missing:
            raise serializers.ValidationError({"variables": f"Missing variable declarations for: {', '.join(sorted(missing))}"})
        # Normalize tags here as well
        tags = attrs.get("tags")
        if tags is not None:
            seen = set()
            norm = []
            for t in tags:
                s = str(t).strip().lower()
                if s and s not in seen:
                    seen.add(s)
                    norm.append(s)
            attrs["tags"] = norm
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        return super().create(validated_data)


# 3.7 Serializers
class CoursePromptItemSerializer(serializers.ModelSerializer):
    slug = serializers.ReadOnlyField()
    template_detail = PromptTemplateSerializer(source="template", read_only=True)

    class Meta:
        model = CoursePromptItem
        fields = [
            "id",
            "collection",
            "template",
            "template_detail",
            "title",
            "slug",
            "description",
            "content_override",
            "variables_override",
            "params_override",
            "tags_override",
            "order",
            "is_active",
            "created_at",
        ]
        read_only_fields = ("slug", "created_at")

    def validate(self, attrs):
        # If content_override provided, ensure variables_override covers its placeholders
        content = attrs.get("content_override")
        if content:
            declared = set(attrs.get("variables_override", []))
            found = set(VAR_PATTERN.findall(content))
            missing = found - declared
            if missing:
                raise serializers.ValidationError({
                    "variables_override": f"Missing variable declarations for override content: {', '.join(sorted(missing))}"
                })
        # Normalize tag overrides
        tags = attrs.get("tags_override")
        if tags is not None:
            seen = set()
            norm = []
            for t in tags:
                s = str(t).strip().lower()
                if s and s not in seen:
                    seen.add(s)
                    norm.append(s)
            attrs["tags_override"] = norm
        return attrs


class CoursePromptCollectionSerializer(serializers.ModelSerializer):
    slug = serializers.ReadOnlyField()
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    items = CoursePromptItemSerializer(many=True, required=False)

    class Meta:
        model = CoursePromptCollection
        fields = [
            "id",
            "course",
            "title",
            "slug",
            "description",
            "tags",
            "order",
            "is_active",
            "created_by",
            "created_at",
            "updated_at",
            "items",
        ]
        read_only_fields = ("slug", "created_by", "created_at", "updated_at")

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        collection = super().create(validated_data)
        for idx, item in enumerate(items_data, start=1):
            CoursePromptItem.objects.create(collection=collection, order=item.get("order", idx), **item)
        return collection

    def update(self, instance, validated_data):
        # Only update fields; nested item updates handled via item endpoint
        return super().update(instance, validated_data)
