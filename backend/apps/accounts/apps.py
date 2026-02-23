from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'
    verbose_name = 'Foydalanuvchilar va Autentifikatsiya'

    def ready(self):
        """SIGNALS IMPORT QILISH SIGNAL.PY QOSHILSA SHU JOYGA QOSHISH SHART """
        import apps.accounts.signals