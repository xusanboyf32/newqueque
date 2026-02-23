"""
AI Assistant Serializers
"""
from rest_framework import serializers
from .models import AIConversation, AIMessage, MedicalKnowledge


class AIMessageSerializer(serializers.ModelSerializer):
    """Bitta xabar serializer"""

    class Meta:
        model = AIMessage
        fields = ['id', 'role', 'content', 'sources', 'tokens_used', 'created_at']
        read_only_fields = ['id', 'created_at']


class AIConversationSerializer(serializers.ModelSerializer):
    """Suhbat serializer"""

    messages = AIMessageSerializer(many=True, read_only=True)
    message_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = AIConversation
        fields = ['id', 'title', 'message_count', 'messages', 'created_at', 'updated_at']
        read_only_fields = ['id', 'message_count', 'created_at', 'updated_at']


class AIConversationListSerializer(serializers.ModelSerializer):
    """Suhbatlar ro'yxati uchun (xabarlar izsiz)"""

    message_count = serializers.IntegerField(read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = AIConversation
        fields = ['id', 'title', 'message_count', 'last_message', 'created_at', 'updated_at']
        read_only_fields = ['id', 'message_count', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        last = obj.messages.last()
        if last:
            return {
                'content': last.content[:100] + '...' if len(last.content) > 100 else last.content,
                'role': last.role,
                'created_at': last.created_at
            }
        return None


class ChatRequestSerializer(serializers.Serializer):
    """Chat so'rovi"""

    question = serializers.CharField(
        required=True,
        max_length=2000,
        help_text='Savolingiz'
    )

    conversation_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text='Mavjud suhbat ID (yangi suhbat uchun null)'
    )


class ChatResponseSerializer(serializers.Serializer):
    """Chat javobi"""

    response = serializers.CharField()
    conversation_id = serializers.IntegerField()
    message_id = serializers.IntegerField()
    sources = serializers.ListField()
    tokens_used = serializers.IntegerField(default=0)


class MedicalKnowledgeSerializer(serializers.ModelSerializer):
    """Tibbiy bilimlar serializer (Admin uchun)"""

    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = MedicalKnowledge
        fields = [
            'id', 'category', 'category_display', 'title', 'content',
            'keywords', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']