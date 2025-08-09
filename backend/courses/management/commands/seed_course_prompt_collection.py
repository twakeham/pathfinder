from __future__ import annotations

from django.core.management.base import BaseCommand

from authentication.models import User
from courses.models import Course, CoursePromptCollection, CoursePromptItem, PromptTemplate


class Command(BaseCommand):
    help = "Seed a demo prompt collection for the demo AI course."

    def add_arguments(self, parser):
        parser.add_argument("--creator", type=str, default=None, help="Username or email for created_by")
        parser.add_argument("--course", type=str, default="ai-prompt-engineering", help="Course slug to attach collection to")
        parser.add_argument("--force", action="store_true", help="Recreate demo collection")

    def handle(self, *args, **options):
        creator = None
        c = options.get("creator")
        if c:
            creator = User.objects.filter(username=c).first() or User.objects.filter(email=c).first()

        course_slug = options.get("course") or "ai-prompt-engineering"
        course = Course.objects.filter(slug=course_slug).first()
        if not course:
            self.stdout.write(self.style.WARNING(f"Course with slug '{course_slug}' not found. Run seed_demo_ai_course first."))
            return

        title = "AI Course – Quick Prompts"
        if options.get("force"):
            CoursePromptCollection.objects.filter(course=course, title=title).delete()

        collection, created = CoursePromptCollection.objects.get_or_create(
            course=course,
            title=title,
            defaults={
                "description": "Curated prompts for the AI course",
                "tags": ["ai", "quick", "starter"],
                "order": 1,
                "created_by": creator,
            },
        )

        # Map a few templates if present
        mapping = [
            ("Summarize Text", {"length": 150, "style": "concise"}),
            ("System Persona", {"role": "AI tutor", "objectives": "Guide the learner", "constraints": "Stay concise"}),
            ("Code Reviewer", {"language": "python"}),
        ]

        order = 0
        for tpl_title, param_override in mapping:
            tpl = PromptTemplate.objects.filter(title=tpl_title).first()
            if not tpl:
                continue
            order += 1
            CoursePromptItem.objects.get_or_create(
                collection=collection,
                template=tpl,
                defaults={
                    "order": order,
                    "params_override": param_override,
                    "is_active": True,
                },
            )

        self.stdout.write(self.style.SUCCESS(f"Seeded prompt collection for course '{course.title}'"))
