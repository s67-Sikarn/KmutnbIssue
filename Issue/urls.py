from django.urls import path
from . import views

urlpatterns = [
    # path ว่างๆ '' หมายถึงหน้าแรกของเว็บ (localhost:8000)
    path('', views.index, name='index'),
]