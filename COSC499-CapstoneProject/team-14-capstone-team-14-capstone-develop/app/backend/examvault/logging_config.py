import os  # ADD THIS LINE
from pathlib import Path

LOG_DIR = Path(os.getenv("LOG_ROOT", "./logs")).resolve()
LOG_DIR.mkdir(parents=True, exist_ok=True)


def build_logging():
    service = os.getenv("SERVICE_NAME", "web")
    log_file = LOG_DIR / f"{service}.log"
    fmt = "%(asctime)s %(levelname)-8s [%(name)s] %(message)s"

    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {"default": {"format": fmt}},
        "handlers": {
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "filename": str(log_file),
                "maxBytes": 5_000_000,
                "backupCount": 5,
                "formatter": "default",
            },
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
            },
        },
        "loggers": {
            "django.request": {
                "handlers": ["file", "console"],
                "level": "DEBUG",
                "propagate": False,
            },
            "django.server": {
                "handlers": ["file", "console"],
                "level": "INFO",
                "propagate": False,
            },
        },
        "root": {
            "handlers": ["file", "console"],
            "level": "INFO",
        },
    }
