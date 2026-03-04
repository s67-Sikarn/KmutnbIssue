from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service

FFoptions=Options()
FFservice=Service(executable_path="/snap/bin/geckodriver")


class IssueReportTest(StaticLiveServerTestCase):

    def setUp(self):
        self.browser = webdriver.Firefox(options=FFoptions,service=FFservice)

    def tearDown(self):
        self.browser.quit()

    def wait_for_text_in_feed(self, text, timeout=15):
        wait = WebDriverWait(self.browser, timeout)
        wait.until(lambda d: text in d.find_element(By.ID, "feed-body").text)

    def test_user_can_report_issue_and_see_pending_status(self):
        self.browser.get(self.live_server_url)

        # เลือก category
        Select(self.browser.find_element(By.ID, "cat")).select_by_value("furniture")

        # ใส่รายละเอียด
        self.browser.find_element(By.ID, "desc").send_keys("โต๊ะพัง 1_ตัว")

        # เลือก location
        Select(self.browser.find_element(By.ID, "bld")).select_by_value("61")
        Select(self.browser.find_element(By.ID, "flr")).select_by_value("1")
        Select(self.browser.find_element(By.ID, "rm")).select_by_value("101")

        # กด submit
        self.browser.find_element(By.CSS_SELECTOR, "button.btn-submit").click()

        # รอจนข้อมูลถูก render ลง feed จริง ๆ
        self.wait_for_text_in_feed("โต๊ะพัง 1_ตัว")
        self.wait_for_text_in_feed("Pending")

        feed_text = self.browser.find_element(By.ID, "feed-body").text
        self.assertIn("โต๊ะพัง 1_ตัว", feed_text)
        self.assertIn("Bld 61", feed_text)
        self.assertIn("Flr 1", feed_text)
        self.assertIn("Rm 101", feed_text)
        self.assertIn("Pending", feed_text)