# apps/mixins.py

from django.db import models
from django.utils.text import slugify
from unidecode import unidecode  # ✅ Kirill → Lotin
import uuid


# ==================== TIMESTAMP MIXIN ====================

class TimeStampMixin(models.Model):
    """
    Barcha modellar uchun vaqt maydonlari.
    created_at va updated_at avtomatik boshqariladi.
    """
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Yaratilgan",
        db_index=True  # ✅ Tez qidiruv uchun index
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Yangilangan"
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']  # ✅ Default ordering


# ==================== SLUG MIXIN (PRO) ====================

class SlugMixin(models.Model):
    """
    Professional slug generator mixin.

    Features:
    - Avtomatik slug yaratish
    - Kirill harflarni qo'llab-quvvatlash (unidecode)
    - Unique slug kafolati
    - Turli xil source fieldlar
    - Custom slug source qo'llab-quvvatlash

    Usage:
        class MyModel(SlugMixin):
            name = models.CharField(...)

            # Optional: custom slug source
            def get_slug_source(self):
                return f"{self.name}-{self.id}"
    """

    slug = models.SlugField(
        max_length=255,
        unique=True,
        blank=True,
        editable=False,  # Admin'da qo'lda o'zgartirib bo'lmaydi
        db_index=True,  # ✅ URL orqali qidiruv tez bo'ladi
        verbose_name="Slug (URL)",
        help_text="Avtomatik yaratiladi. URL'da ishlatiladi."
    )

    class Meta:
        abstract = True

    def get_slug_source(self):
        """
        Override qilish mumkin bo'lgan metod.
        Har bir model o'z slug source'ini belgilashi mumkin.

        Returns:
            str: Slug yaratish uchun matn
        """
        # Prioritet tartibida fieldlarni tekshirish

        # 1. name (eng keng tarqalgan)
        if hasattr(self, 'name') and self.name:
            return str(self.name)

        # 2. title (blog, article modellari uchun)
        if hasattr(self, 'title') and self.title:
            return str(self.title)

        # 3. card_number (MedicalCard kabi)
        if hasattr(self, 'card_number') and self.card_number:
            return str(self.card_number)

        # 4. first_name + last_name (User profillar uchun)
        if hasattr(self, 'first_name') and hasattr(self, 'last_name'):
            first = str(self.first_name or '')
            last = str(self.last_name or '')
            full_name = f"{first} {last}".strip()
            if full_name:
                return full_name

        # 5. username (User modellari uchun)
        if hasattr(self, 'username') and self.username:
            return str(self.username)

        # 6. reason (Encounter kabi)
        if hasattr(self, 'reason') and self.reason:
            return str(self.reason)

        # 7. Default: UUID (oxirgi chora)
        return str(uuid.uuid4())[:8]

    def _generate_unique_slug(self, base_slug):
        """
        Unique slug yaratish (agar dublikat bo'lsa).

        Args:
            base_slug (str): Asosiy slug

        Returns:
            str: Unique slug
        """
        slug = base_slug
        counter = 1

        # O'zini exclude qilish (update paytida)
        queryset = self.__class__.objects.filter(slug=slug)
        if self.pk:
            queryset = queryset.exclude(pk=self.pk)

        # Dublikat topilsa, counter qo'shish
        while queryset.exists():
            slug = f"{base_slug}-{counter}"
            queryset = self.__class__.objects.filter(slug=slug)
            if self.pk:
                queryset = queryset.exclude(pk=self.pk)
            counter += 1

        return slug

    def _clean_slug_text(self, text):
        """
        Matnni slug uchun tozalash.

        - Kirill → Lotin (unidecode)
        - Bo'shliqlar → tire
        - Maxsus belgilar o'chiriladi

        Args:
            text (str): Asl matn

        Returns:
            str: Tozalangan slug
        """
        # Kirill harflarni lotin harflarga o'girish
        text = unidecode(text)

        # Django slugify (maxsus belgilarni tozalash)
        slug = slugify(text)

        # Agar slug bo'sh bo'lsa (faqat maxsus belgilar bo'lgan)
        if not slug:
            slug = str(uuid.uuid4())[:8]

        return slug

    def save(self, *args, **kwargs):
        """
        Model saqlanishdan oldin slug yaratish/yangilash.
        """
        # Faqat yangi obyekt yoki slug bo'sh bo'lsa
        if not self.slug or not self.pk:
            # 1. Source matnni olish
            source_text = self.get_slug_source()

            # 2. Slug yaratish (tozalash)
            base_slug = self._clean_slug_text(source_text)

            # 3. Unique qilish
            self.slug = self._generate_unique_slug(base_slug)

        super().save(*args, **kwargs)

    def __str__(self):
        """String representation (agar boshqa __str__ yo'q bo'lsa)"""
        if hasattr(super(), '__str__') and super().__str__() != object.__str__(self):
            return super().__str__()
        return self.slug


# ==================== UUID MIXIN ====================

class UUIDMixin(models.Model):
    """
    UUID primary key (ID o'rniga).

    Afzalliklari:
    - Xavfsizroq (ID'ni topish qiyin)
    - Distributed system'larda collision yo'q
    - URL'da ID ni yashirish
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name="ID",
        help_text="Universal unique identifier"
    )

    class Meta:
        abstract = True


# ==================== ACTIVE MIXIN ====================

class IsActiveMixin(models.Model):
    """
    Soft delete uchun is_active field.

    Ma'lumotlarni bazadan o'chirmasdan yashirish.

    Usage:
        # O'chirish o'rniga:
        obj.is_active = False
        obj.save()

        # Faqat faol obyektlar:
        MyModel.objects.filter(is_active=True)
    """
    is_active = models.BooleanField(
        default=True,
        db_index=True,  # ✅ Tez filter qilish uchun
        verbose_name="Faol",
        help_text="Nofaol qilingan ma'lumotlar ko'rinmaydi"
    )

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        """
        Soft delete: is_active=False qilish.
        Haqiqiy delete uchun: hard_delete() metodini chaqirish.
        """
        self.is_active = False
        self.save(update_fields=['is_active'])

    def hard_delete(self, using=None, keep_parents=False):
        """Haqiqiy delete (bazadan o'chirish)"""
        super().delete(using=using, keep_parents=keep_parents)

    def restore(self):
        """Soft delete qilingan obyektni tiklash"""
        self.is_active = True
        self.save(update_fields=['is_active'])


# ==================== ORDERING MIXIN ====================

class OrderingMixin(models.Model):
    """
    Manual ordering uchun.
    Admin panelda drag & drop qilish uchun.
    """
    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Tartib",
        help_text="Kichik raqam - yuqorida"
    )

    class Meta:
        abstract = True
        ordering = ['order', '-created_at']