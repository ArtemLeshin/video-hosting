from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# --- 1. МОДЕЛИ ---

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', default='avatars/default.png', blank=True)

    subscriptions = models.ManyToManyField(User, related_name='subscribers', blank=True)

    banner = models.ImageField(upload_to='banners/', null=True, blank=True)
    def __str__(self):
        return f"Profile of {self.user.username}"

class Video(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    video_file = models.FileField(upload_to='videos/')
    thumbnail = models.ImageField(upload_to='thumbnails/')
    created_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.title
    likes = models.ManyToManyField(User, related_name='liked_videos', blank=True)

    @property
    def total_likes(self):
        return self.likes.count()

class Comment(models.Model):
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.author.username}: {self.text[:20]}"


# --- 2. СИГНАЛЫ (Всегда внизу, чтобы видеть модель Profile) ---

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        # Создаем профиль только для нового пользователя
        Profile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    # Безопасное сохранение профиля при обновлении User
    if hasattr(instance, 'profile'):
        instance.profile.save()