from django.contrib import admin
from django.urls import path, include, re_path # Добавляем re_path
from django.conf import settings
from django.views.static import serve # Добавляем serve
from videos.views import index

urlpatterns = [
    path('', index, name='home'),
    path('admin/', admin.site.urls),
    path('api/', include('videos.urls')),
]

# Этот блок работает даже при DEBUG = False
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {
        'document_root': settings.MEDIA_ROOT,
    }),
    re_path(r'^static/(?P<path>.*)$', serve, {
        'document_root': settings.STATIC_ROOT,
    }),
]