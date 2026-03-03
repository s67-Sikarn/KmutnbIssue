from django.contrib import admin
from django.urls import path, include  # อย่าลืมเพิ่ม include ตรงนี้

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('django.contrib.auth.urls')),
    # ส่งต่อ path ทั้งหมดไปให้ไฟล์ urls.py ของแอป Issue จัดการ
    path('', include('Issue.urls')), 
]