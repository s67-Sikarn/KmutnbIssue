from django.contrib import admin
from django.urls import path, include  # อย่าลืมเพิ่ม include ตรงนี้
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('django.contrib.auth.urls')),
    # ส่งต่อ path ทั้งหมดไปให้ไฟล์ urls.py ของแอป Issue จัดการ
    path('', include('Issue.urls')), 
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)