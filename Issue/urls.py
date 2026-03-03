from django.urls import path
from . import views

app_name = 'Issue'

urlpatterns = [
    path('', views.index, name='index'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('update-status/<int:issue_id>/', views.update_issue_status, name='update_status'),
]