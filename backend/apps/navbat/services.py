# apps/navbat/services.py
from __future__ import annotations

from datetime import datetime, timedelta, time

from django.db import transaction
from django.utils import timezone

from .models import (
    Doctor,
    AppointmentSlot, SlotStatus,
    Appointment, AppointmentStatus,
)

SUNDAY = 6  # Mon=0 ... Sun=6


def _add_minutes(t: time, minutes: int) -> time:
    dt = datetime.combine(timezone.localdate(), t) + timedelta(minutes=minutes)
    return dt.time()


def generate_slots_for_date(*, doctor: Doctor, day) -> None:
    """
    DoctorSchedule asosida bitta kun uchun slot yaratadi.
    Yakshanba dam: slot yaratmaydi.
    """
    if day.weekday() == SUNDAY:
        return

    if not doctor.is_active:
        return

    schedule = getattr(doctor, "schedule", None)
    if not schedule or not schedule.is_active:
        return

    start = schedule.work_start
    end = schedule.work_end
    step = schedule.slot_minutes

    slots = []
    cur = start
    while cur < end:
        slots.append(
            AppointmentSlot(
                doctor=doctor,
                date=day,
                start_time=cur,
                status=SlotStatus.FREE,
            )
        )
        cur = _add_minutes(cur, step)

    # uniq constraint bor -> ignore_conflicts=True
    AppointmentSlot.objects.bulk_create(slots, ignore_conflicts=True)


@transaction.atomic
def ensure_week_slots(*, doctor: Doctor, days: int = 7) -> None:
    """
    Bugundan boshlab 7 kunlik slotlar bazada borligini ta'minlaydi.
    """
    today = timezone.localdate()
    for i in range(days):
        day = today + timedelta(days=i)
        generate_slots_for_date(doctor=doctor, day=day)


def list_available_week_slots(*, doctor: Doctor, days: int = 7):
    """
    7 kunlik FREE slotlar:
    - bugun bo'lsa: eski vaqtlar chiqmaydi
    - yakshanba: slot yo'q (yaratilmaydi)
    """
    today = timezone.localdate()
    now_time = timezone.localtime().time()

    date_to = today + timedelta(days=days - 1)

    qs = (AppointmentSlot.objects
          .select_related("doctor")
          .filter(
              doctor=doctor,
              date__range=(today, date_to),
              status=SlotStatus.FREE,
          )
          .order_by("date", "start_time"))

    # bugun uchun o'tib ketganlarini yashirish
    qs = qs.exclude(date=today, start_time__lte=now_time)

    return qs


@transaction.atomic
def book_slot(*, user, slot_id):
    """
    Slotni band qiladi (atomic).
    2 user bir vaqtda bossayam, faqat bittasi oladi.
    """
    # row lock: slotni band qilishda musobaqa bo'lmasin
    slot = (AppointmentSlot.objects
            .select_for_update()
            .select_related("doctor")
            .get(id=slot_id))

    if slot.status != SlotStatus.FREE:
        raise ValueError("SLOT_NOT_FREE")

    # bugun bo'lsa o'tib ketgan vaqtni band qildirmaymiz
    today = timezone.localdate()
    now_time = timezone.localtime().time()
    if slot.date == today and slot.start_time <= now_time:
        raise ValueError("SLOT_EXPIRED")

    slot.status = SlotStatus.BOOKED
    slot.save(update_fields=["status", "updated_at"])

    appointment = Appointment.objects.create(
        user=user,
        slot=slot,
        status=AppointmentStatus.BOOKED,
    )
    return appointment


@transaction.atomic
def cancel_appointment(*, user, appointment_id):
    """
    User o'z navbatini bekor qiladi:
    - Appointment -> CANCELED
    - Slot -> FREE
    """
    appt = (Appointment.objects
            .select_for_update()
            .select_related("slot")
            .get(id=appointment_id, user=user))

    if appt.status != AppointmentStatus.BOOKED:
        raise ValueError("APPOINTMENT_NOT_CANCELABLE")

    appt.status = AppointmentStatus.CANCELED
    appt.save(update_fields=["status", "updated_at"])

    slot = appt.slot
    slot.status = SlotStatus.FREE
    slot.save(update_fields=["status", "updated_at"])

    return appt
