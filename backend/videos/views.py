from django.contrib.auth.models import User
from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Video, Comment, Profile
from .serializers import VideoSerializer, CommentSerializer

# --- ЛОГИКА ЛАЙКОВ ---
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def toggle_like(request, pk):
    try:
        video = Video.objects.get(pk=pk)
        if request.user in video.likes.all():
            video.likes.remove(request.user)
            liked = False
        else:
            video.likes.add(request.user)
            liked = True
        
        return Response({
            'liked': liked,
            'total_likes': video.total_likes 
        })
    except Video.DoesNotExist:
        return Response({"error": "Видео не найдено"}, status=404)

# --- ЛОГИКА ДЛЯ ВИДЕО ---
class VideoListCreateView(generics.ListCreateAPIView):
    queryset = Video.objects.all().order_by('-created_at') 
    serializer_class = VideoSerializer
    # SessionAuthentication позволяет гостям заходить без токена, а TokenAuthentication подхватит авторизованных
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def perform_create(self, serializer):
        Profile.objects.get_or_create(user=self.request.user)
        serializer.save(author=self.request.user)

class VideoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

# --- ОБНОВЛЕНИЕ АВАТАРА ---
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def update_avatar(request):
    profile, created = Profile.objects.get_or_create(user=request.user)
    if 'avatar' in request.FILES:
        profile.avatar = request.FILES['avatar']
        profile.save()
        return Response({"avatar_url": request.build_absolute_uri(profile.avatar.url)})
    return Response({"error": "Файл не найден"}, status=400)

# --- КОММЕНТАРИИ ---
class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Comment.objects.filter(video_id=self.kwargs['video_id']).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, video_id=self.kwargs['video_id'])

# --- РЕГИСТРАЦИЯ ---
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ('username', 'password', 'email')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

# --- ПОДПИСКИ ---
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def toggle_subscribe(request, user_id):
    try:
        target_user = User.objects.get(pk=user_id)
        if target_user == request.user:
            return Response({"error": "Нельзя подписаться на самого себя"}, status=400)
            
        profile, created = Profile.objects.get_or_create(user=request.user)
        
        if target_user in profile.subscriptions.all():
            profile.subscriptions.remove(target_user)
            subscribed = False
        else:
            profile.subscriptions.add(target_user)
            subscribed = True
            
        return Response({
            'subscribed': subscribed,
            'subscribers_count': target_user.subscribers.count()
        })
    except User.DoesNotExist:
        return Response({"error": "Пользователь не найден"}, status=404)

# --- ПРОФИЛЬ ---
class ProfileUpdateView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def patch(self, request):
        profile, created = Profile.objects.get_or_create(user=request.user)
        
        if 'banner' in request.FILES:
            profile.banner = request.FILES['banner']
            profile.save()
            
            return Response({
                "banner_url": request.build_absolute_uri(profile.banner.url)
            }, status=status.HTTP_200_OK)
            
        return Response({"error": "Файл не получен"}, status=status.HTTP_400_BAD_REQUEST)