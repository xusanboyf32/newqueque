# """
# AI Assistant Views
# """
# from rest_framework import status, generics
# from rest_framework.response import Response
# from rest_framework.views import APIView
# from rest_framework.permissions import IsAuthenticated
#
# from .models import AIConversation, MedicalKnowledge
# from .serializers import (
#     ChatRequestSerializer,
#     ChatResponseSerializer,
#     AIConversationSerializer,
#     AIConversationListSerializer,
#     MedicalKnowledgeSerializer,
# )
# from .services import ask_ai
#
#
# class ChatView(APIView):
#     """
#     POST /api/ai/chat/
#
#     AI bilan suhbatlashish
#     """
#
#     permission_classes = [IsAuthenticated]
#
#     def post(self, request):
#         # Validatsiya
#         serializer = ChatRequestSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#
#         question = serializer.validated_data['question']
#         conversation_id = serializer.validated_data.get('conversation_id')
#
#         try:
#             # AI ga murojaat
#             result = ask_ai(
#                 user=request.user,
#                 question=question,
#                 conversation_id=conversation_id
#             )
#
#             # Javobni formatlash
#             response_serializer = ChatResponseSerializer(data=result)
#             response_serializer.is_valid(raise_exception=True)
#
#             return Response(
#                 response_serializer.data,
#                 status=status.HTTP_200_OK
#             )
#
#         except Exception as e:
#             return Response({
#                 'error': 'Xatolik yuz berdi',
#                 'detail': str(e)
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
#
#
# class ConversationListView(generics.ListAPIView):
#     """
#     GET /api/ai/conversations/
#
#     Foydalanuvchining barcha suhbatlari
#     """
#
#     serializer_class = AIConversationListSerializer
#     permission_classes = [IsAuthenticated]
#
#     def get_queryset(self):
#         return AIConversation.objects.filter(
#             user=self.request.user
#         ).prefetch_related('messages')
#
#
# class ConversationDetailView(generics.RetrieveAPIView):
#     """
#     GET /api/ai/conversations/<id>/
#
#     Bitta suhbatni to'liq ko'rish
#     """
#
#     serializer_class = AIConversationSerializer
#     permission_classes = [IsAuthenticated]
#
#     def get_queryset(self):
#         return AIConversation.objects.filter(
#             user=self.request.user
#         ).prefetch_related('messages')
#
#
# class ConversationDeleteView(generics.DestroyAPIView):
#     """
#     DELETE /api/ai/conversations/<id>/
#
#     Suhbatni o'chirish
#     """
#
#     permission_classes = [IsAuthenticated]
#
#     def get_queryset(self):
#         return AIConversation.objects.filter(user=self.request.user)
#
#
# class MedicalKnowledgeListView(generics.ListAPIView):
#     """
#     GET /api/ai/knowledge/
#
#     Tibbiy bilimlar ro'yxati (faqat ko'rish)
#     """
#
#     serializer_class = MedicalKnowledgeSerializer
#     permission_classes = [IsAuthenticated]
#
#     def get_queryset(self):
#         queryset = MedicalKnowledge.objects.filter(is_active=True)
#
#         # Kategoriya bo'yicha filter
#         category = self.request.query_params.get('category')
#         if category:
#             queryset = queryset.filter(category=category)
#
#         # Qidiruv
#         search = self.request.query_params.get('search')
#         if search:
#             queryset = queryset.filter(
#                 title__icontains=search
#             ) | queryset.filter(
#                 keywords__icontains=search
#             )
#
#         return queryset
#
#
# class MedicalKnowledgeDetailView(generics.RetrieveAPIView):
#     """
#     GET /api/ai/knowledge/<id>/
#
#     Bitta tibbiy bilim
#     """
#
#     serializer_class = MedicalKnowledgeSerializer
#     permission_classes = [IsAuthenticated]
#     queryset = MedicalKnowledge.objects.filter(is_active=True)
#
#+++++++++++++++++++++ NEW NEW ++++++++++++++++++++++++++++++++++++++++++



"""
AI Assistant Views
"""
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .models import AIConversation, MedicalKnowledge
from .serializers import (
    ChatRequestSerializer,
    AIConversationSerializer,
    AIConversationListSerializer,
    MedicalKnowledgeSerializer,
)
from .services import ask_ai


class ChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        question = serializer.validated_data['question']
        conversation_id = serializer.validated_data.get('conversation_id')

        try:
            result = ask_ai(
                user=request.user,
                question=question,
                conversation_id=conversation_id
            )

            # ChatResponseSerializer ishlatmaymiz — message_id None bo'lishi mumkin
            return Response({
                'response': result.get('response', ''),
                'conversation_id': result.get('conversation_id'),
                'message_id': result.get('message_id'),
                'sources': result.get('sources', []),
                'tokens_used': result.get('tokens_used', 0),
                'is_emergency': result.get('is_emergency', False),
            }, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            traceback.print_exc()  # terminalda to'liq xatoni ko'rish uchun
            return Response({
                'error': 'Xatolik yuz berdi',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConversationListView(generics.ListAPIView):
    serializer_class = AIConversationListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AIConversation.objects.filter(
            user=self.request.user
        ).prefetch_related('messages')


class ConversationDetailView(generics.RetrieveAPIView):
    serializer_class = AIConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AIConversation.objects.filter(
            user=self.request.user
        ).prefetch_related('messages')


class ConversationDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AIConversation.objects.filter(user=self.request.user)


class MedicalKnowledgeListView(generics.ListAPIView):
    serializer_class = MedicalKnowledgeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = MedicalKnowledge.objects.filter(is_active=True)
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(title__icontains=search) | \
                       queryset.filter(keywords__icontains=search)
        return queryset


class MedicalKnowledgeDetailView(generics.RetrieveAPIView):
    serializer_class = MedicalKnowledgeSerializer
    permission_classes = [IsAuthenticated]
    queryset = MedicalKnowledge.objects.filter(is_active=True)


# CELERY QO'SHDIM AI CHAT UCHUN ISHNI TARTIBLI VA TEZ QILADI

from django.http import JsonResponse
from .tasks import ai_javob_ber


def bemor_savol(request):
    if request.method == 'POST':
        savol = request.POST.get('savol')

        # Celery ga topshiradi, kutmaydi
        task = ai_javob_ber.delay(savol)

        return JsonResponse({'task_id': task.id})


def natija_olish(request, task_id):
    from celery.result import AsyncResult

    task = AsyncResult(task_id)

    if task.ready():
        return JsonResponse({'javob': task.result})
    else:
        return JsonResponse({'status': 'kutilmoqda'})