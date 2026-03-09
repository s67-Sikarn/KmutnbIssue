from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service

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
    