from django.urls import path
from .views import VideoListCreateView, VideoDetailView, RegisterView, CommentListCreateView
from rest_framework.authtoken.views import obtain_auth_token
from . import views
from .views import ProfileUpdateView
urlpatterns = [
    path('videos/', VideoListCreateView.as_view(), name='video-list'),
    path('videos/<int:pk>/', VideoDetailView.as_view(), name='video-detail'),
    path('videos/<int:video_id>/comments/', CommentListCreateView.as_view(), name='video-comments'),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', obtain_auth_token, name='api_token_auth'),
    path('profile/update_avatar/', views.update_avatar),
    path('videos/<int:pk>/like/', views.toggle_like),
    path('subscribe/<int:user_id>/', views.toggle_subscribe),
    path('user/profile/', ProfileUpdateView.as_view(), name='profile-update'),      

]

