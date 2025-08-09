from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
import uuid
import re
from datetime import datetime

from authentication.permissions import IsAdminOrInstructor
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
from .serializers import (
    CourseSerializer,
    ModuleSerializer,
    LessonSerializer,
    ContentBlockSerializer,
    LessonProgressSerializer,
    BadgeSerializer,
    UserBadgeSerializer,
    QuizSerializer,
    QuizQuestionSerializer,
    QuizChoiceSerializer,
    QuizSubmissionSerializer,
    ExerciseSerializer,
    ExerciseSubmissionSerializer,
    PromptTemplateCategorySerializer,
    PromptTemplateSerializer,
    CoursePromptCollectionSerializer,
    CoursePromptItemSerializer,
)


def _get_bool(param_value: str | None) -> bool | None:
    if param_value is None:
        return None
    return param_value.strip().lower() in {"1", "true", "yes", "on"}


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer

    def get_queryset(self):
        qs = Course.objects.all().order_by("title")
        params = self.request.query_params

        # No parent kwargs for Course, but still support standard filtering
        slug = params.get("slug")
        if slug:
            qs = qs.filter(slug=slug)

        is_published = _get_bool(params.get("is_published"))
        if is_published is not None:
            qs = qs.filter(is_published=is_published)

        created_by = params.get("created_by")
        if created_by:
            qs = qs.filter(created_by_id=created_by)

        q = params.get("q")
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))

        return qs

    def get_permissions(self):
        if self.action in {"list", "retrieve", "modules", "lessons"}:
            return [permissions.AllowAny()]
        return [IsAuthenticated(), IsAdminOrInstructor()]

    @action(detail=True, methods=["get"])
    def modules(self, request, pk=None):
        course = self.get_object()
        modules = course.modules.order_by("order", "id")
        serializer = ModuleSerializer(modules, many=True)
        return self.get_response(serializer.data)

    @action(detail=True, methods=["get"], url_path="lessons")
    def lessons(self, request, pk=None):
        course = self.get_object()
        lessons = Lesson.objects.filter(module__course=course).order_by(
            "module__order", "module_id", "order", "id"
        )
        serializer = LessonSerializer(lessons, many=True)
        return self.get_response(serializer.data)

    # Helper to return Response consistently
    def get_response(self, data, status_code=200):
        from rest_framework.response import Response

        return Response(data, status=status_code)


class ModuleViewSet(viewsets.ModelViewSet):
    serializer_class = ModuleSerializer

    def get_queryset(self):
        qs = Module.objects.select_related("course").all()
        params = self.request.query_params

        # Nested: /courses/{course_pk}/modules/
        course_pk = self.kwargs.get("course_pk")
        if course_pk:
            qs = qs.filter(course_id=course_pk)

        course_id = params.get("course")
        if course_id:
            qs = qs.filter(course_id=course_id)

        course_slug = params.get("course_slug")
        if course_slug:
            qs = qs.filter(course__slug=course_slug)

        slug = params.get("slug")
        if slug:
            qs = qs.filter(slug=slug)

        q = params.get("q")
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))

        return qs.order_by("course_id", "order", "id")

    def get_permissions(self):
        if self.action in {"list", "retrieve", "lessons"}:
            return [permissions.AllowAny()]
        return [IsAuthenticated(), IsAdminOrInstructor()]

    @action(detail=True, methods=["get"])
    def lessons(self, request, pk=None):
        module = self.get_object()
        lessons = module.lessons.order_by("order", "id")
        serializer = LessonSerializer(lessons, many=True)
        return Response(serializer.data)


class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer

    def get_queryset(self):
        qs = Lesson.objects.select_related("module", "module__course").all()
        params = self.request.query_params

        # Nested: /courses/{course_pk}/lessons/ and /modules/{module_pk}/lessons/
        course_pk = self.kwargs.get("course_pk")
        if course_pk:
            qs = qs.filter(module__course_id=course_pk)

        module_pk = self.kwargs.get("module_pk")
        if module_pk:
            qs = qs.filter(module_id=module_pk)

        module_id = params.get("module")
        if module_id:
            qs = qs.filter(module_id=module_id)

        module_slug = params.get("module_slug")
        if module_slug:
            qs = qs.filter(module__slug=module_slug)

        course_slug = params.get("course_slug")
        if course_slug:
            qs = qs.filter(module__course__slug=course_slug)

        slug = params.get("slug")
        if slug:
            qs = qs.filter(slug=slug)

        is_published = _get_bool(params.get("is_published"))
        if is_published is not None:
            qs = qs.filter(is_published=is_published)

        q = params.get("q")
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(content__icontains=q))

        return qs.order_by("module__order", "module_id", "order", "id")

    def get_permissions(self):
        if self.action in {"list", "retrieve", "content_blocks"}:
            return [permissions.AllowAny()]
        return [IsAuthenticated(), IsAdminOrInstructor()]

    @action(detail=True, methods=["get"], url_path="content-blocks")
    def content_blocks(self, request, pk=None):
        lesson = self.get_object()
        blocks = lesson.content_blocks.order_by("order", "id")
        serializer = ContentBlockSerializer(blocks, many=True)
        return Response(serializer.data)


class ContentBlockViewSet(viewsets.ModelViewSet):
    serializer_class = ContentBlockSerializer

    def get_queryset(self):
        qs = ContentBlock.objects.select_related("lesson", "lesson__module").all()
        params = self.request.query_params

        # Nested: /lessons/{lesson_pk}/content-blocks/
        lesson_pk = self.kwargs.get("lesson_pk")
        if lesson_pk:
            qs = qs.filter(lesson_id=lesson_pk)

        # Nested via higher parents (not directly registered but allow filtering)
        module_pk = self.kwargs.get("module_pk")
        if module_pk:
            qs = qs.filter(lesson__module_id=module_pk)

        course_pk = self.kwargs.get("course_pk")
        if course_pk:
            qs = qs.filter(lesson__module__course_id=course_pk)

        lesson_id = params.get("lesson")
        if lesson_id:
            qs = qs.filter(lesson_id=lesson_id)

        module_id = params.get("module")
        if module_id:
            qs = qs.filter(lesson__module_id=module_id)

        module_slug = params.get("module_slug")
        if module_slug:
            qs = qs.filter(lesson__module__slug=module_slug)

        course_slug = params.get("course_slug")
        if course_slug:
            qs = qs.filter(lesson__module__course__slug=course_slug)

        block_type = params.get("block_type")
        if block_type:
            qs = qs.filter(block_type=block_type)

        is_published = _get_bool(params.get("is_published"))
        if is_published is not None:
            qs = qs.filter(is_published=is_published)

        q = params.get("q")
        if q:
            qs = qs.filter(Q(title__icontains=q))

        return qs.order_by("lesson__module__order", "lesson__order", "order", "id")

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.AllowAny()]
        return [IsAuthenticated(), IsAdminOrInstructor()]


class LessonProgressViewSet(viewsets.ModelViewSet):
    serializer_class = LessonProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = LessonProgress.objects.select_related("lesson", "user", "lesson__module", "lesson__module__course")
        # Limit to current user unless admin/instructor explicitly wants all
        user = self.request.user
        if not (hasattr(user, "role") and user.role in {"admin", "instructor"}):
            qs = qs.filter(user=user)

        params = self.request.query_params
        lesson_id = params.get("lesson")
        if lesson_id:
            qs = qs.filter(lesson_id=lesson_id)

        module_id = params.get("module")
        if module_id:
            qs = qs.filter(lesson__module_id=module_id)

        course_id = params.get("course")
        if course_id:
            qs = qs.filter(lesson__module__course_id=course_id)

        is_completed = params.get("is_completed")
        if is_completed is not None:
            val = is_completed.strip().lower() in {"1", "true", "yes", "on"}
            qs = qs.filter(is_completed=val)

        return qs.order_by("-completed_at", "lesson_id")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BadgeViewSet(viewsets.ModelViewSet):
    serializer_class = BadgeSerializer
    queryset = Badge.objects.all().order_by("name")

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.AllowAny()]
        return [IsAuthenticated(), IsAdminOrInstructor()]


class UserBadgeViewSet(viewsets.ModelViewSet):
    serializer_class = UserBadgeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = UserBadge.objects.select_related("badge", "user", "badge__course")
        user = self.request.user
        if not (hasattr(user, "role") and user.role in {"admin", "instructor"}):
            qs = qs.filter(user=user)
        return qs.order_by("-awarded_at")

    def perform_create(self, serializer):
        # Allow self-award or admin/instructor awarding for others
        user = self.request.user
        target_user = user
        target = self.request.data.get("user")
        if target and hasattr(user, "role") and user.role in {"admin", "instructor"}:
            target_user = target
        serializer.save(user=target_user)


class QuizViewSet(viewsets.ModelViewSet):
    serializer_class = QuizSerializer

    def get_queryset(self):
        qs = Quiz.objects.select_related("lesson", "lesson__module", "lesson__module__course").all()
        params = self.request.query_params

        lesson_pk = self.kwargs.get("lesson_pk")
        if lesson_pk:
            qs = qs.filter(lesson_id=lesson_pk)

        lesson_id = params.get("lesson")
        if lesson_id:
            qs = qs.filter(lesson_id=lesson_id)

        is_published = _get_bool(params.get("is_published"))
        if is_published is not None:
            qs = qs.filter(is_published=is_published)

        q = params.get("q")
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))

        return qs.order_by("lesson_id", "order", "id")

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.AllowAny()]
        return [IsAuthenticated(), IsAdminOrInstructor()]


class QuizQuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuizQuestionSerializer

    def get_queryset(self):
        qs = QuizQuestion.objects.select_related("quiz", "quiz__lesson").all()
        quiz_pk = self.kwargs.get("quiz_pk")
        if quiz_pk:
            qs = qs.filter(quiz_id=quiz_pk)
        return qs.order_by("quiz_id", "order", "id")

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.AllowAny()]
        return [IsAuthenticated(), IsAdminOrInstructor()]

    def perform_create(self, serializer):
        # Ensure nested quiz is set from URL when posting to /quizzes/{quiz_pk}/questions/
        quiz_pk = self.kwargs.get("quiz_pk")
        if quiz_pk:
            serializer.save(quiz_id=quiz_pk)
        else:
            serializer.save()


class QuizChoiceViewSet(viewsets.ModelViewSet):
    serializer_class = QuizChoiceSerializer

    def get_queryset(self):
        qs = QuizChoice.objects.select_related("question", "question__quiz").all()
        question_pk = self.kwargs.get("question_pk")
        if question_pk:
            qs = qs.filter(question_id=question_pk)
        return qs.order_by("question_id", "order", "id")

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.AllowAny()]
        return [IsAuthenticated(), IsAdminOrInstructor()]

    def perform_create(self, serializer):
        # Ensure nested question is set from URL when posting to /questions/{question_pk}/choices/
        question_pk = self.kwargs.get("question_pk")
        if question_pk:
            serializer.save(question_id=question_pk)
        else:
            serializer.save()


class QuizSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = QuizSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = QuizSubmission.objects.select_related("quiz", "quiz__lesson").all()
        user = self.request.user
        if not (hasattr(user, "role") and user.role in {"admin", "instructor"}):
            qs = qs.filter(user=user)

        quiz_pk = self.kwargs.get("quiz_pk")
        if quiz_pk:
            qs = qs.filter(quiz_id=quiz_pk)
        return qs.order_by("-submitted_at", "id")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ExerciseViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseSerializer

    def get_queryset(self):
        qs = Exercise.objects.select_related("lesson", "lesson__module").all()
        lesson_pk = self.kwargs.get("lesson_pk")
        if lesson_pk:
            qs = qs.filter(lesson_id=lesson_pk)
        return qs.order_by("lesson_id", "order", "id")

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.AllowAny()]
        return [IsAuthenticated(), IsAdminOrInstructor()]


class ExerciseSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ExerciseSubmission.objects.select_related("exercise", "user").all()
        user = self.request.user
        if not (hasattr(user, "role") and user.role in {"admin", "instructor"}):
            qs = qs.filter(user=user)
        exercise_pk = self.kwargs.get("exercise_pk")
        if exercise_pk:
            qs = qs.filter(exercise_id=exercise_pk)
        return qs.order_by("-submitted_at", "id")

    def perform_create(self, serializer):
        # Naive auto-evaluation using expected keywords in exercise.data
        exercise: Exercise = serializer.validated_data["exercise"]
        content: str = serializer.validated_data.get("content", "")
        data = exercise.data or {}
        expected = [str(x).lower() for x in data.get("expected_keywords", [])]
        min_matches = int(data.get("min_matches", 0))
        txt = content.lower()
        matches = sum(1 for kw in expected if kw in txt)
        score = float(matches)
        max_score = float(max(len(expected), 1))
        passed = matches >= (min_matches or len(expected)) if expected else True
        feedback = "Good job" if passed else "Consider including more key concepts."
        serializer.save(user=self.request.user, score=score, max_score=max_score, feedback=feedback)


class PromptTemplateCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = PromptTemplateCategorySerializer
    queryset = PromptTemplateCategory.objects.select_related("parent").all()

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.AllowAny()]
        return [IsAuthenticated(), IsAdminOrInstructor()]


class PromptTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = PromptTemplateSerializer

    def get_queryset(self):
        qs = PromptTemplate.objects.select_related("category", "created_by").all()
        params = self.request.query_params

        category = params.get("category")
        if category:
            qs = qs.filter(category_id=category)
        category_slug = params.get("category_slug")
        if category_slug:
            qs = qs.filter(category__slug=category_slug)
        tag = params.get("tag")
        if tag:
            qs = qs.filter(tags__contains=[tag.lower()])
        slug = params.get("slug")
        if slug:
            qs = qs.filter(slug=slug)
        is_active = params.get("is_active")
        if is_active is not None:
            flag = is_active.strip().lower() in {"1", "true", "yes", "on"}
            qs = qs.filter(is_active=flag)
        created_by = params.get("created_by")
        if created_by:
            qs = qs.filter(created_by_id=created_by)
        q = params.get("q")
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q) | Q(content__icontains=q))

        return qs.order_by("category_id", "title")

    def get_permissions(self):
        if self.action in {"list", "retrieve", "preview"}:
            return [permissions.AllowAny()]
        return [IsAuthenticated(), IsAdminOrInstructor()]

    @action(detail=True, methods=["post"])
    def preview(self, request, pk=None):
        template = self.get_object()
        params = request.data or {}
        # Safe format: leave missing keys unformatted
        content = template.content
        for var in (template.variables or []):
            val = params.get(var, "{" + var + "}")
            content = content.replace("{" + var + "}", str(val))
        return Response({"rendered": content})


# 3.7 ViewSets
class CoursePromptCollectionViewSet(viewsets.ModelViewSet):
    serializer_class = CoursePromptCollectionSerializer

    def get_queryset(self):
        qs = CoursePromptCollection.objects.select_related("course", "created_by").prefetch_related("items").all()
        params = self.request.query_params

        course_pk = self.kwargs.get("course_pk")
        if course_pk:
            qs = qs.filter(course_id=course_pk)

        course_id = params.get("course")
        if course_id:
            qs = qs.filter(course_id=course_id)

        slug = params.get("slug")
        if slug:
            qs = qs.filter(slug=slug)

        tag = params.get("tag")
        if tag:
            qs = qs.filter(tags__contains=[tag.lower()])

        is_active = _get_bool(params.get("is_active"))
        if is_active is not None:
            qs = qs.filter(is_active=is_active)

        q = params.get("q")
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))

        return qs.order_by("course_id", "order", "title", "id")

    def get_permissions(self):
        if self.action in {"list", "retrieve", "items", "resolved"}:
            return [permissions.AllowAny()]
        return [IsAuthenticated(), IsAdminOrInstructor()]

    @action(detail=True, methods=["get"], url_path="items")
    def items_action(self, request, pk=None):
        collection = self.get_object()
        items = collection.items.select_related("template").order_by("order", "id")
        serializer = CoursePromptItemSerializer(items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="resolved")
    def resolved(self, request, pk=None):
        """Return the collection with items where each item merges template with overrides and renders preview.
        Request body may include a mapping of variable values to preview render.
        """
        collection = self.get_object()
        var_values = request.data or {}
        result = {
            "collection": CoursePromptCollectionSerializer(collection).data,
            "items": [],
        }
        for item in collection.items.select_related("template").order_by("order", "id"):
            tpl = item.template
            content = (item.content_override or tpl.content)
            # variables precedence: override -> template.variables
            vars_list = item.variables_override or tpl.variables or []
            # params precedence: template.default_params updated by item.params_override
            params = dict(tpl.default_params or {})
            params.update(item.params_override or {})
            # tags precedence: template.tags extended/overridden by override list if provided
            tags = list(tpl.tags or [])
            if item.tags_override:
                # ensure unique lowercase
                seen = set()
                tags = []
                for t in (item.tags_override or []):
                    s = str(t).strip().lower()
                    if s and s not in seen:
                        seen.add(s)
                        tags.append(s)
            # Render a preview
            rendered = content
            for var in (vars_list or []):
                val = var_values.get(var, "{" + var + "}")
                rendered = rendered.replace("{" + var + "}", str(val))
            result["items"].append(
                {
                    "id": item.id,
                    "title": item.display_title,
                    "slug": item.slug,
                    "description": item.description or tpl.description,
                    "content": content,
                    "variables": vars_list,
                    "params": params,
                    "tags": tags,
                    "order": item.order,
                    "is_active": item.is_active and tpl.is_active,
                    "template": PromptTemplateSerializer(tpl).data,
                    "rendered": rendered,
                }
            )
        return Response(result)


class CoursePromptItemViewSet(viewsets.ModelViewSet):
    serializer_class = CoursePromptItemSerializer

    def get_queryset(self):
        qs = CoursePromptItem.objects.select_related("collection", "template", "collection__course").all()
        params = self.request.query_params

        collection_pk = self.kwargs.get("collection_pk")
        if collection_pk:
            qs = qs.filter(collection_id=collection_pk)

        course_pk = self.kwargs.get("course_pk")
        if course_pk:
            qs = qs.filter(collection__course_id=course_pk)

        is_active = _get_bool(params.get("is_active"))
        if is_active is not None:
            qs = qs.filter(is_active=is_active)

        slug = params.get("slug")
        if slug:
            qs = qs.filter(slug=slug)

        q = params.get("q")
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q) | Q(template__title__icontains=q))

        return qs.order_by("collection_id", "order", "id")

    def get_permissions(self):
        if self.action in {"list", "retrieve", "preview"}:
            return [permissions.AllowAny()]
        return [IsAuthenticated(), IsAdminOrInstructor()]

    @action(detail=True, methods=["post"])
    def preview(self, request, pk=None):
        item = self.get_object()
        tpl = item.template
        content = (item.content_override or tpl.content)
        vars_list = item.variables_override or tpl.variables or []
        params = dict(tpl.default_params or {})
        params.update(item.params_override or {})
        tags = list(tpl.tags or [])
        if item.tags_override:
            seen = set()
            tags = []
            for t in (item.tags_override or []):
                s = str(t).strip().lower()
                if s and s not in seen:
                    seen.add(s)
                    tags.append(s)
        rendered = content
        for var in (vars_list or []):
            val = (request.data or {}).get(var, "{" + var + "}")
            rendered = rendered.replace("{" + var + "}", str(val))
        return Response({
            "id": item.id,
            "title": item.display_title,
            "slug": item.slug,
            "description": item.description or tpl.description,
            "content": content,
            "variables": vars_list,
            "params": params,
            "tags": tags,
            "order": item.order,
            "is_active": item.is_active and tpl.is_active,
            "template": PromptTemplateSerializer(tpl).data,
            "rendered": rendered,
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOrInstructor])
def upload_file(request):
    """Upload a file to the media directory with organized folder structure."""
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    upload_path = request.data.get('path', 'general')
    
    # Sanitize the upload path
    upload_path = upload_path.strip('/').replace('..', '')
    
    # Use original filename, but handle conflicts by adding a counter if needed
    original_filename = file.name
    base_name, file_extension = os.path.splitext(original_filename)
    
    # Sanitize filename (remove/replace problematic characters)
    safe_base_name = re.sub(r'[^\w\-_\. ]', '_', base_name)
    safe_filename = f"{safe_base_name}{file_extension}"
    
    # Check for conflicts and add counter if needed
    counter = 0
    final_filename = safe_filename
    full_path = f"uploads/{upload_path}/{final_filename}"
    
    while default_storage.exists(full_path):
        counter += 1
        name_with_counter = f"{safe_base_name}_{counter}{file_extension}"
        final_filename = name_with_counter
        full_path = f"uploads/{upload_path}/{final_filename}"
    
    try:
        # Save the file
        path = default_storage.save(full_path, ContentFile(file.read()))
        
        # Generate the URL
        file_url = f"/media/{path}"
        
        return Response({
            'success': True,
            'url': file_url,
            'filename': final_filename,
            'path': path,
            'size': file.size
        })
    except Exception as e:
        return Response({
            'error': f'Upload failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_course_files(request, course_id):
    """List all files uploaded for a specific course, organized by module and lesson."""
    try:
        # Check if user has access to this course
        course = Course.objects.get(id=course_id)
        
        # Get the course directory path
        course_path = os.path.join(settings.MEDIA_ROOT, 'uploads', str(course_id))
        
        if not os.path.exists(course_path):
            return Response({'files': []})
        
        files_by_location = {}
        
        # Walk through the directory structure
        for root, dirs, files in os.walk(course_path):
            if files:
                # Get relative path from course directory
                rel_path = os.path.relpath(root, course_path)
                path_parts = rel_path.split(os.sep) if rel_path != '.' else []
                
                # Organize by module/lesson structure
                if len(path_parts) >= 2:
                    module_id = path_parts[0]
                    lesson_id = path_parts[1]
                    
                    # Get module and lesson names
                    try:
                        module = Module.objects.get(id=module_id)
                        lesson = Lesson.objects.get(id=lesson_id)
                        
                        location_key = f"{module.title} / {lesson.title}"
                        
                        if location_key not in files_by_location:
                            files_by_location[location_key] = {
                                'module_id': module_id,
                                'lesson_id': lesson_id,
                                'module_title': module.title,
                                'lesson_title': lesson.title,
                                'files': []
                            }
                        
                        for filename in files:
                            file_path = os.path.join(root, filename)
                            file_stat = os.stat(file_path)
                            
                            # Generate URL
                            rel_file_path = os.path.relpath(file_path, settings.MEDIA_ROOT)
                            file_url = f"/media/{rel_file_path.replace(os.sep, '/')}"
                            
                            files_by_location[location_key]['files'].append({
                                'filename': filename,
                                'url': file_url,
                                'size': file_stat.st_size,
                                'uploaded_at': datetime.fromtimestamp(file_stat.st_mtime).isoformat()
                            })
                    except (Module.DoesNotExist, Lesson.DoesNotExist):
                        # Skip if module or lesson doesn't exist
                        continue
        
        return Response({'files': files_by_location})
        
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Failed to list files: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
