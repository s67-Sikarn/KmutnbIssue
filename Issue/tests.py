import json
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from django.contrib.messages import get_messages
from .models import Issue

class IssueViewsTests(TestCase):
    # ทดสอบการตั้งค่าข้อมูลจำลองเริ่มต้น (ตั้งค่า User และ Issues ไว้สำหรับการทดสอบ)
    def setUp(self):
        self.client = Client()
        
        # สร้างผู้ใช้ทั่วไป
        self.user = User.objects.create_user(username='normaluser', password='password123')
        # สร้างพนักงาน (Staff)
        self.staff_user = User.objects.create_user(username='staffuser', password='password123', is_staff=True)
        
        # สร้างรายการปัญหาจำลอง
        self.issue1 = Issue.objects.create(category='electrical', title='Test Electrical', desc='It is dark', bld='A', flr='1', rm='101', status='pending')
        self.issue2 = Issue.objects.create(category='plumbing', title='Test Plumbing', desc='Water everywhere', bld='B', flr='2', rm='202', status='progress', assigned_to=self.staff_user)
        self.issue3 = Issue.objects.create(category='other', title='Test Other', desc='Something is broken', bld='C', flr='3', rm='303', status='resolved')

    # ทดสอบว่าหน้า index สามารถโหลดได้สำเร็จ (GET request)
    def test_index_view_get(self):
        response = self.client.get(reverse('Issue:index'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'index.html')
        self.assertIn('issues', response.context)
        self.assertIn('issues_json', response.context)

    # ทดสอบการส่งฟอร์มแจ้งปัญหาสำเร็จ (POST request แบบช้อมูลครบ)
    def test_index_view_post_valid(self):
        post_data = {
            'category': 'internet',
            'desc': 'Wi-Fi is down everywhere',
            'bld': 'IT',
            'flr': '4',
            'rm': '404'
        }
        response = self.client.post(reverse('Issue:index'), post_data)
        
        # เช็คว่ากลับมาที่หน้าแรกแบบ 302 Redirect (PRG Pattern)
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('Issue:index'))
        
        # ตรวจสอบว่า Issue ถูกสร้างในฐานข้อมูลขึ้นมาอีกหนึ่งอัน
        self.assertEqual(Issue.objects.count(), 4)
        new_issue = Issue.objects.latest('created_at')
        self.assertEqual(new_issue.category, 'internet')
        
        # ตรวจสอบว่ามีข้อความ success (messages) เด้งขึ้นมา
        messages = list(get_messages(response.wsgi_request))
        self.assertEqual(len(messages), 1)
        self.assertEqual(str(messages[0]), 'Issue submitted successfully!')

    # ทดสอบการส่งฟอร์มแจ้งปัญหาแบบข้อมูลไม่ครบ (POST request แบบข้อมูลหาย)
    def test_index_view_post_invalid(self):
        # ขาดฟิลด์บังคับอย่าง `desc`
        post_data = {'category': 'electrical'}
        response = self.client.post(reverse('Issue:index'), post_data)
        
        self.assertEqual(response.status_code, 200) # หาก Validation Error โยงส่งกลับมาที่หน้าเดิม ไม่ Redirect
        self.assertEqual(Issue.objects.count(), 3) # ไม่มีการบันทึกลงฐานข้อมูลเพิ่มเติม
        
        messages = list(get_messages(response.wsgi_request))
        self.assertEqual(len(messages), 1)
        self.assertEqual(str(messages[0]), 'Category and Description are required fields.')

    # ทดสอบว่า User ทั่วไปที่ไม่ใช่พนักงาน ไม่สามารถเข้าถึงหน้า Dashboard ได้
    def test_dashboard_view_standard_user_access(self):
        self.client.login(username='normaluser', password='password123')
        response = self.client.get(reverse('Issue:dashboard'))
        self.assertEqual(response.status_code, 302) # โดนเตะกลับ

    # ทดสอบว่า User พนักงานสามารถเข้าถึงหน้า Dashboard แบบเห็นข้อมูลเริ่มต้นได้ปกติ
    def test_dashboard_view_staff_access(self):
        self.client.login(username='staffuser', password='password123')
        response = self.client.get(reverse('Issue:dashboard'))
        
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'dashboard.html')
        
        # โดย Default ระบบจะซ่อน resolved ไว้ (มี issue 2 อันที่กำลัง progress/pending)
        self.assertEqual(len(response.context['issues']), 2) 
        self.assertNotIn(self.issue3, response.context['issues'])

    # ทดสอบการใช้ Filter สถานะในหน้า Dashboard (GET request ใส่ Query String)
    def test_dashboard_view_status_filter(self):
        self.client.login(username='staffuser', password='password123')
        response = self.client.get(reverse('Issue:dashboard'), {'status': 'progress'})
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['issues']), 1)
        self.assertEqual(response.context['issues'][0], self.issue2)

    # ทดสอบการปฏิเสธไม่ให้ User ทั่วไปเปลี่ยนสถานะเคสของคนอื่นได้
    def test_update_issue_status_unauthorized(self):
        self.client.login(username='normaluser', password='password123')
        response = self.client.post(reverse('Issue:update_status', args=[self.issue1.id]), {'action': 'accept'})
        self.assertEqual(response.status_code, 302) # โดนเตะกลับ
        self.issue1.refresh_from_db()
        self.assertEqual(self.issue1.status, 'pending')

    # ทดสอบปุ่มยอมรับปัญหางานโหมดรวดเร็ว (Quick Accept Action) โดยพนักงาน
    def test_update_issue_quick_accept(self):
        self.client.login(username='staffuser', password='password123')
        response = self.client.post(reverse('Issue:update_status', args=[self.issue1.id]), {'action': 'accept'})
        
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('Issue:dashboard'))
        
        self.issue1.refresh_from_db()
        self.assertEqual(self.issue1.status, 'progress')
        self.assertEqual(self.issue1.assigned_to, self.staff_user)
        
        messages = list(get_messages(response.wsgi_request))
        self.assertEqual(len(messages), 1)
        self.assertIn('accepted and assigned to you', str(messages[0]))

    # ทดสอบการเปลี่ยนสถานะทั่วไปเพื่อปิดปัญหาหรือโฮลเอาไว้ก่อนโดย Dropdown Menu
    def test_update_issue_generic_status_change(self):
        self.client.login(username='staffuser', password='password123')
        response = self.client.post(reverse('Issue:update_status', args=[self.issue2.id]), {'status': 'resolved'})
        
        self.assertEqual(response.status_code, 302)
        
        self.issue2.refresh_from_db()
        self.assertEqual(self.issue2.status, 'resolved')
        
        messages = list(get_messages(response.wsgi_request))
        self.assertEqual(len(messages), 1)
        self.assertIn('updated to Resolved', str(messages[0]))

    # ทดสอบระบบการ Reject โดยตั้งใจไม่ใส่เหตุผลปฏิเสธ (ต้องติด Validation Error เสมอ)
    def test_update_issue_reject_without_reason(self):
        self.client.login(username='staffuser', password='password123')
        response = self.client.post(reverse('Issue:update_status', args=[self.issue1.id]), {
            'status': 'rejected',
            'rejection_reason': ' '
        })
        
        self.assertEqual(response.status_code, 302)
        self.issue1.refresh_from_db()
        self.assertEqual(self.issue1.status, 'pending') # สถานะต้องไม่เปลี่ยน
        
        messages = list(get_messages(response.wsgi_request))
        self.assertEqual(len(messages), 1)
        self.assertEqual(str(messages[0]), 'A rejection reason is required.')

    # ทดสอบระบบการ Reject โดยใส่เหตุผลแจ้งที่สมบูรณ์ครบข้อควร
    def test_update_issue_reject_with_reason(self):
        self.client.login(username='staffuser', password='password123')
        target_reason = "Duplicate of tracking ticket #1"
        response = self.client.post(reverse('Issue:update_status', args=[self.issue1.id]), {
            'status': 'rejected',
            'rejection_reason': target_reason
        })
        
        self.assertEqual(response.status_code, 302)
        self.issue1.refresh_from_db()
        self.assertEqual(self.issue1.status, 'rejected')
        self.assertEqual(self.issue1.rejection_reason, target_reason)
