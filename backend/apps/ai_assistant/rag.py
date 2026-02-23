"""
RAG Sistema - tuzatilgan versiya
"""
from django.db.models import Q
from typing import List, Dict, Any


class RAGRetriever:

    @staticmethod
    def search_medical_knowledge(query: str, limit: int = 3) -> List[Dict[str, Any]]:
        from .models import MedicalKnowledge
        keywords = query.lower().split()
        q_objects = Q()
        for keyword in keywords:
            q_objects |= Q(title__icontains=keyword)
            q_objects |= Q(content__icontains=keyword)
            q_objects |= Q(keywords__icontains=keyword)
        results = MedicalKnowledge.objects.filter(q_objects, is_active=True).distinct()[:limit]
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
        # departments app yo'q — bo'sh qaytaradi
        return []

    @staticmethod
    def search_doctors(query: str = None, department_name: str = None) -> List[Dict[str, Any]]:
        try:
            from apps.navbat.models import Doctor
            doctors = Doctor.objects.filter(is_active=True)
            if query:
                keywords = query.lower().split()
                q_objects = Q()
                for keyword in keywords:
                    q_objects |= Q(full_name__icontains=keyword)
                    q_objects |= Q(specialty__name__icontains=keyword)
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
        context['medical'] = RAGRetriever.search_medical_knowledge(question)
        doctor_keywords = ['doktor', 'shifokor', 'vrach', 'doctor', 'mutaxassis']
        if any(kw in question_lower for kw in doctor_keywords):
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