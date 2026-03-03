import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.timesince import timesince
from django.utils import timezone
from .models import Issue

def index(request):
    if request.method == 'POST':
        category = request.POST.get('category')
        desc = request.POST.get('desc')
        bld = request.POST.get('bld')
        flr = request.POST.get('flr')
        rm = request.POST.get('rm')
        
        if not category or not desc:
            messages.error(request, 'Category and Description are required fields.')
        else:
            # Generate a brief title from the description (first 6 words)
            words = desc.split()
            title = ' '.join(words[:6]) + ('...' if len(words) > 6 else '')
            Issue.objects.create(category=category, title=title, desc=desc, bld=bld, flr=flr, rm=rm)
            messages.success(request, 'Issue submitted successfully!')
            return redirect('Issue:index')
            
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


@login_required
@staff_member_required
def dashboard(request):
    # Fetch all issues except the ones already resolved
    issues = Issue.objects.exclude(status='resolved').order_by('-created_at')
    context = {
        'issues': issues,
    }
    return render(request, 'dashboard.html', context)


@login_required
@staff_member_required
def update_issue_status(request, issue_id):
    if request.method == 'POST':
        issue = get_object_or_404(Issue, id=issue_id)
        action = request.POST.get('action')
        
        if action == 'accept':
            issue.status = 'progress'
            issue.assigned_to = request.user
        elif action == 'close':
            issue.status = 'resolved'
            
        issue.save()
        
    return redirect('Issue:dashboard')