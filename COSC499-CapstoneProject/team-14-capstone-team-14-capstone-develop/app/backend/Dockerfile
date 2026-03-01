FROM python:3.11-slim

# Python settings
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install dos2unix (needed if Windows line endings exist)
RUN apt-get update && apt-get install -y dos2unix && apt-get clean

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy the rest of the application
COPY . .

# Ensure logs directory exists and is writable
RUN mkdir -p /app/logs && chmod 777 /app/logs

# Fix line endings and make entrypoint executable
RUN dos2unix entrypoint.sh
RUN chmod +x entrypoint.sh

# Default CMD (can be overridden by docker-compose.yml)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
