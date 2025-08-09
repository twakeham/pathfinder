from __future__ import annotations

from django.core.management.base import BaseCommand
from django.utils import timezone

from authentication.models import User
from courses.models import Course, Module, Lesson, ContentBlock


class Command(BaseCommand):
    help = "Seed a demo AI course with modules, lessons, and content blocks."

    def add_arguments(self, parser):
        parser.add_argument("--creator", type=str, default=None, help="Username (or email) of the course creator")
        parser.add_argument("--publish", action="store_true", help="Mark course and lessons as published")
        parser.add_argument("--force", action="store_true", help="Recreate the course if it already exists")

    def handle(self, *args, **options):
        creator = None
        creator_arg = options.get("creator")
        if creator_arg:
            creator = User.objects.filter(username=creator_arg).first() or User.objects.filter(email=creator_arg).first()

        title = "Intro to Prompt Engineering and AI Models"
        slug = "ai-prompt-engineering"

        if options.get("force"):
            Course.objects.filter(slug=slug).delete()

        course, created = Course.objects.get_or_create(
            slug=slug,
            defaults={
                "title": title,
                "description": "Learn how to craft effective prompts, compare model behaviors, and build AI-powered interactions.",
                "created_by": creator,
                "is_published": bool(options.get("publish")),
            },
        )
        if not created:
            self.stdout.write(self.style.WARNING("Course already exists; updating metadata"))
            if creator and course.created_by is None:
                course.created_by = creator
            if options.get("publish"):
                course.is_published = True
            course.description = (
                course.description
                or "Learn how to craft effective prompts, compare model behaviors, and build AI-powered interactions."
            )
            course.save()

        # Modules
        modules_data = [
            ("Foundations", "Core concepts and terminology"),
            ("Prompt Engineering", "Techniques and patterns for better prompts"),
            ("Model Comparison", "Experiment with different model settings"),
        ]

        modules: list[Module] = []
        for idx, (m_title, m_desc) in enumerate(modules_data, start=1):
            module, _ = Module.objects.get_or_create(
                course=course,
                title=m_title,
                defaults={"description": m_desc, "order": idx},
            )
            modules.append(module)

        publish_flag = bool(options.get("publish"))

        # Lessons and blocks
        lessons_spec = [
            {
                "module": modules[0],
                "title": "What is a Large Language Model?",
                "content": "Overview of LLMs, tokens, and common terminology.",
                "blocks": [
                    {"type": "text", "title": "Overview", "data": {"content": "LLMs predict next tokens...", "format": "markdown"}},
                    {"type": "image", "title": "Tokenization", "data": {"url": "https://placehold.co/800x400", "caption": "Tokenization example"}},
                ],
            },
            {
                "module": modules[1],
                "title": "Prompt Patterns",
                "content": "Chain-of-thought, few-shot, and role prompting.",
                "blocks": [
                    {"type": "text", "title": "Patterns", "data": {"content": "Use roles, constraints, and examples.", "format": "markdown"}},
                    {"type": "code", "title": "Few-shot JSON", "data": {"language": "json", "code": "{\n  'role': 'system',\n  'content': 'You are ...'\n}"}},
                ],
            },
            {
                "module": modules[2],
                "title": "Experiment: Temperature vs. Top-p",
                "content": "Understand sampling parameters by comparison.",
                "blocks": [
                    {"type": "text", "title": "Sliders", "data": {"content": "Try different temperature and top-p settings.", "format": "markdown"}},
                    {"type": "prompt", "title": "Try it", "data": {"prompt": "Explain temperature vs top-p with examples."}},
                ],
            },
        ]

        for order, spec in enumerate(lessons_spec, start=1):
            lesson, _ = Lesson.objects.get_or_create(
                module=spec["module"],
                title=spec["title"],
                defaults={
                    "content": spec["content"],
                    "order": order,
                    "is_published": publish_flag,
                },
            )

            # Clear and recreate blocks for idempotence
            lesson.content_blocks.all().delete()
            for b_order, block in enumerate(spec["blocks"], start=1):
                ContentBlock.objects.create(
                    lesson=lesson,
                    block_type=block["type"],
                    title=block.get("title", ""),
                    data=block.get("data", {}),
                    order=b_order,
                    is_published=publish_flag,
                )

        self.stdout.write(self.style.SUCCESS(f"Seeded course: {course.title} ({course.slug})"))
