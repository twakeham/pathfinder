from django.contrib import admin

from .models import Course, Module, Lesson, ContentBlock, LessonProgress, Badge, UserBadge, PromptTemplateCategory, PromptTemplate, CoursePromptCollection, CoursePromptItem


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    fields = ("title", "order", "is_published", "slug")
    readonly_fields = ("slug",)
    ordering = ("order", "id")


class ModuleInline(admin.TabularInline):
    model = Module
    extra = 0
    fields = ("title", "order", "slug")
    readonly_fields = ("slug",)
    ordering = ("order", "id")


class ContentBlockInline(admin.TabularInline):
    model = ContentBlock
    extra = 0
    fields = ("block_type", "title", "order", "is_published")
    ordering = ("order", "id")


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "is_published", "created_by", "created_at")
    list_filter = ("is_published",)
    search_fields = ("title", "description")
    inlines = (ModuleInline,)
    readonly_fields = ("slug", "created_at", "updated_at")


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "order")
    list_filter = ("course",)
    search_fields = ("title", "description", "course__title")
    ordering = ("course", "order", "id")
    inlines = (LessonInline,)
    readonly_fields = ("slug",)


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    def course(self, obj: Lesson):  # type: ignore[override]
        return obj.module.course

    course.short_description = "Course"  # type: ignore[attr-defined]
    course.admin_order_field = "module__course"  # type: ignore[attr-defined]

    list_display = ("title", "module", "course", "order", "is_published")
    list_filter = ("module__course", "module", "is_published")
    search_fields = ("title", "module__title", "module__course__title")
    ordering = ("module__course", "module", "order", "id")
    readonly_fields = ("slug", "created_at", "updated_at")
    inlines = (ContentBlockInline,)


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "lesson", "is_completed", "completed_at")
    list_filter = ("is_completed", "lesson__module__course")
    search_fields = ("user__username", "lesson__title")


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "course", "threshold_percent", "is_active")
    list_filter = ("is_active", "course")
    search_fields = ("name", "code", "description")


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ("user", "badge", "awarded_at")
    list_filter = ("badge__course",)
    search_fields = ("user__username", "badge__name")


@admin.register(PromptTemplateCategory)
class PromptTemplateCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "parent", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "description")
    readonly_fields = ("slug",)


@admin.register(PromptTemplate)
class PromptTemplateAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "category", "is_active", "created_by", "updated_at")
    list_filter = ("is_active", "category")
    search_fields = ("title", "description", "content", "tags")
    readonly_fields = ("slug", "created_at", "updated_at")


class CoursePromptItemInline(admin.TabularInline):
    model = CoursePromptItem
    extra = 0
    fields = ("template", "title", "order", "is_active", "slug")
    readonly_fields = ("slug",)
    ordering = ("order", "id")


@admin.register(CoursePromptCollection)
class CoursePromptCollectionAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "order", "is_active", "created_by")
    list_filter = ("course", "is_active")
    search_fields = ("title", "description", "course__title")
    ordering = ("course", "order", "id")
    readonly_fields = ("slug", "created_at", "updated_at")
    inlines = (CoursePromptItemInline,)


@admin.register(CoursePromptItem)
class CoursePromptItemAdmin(admin.ModelAdmin):
    list_display = ("display_title", "collection", "order", "is_active")
    list_filter = ("collection__course", "collection")
    search_fields = ("title", "description", "template__title")
    ordering = ("collection", "order", "id")
    readonly_fields = ("slug", "created_at")
