"""
Custom User Model
Telefon raqam bilan authentication
"""
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.core.validators import RegexValidator


class UserManager(BaseUserManager):
    """Custom User Manager"""

    def create_user(self, phone_number, password=None, **extra_fields):
        """Oddiy user yaratish"""
        if not phone_number:
            raise ValueError('Telefon raqam kiritilishi shart!')

        user = self.model(phone_number=phone_number, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, password=None, **extra_fields):
        """Superuser (Admin) yaratish"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser is_staff=True bo\'lishi kerak!')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser is_superuser=True bo\'lishi kerak!')

        return self.create_user(phone_number, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User Model

    - Telefon raqam bilan login
    - 2 xil rol: PATIENT (bemor) va ADMIN (doktor)
    """

    ROLE_CHOICES = (
        ('PATIENT', 'Bemor'),
        ('ADMIN', 'Admin/Doktor'),
    )

    # Username o'chiramiz, telefon ishlatamiz
    username = None

    # Telefon validator
    phone_regex = RegexValidator(
        regex=r'^\+998\d{9}$',
        message="Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak"
    )

    phone_number = models.CharField(
        'Telefon raqam',
        validators=[phone_regex],
        max_length=13,
        unique=True,
        help_text='+998901234567'
    )

    # Rol
    role = models.CharField(
        'Rol',
        max_length=10,
        choices=ROLE_CHOICES,
        default='PATIENT'
    )

    # Majburiy maydonlar
    first_name = models.CharField('Ism', max_length=150)
    last_name = models.CharField('Familiya', max_length=150)

    # Qo'shimcha
    email = models.EmailField('Email', blank=True, null=True)
    date_of_birth = models.DateField('Tug\'ilgan sana', null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField('Yaratilgan', auto_now_add=True)
    updated_at = models.DateTimeField('Yangilangan', auto_now=True)

    objects = UserManager()

    # Phone number bilan login
    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = 'Foydalanuvchi'
        verbose_name_plural = 'Foydalanuvchilar'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_full_name()} ({self.phone_number})"

    def get_full_name(self):
        """To'liq ism"""
        return f"{self.first_name} {self.last_name}"

    @property
    def is_patient(self):
        """Bemor ekanligini tekshirish"""
        return self.role == 'PATIENT'

    @property
    def is_admin_doctor(self):
        """Admin/Doktor ekanligini tekshirish"""
        return self.role == 'ADMIN'


class PatientProfile(models.Model):
    """
    Bemor tibbiy daftari
    Faqat PATIENT role'ga ega userlar uchun
    """

    GENDER_CHOICES = (
        ('M', 'Erkak'),
        ('F', 'Ayol'),
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='patient_profile',
        verbose_name='Foydalanuvchi'
    )

    # Shaxsiy ma'lumotlar
    gender = models.CharField('Jinsi', max_length=1, choices=GENDER_CHOICES, blank=True)
    address = models.TextField('Manzil', blank=True)

    # Tibbiy ma'lumotlar
    blood_type = models.CharField('Qon guruhi', max_length=3, blank=True)
    allergies = models.TextField('Allergiyalar', blank=True)
    chronic_diseases = models.TextField('Surunkali kasalliklar', blank=True)

    # Doktor eslatmalari (faqat doktor yozishi mumkin)
    notes = models.TextField('Doktor eslatmalari', blank=True)

    created_at = models.DateTimeField('Yaratilgan', auto_now_add=True)
    updated_at = models.DateTimeField('Yangilangan', auto_now=True)

    class Meta:
        verbose_name = 'Bemor profili'
        verbose_name_plural = 'Bemorlar profili'

    def __str__(self):
        return f"{self.user.get_full_name()} - Profil"