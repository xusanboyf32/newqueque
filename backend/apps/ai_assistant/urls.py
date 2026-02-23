"""
AI Assistant URLs
"""
from django.urls import path
from .views import (
    ChatView,
    ConversationListView,
    ConversationDetailView,
    ConversationDeleteView,
    MedicalKnowledgeListView,
    MedicalKnowledgeDetailView,
)

app_name = 'ai_assistant'

urlpatterns = [
    # Chat
    path('chat/', ChatView.as_view(), name='chat'),

    # Conversations
    path('conversations/', ConversationListView.as_view(), name='conversation_list'),
    path('conversations/<int:pk>/', ConversationDetailView.as_view(), name='conversation_detail'),
    path('conversations/<int:pk>/delete/', ConversationDeleteView.as_view(), name='conversation_delete'),

    # Medical Knowledge Base
    path('knowledge/', MedicalKnowledgeListView.as_view(), name='knowledge_list'),
    path('knowledge/<int:pk>/', MedicalKnowledgeDetailView.as_view(), name='knowledge_detail'),

    # path('savol/', bemor_savol, name='savol'),
    # path('natija/<str:task_id>/', natija_olish, name='natija'),
]