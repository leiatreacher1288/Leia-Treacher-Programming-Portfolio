import logging
import threading
import uuid

from django.utils.deprecation import MiddlewareMixin

# Thread-local storage for request ID
_thread_locals = threading.local()


class RequestIdMiddleware(MiddlewareMixin):
    def process_request(self, request):
        rid = request.META.get("HTTP_X_REQUEST_ID") or str(uuid.uuid4())
        request.request_id = rid
        # Store in thread-local storage
        _thread_locals.request_id = rid
        return None


class LogRequestIdFilter(logging.Filter):
    def filter(self, record):
        # Get request_id from thread-local storage
        record.request_id = getattr(_thread_locals, "request_id", "-")
        return True
