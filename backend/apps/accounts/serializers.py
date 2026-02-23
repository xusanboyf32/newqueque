"""
Serializers for Authentication
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, PatientProfile


class PatientProfileSerializer(serializers.ModelSerializer):
    """Bemor profili serializer"""

    class Meta:
        model = PatientProfile
        fields = ['gender', 'address', 'blood_type', 'allergies', 'chronic_diseases', 'notes']
        read_only_fields = ['notes']  # Bemor notes yoza olmaydi


class UserSerializer(serializers.ModelSerializer):
    """User serializer"""

    patient_profile = PatientProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'phone_number', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'date_of_birth', 'patient_profile',
            'created_at'
        ]
        read_only_fields = ['id', 'role', 'created_at']

    def get_full_name(self, obj):
        return obj.get_full_name()


class RegisterSerializer(serializers.ModelSerializer):
    """
    Ro'yxatdan o'tish (Sign Up)
    """

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['phone_number', 'email', 'first_name', 'last_name',
                  'date_of_birth', 'password', 'password2']

    def validate(self, attrs):
        """Parollar bir xilligini tekshirish"""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                'password': 'Parollar bir xil emas!'
            })
        return attrs

    def validate_phone_number(self, value):
        """Telefon formatini tekshirish"""
        if not value.startswith('+998'):
            raise serializers.ValidationError('Telefon +998 bilan boshlanishi kerak')
        if len(value) != 13:
            raise serializers.ValidationError('Telefon 13 ta belgi bo\'lishi kerak')
        return value

    def create(self, validated_data):
        """Yangi bemor yaratish"""
        validated_data.pop('password2')

        user = User.objects.create_user(
            phone_number=validated_data['phone_number'],
            email=validated_data.get('email', ''),
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            date_of_birth=validated_data.get('date_of_birth'),
            password=validated_data['password'],
            role='PATIENT'  # Har doim PATIENT sifatida
        )

        # Avtomatik profil yaratish
        # PatientProfile.objects.create(user=user)

        return user


class LoginSerializer(serializers.Serializer):
    """
    Kirish (Sign In)
    """

    phone_number = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        """Foydalanuvchi tekshiruvi"""
        phone_number = attrs.get('phone_number')
        password = attrs.get('password')

        # Authenticate
        user = authenticate(
            request=self.context.get('request'),
            username=phone_number,  # Phone ishlatamiz
            password=password
        )

        if not user:
            raise serializers.ValidationError(
                'Telefon raqam yoki parol noto\'g\'ri!'
            )

        if not user.is_active:
            raise serializers.ValidationError(
                'Bu hisob faol emas!'
            )

        attrs['user'] = user
        return attrs