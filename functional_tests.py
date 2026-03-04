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

    def test_user_can_report_issue_and_see_pending_status(self):

        # ฟ้าใสเข้าเว็บ KMUTNB ISSUE TRACKER
        self.browser.get(self.live_server_url)

        # First Report
        # ฟ้าใสเลือก Issue Category → Furniture
        Select(self.browser.find_element(By.ID, "cat")).select_by_value("furniture")

        # ฟ้าใสพิมพ์ Problem Details "โต๊ะพัง 1 ตัว"
        self.browser.find_element(By.ID, "desc").send_keys("โต๊ะพัง 1 ตัว")

        # ฟ้าใสเลือก Location
        Select(self.browser.find_element(By.ID, "bld")).select_by_value("61")
        Select(self.browser.find_element(By.ID, "flr")).select_by_value("1")
        Select(self.browser.find_element(By.ID, "rm")).select_by_value("101")

        # ฟ้าใสกด SUBMIT
        self.browser.find_element(By.CSS_SELECTOR, "button.btn-submit").click()

        # ฟ้าใสรอให้ issue แรกแสดงใน All Reported Issues
        self.wait_for_text_in_feed("โต๊ะพัง 1 ตัว")

        # Second Report
        # ฟ้าใสแจ้งปัญหาใหม่เรื่องแอร์เสีย

        # ฟ้าใสเลือก Issue Category → Air Conditioning
        Select(self.browser.find_element(By.ID, "cat")).select_by_value("hvac")

        self.browser.find_element(By.ID, "desc").send_keys("แอร์ไม่เย็น")

        # ฟ้าใสเลือก Location
        Select(self.browser.find_element(By.ID, "bld")).select_by_value("63")
        Select(self.browser.find_element(By.ID, "flr")).select_by_value("2")
        Select(self.browser.find_element(By.ID, "rm")).select_by_value("201")

        # ฟ้าใสกด SUBMIT
        self.browser.find_element(By.CSS_SELECTOR, "button.btn-submit").click()

        # ฟ้าใสรอให้ issue ที่สองแสดง
        self.wait_for_text_in_feed("แอร์ไม่เย็น")

        feed_text = self.browser.find_element(By.ID, "feed-body").text

        # ฟ้าใสเห็นทั้งสอง issue ในรายการ
        self.assertIn("โต๊ะพัง 1 ตัว", feed_text)
        self.assertIn("แอร์ไม่เย็น", feed_text)

    