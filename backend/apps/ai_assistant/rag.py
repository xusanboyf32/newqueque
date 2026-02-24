"""
RAG Sistema - O'zbek tiliga moslashtirilgan versiya
"""
from django.db.models import Q
from typing import List, Dict, Any


# O'zbek tilida so'z qo'shimchalari
UZ_SUFFIXES = [
    'yabdi', 'yapti', 'ayabdi', 'moqda', 'abdi', 'yotir',
    'imiz', 'ingiz', 'larni', 'lardan', 'larga', 'lardan',
    'dagi', 'ning', 'dan', 'lar', 'lari', 'ga', 'da', 'ni',
    'im', 'ing', 'di', 'adi', 'ydi',
]

def uz_stem(word: str) -> str:
    """tishim -> tish, og'riyabdi -> og'ri"""
    word = word.lower().strip()
    for suffix in sorted(UZ_SUFFIXES, key=len, reverse=True):
        if word.endswith(suffix) and len(word) - len(suffix) >= 3:
            return word[:-len(suffix)]
    return word


def get_search_variants(query: str) -> List[str]:
    """
    'tishim og'riyabdi' -> ['tishim', 'og'riyabdi', 'tish', 'og'ri', 'tis', 'og'r']
    """
    words = query.lower().split()
    variants = set()
    for word in words:
        if len(word) < 2:
            continue
        variants.add(word)           # to'liq so'z
        stem = uz_stem(word)
        variants.add(stem)           # ildiz
        if len(stem) >= 4:
            variants.add(stem[:4])   # birinchi 4 harf
        if len(stem) >= 3:
            variants.add(stem[:3])   # birinchi 3 harf
    return list(variants)


class RAGRetriever:

    @staticmethod
    def search_medical_knowledge(query: str, limit: int = 3) -> List[Dict[str, Any]]:
        from .models import MedicalKnowledge
        variants = get_search_variants(query)
        q_objects = Q()
        for variant in variants:
            if len(variant) < 3:
                continue
            q_objects |= Q(title__icontains=variant)
            q_objects |= Q(content__icontains=variant)
            q_objects |= Q(keywords__icontains=variant)

        results = MedicalKnowledge.objects.filter(
            q_objects, is_active=True
        ).distinct()[:limit]

        return [
            {
                'title': item.title,
                'content': item.content,
                'category': item.get_category_display(),
                'source': 'medical_knowledge'
            }
            for item in results
        ]

    @staticmethod
    def search_departments(query: str = None) -> List[Dict[str, Any]]:
        return []

    @staticmethod
    def search_doctors(query: str = None, department_name: str = None) -> List[Dict[str, Any]]:
        try:
            from apps.navbat.models import Doctor
            doctors = Doctor.objects.filter(is_active=True)
            if query:
                variants = get_search_variants(query)
                q_objects = Q()
                for variant in variants:
                    if len(variant) < 3:
                        continue
                    q_objects |= Q(full_name__icontains=variant)
                    q_objects |= Q(specialty__name__icontains=variant)
                doctors = doctors.filter(q_objects)

            result = []
            for d in doctors[:5]:
                result.append({
                    'name': d.full_name or '',
                    'specialization': str(d.specialty) if d.specialty else '',
                    'room': d.room_number or '',
                    'source': 'doctors'
                })
            return result
        except Exception:
            return []

    @staticmethod
    def get_context_for_question(question: str) -> Dict[str, Any]:
        question_lower = question.lower()
        context = {
            'medical': [],
            'departments': [],
            'doctors': [],
            'has_context': False
        }

        # Har doim tibbiy ma'lumot qidiradi
        context['medical'] = RAGRetriever.search_medical_knowledge(question)

        # Shifokor so'ralsa yoki tibbiy ma'lumot topilmasa — doktorlarni ham qidiradi
        doctor_keywords = [
            'doktor', 'shifokor', 'vrach', 'doctor', 'mutaxassis',
            'kim', 'qaysi', 'bormi', 'kimga', 'qayerda'
        ]
        if any(kw in question_lower for kw in doctor_keywords) or not context['medical']:
            context['doctors'] = RAGRetriever.search_doctors(question)

        context['has_context'] = bool(context['medical'] or context['doctors'])
        return context

    @staticmethod
    def format_context_for_ai(context: Dict[str, Any]) -> str:
        formatted = []
        if context['medical']:
            formatted.append("📚 TIBBIY MA'LUMOTLAR:\n")
            for idx, item in enumerate(context['medical'], 1):
                formatted.append(f"{idx}. {item['title']}")
                formatted.append(f"   {item['content']}\n")
        if context['doctors']:
            formatted.append("\n👨‍⚕️ DOKTORLARIMIZ:\n")
            for doc in context['doctors']:
                formatted.append(
                    f"- Dr. {doc['name']} - {doc['specialization']}\n"
                    f"  Xona: {doc['room']}"
                )
        return "\n".join(formatted) if formatted else "Ma'lumot topilmadi"


class PatientContextRetriever:

    @staticmethod
    def get_patient_context(user) -> Dict[str, Any]:
        if not hasattr(user, 'patient_profile'):
            return {}
        try:
            profile = user.patient_profile
            age = None
            if user.date_of_birth:
                from datetime import date
                today = date.today()
                age = today.year - user.date_of_birth.year - (
                    (today.month, today.day) < (user.date_of_birth.month, user.date_of_birth.day)
                )
            return {
                'age': age,
                'gender': profile.get_gender_display() if profile.gender else None,
                'blood_type': profile.blood_type,
                'chronic_diseases': profile.chronic_diseases or 'Yo\'q',
                'allergies': profile.allergies or 'Yo\'q',
            }
        except Exception:
            return {}