from django.db import migrations


def forward(apps, schema_editor):
    OldCourse = apps.get_model("exams", "Course")
    NewCourse = apps.get_model("courses", "Course")
    db_alias = schema_editor.connection.alias

    for oc in OldCourse.objects.using(db_alias).all():
        nc = NewCourse.objects.using(db_alias).create(
            id=oc.id,  # keep same pk for painless FK swap
            code=getattr(oc, "code", ""),  # in case field didn’t exist
            name=oc.name,
            term=oc.term,
            banner=getattr(oc, "banner", None),
            last_edited=oc.last_edited,
        )
        # original single-instructor FK → new M2M
        nc.instructors.add(oc.user_id)
        nc.save()


def reverse(apps, schema_editor):
    NewCourse = apps.get_model("courses", "Course")
    NewCourse.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("courses", "0001_initial"),
        ("exams", "0002_course_remove_exam_created_by_and_more"),
    ]
    operations = [migrations.RunPython(forward, reverse)]
