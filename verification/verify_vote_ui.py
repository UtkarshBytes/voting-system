import json
from playwright.sync_api import sync_playwright
import time

def verify_vote_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use desktop viewport
        context = browser.new_context(viewport={"width": 1280, "height": 800})

        # Add auth token
        token = "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6InVzZXIxIiwibmFtZSI6IlZvdGVyIFVzZXIiLCJyb2xlIjoiVk9URVIiLCJpYXQiOjE3NzE1Mjk0MDUsImV4cCI6MTc3MTYxNTgwNX0.OEZz_WQGTHhfVhPeEh4G78INE-RvNN499ao6XmAYjig"
        context.add_cookies([{
            "name": "token",
            "value": token,
            "domain": "localhost",
            "path": "/",
            "httpOnly": True,
            "secure": False,
            "sameSite": "Lax"
        }])

        page = context.new_page()

        # Mock APIs
        page.route("**/api/auth/me", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({"user": {"id": "user1", "name": "Voter User", "role": "VOTER"}})
        ))

        page.route("**/api/elections/123", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "election": {
                    "id": "123",
                    "title": "Test Election 2024",
                    "status": "ACTIVE",
                    "candidates": [
                        { "id": "c1", "name": "Jane Doe", "party": "Future Party", "imageUrl": "" },
                        { "id": "c2", "name": "John Smith", "party": "Past Party", "imageUrl": "" }
                    ]
                }
            })
        ))

        page.route("**/api/vote/request-otp", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({ "email": "j***@example.com" })
        ))

        page.route("**/api/vote/verify-otp", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "receipt": {
                    "voteVerificationCode": "VOTE-RECEIPT-123",
                    "blockNumber": 54321,
                    "transactionHash": "0xabc123def456",
                    "timestamp": int(time.time() * 1000)
                }
            })
        ))

        try:
            print("Navigating to vote page...")
            page.goto("http://localhost:3000/vote/123")

            # 1. Selection Page
            print("Verifying Selection Page...")
            page.wait_for_selector("text=Test Election 2024")
            assert page.is_visible("text=Select a Candidate")

            # Click select on first candidate
            print("Selecting candidate...")
            page.click("text=Select Candidate >> nth=0")

            # 2. Verify Identity Page (Step 1 - Input)
            print("Verifying Verify Identity Page...")
            page.wait_for_selector("text=Verify Identity")
            assert page.is_visible("text=Verify Identity")

            # Switch to password
            print("Switching to password...")
            page.click("text=Account Password")
            page.fill("input[type=password]", "password123")
            page.click("text=Verify Password")

            # 3. Confirm Page (Step 1 - Confirm)
            print("Verifying Confirm Page...")
            page.wait_for_selector("text=Confirm Your Vote")
            assert page.is_visible("text=This action cannot be undone")
            assert page.is_visible("text=Identity Verified Successfully")
            assert page.is_visible("text=You are voting for")
            assert page.is_visible("text=Jane Doe")

            # Proceed to OTP
            print("Requesting OTP...")
            page.click("text=Proceed to Final Step")

            # 4. OTP Page (Step 2)
            print("Verifying OTP Page...")
            page.wait_for_selector("text=Email Verification Required")
            assert page.is_visible("text=We've sent a 6-digit code")
            assert page.is_visible("text=Time Remaining")

            # Enter OTP
            print("Entering OTP...")
            otp_inputs = page.query_selector_all("input[type=text]")
            for i, inp in enumerate(otp_inputs):
                inp.fill(str(i+1))

            # Confirm Vote
            print("Confirming Vote...")
            page.click("text=Confirm & Cast Vote")

            # 5. Receipt Page (Step 3)
            print("Verifying Receipt Page...")
            page.wait_for_selector("text=Vote Successfully Recorded")
            assert page.is_visible("text=VOTE-RECEIPT-123")
            assert page.is_visible("text=0xabc123def456")
            assert page.is_visible("text=Verify Publicly")

            print("Verification passed!")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/vote_flow_fail.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_vote_ui()
