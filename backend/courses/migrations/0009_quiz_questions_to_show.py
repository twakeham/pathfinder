from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0008_alter_quiz_attempts_allowed"),
    ]

    operations = [
        migrations.AddField(
            model_name="quiz",
            name="questions_to_show",
            field=models.PositiveIntegerField(
                null=True,
                blank=True,
                help_text="Number of questions to show per attempt; leave blank to show all",
            ),
        ),
    ]
