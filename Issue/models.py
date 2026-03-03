from django.db import models
from django.contrib.auth.models import User

class Issue(models.Model):
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

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('progress', 'In Progress'),
        ('resolved', 'Resolved'),
    ]

    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    title = models.CharField(max_length=255)
    desc = models.TextField()
    bld = models.CharField(max_length=50) # Building
    flr = models.CharField(max_length=50) # Floor
    rm = models.CharField(max_length=50)  # Room
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_issues')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
