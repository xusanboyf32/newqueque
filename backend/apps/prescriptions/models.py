"""
Prescriptions Models
"""
import random
from django.db import models
from django.conf import settings
import math


# ── 1. DORI BAZASI ────────────────────────────────────────────────
class Medication(models.Model):
    """Dori bazasi — narxlar bilan"""

    UNIT_CHOICES = [
        ('dona',   'Dona'),
        ('pochka', 'Pochka'),
        ('ampula', 'Ampula'),
        ('shisha', 'Shisha'),
        ('ml',     'Millilitr'),
        ('gr',     'Gramm'),
    ]

    # YANGI — hisoblash turi
    MEASURE_TYPE = [
        ('count', 'Sanaladigan'),  # Parasetamol, ampula — dona/pachka
        ('volume', 'Hajmli'),  # Spirt, shisha — 1 dona = yetarli
        ('injection', 'Ukol/Ampula'),   # Ukol — har bir qabul = 1 ampula

    ]



    name           = models.CharField('Dori nomi', max_length=200, unique=True)
    price_per_pack = models.DecimalField('1 pachka narxi (so\'m)', max_digits=10, decimal_places=0)
    units_per_pack = models.PositiveIntegerField(
        '1 pachkada nechta',
        default=1,
        help_text='Parasetamol 10talik → 10, Ampula → 1, Shisha → 1'
    )
    unit           = models.CharField('Birlik', max_length=20, choices=UNIT_CHOICES, default='dona')
    measure_type = models.CharField(  # ← YANGI
        'Hisoblash turi', max_length=10,
        choices=MEASURE_TYPE, default='count',
        help_text='Sanaladigan=dona/pachka, Hajmli=shisha/shpris/surtma'
    )
    is_active      = models.BooleanField('Faol', default=True)

    class Meta:
        verbose_name = 'Dori bazasi'
        verbose_name_plural = 'Dorilar bazasi'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.units_per_pack} {self.unit}) — {self.price_per_pack:,} so'm"


# ── 2. RETSEPT ────────────────────────────────────────────────────
class Prescription(models.Model):
    """Retsept"""

    doctor = models.ForeignKey(
        'navbat.Doctor',
        on_delete=models.PROTECT,
        related_name='prescriptions',
        verbose_name='Doktor'
    )
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='prescriptions',
        verbose_name='Bemor'
    )
    diagnosis  = models.CharField('Tashxis', max_length=500, blank=True)
    barcode    = models.CharField('Shtrix kod', max_length=13, unique=True, editable=False)
    valid_until = models.DateField('Yaroqlilik muddati', null=True, blank=True)
    created_at = models.DateTimeField('Yaratilgan', auto_now_add=True)

    class Meta:
        verbose_name = 'Retsept'
        verbose_name_plural = 'Retseptlar'
        ordering = ['-created_at']

    def __str__(self):
        return f"Retsept #{self.id} - {self.patient}"

    def save(self, *args, **kwargs):
        if not self.barcode:
            self.barcode = self._generate_barcode()
        if not self.valid_until:
            from datetime import date, timedelta
            self.valid_until = date.today() + timedelta(days=30)
        super().save(*args, **kwargs)

    def _generate_barcode(self):
        while True:
            code = ''.join([str(random.randint(0, 9)) for _ in range(12)])
            odd   = sum(int(code[i]) for i in range(0, 12, 2))
            even  = sum(int(code[i]) for i in range(1, 12, 2))
            check = (10 - ((odd + even * 3) % 10)) % 10
            barcode = code + str(check)
            if not Prescription.objects.filter(barcode=barcode).exists():
                return barcode

class PrescriptionItem(models.Model):
    prescription = models.ForeignKey(
        Prescription, on_delete=models.CASCADE,
        related_name='items', verbose_name='Retsept'
    )
    medication = models.ForeignKey(
        Medication, on_delete=models.SET_NULL,
        null=True, blank=True, verbose_name='Dori bazasidan'
    )
    doses_per_day  = models.PositiveIntegerField('Kuniga necha mahal', default=1)
    duration_days  = models.PositiveIntegerField('Necha kun', default=1)
    unit_price     = models.DecimalField('Pachka narxi', max_digits=10, decimal_places=0, default=0)
    units_per_pack = models.PositiveIntegerField('Pachkada nechta dona', default=1)
    pack_unit      = models.CharField('Birlik', max_length=20, default='dona')
    note           = models.CharField('Izoh', max_length=300, blank=True)
    measure_type   = models.CharField(max_length=10, default='count')

    class Meta:
        verbose_name = 'Dori'
        verbose_name_plural = 'Dorilar'

    def __str__(self):
        return f"{self.medication} — {self.doses_per_day}x{self.duration_days} kun"

    @property
    def total_doses_needed(self):
        return self.doses_per_day * self.duration_days

    # O'zgartiring:
    @property
    def packs_needed(self):
        import math
        if self.measure_type == 'volume':
            return 1  # Spirt, maz — 1 ta yetadi
        elif self.measure_type == 'injection':
            return self.total_doses_needed  # Ukol — har qabul 1 ampula
        else:
            if self.units_per_pack <= 1:
                return self.total_doses_needed
            return math.ceil(self.total_doses_needed / self.units_per_pack)

    @property
    def total_price(self):
        return self.packs_needed * int(self.unit_price)

    def save(self, *args, **kwargs):
        if self.medication:
            self.unit_price     = self.medication.price_per_pack
            self.units_per_pack = self.medication.units_per_pack
            self.pack_unit      = self.medication.unit
            self.measure_type   = self.medication.measure_type
        super().save(*args, **kwargs)
