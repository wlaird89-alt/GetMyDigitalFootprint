#!/usr/bin/env python3
"""
Backend API Testing for Instagoogleface.com OSINT Application
Tests all endpoints including auth, scanning, payments, and health checks
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class InstagooglefaceAPITester:
    def __init__(self, base_url="https://identity-audit.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.test_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED")
        else:
            print(f"❌ {name}: FAILED - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        request_headers = {'Content-Type': 'application/json'}
        
        if headers:
            request_headers.update(headers)
        
        if self.session_token:
            request_headers['Authorization'] = f'Bearer {self.session_token}'

        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=request_headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=request_headers, timeout=30)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=request_headers, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=request_headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text, "status_code": response.status_code}

            return response.status_code, response_data

        except requests.exceptions.RequestException as e:
            return 0, {"error": str(e)}

    def test_health_endpoints(self):
        """Test health and root endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        status_code, response = self.make_request('GET', '/')
        success = status_code == 200 and 'Instagoogleface.com API' in str(response)
        self.log_test("Root endpoint", success, f"Status: {status_code}", response)
        
        # Test health endpoint
        status_code, response = self.make_request('GET', '/health')
        success = status_code == 200 and 'status' in response
        details = f"Status: {status_code}"
        if success:
            details += f", SerpAPI: {response.get('serpapi_configured', False)}, Stripe: {response.get('stripe_configured', False)}"
        self.log_test("Health endpoint", success, details, response)

    def test_username_scanning(self):
        """Test username scanning functionality"""
        print("\n🔍 Testing Username Scanning...")
        
        # Test valid username scan
        test_data = {
            "username": "testuser123",
            "platform_filter": "all"
        }
        
        status_code, response = self.make_request('POST', '/scan/username', test_data)
        success = status_code == 200 and 'scan_id' in response and 'platforms' in response
        details = f"Status: {status_code}"
        if success:
            details += f", Scan ID: {response.get('scan_id')}, Platforms: {len(response.get('platforms', []))}"
            self.test_scan_id = response.get('scan_id')
        self.log_test("Username scan (valid)", success, details, response)
        
        # Test invalid username (empty)
        status_code, response = self.make_request('POST', '/scan/username', {"username": ""})
        success = status_code == 400
        self.log_test("Username scan (empty username)", success, f"Status: {status_code}", response)
        
        # Test invalid username (too long)
        status_code, response = self.make_request('POST', '/scan/username', {"username": "a" * 60})
        success = status_code == 400
        self.log_test("Username scan (too long)", success, f"Status: {status_code}", response)

    def test_scan_retrieval(self):
        """Test scan result retrieval"""
        print("\n🔍 Testing Scan Retrieval...")
        
        if not hasattr(self, 'test_scan_id'):
            print("⚠️ Skipping scan retrieval tests - no scan ID available")
            return
        
        # Test get scan by ID
        status_code, response = self.make_request('GET', f'/scan/{self.test_scan_id}')
        success = status_code == 200 and 'scan_id' in response
        details = f"Status: {status_code}"
        if success:
            details += f", Username: {response.get('username')}, Risk Score: {response.get('risk_score')}"
        self.log_test("Get scan by ID", success, details, response)
        
        # Test get non-existent scan
        status_code, response = self.make_request('GET', '/scan/nonexistent123')
        success = status_code == 404
        self.log_test("Get non-existent scan", success, f"Status: {status_code}", response)
        
        # Test get full scan (should require payment)
        status_code, response = self.make_request('GET', f'/scan/{self.test_scan_id}/full')
        success = status_code == 402  # Payment required
        self.log_test("Get full scan (unpaid)", success, f"Status: {status_code}", response)

    def test_payment_endpoints(self):
        """Test payment-related endpoints"""
        print("\n🔍 Testing Payment Endpoints...")
        
        if not hasattr(self, 'test_scan_id'):
            print("⚠️ Skipping payment tests - no scan ID available")
            return
        
        # Test create checkout session
        checkout_data = {
            "scan_id": self.test_scan_id,
            "origin_url": self.base_url
        }
        
        status_code, response = self.make_request('POST', '/payments/create-checkout', checkout_data)
        success = status_code == 200 and 'checkout_url' in response and 'session_id' in response
        details = f"Status: {status_code}"
        if success:
            details += f", Session ID: {response.get('session_id')}"
            self.test_session_id = response.get('session_id')
        self.log_test("Create checkout session", success, details, response)
        
        # Test payment status check
        if hasattr(self, 'test_session_id'):
            status_code, response = self.make_request('GET', f'/payments/status/{self.test_session_id}')
            success = status_code in [200, 404]  # Either found or not found is acceptable
            self.log_test("Check payment status", success, f"Status: {status_code}", response)
        
        # Test invalid checkout data
        status_code, response = self.make_request('POST', '/payments/create-checkout', {"scan_id": "invalid"})
        success = status_code in [400, 404]
        self.log_test("Create checkout (invalid scan)", success, f"Status: {status_code}", response)

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔍 Testing Auth Endpoints...")
        
        # Test /auth/me without authentication
        status_code, response = self.make_request('GET', '/auth/me')
        success = status_code == 401
        self.log_test("Auth me (unauthenticated)", success, f"Status: {status_code}", response)
        
        # Test logout without session
        status_code, response = self.make_request('POST', '/auth/logout')
        success = status_code == 200  # Should succeed even without session
        self.log_test("Logout (no session)", success, f"Status: {status_code}", response)
        
        # Test session creation with invalid data
        status_code, response = self.make_request('POST', '/auth/session', {"invalid": "data"})
        success = status_code == 400
        self.log_test("Auth session (invalid data)", success, f"Status: {status_code}", response)

    def test_scan_history(self):
        """Test scan history endpoint"""
        print("\n🔍 Testing Scan History...")
        
        # Test scan history without authentication
        status_code, response = self.make_request('GET', '/scans/history')
        success = status_code == 401
        self.log_test("Scan history (unauthenticated)", success, f"Status: {status_code}", response)

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Instagoogleface.com API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Run test suites
        self.test_health_endpoints()
        self.test_username_scanning()
        self.test_scan_retrieval()
        self.test_payment_endpoints()
        self.test_auth_endpoints()
        self.test_scan_history()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    """Main test runner"""
    tester = InstagooglefaceAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())