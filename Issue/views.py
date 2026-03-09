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
    # ฟังก์ชันหน้าแรก สำหรับแจ้งปัญหาและแสดงปัญหาทั้งหมด
    if request.method == 'POST':
        # รับข้อมูลจากการกรอกฟอร์ม
        category = request.POST.get('category')
        desc = request.POST.get('desc')
        bld = request.POST.get('bld')
        flr = request.POST.get('flr')
        rm = request.POST.get('rm')
        
        # ตรวจสอบความถูกต้องของข้อมูล (หมวดหมู่และรายละเอียดเป็นสิ่งที่ต้องมี)
        if not category or not desc:
            messages.error(request, 'Category and Description are required fields.')
        else:
            # สร้างข้อความ title แบบย่อจากรายละเอียด (ดึงคำออกมา 6 คำแรก)
            words = desc.split()
            title = ' '.join(words[:6]) + ('...' if len(words) > 6 else '')
            # บันทึกข้อมูลลงฐานข้อมูล
            Issue.objects.create(category=category, title=title, desc=desc, bld=bld, flr=flr, rm=rm)
            messages.success(request, 'Issue submitted successfully!')
            return redirect('Issue:index')
            
    # ค้นหาปัญหาทั้งหมดเรียงตามเวลาที่สร้าง (ใหม่สุดขึ้นก่อน)
    issues = Issue.objects.all().order_by('-created_at')
    
    issues_list = []
    for issue in issues:
        # คำนวณเวลาว่าผ่านมานานเท่าไหร่แล้วเพื่อนำไปแสดงผล (เช่น 5 mins ago)
        now = timezone.now()
        time_str = f"{timesince(issue.created_at, now)} ago" if issue.created_at else "Just now"
        
        # แปลงเป็น dict เพื่อแปลงเป็น JSON ให้ frontend นำไปใช้
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
            'rejection_reason': issue.rejection_reason,
            'created_at_time': timezone.localtime(issue.created_at).strftime('%b %d, %Y | %H:%M') if issue.created_at else '',
            'in_progress_at_time': timezone.localtime(issue.in_progress_at).strftime('%b %d, %Y | %H:%M') if issue.in_progress_at else '',
            'resolved_at_time': timezone.localtime(issue.resolved_at).strftime('%b %d, %Y | %H:%M') if issue.resolved_at else '',
        })
        
    context = {
        'issues': issues,
        'issues_json': json.dumps(issues_list),
    }
    return render(request, 'index.html', context)


@login_required
@staff_member_required
def dashboard(request):
    # หน้า Dashboard สำหรับแอดมิน
    status_filter = request.GET.get('status', '') # สถานะจากช่องกรองค้นหา
    search_query = request.GET.get('q', '') # ข้อความค้นหา
    
    if status_filter:
        issues = Issue.objects.filter(status=status_filter).order_by('-created_at')
    else:
        # โดยค่าเริ่มต้นจะไม่ค่อยโชว์อันที่แก้เสร็จแล้วเพื่อความสะอาดตาของหน้าต่าง
        issues = Issue.objects.exclude(status='resolved').order_by('-created_at')
        
    if search_query:
        # ค้นหาข้อความในช่อง title และ desc โดยไม่แยกตัวพิมพ์เล็กพิมพ์ใหญ่
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
    # อัปเดตสถานะปัญหา
    if request.method == 'POST':
        issue = get_object_or_404(Issue, id=issue_id)
        action = request.POST.get('action') # ปุ่ม action รับค่า (accept, reject, complete)
        new_status = request.POST.get('status')
        
        if action == 'accept':
            # รับเรื่องปัญหา -> เปลี่ยนเป็น In Progress
            issue.status = 'progress'
            issue.in_progress_at = timezone.now()
            issue.assigned_to = request.user
            messages.success(request, f'Issue #{issue.id} accepted and assigned to you.')
        elif action == 'reject':
            # ปฏิเสธปัญหาพร้อมบังคับใส่เหตุผล
            reason = request.POST.get('rejection_reason', '').strip()
            if not reason:
                messages.error(request, 'A rejection reason is required.')
                return redirect('Issue:dashboard')
            issue.rejection_reason = reason
            issue.status = 'rejected'
            messages.success(request, f'Issue #{issue.id} has been rejected.')
        elif action == 'complete':
            # ปัญหาได้รับการแก้ไขเรียบร้อย
            issue.status = 'resolved'
            issue.resolved_at = timezone.now()
            if not issue.assigned_to:
                issue.assigned_to = request.user
            messages.success(request, f'Issue #{issue.id} is marked as resolved.')
        elif new_status:
            # กรณีที่แอดมินเปลี่ยนจาก Dropdown อันเก่า (ถ้ายังเก็บไว้อยู่)
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