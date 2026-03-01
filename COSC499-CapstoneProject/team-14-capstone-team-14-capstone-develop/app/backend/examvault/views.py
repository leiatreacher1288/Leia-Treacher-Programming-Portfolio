import requests
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class GlobalHealthCheckView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    SERVICE_URLS = {
        "users": "http://backend:8000/api/auth/health/",
        "courses": "http://backend:8000/api/courses/health/",  # Added courses
        "exams": "http://backend:8000/api/exams/health/",
        "questions": "http://backend:8000/api/questions/health/",
        "analytics": "http://backend:8000/api/analytics/health/",
        "results": "http://backend:8000/api/results/health/",
    }

    def get(self, request):
        health_data = {}

        for name, url in self.SERVICE_URLS.items():
            try:
                r = requests.get(url, timeout=2)
                if r.status_code == 200:
                    # store full JSON:
                    # {"status":"ok","service":...,"database":...}
                    health_data[name] = r.json()
                else:
                    health_data[name] = {"status": "error", "database": "unknown"}
            except requests.RequestException:
                health_data[name] = {"status": "unreachable", "database": "unknown"}

        return Response({"status": "ok", "services": health_data})
