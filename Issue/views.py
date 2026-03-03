import json
from django.shortcuts import render
from django.utils.timesince import timesince
from django.utils import timezone
from .models import Issue

def index(request):
    issues = Issue.objects.all().order_by('-created_at')
    
    issues_list = []
    for issue in issues:
        now = timezone.now()
        time_str = f"{timesince(issue.created_at, now)} ago" if issue.created_at else "Just now"
        
        issues_list.append({
            'id': issue.id,
            'bld': issue.bld,
            'flr': issue.flr,
            'rm': issue.rm,
            'category': issue.category,
            'title': issue.title,
            'desc': issue.desc,
            'status': issue.status,
            'time': time_str,
        })
        
    context = {
        'issues': issues,
        'issues_json': json.dumps(issues_list),
    }
    return render(request, 'index.html', context)