from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Video, Comment, Profile

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    banner = serializers.SerializerMethodField() # 1. Добавляем поле
    is_subscribed = serializers.SerializerMethodField()
    subscribers_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'banner', 'is_subscribed', 'subscribers_count'] # 2. Регистрируем

    # 3. Создаем метод для получения URL баннера
    def get_avatar(self, obj):
        try:
            if hasattr(obj, 'profile') and obj.profile.avatar:
                return self.context['request'].build_absolute_uri(obj.profile.avatar.url)
        except Exception:
            pass
        return None

    def get_banner(self, obj):
        try:
            if hasattr(obj, 'profile') and obj.profile.banner:
                return self.context['request'].build_absolute_uri(obj.profile.banner.url)
        except Exception:
            pass
        return None

    def get_is_subscribed(self, obj):
        request = self.context.get('request')
        # Важно: DRF при TokenAuthentication может не подтянуть юзера в общий список, 
        # если не передать заголовок. Проверяем наличие юзера:
        if request and request.user and request.user.is_authenticated:
            return obj.subscribers.filter(user=request.user).exists()
        return False

    def get_subscribers_count(self, obj):
        # Если связей нет, возвращаем 0 вместо ошибки
        return obj.subscribers.count() if hasattr(obj, 'subscribers') else 0
        
class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'text', 'created_at', 'author']

class VideoSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = [
            'id', 'title', 'description', 'video_file', 
            'thumbnail', 'created_at', 'author', 
            'likes_count', 'is_liked'
        ]

    def get_likes_count(self, obj):
        # Безопасно считаем количество лайков
        return obj.likes.count() if hasattr(obj, 'likes') else 0

    def get_is_liked(self, obj):
        # Проверяем, поставил ли лайк текущий пользователь
        request = self.context.get('request')
        if request and request.user.is_authenticated and hasattr(obj, 'likes'):
            return obj.likes.filter(id=request.user.id).exists()
        return False

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['avatar', 'banner'] # Добавляем banner сюда

class AuthorSerializer(serializers.ModelSerializer):
    # Если данные профиля вложены:
    profile = ProfileSerializer(read_only=True)
    # Или если ты выносишь поле напрямую:
    banner = serializers.ImageField(source='profile.banner', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'banner', 'subscribers_count', 'is_subscribed']