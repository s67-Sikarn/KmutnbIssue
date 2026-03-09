from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils.timesince import timesince
from django.utils import timezone

class Issue(models.Model):
    # ตัวเลือกหมวดหมู่ปัญหาที่มีให้ผู้ใช้เลือก
    CATEGORY_CHOICES = [
        ('electrical', 'Electrical'),
        ('plumbing', 'Plumbing'),
        ('internet', 'Internet'),
        ('hvac', 'Air Conditioning'),
        ('furniture', 'Furniture / Equipment'),
        ('security', 'Security'),
        ('cleanliness', 'Cleanliness'),
        ('other', 'Other'),
    ]

    # ตัวเลือกสถานะปัญหาต่างๆ 
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('progress', 'In Progress'),
        ('hold', 'On Hold'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected'),
    ]

    # ฟิลด์ข้อมูลต่างๆ ของปัญหา
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other') # หมวดหมู่
    title = models.CharField(max_length=255) # หัวข้อปัญหา (สร้างอัตโนมัติจากรายละเอียด)
    desc = models.TextField() # รายละเอียด
    bld = models.CharField(max_length=50) # อาคาร
    flr = models.CharField(max_length=50) # ชั้น
    rm = models.CharField(max_length=50)  # ห้อง
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending') # สถานะเริ่มต้นคือ pending
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_issues') # เจ้าหน้าที่ผู้รับผิดชอบ
    rejection_reason = models.TextField(blank=True, null=True) # เหตุผลที่ปฏิเสธปัญหา
    created_at = models.DateTimeField(auto_now_add=True) # เวลาที่สร้างปัญหา
    in_progress_at = models.DateTimeField(null=True, blank=True) # เวลาที่เริ่มดำเนินการ
    resolved_at = models.DateTimeField(null=True, blank=True) # เวลาที่แก้ไขเสร็จ

    def __str__(self):
        # แสดงชื่อวัตถุในระบบแอดมินหรือตอนทำ debug ให้เป็นหัวข้อปัญหา
        return self.title

    def to_dict(self):
        now = timezone.now()
        time_str = f"{timesince(self.created_at, now)} ago" if self.created_at else "Just now"
        return {
            'id': self.id,
            'bld': self.bld,
            'flr': self.flr,
            'rm': self.rm,
            'category': self.category,
            'title': self.title,
            'desc': self.desc,
            'status': self.status,
            'time': time_str,
            'rejection_reason': self.rejection_reason,
            'created_at_time': timezone.localtime(self.created_at).strftime('%b %d, %Y | %H:%M') if self.created_at else '',
            'in_progress_at_time': timezone.localtime(self.in_progress_at).strftime('%b %d, %Y | %H:%M') if self.in_progress_at else '',
            'resolved_at_time': timezone.localtime(self.resolved_at).strftime('%b %d, %Y | %H:%M') if self.resolved_at else '',
        }

@receiver(post_save, sender=Issue)
def announce_issue_update(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        'issues_group',
        {
            'type': 'issue_update',
            'message': {
                'action': 'created' if created else 'updated',
                'issue': instance.to_dict()
            }
        }
    )
