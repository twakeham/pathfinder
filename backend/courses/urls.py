from rest_framework import routers
from rest_framework_nested import routers as nested_routers
from django.urls import include, path

from .views import (
    CourseViewSet,
    ModuleViewSet,
    LessonViewSet,
    ContentBlockViewSet,
    LessonProgressViewSet,
    BadgeViewSet,
    UserBadgeViewSet,
    QuizViewSet,
    QuizQuestionViewSet,
    QuizChoiceViewSet,
    QuizSubmissionViewSet,
    ExerciseViewSet,
    ExerciseSubmissionViewSet,
    PromptTemplateCategoryViewSet,
    PromptTemplateViewSet,
    CoursePromptCollectionViewSet,
    CoursePromptItemViewSet,
    upload_file,
    list_course_files,
)

router = routers.DefaultRouter()
router.register(r"courses", CourseViewSet, basename="course")
router.register(r"modules", ModuleViewSet, basename="module")
router.register(r"lessons", LessonViewSet, basename="lesson")
router.register(r"content-blocks", ContentBlockViewSet, basename="contentblock")
router.register(r"lesson-progress", LessonProgressViewSet, basename="lessonprogress")
router.register(r"badges", BadgeViewSet, basename="badge")
router.register(r"user-badges", UserBadgeViewSet, basename="userbadge")
router.register(r"quizzes", QuizViewSet, basename="quiz")
router.register(r"quiz-questions", QuizQuestionViewSet, basename="quizquestion")
router.register(r"quiz-choices", QuizChoiceViewSet, basename="quizchoice")
router.register(r"quiz-submissions", QuizSubmissionViewSet, basename="quizsubmission")
router.register(r"exercises", ExerciseViewSet, basename="exercise")
router.register(r"exercise-submissions", ExerciseSubmissionViewSet, basename="exercisesubmission")
router.register(r"prompt-categories", PromptTemplateCategoryViewSet, basename="promptcategory")
router.register(r"prompt-templates", PromptTemplateViewSet, basename="prompttemplate")
router.register(r"prompt-collections", CoursePromptCollectionViewSet, basename="promptcollection")
router.register(r"prompt-items", CoursePromptItemViewSet, basename="promptitem")

courses_router = nested_routers.NestedDefaultRouter(router, r"courses", lookup="course")
courses_router.register(r"modules", ModuleViewSet, basename="course-modules")
courses_router.register(r"lessons", LessonViewSet, basename="course-lessons")
courses_router.register(r"prompt-collections", CoursePromptCollectionViewSet, basename="course-prompt-collections")

modules_router = nested_routers.NestedDefaultRouter(router, r"modules", lookup="module")
modules_router.register(r"lessons", LessonViewSet, basename="module-lessons")

lessons_router = nested_routers.NestedDefaultRouter(router, r"lessons", lookup="lesson")
lessons_router.register(r"content-blocks", ContentBlockViewSet, basename="lesson-content-blocks")
lessons_router.register(r"quizzes", QuizViewSet, basename="lesson-quizzes")
lessons_router.register(r"exercises", ExerciseViewSet, basename="lesson-exercises")

quizzes_router = nested_routers.NestedDefaultRouter(router, r"quizzes", lookup="quiz")
quizzes_router.register(r"questions", QuizQuestionViewSet, basename="quiz-questions-nested")
quizzes_router.register(r"submissions", QuizSubmissionViewSet, basename="quiz-submissions-nested")

questions_router = nested_routers.NestedDefaultRouter(quizzes_router, r"questions", lookup="question")
questions_router.register(r"choices", QuizChoiceViewSet, basename="question-choices")

exercises_router = nested_routers.NestedDefaultRouter(router, r"exercises", lookup="exercise")
exercises_router.register(r"submissions", ExerciseSubmissionViewSet, basename="exercise-submissions-nested")

prompt_categories_router = nested_routers.NestedDefaultRouter(router, r"prompt-categories", lookup="prompt_category")
prompt_categories_router.register(r"prompt-templates", PromptTemplateViewSet, basename="category-prompt-templates")

prompt_collections_router = nested_routers.NestedDefaultRouter(router, r"prompt-collections", lookup="collection")
prompt_collections_router.register(r"items", CoursePromptItemViewSet, basename="collection-prompt-items")

urlpatterns = [
    path("upload/", upload_file, name="upload_file"),
    path("files/<int:course_id>/", list_course_files, name="list_course_files"),
    path("", include(router.urls)),
    path("", include(courses_router.urls)),
    path("", include(modules_router.urls)),
    path("", include(lessons_router.urls)),
    path("", include(quizzes_router.urls)),
    path("", include(questions_router.urls)),
    path("", include(exercises_router.urls)),
    path("", include(prompt_categories_router.urls)),
    path("", include(prompt_collections_router.urls)),
]
