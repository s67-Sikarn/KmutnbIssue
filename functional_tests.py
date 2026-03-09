from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.contrib.auth.models import User
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service



from Issue.models import Issue 

FFoptions = Options()
FFservice = Service(executable_path="/snap/bin/geckodriver")


class IssueReportTest(StaticLiveServerTestCase):

    def setUp(self):
        self.browser = webdriver.Firefox(options=FFoptions, service=FFservice)

    def tearDown(self):
        self.browser.quit()

    def wait_for_text_in_feed(self, text, timeout=15):
        wait = WebDriverWait(self.browser, timeout)
        wait.until(lambda d: text in d.find_element(By.ID, "feed-body").text)

    def test_user_can_view_existing_issues_search_and_report_new_issue(self):

        # สมชายเข้ามาที่หน้าหลักของเว็บไซต์แจ้งปัญหา
        self.browser.get(self.live_server_url)

        # สมชายมองเห็นส่วนแสดงรายการปัญหา All Reported Issues
        feed_title = self.browser.find_element(By.ID, "feed-title").text
        self.assertIn("All Reported Issues", feed_title)

        # สมชายมองเห็นช่องค้นหาปัญหา
        search_box = self.browser.find_element(By.ID, "search-issue")
        self.assertTrue(search_box.is_displayed())

        # สมชายลองค้นหาปัญหาที่ตนเองพบ
        search_box.send_keys("ฝาชักโครกหัก")

        # สมชายพบว่ายังไม่มีปัญหาที่ตนเองต้องการแจ้งอยู่ในระบบ
        feed_text = self.browser.find_element(By.ID, "feed-body").text
        self.assertNotIn("ฝาชักโครกหัก", feed_text)

        # สมชายเริ่มกรอกแบบฟอร์มแจ้งปัญหาใหม่
        Select(self.browser.find_element(By.ID, "cat")).select_by_value("plumbing")

        # สมชายกรอกรายละเอียดปัญหา
        self.browser.find_element(By.ID, "desc").send_keys("ฝาชักโครกหัก")

        # สมชายระบุสถานที่เกิดเหตุ
        # หมายเหตุ: ใช้ค่าที่มีอยู่จริงในฟอร์มปัจจุบัน
        Select(self.browser.find_element(By.ID,"bld")).select_by_value("81")
        Select(self.browser.find_element(By.ID,"flr")).select_by_value("3")
        Select(self.browser.find_element(By.ID,"rm")).select_by_value("male_restroom_1")

        # สมชายกดปุ่ม Submit
        self.browser.find_element(By.CSS_SELECTOR, "button.btn-submit").click()

        # หลังจากส่งข้อมูลสำเร็จ สมชายเห็นรายการปัญหาที่เพิ่งแจ้งปรากฏอยู่ในระบบ
        self.wait_for_text_in_feed("ฝาชักโครกหัก")
        self.wait_for_text_in_feed("Pending")

        feed_text = self.browser.find_element(By.ID, "feed-body").text

        self.assertIn("ฝาชักโครกหัก", feed_text)
        self.assertIn("Pending", feed_text)

        # สมชายตรวจสอบว่าตำแหน่งที่แจ้งแสดงในรายการ
        self.assertIn("Bld 81", feed_text)
        self.assertIn("Flr 3", feed_text)
        self.assertIn("male_restroom_1", feed_text)
    
class StaffDashboardTest(StaticLiveServerTestCase):

    def setUp(self):
        self.browser = webdriver.Firefox(options=FFoptions, service=FFservice)

        # สร้าง staff user สำหรับฟ้าใส
        self.staff_user = User.objects.create_user(
            username="fahsai",
            password="testpass123"
        )
        self.staff_user.is_staff = True
        self.staff_user.save()

        # สร้าง issue ที่สมชายแจ้งไว้ก่อนหน้า
        self.issue = Issue.objects.create(
            title="ฝาชักโครกหัก",
            category="plumbing",
            desc="ฝาชักโครกหัก",
            bld="81",
            flr="3",
            rm="male_restroom_1",
            status="pending"
        )

    def tearDown(self):
        self.browser.quit()

    def wait_for_text(self, text, timeout=15):
        wait = WebDriverWait(self.browser, timeout)
        wait.until(lambda d: text in d.find_element(By.TAG_NAME, "body").text)

    def test_staff_can_login_and_update_issue_status(self):

        # ฟ้าใสเข้าหน้าหลัก
        self.browser.get(self.live_server_url)

        # ฟ้าใสกด Staff Login
        self.browser.find_element(By.LINK_TEXT, "Staff Login").click()

        # ฟ้าใสกรอก username และ password
        self.browser.find_element(By.NAME, "username").send_keys("fahsai")
        self.browser.find_element(By.NAME, "password").send_keys("testpass123")

        # ฟ้าใสกด Sign in
        self.browser.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        # หลัง login ฟ้าใสถูกส่งกลับมาหน้าแรก
        self.wait_for_text("KMUTNB ISSUE")

        # ฟ้าใสเห็นปุ่ม Staff Dashboard
        dashboard_button = self.browser.find_element(By.LINK_TEXT, "Staff Dashboard")
        self.assertTrue(dashboard_button.is_displayed())

        # ฟ้าใสกด Staff Dashboard
        dashboard_button.click()

        # ฟ้าใสเข้าสู่หน้า Staff Dashboard
        self.wait_for_text("Issue Management")

        # ฟ้าใสพบปัญหาฝาชักโครกหักที่สมชายรายงาน
        body_text = self.browser.find_element(By.TAG_NAME, "body").text
        self.assertIn("ฝาชักโครกหัก", body_text)
        self.assertIn("Pending", body_text)

        # ฟ้าใสตรวจสอบแล้วและกด Accept
        accept_button = self.browser.find_element(
            By.XPATH,
            f"//form[contains(@action, '{self.issue.id}')]//button[contains(., 'Accept')]"
        )
        accept_button.click()

        # สถานะเปลี่ยนเป็น In Progress
        self.wait_for_text("In Progress")

        body_text = self.browser.find_element(By.TAG_NAME, "body").text
        self.assertIn("In Progress", body_text)