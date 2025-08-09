from __future__ import annotations

from django.core.management.base import BaseCommand

from authentication.models import User
from courses.models import PromptTemplateCategory, PromptTemplate


class Command(BaseCommand):
    help = "Seed demo prompt template categories and templates."

    def add_arguments(self, parser):
        parser.add_argument("--creator", type=str, default=None, help="Username or email for created_by")
        parser.add_argument("--force", action="store_true", help="Recreate demo templates")

    def handle(self, *args, **options):
        creator = None
        c = options.get("creator")
        if c:
            creator = User.objects.filter(username=c).first() or User.objects.filter(email=c).first()

        cats = [
            ("General", "Generic utility prompts", None),
            ("Chat", "Conversation helpers and system prompts", None),
            ("Coding", "Developer/coding assistants", None),
        ]
        cat_objs: dict[str, PromptTemplateCategory] = {}
        for name, desc, parent in cats:
            if options.get("force"):
                PromptTemplateCategory.objects.filter(name=name).delete()
            obj, _ = PromptTemplateCategory.objects.get_or_create(name=name, defaults={"description": desc})
            cat_objs[name] = obj

        demos = [
            {
                "title": "Summarize Text",
                "description": "Summarize arbitrary text with a given style and length.",
                "content": "Summarize the following text in a {style} style with about {length} words.\n\nText:\n{input}",
                "variables": ["style", "length", "input"],
                "tags": ["summary", "general"],
                "default_params": {"temperature": 0.3},
                "category": cat_objs["General"],
            },
            {
                "title": "System Persona",
                "description": "Create a system message persona.",
                "content": "You are {role}. Your objectives: {objectives}. Constraints: {constraints}.",
                "variables": ["role", "objectives", "constraints"],
                "tags": ["chat", "persona"],
                "default_params": {"temperature": 0.2},
                "category": cat_objs["Chat"],
            },
            {
                "title": "Code Reviewer",
                "description": "Review code for issues and suggestions.",
                "content": "Review the following {language} code and list issues and improvements.\n\n{code}",
                "variables": ["language", "code"],
                "tags": ["coding", "review"],
                "default_params": {"temperature": 0.1},
                "category": cat_objs["Coding"],
            },
        ]

        for demo in demos:
            if options.get("force"):
                PromptTemplate.objects.filter(title=demo["title"]).delete()
            obj, created = PromptTemplate.objects.get_or_create(title=demo["title"], defaults={**demo, "created_by": creator})
            if not created:
                # Update tags/defaults if changed
                obj.description = obj.description or demo["description"]
                obj.variables = demo["variables"]
                obj.tags = demo["tags"]
                obj.default_params = demo["default_params"]
                obj.category = demo["category"]
                obj.save()

        self.stdout.write(self.style.SUCCESS("Seeded demo prompt templates"))
