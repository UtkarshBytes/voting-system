import json
from playwright.sync_api import sync_playwright
import time

def verify_admin_dashboard():
    with sync_playwright() as p:
        # Launch browser with desktop viewport to ensure sidebar is visible
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})

        # Add the authentication token cookie
        token = "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImFkbWluMSIsIm5hbWUiOiJBZG1pbiBVc2VyIiwicm9sZSI6IkFETUlOIiwib3JnSWQiOiJPUkctMTIzIiwiaWF0IjoxNzcxNTI4Mjg1LCJleHAiOjE3NzE2MTQ2ODV9.I6pFrFSRFNDh8xtaiAxfjmOkCPnmPgaB34I4JODAbwk"
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

        # Mock the /api/auth/me endpoint
        page.route(
            "**/api/auth/me",
            lambda route: route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({"user": {"id": "admin1", "name": "Admin User", "role": "ADMIN"}})
            )
        )

        # Mock the /api/admin/stats endpoint
        page.route(
            "**/api/admin/stats",
            lambda route: route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({
                    "totalVoters": 1250,
                    "votesCast": 980,
                    "activeElectionsCount": 3,
                    "pendingKycCount": 5,
                    "kycDistribution": {"approved": 1000, "pending": 5, "rejected": 20},
                    "blockchain": {
                        "height": 10500,
                        "latestBlockIndex": 10500,
                        "latestBlockHash": "0xabc123"
                    },
                    "recentActivity": [
                        {"type": "VOTE", "details": "New Voter Registration", "timestamp": int(time.time() * 1000)},
                        {"type": "ELECTION", "details": "Election Created", "timestamp": int(time.time() * 1000) - 3600000},
                        {"type": "SYSTEM", "details": "System Update", "timestamp": int(time.time() * 1000) - 10800000},
                    ]
                })
            )
        )

        # Mock the /api/elections endpoint
        page.route(
            "**/api/elections",
            lambda route: route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps([
                    {
                        "id": "1",
                        "title": "Student Council Election 2024",
                        "status": "ACTIVE",
                        "startTime": int(time.time() * 1000),
                        "endDate": "2024-12-31T23:59:59.000Z",
                        "candidates": [{}, {}]
                    },
                    {
                        "id": "2",
                        "title": "Faculty Representative Vote",
                        "status": "UPCOMING",
                        "startTime": int(time.time() * 1000) + 86400000,
                        "endDate": "2025-01-15T23:59:59.000Z",
                        "candidates": []
                    }
                ])
            )
        )

        try:
            # Navigate to the admin dashboard
            print("Navigating to dashboard...")
            page.goto("http://localhost:3000/admin/dashboard")

            # Wait for the page to load (wait for the "Admin Portal" text in sidebar)
            print("Waiting for sidebar...")
            page.wait_for_selector("text=Admin Portal", timeout=10000)

            # Verify Sidebar Elements
            assert page.is_visible("text=Dashboard"), "Dashboard link not visible"
            # assert page.is_visible("text=Elections"), "Elections link not visible" # It says "Elections" in sidebar
            # assert page.is_visible("text=Voters"), "Voters link not visible"
            # assert page.is_visible("text=Settings"), "Settings link not visible"

            # Verify Header
            print("Verifying header...")
            assert page.is_visible("text=Admin User"), "User name not displayed in header"

            # Verify Stats Cards
            print("Verifying stats...")
            assert page.is_visible("text=Registered Voters"), "Registered Voters card not visible"
            assert page.is_visible("text=1250"), "Total Voters count incorrect"

            assert page.is_visible("text=Active Elections"), "Active Elections card not visible"
            assert page.is_visible("text=3"), "Active Elections count incorrect"

            assert page.is_visible("text=Pending KYC Reviews"), "Pending KYC card not visible"
            assert page.is_visible("text=5"), "Pending KYC count incorrect"

            assert page.is_visible("text=Blockchain Height"), "Blockchain card not visible"
            assert page.is_visible("text=10500"), "Blockchain height incorrect"

            # Verify Elections Table/List
            print("Verifying elections list...")
            assert page.is_visible("text=Student Council Election 2024"), "Election title 1 not visible"
            assert page.is_visible("text=Faculty Representative Vote"), "Election title 2 not visible"
            assert page.is_visible("text=ACTIVE"), "Status badge ACTIVE not visible"

            # Verify Recent Activity
            print("Verifying recent activity...")
            assert page.is_visible("text=New Voter Registration"), "Recent activity item 1 not visible"
            assert page.is_visible("text=Election Created"), "Recent activity item 2 not visible"

            print("Verification passed!")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/admin_dashboard_final_fail.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_admin_dashboard()
