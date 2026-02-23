
# +++++++++++++++   NEW , NEW, NEW ++++++++++++++++++++++++++

"""
AI Services - Asosiy AI mantiq
"""
import os
from typing import Dict, Any, Optional
from django.conf import settings

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

# GEMINI API TEKIN SHU UN SHU GEMINI TANLANDI
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


# GROQ bo'yicha API
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False



from .prompts import (
    get_rag_prompt,
    get_clinic_info_prompt,
    get_medical_consultation_prompt,
    is_emergency,
    is_greeting,
    FALLBACK_RESPONSES,
)
from .rag import RAGRetriever, PatientContextRetriever
from .models import AIConversation, AIMessage


class AIService:
    def __init__(self, provider: str = 'openai'):
        self.provider = provider
        self.setup_client()

    def setup_client(self):
        if self.provider == 'openai' and OPENAI_AVAILABLE:
            api_key = getattr(settings, 'OPENAI_API_KEY', '')
            if not api_key:
                raise ValueError("OPENAI_API_KEY settings.py da yo'q!")
            # Yangi OpenAI SDK (>=1.0.0)
            self.client = OpenAI(api_key=api_key)
            self.model = getattr(settings, 'OPENAI_MODEL', 'gpt-3.5-turbo')

        elif self.provider == 'anthropic' and ANTHROPIC_AVAILABLE:
            api_key = getattr(settings, 'ANTHROPIC_API_KEY', '')
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY settings.py da yo'q!")
            self.client = anthropic.Anthropic(api_key=api_key)
            self.model = 'claude-3-sonnet-20240229'


        elif self.provider == 'gemini' and GEMINI_AVAILABLE:
            api_key = getattr(settings, 'GEMINI_API_KEY', '')
            if not api_key:
                raise ValueError("GEMINI_API_KEY settings.py da yo'q!")
            genai.configure(api_key=api_key)
            self.client = genai.GenerativeModel('gemini-2.0-flash')
            self.model = 'gemini-2.0-flash'


        elif self.provider == 'groq' and GROQ_AVAILABLE:
            api_key = getattr(settings, 'GROQ_API_KEY', '')
            if not api_key:
                raise ValueError("GROQ_API_KEY settings.py da yo'q!")
            self.client = Groq(api_key=api_key)
            self.model = 'llama-3.3-70b-versatile'


        else:
            raise ValueError(
                f"Provider '{self.provider}' mavjud emas. "
                f"OpenAI: {OPENAI_AVAILABLE}, Anthropic: {ANTHROPIC_AVAILABLE}"
            )

    def generate_response(
        self,
        question: str,
        context: str = '',
        conversation_history: list = None,
    ) -> Dict[str, Any]:
        messages = list(conversation_history or [])

        # System prompt + context ni birlashtiramiz
        from .prompts import SYSTEM_PROMPT
        system_content = SYSTEM_PROMPT
        if context and context != "Ma'lumot topilmadi":
            system_content += f"\n\n📊 MAVJUD MA'LUMOTLAR:\n{context}"

        # System message
        full_messages = [{'role': 'system', 'content': system_content}]
        full_messages.extend(messages)
        full_messages.append({'role': 'user', 'content': question})

        if self.provider == 'gemini':
            return self._call_gemini(full_messages, system_content)

        if self.provider == 'openai':
            return self._call_openai(full_messages)

        if self.provider == 'groq':
            return self._call_groq(full_messages)

        elif self.provider == 'anthropic':
            return self._call_anthropic(full_messages, system_content)

    def _call_openai(self, messages: list) -> Dict[str, Any]:
        try:
            # Yangi OpenAI SDK sintaksisi
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
            )
            return {
                'response': response.choices[0].message.content,
                'tokens_used': response.usage.total_tokens,
                'sources': []
            }
        except Exception as e:
            raise Exception(f"OpenAI xatosi: {str(e)}")

    def _call_anthropic(self, messages: list, system: str) -> Dict[str, Any]:
        try:
            # System ni messages dan ajratamiz
            user_messages = [m for m in messages if m['role'] != 'system']
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                system=system,
                messages=user_messages,
            )
            return {
                'response': response.content[0].text,
                'tokens_used': response.usage.input_tokens + response.usage.output_tokens,
                'sources': []
            }
        except Exception as e:
            raise Exception(f"Anthropic xatosi: {str(e)}")

    def _call_gemini(self, messages: list, system: str) -> Dict[str, Any]:
        try:
            history_text = ""
            for m in messages:
                if m['role'] == 'user':
                    history_text += f"Foydalanuvchi: {m['content']}\n"
                elif m['role'] == 'assistant':
                    history_text += f"Yordamchi: {m['content']}\n"
            full_prompt = f"{system}\n\n{history_text}"
            response = self.client.generate_content(full_prompt)
            return {
                'response': response.text,
                'tokens_used': 0,
                'sources': []
            }


        except Exception as e:
            raise Exception(f"Gemini xatosi: {str(e)}")

    def _call_groq(self, messages: list) -> Dict[str, Any]:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
            )
            return {
                'response': response.choices[0].message.content,
                'tokens_used': response.usage.total_tokens,
                'sources': []
            }
        except Exception as e:
            raise Exception(f"Groq xatosi: {str(e)}")

    # ```
    #
    # ** 5.
    # `.env
    # ` ga: **
    # ```
    GROQ_API_KEY=os.environ.get("GROQ_API_KEY")


    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")


class MedicalAIAssistant:
    def __init__(self, user, provider: str = 'openai'):
        self.user = user
        self.ai_service = AIService(provider=provider)
        self.rag = RAGRetriever()

    def chat(self, question: str, conversation_id: Optional[int] = None) -> Dict[str, Any]:
        # 1. Favqulodda holat
        if is_emergency(question):
            return self._handle_emergency()

        # 2. Salomlashish
        if is_greeting(question):
            return self._handle_greeting()

        # 3. Suhbat
        conversation = self._get_or_create_conversation(conversation_id)

        # 4. RAG
        rag_context = self.rag.get_context_for_question(question)
        formatted_context = self.rag.format_context_for_ai(rag_context)

        # 5. Bemor ma'lumotlari
        patient_info = None
        if hasattr(self.user, 'is_patient') and self.user.is_patient:
            patient_retriever = PatientContextRetriever()
            patient_info = patient_retriever.get_patient_context(self.user)

        # 6. Suhbat tarixi
        history = self._get_conversation_history(conversation)

        # 7. Prompt
        if rag_context['doctors'] or rag_context['departments']:
            final_prompt = get_clinic_info_prompt(
                question, rag_context['departments'], rag_context['doctors']
            )
        elif rag_context['medical'] or patient_info:
            final_prompt = get_medical_consultation_prompt(question, patient_info)
        else:
            from .prompts import SYSTEM_PROMPT
            final_prompt = (
                f"{SYSTEM_PROMPT}\n\n"
                f"SAVOL:\n{question}\n\n"
                "DIQQAT: Faqat yuqoridagi system prompt asosida javob ber. "
                "Bazada malumot yoq bolsa, aniq ayt."
            )

        # 8. AI javob
        ai_response = self.ai_service.generate_response(
            question=final_prompt,
            context=formatted_context if rag_context[
                'has_context'] else "Bazada bu savol bo'yicha ma'lumot topilmadi. Faqat umumiy tibbiy bilimlar asosida javob ber, hech narsa o'ylab chiqarma.",

            conversation_history=history
        )

        # 9. Saqlash
        self._save_message(conversation, 'user', question, 0, [])
        ai_message = self._save_message(
            conversation, 'assistant',
            ai_response['response'],
            ai_response['tokens_used'],
            self._format_sources(rag_context)
        )

        # Suhbat sarlavhasini yangilash (birinchi xabar bo'lsa)
        if conversation.message_count <= 2:
            conversation.title = question[:80]
            conversation.save(update_fields=['title'])

        return {
            'response': ai_response['response'],
            'conversation_id': conversation.id,
            'message_id': ai_message.id,
            'sources': self._format_sources(rag_context),
            'tokens_used': ai_response['tokens_used']
        }

    def _get_or_create_conversation(self, conversation_id):
        if conversation_id:
            try:
                return AIConversation.objects.get(id=conversation_id, user=self.user)
            except AIConversation.DoesNotExist:
                pass
        return AIConversation.objects.create(user=self.user, title='Yangi suhbat')

    def _get_conversation_history(self, conversation):
        messages = conversation.messages.order_by('created_at')[:10]
        return [{'role': m.role, 'content': m.content} for m in messages]

    def _save_message(self, conversation, role, content, tokens, sources):
        return AIMessage.objects.create(
            conversation=conversation,
            role=role,
            content=content,
            tokens_used=tokens,
            sources=sources
        )

    def _format_sources(self, rag_context):
        sources = []
        for item in rag_context.get('medical', []):
            sources.append({'type': 'medical', 'title': item['title']})
        for dept in rag_context.get('departments', []):
            sources.append({'type': 'department', 'name': dept['name']})
        for doc in rag_context.get('doctors', []):
            sources.append({'type': 'doctor', 'name': doc['name'], 'specialization': doc['specialization']})
        return sources

    def _handle_emergency(self):
        return {
            'response': FALLBACK_RESPONSES['emergency'],
            'conversation_id': None,
            'message_id': None,
            'sources': [],
            'is_emergency': True,
            'tokens_used': 0
        }

    def _handle_greeting(self):
        return {
            'response': FALLBACK_RESPONSES['greeting'],
            'conversation_id': None,
            'message_id': None,
            'sources': [],
            'tokens_used': 0
        }


def ask_ai(user, question: str, conversation_id: Optional[int] = None) -> Dict[str, Any]:
    provider = getattr(settings, 'AI_PROVIDER', 'openai')
    assistant = MedicalAIAssistant(user, provider=provider)
    return assistant.chat(question, conversation_id)

