from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Course",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("code", models.CharField(max_length=20)),
                ("name", models.CharField(max_length=120)),
                ("term", models.CharField(max_length=30)),
                ("banner", models.ImageField(blank=True, upload_to="course_banners")),
                ("last_edited", models.DateTimeField(auto_now=True)),
                (
                    "instructors",
                    models.ManyToManyField(
                        related_name="courses", to=settings.AUTH_USER_MODEL
                    ),
                ),
            ],
            options={
                "ordering": ["-last_edited"],
            },
        ),
    ]
