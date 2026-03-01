set -e

echo "Waiting for database..."
sleep 5

echo "Running migrations..."
python manage.py migrate

echo "Seeding superuser..."
python manage.py seed_superuser

echo "Starting Django development server..."
exec python manage.py runserver 0.0.0.0:8000