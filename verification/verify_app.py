import time
from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Enable console logging
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
        
        # Navigate to login
        page.goto("http://localhost:4173/login")
        print("Navigated to login")
        
        # Take screenshot of login
        page.screenshot(path="verification/1_login.png")
        
        # Enter API Key (mock)
        page.fill("input[type=password]", "AIzaSyFakeKeyForVerification")
        
        # Check "Remember me" so reload works
        page.check("input[type=checkbox]")
        
        # Mock the API response for sources validation
        # Using a very specific regex pattern for the Jules API
        page.route("**/v1alpha/sources*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"sources": [{"name": "projects/p/sources/s", "githubRepo": {"owner": "test", "repo": "test-repo", "branches": []}}]}'
        ))
        
        print("Mocked sources API")
        
        # Click connect
        page.click("button[type=submit]")
        print("Clicked connect")
        
        # Wait for navigation.
        try:
            page.wait_for_url("**/sessions", timeout=5000)
            print("Navigated to sessions")
        except Exception as e:
            print("Failed to navigate to sessions. Current URL:", page.url)
            page.screenshot(path="verification/debug_login_failed.png")
            raise e
        
        # Mock sessions list
        # Target the API URL specifically
        page.route("**/v1alpha/sessions*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"sessions": [{"name": "projects/p/sessions/123", "state": "IN_PROGRESS", "prompt": "Fix the bug in auth", "createTime": "2023-10-27T10:00:00Z"}]}'
        ))
        
        # Reload to ensure clean fetch
        page.reload()
        
        # Wait for session card
        try:
            # Look for the session title or some unique element
            page.wait_for_selector("text=Fix the bug in auth", timeout=5000)
        except:
             print("Session element not found. Taking debug screenshot.")
             page.screenshot(path="verification/debug_sessions_failed.png")
             # Print content to see if we got JSON again
             print(page.content())
             raise
        
        # Take screenshot of sessions
        page.screenshot(path="verification/2_sessions.png")
        
        browser.close()

if __name__ == "__main__":
    verify_app()
