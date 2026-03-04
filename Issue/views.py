import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.timesince import timesince
from django.utils import timezone
from django.db.models import Q
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
            'rejection_reason': issue.rejection_reason
        })
        
    context = {
        'issues': issues,
        'issues_json': json.dumps(issues_list),
    }
    return render(request, 'index.html', context)


@login_required
@staff_member_required
def dashboard(request):
    status_filter = request.GET.get('status', '')
    search_query = request.GET.get('q', '')
    
    if status_filter:
        issues = Issue.objects.filter(status=status_filter).order_by('-created_at')
    else:
        # Show all except resolved by default to keep the interface clean
        issues = Issue.objects.exclude(status='resolved').order_by('-created_at')
        
    if search_query:
        issues = issues.filter(Q(title__icontains=search_query) | Q(desc__icontains=search_query))
        
    context = {
        'issues': issues,
        'current_filter': status_filter,
        'search_query': search_query,
        'status_choices': Issue.STATUS_CHOICES,
    }
    return render(request, 'dashboard.html', context)


@login_required
@staff_member_required
def update_issue_status(request, issue_id):
    if request.method == 'POST':
        issue = get_object_or_404(Issue, id=issue_id)
        action = request.POST.get('action')
        new_status = request.POST.get('status')
        
        if action == 'accept':
            issue.status = 'progress'
            issue.assigned_to = request.user
            messages.success(request, f'Issue #{issue.id} accepted and assigned to you.')
        elif new_status:
            if new_status == 'rejected':
                reason = request.POST.get('rejection_reason', '').strip()
                if not reason:
                    messages.error(request, 'A rejection reason is required.')
                    return redirect('Issue:dashboard')
                issue.rejection_reason = reason
            
            if new_status == 'progress' and not issue.assigned_to:
                issue.assigned_to = request.user
            
            issue.status = new_status
            messages.success(request, f'Status for Issue #{issue.id} updated to {issue.get_status_display()}.')
            
        issue.save()
        
    return redirect('Issue:dashboard')