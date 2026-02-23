"""
AI Assistant Admin Panel
"""
from django.contrib import admin
from .models import AIConversation, AIMessage, MedicalKnowledge


@admin.register(AIConversation)
class AIConversationAdmin(admin.ModelAdmin):
    """Suhbatlar admin"""

    list_display = ['id', 'user', 'title', 'message_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__first_name', 'user__last_name', 'user__phone_number', 'title']
    readonly_fields = ['message_count', 'created_at', 'updated_at']

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('user')


@admin.register(AIMessage)
class AIMessageAdmin(admin.ModelAdmin):
    """Xabarlar admin"""

    list_display = ['id', 'conversation', 'role', 'content_preview', 'tokens_used', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['content']
    readonly_fields = ['created_at']

    def content_preview(self, obj):
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content

    content_preview.short_description = 'Xabar'


@admin.register(MedicalKnowledge)
class MedicalKnowledgeAdmin(admin.ModelAdmin):
    """Tibbiy bilimlar admin"""

    list_display = ['id', 'title', 'category', 'is_active', 'created_at']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['title', 'content', 'keywords']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Asosiy ma\'lumot', {
            'fields': ('category', 'title', 'is_active')
        }),
        ('Mazmun', {
            'fields': ('content',),
            'classes': ('wide',)
        }),
        ('Qidiruv uchun', {
            'fields': ('keywords',),
            'description': 'Vergul bilan ajratilgan kalit so\'zlar'
        }),
        ('Vaqt', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


