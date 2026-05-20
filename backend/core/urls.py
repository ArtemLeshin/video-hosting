from django.contrib import admin
from django.urls import path, include 
from django.conf import settings
from django.conf.urls.static import static
from videos.views import index

urlpatterns = [
    path('', index, name='home'), # Главная страница
    path('admin/', admin.site.urls),
    path('api/', include('videos.urls')),
]

# Этот блок будет работать везде: и на локалке, и на сервере
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)