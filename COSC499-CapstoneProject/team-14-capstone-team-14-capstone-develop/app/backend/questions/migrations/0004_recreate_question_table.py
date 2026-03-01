# Generated manually to fix database constraint issue

from django.db import migrations


def forward_migration(apps, schema_editor):
    """Apply the migration - drop and recreate the questions_question table"""
    with schema_editor.connection.cursor() as cursor:
        db_engine = schema_editor.connection.settings_dict["ENGINE"]

        # Step 1: Drop the table with appropriate syntax
        if "sqlite" in db_engine:
            cursor.execute("DROP TABLE IF EXISTS questions_question;")
        else:
            # PostgreSQL - use CASCADE to drop dependent objects
            cursor.execute("DROP TABLE IF EXISTS questions_question CASCADE;")

        # Step 2: Create the table with database-specific syntax
        if "sqlite" in db_engine:
            cursor.execute(
                """
                CREATE TABLE questions_question (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    prompt TEXT NOT NULL,
                    choices TEXT NOT NULL DEFAULT '[]',
                    correct_answer TEXT NOT NULL DEFAULT '[]',
                    points DECIMAL(5,2) NOT NULL DEFAULT 1.0,
                    difficulty INTEGER NOT NULL DEFAULT 2,
                    tags TEXT NOT NULL DEFAULT '[]',
                    explanation TEXT NOT NULL DEFAULT '',
                    created_at DATETIME,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    created_by_id INTEGER,
                    bank_id INTEGER,
                    CONSTRAINT questions_question_difficulty_check CHECK (difficulty >= 1 AND difficulty <= 3),
                    FOREIGN KEY (created_by_id) REFERENCES users_user(id),
                    FOREIGN KEY (bank_id) REFERENCES questions_questionbank(id)
                );
            """
            )
        else:
            # PostgreSQL
            cursor.execute(
                """
                CREATE TABLE questions_question (
                    id SERIAL PRIMARY KEY,
                    prompt TEXT NOT NULL,
                    choices JSONB NOT NULL DEFAULT '[]',
                    correct_answer JSONB NOT NULL DEFAULT '[]',
                    points DECIMAL(5,2) NOT NULL DEFAULT 1.0,
                    difficulty INTEGER NOT NULL DEFAULT 2,
                    tags JSONB NOT NULL DEFAULT '[]',
                    explanation TEXT NOT NULL DEFAULT '',
                    created_at TIMESTAMP WITH TIME ZONE,
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    created_by_id INTEGER,
                    bank_id INTEGER,
                    CONSTRAINT questions_question_difficulty_check CHECK (difficulty >= 1 AND difficulty <= 3),
                    FOREIGN KEY (created_by_id) REFERENCES users_user(id),
                    FOREIGN KEY (bank_id) REFERENCES questions_questionbank(id)
                );
            """
            )


def reverse_migration(apps, schema_editor):
    """Reverse the migration"""
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("DROP TABLE IF EXISTS questions_question;")


class Migration(migrations.Migration):

    dependencies = [
        (
            "questions",
            "0003_alter_question_options_alter_questionbank_options_and_more",
        ),
    ]

    operations = [
        migrations.RunPython(
            forward_migration,
            reverse_migration,
        ),
    ]
