from django.apps import AppConfig

class DaftarConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.daftar"

    def ready(self):
        import apps.daftar.signals
