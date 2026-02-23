"""
AI Assistant Models
Foydalanuvchi bilan AI o'rtasidagi suhbatlarni saqlash
"""
from django.db import models
from django.conf import settings


class AIConversation(models.Model):
    """
    AI bilan suhbat
    Har bir user alohida suhbat ocha oladi
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_conversations',
        verbose_name='Foydalanuvchi'
    )

    title = models.CharField(
        'Sarlavha',
        max_length=200,
        default='Yangi suhbat'
    )

    created_at = models.DateTimeField('Yaratilgan', auto_now_add=True)
    updated_at = models.DateTimeField('Yangilangan', auto_now=True)

    class Meta:
        verbose_name = 'AI Suhbat'
        verbose_name_plural = 'AI Suhbatlar'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.title}"

    @property
    def message_count(self):
        """Xabarlar soni"""
        return self.messages.count()


class AIMessage(models.Model):
    """
    AI suhbatidagi bitta xabar
    """

    ROLE_CHOICES = (
        ('user', 'Foydalanuvchi'),
        ('assistant', 'AI Yordamchi'),
    )

    conversation = models.ForeignKey(
        AIConversation,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='Suhbat'
    )

    role = models.CharField(
        'Kim yozgan',
        max_length=10,
        choices=ROLE_CHOICES
    )

    content = models.TextField('Xabar matni')

    # RAG uchun - qaysi manba ishlatilgan
    sources = models.JSONField(
        'Manbalar',
        default=list,
        blank=True,
        help_text='Qaysi bazadagi ma\'lumotlar ishlatilgan'
    )

    # Token hisobi (xarajat uchun)
    tokens_used = models.IntegerField(
        'Ishlatilingan tokenlar',
        default=0
    )

    created_at = models.DateTimeField('Yaratilgan', auto_now_add=True)

    class Meta:
        verbose_name = 'AI Xabar'
        verbose_name_plural = 'AI Xabarlar'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."


class MedicalKnowledge(models.Model):
    """
    Tibbiy bilimlar bazasi (RAG uchun)
    Bu yerga tibbiy ma'lumotlar kiritiladi
    """

    CATEGORY_CHOICES = (
        ('disease', 'Kasallik'),
        ('symptom', 'Alomat'),
        ('treatment', 'Davolash'),
        ('medicine', 'Dori'),
        ('prevention', 'Profilaktika'),
        ('general', 'Umumiy'),
    )

    category = models.CharField(
        'Kategoriya',
        max_length=20,
        choices=CATEGORY_CHOICES
    )

    title = models.CharField('Sarlavha', max_length=300)
    content = models.TextField('To\'liq mazmun')

    # RAG uchun - qidirishni osonlashtirish
    keywords = models.TextField(
        'Kalit so\'zlar',
        help_text='Vergul bilan ajrating: qandli diabet, qon shakar, insulin'
    )

    # Embedding (vector qidiruv uchun) - keyinchalik
    # embedding = models.JSONField('Vector', null=True, blank=True)

    is_active = models.BooleanField('Faol', default=True)

    created_at = models.DateTimeField('Qo\'shilgan', auto_now_add=True)
    updated_at = models.DateTimeField('Yangilangan', auto_now=True)

    class Meta:
        verbose_name = 'Tibbiy Bilim'
        verbose_name_plural = 'Tibbiy Bilimlar Bazasi'
        ordering = ['-created_at']

    def __str__(self):
        return self.title