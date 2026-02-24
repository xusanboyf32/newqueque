from django.apps import AppConfig

class NavbatConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.navbat'

    def ready(self):
        # signal'lar ishlashi uchun
        from . import signals
