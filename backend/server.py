from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe integration
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

# Create the main app
app = FastAPI(title="GetMyDigitalFootprint API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Platform definitions for OSINT scanning
PLATFORMS = [
    {"name": "Instagram", "url_template": "https://instagram.com/{username}", "icon": "instagram", "check_type": "profile"},
    {"name": "Twitter/X", "url_template": "https://x.com/{username}", "icon": "twitter", "check_type": "profile"},
    {"name": "TikTok", "url_template": "https://tiktok.com/@{username}", "icon": "tiktok", "check_type": "profile"},
    {"name": "GitHub", "url_template": "https://github.com/{username}", "icon": "github", "check_type": "profile"},
    {"name": "Reddit", "url_template": "https://reddit.com/user/{username}", "icon": "reddit", "check_type": "profile"},
    {"name": "LinkedIn", "url_template": "https://linkedin.com/in/{username}", "icon": "linkedin", "check_type": "profile"},
    {"name": "YouTube", "url_template": "https://youtube.com/@{username}", "icon": "youtube", "check_type": "profile"},
    {"name": "Pinterest", "url_template": "https://pinterest.com/{username}", "icon": "pinterest", "check_type": "profile"},
    {"name": "Twitch", "url_template": "https://twitch.tv/{username}", "icon": "twitch", "check_type": "profile"},
    {"name": "Snapchat", "url_template": "https://snapchat.com/add/{username}", "icon": "snapchat", "check_type": "profile"},
    {"name": "Medium", "url_template": "https://medium.com/@{username}", "icon": "medium", "check_type": "profile"},
    {"name": "Tumblr", "url_template": "https://{username}.tumblr.com", "icon": "tumblr", "check_type": "profile"},
]

# Pydantic Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PlatformResult(BaseModel):
    name: str
    url: str
    icon: str
    status: str  # "found", "not_found", "unknown"
    
class SearchResult(BaseModel):
    platform: str
    title: str
    snippet: str
    link: str
    position: int

class RiskFactors(BaseModel):
    platforms_found: int
    total_mentions: int
    has_personal_identifiers: bool
    has_contact_patterns: bool
    high_visibility: bool

class ScanResult(BaseModel):
    scan_id: str = Field(default_factory=lambda: f"scan_{uuid.uuid4().hex[:12]}")
    user_id: Optional[str] = None
    username: str
    platform_filter: str = "all"
    platforms: List[PlatformResult] = []
    search_results: List[SearchResult] = []
    risk_score: int = 0
    risk_level: str = "low"  # low, medium, high
    risk_factors: Optional[RiskFactors] = None
    is_paid: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentTransaction(BaseModel):
    transaction_id: str = Field(default_factory=lambda: f"txn_{uuid.uuid4().hex[:12]}")
    user_id: Optional[str] = None
    scan_id: str
    session_id: str
    amount: float
    currency: str
    payment_status: str = "initiated"  # initiated, paid, failed, expired
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper functions
async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token in cookie or header"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        return None
    
    # Check expiry with timezone awareness
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    
    return User(**user_doc)

async def check_platform_existence(username: str, platform: dict) -> PlatformResult:
    """Check if username exists on a platform using HTTP request"""
    url = platform["url_template"].format(username=username)
    
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as http_client:
            response = await http_client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            })
            
            content_lower = response.text.lower()
            final_url = str(response.url).lower()
            
            # Determine status based on response
            if response.status_code == 404:
                status = "not_found"
            elif response.status_code in [429, 403, 999]:
                # Rate limited or blocked - can't determine
                status = "unknown"
            elif response.status_code == 200:
                # Check for common "not found" patterns in content
                not_found_patterns = [
                    "page not found", "user not found", "account not found",
                    "this page isn't available", "sorry, this page", "doesn't exist",
                    "no user", "page doesn't exist", "not available", "couldn't find",
                    "profile not found", "user doesn't exist", "nothing here"
                ]
                
                # Check for login redirects (Instagram does this)
                login_patterns = ["accounts/login", "login?", "/login", "sign_in"]
                is_login_redirect = any(p in final_url for p in login_patterns)
                
                if any(pattern in content_lower for pattern in not_found_patterns):
                    status = "not_found"
                elif is_login_redirect:
                    # Redirected to login - likely means profile exists but needs auth to view
                    status = "found"
                else:
                    status = "found"
            else:
                status = "unknown"
    except httpx.TimeoutException:
        logger.warning(f"Timeout checking {platform['name']} for {username}")
        status = "unknown"
    except Exception as e:
        logger.warning(f"Error checking {platform['name']} for {username}: {str(e)}")
        status = "unknown"
    
    return PlatformResult(name=platform["name"], url=url, icon=platform["icon"], status=status)

def calculate_risk_score(platforms: List[PlatformResult], search_results: List[SearchResult]) -> tuple:
    """Calculate risk score based on findings"""
    platforms_found = sum(1 for p in platforms if p.status == "found")
    total_mentions = len(search_results)
    
    # Check for personal identifiers in search results
    personal_patterns = re.compile(r'\b(name|age|born|location|address|lives in|from)\b', re.I)
    contact_patterns = re.compile(r'\b(email|phone|contact|dm|message)\b', re.I)
    
    has_personal = any(personal_patterns.search(r.snippet or "") for r in search_results)
    has_contact = any(contact_patterns.search(r.snippet or "") for r in search_results)
    high_visibility = platforms_found >= 5 or total_mentions >= 10
    
    # Calculate score
    score = 0
    score += min(platforms_found * 8, 40)  # Up to 40 points for platforms
    score += min(total_mentions * 3, 30)   # Up to 30 points for mentions
    score += 10 if has_personal else 0
    score += 10 if has_contact else 0
    score += 10 if high_visibility else 0
    
    score = min(score, 100)
    
    if score < 30:
        level = "low"
    elif score < 60:
        level = "medium"
    else:
        level = "high"
    
    risk_factors = RiskFactors(
        platforms_found=platforms_found,
        total_mentions=total_mentions,
        has_personal_identifiers=has_personal,
        has_contact_patterns=has_contact,
        high_visibility=high_visibility
    )
    
    return score, level, risk_factors

async def search_with_serpapi(username: str, platform_filter: str = "all") -> List[SearchResult]:
    """Search for username using SerpAPI"""
    api_key = os.environ.get("SERPAPI_API_KEY", "").strip()
    
    if not api_key:
        logger.warning("SerpAPI key not configured")
        return []
    
    results = []
    
    # Define search queries based on filter
    if platform_filter == "all":
        queries = [
            f'"{username}" site:instagram.com',
            f'"{username}" site:twitter.com OR site:x.com',
            f'"{username}" site:tiktok.com',
            f'"{username}" site:youtube.com',
            f'"{username}" site:linkedin.com',
        ]
    else:
        platform_domains = {
            "instagram": "instagram.com",
            "twitter": "twitter.com OR site:x.com",
            "tiktok": "tiktok.com",
            "youtube": "youtube.com",
            "linkedin": "linkedin.com",
        }
        domain = platform_domains.get(platform_filter.lower())
        if domain:
            queries = [f'"{username}" site:{domain}']
        else:
            queries = [f'"{username}"']
    
    try:
        from serpapi import Client
        serp_client = Client(api_key=api_key)
        
        for query in queries:
            try:
                response = serp_client.search(
                    q=query,
                    engine="google",
                    gl="us",
                    hl="en",
                    num=5
                )
                
                organic_results = response.get("organic_results", [])
                
                for idx, result in enumerate(organic_results[:5]):
                    link = result.get("link", "")
                    
                    # Determine platform from link
                    platform = "Web"
                    if "instagram.com" in link:
                        platform = "Instagram"
                    elif "twitter.com" in link or "x.com" in link:
                        platform = "Twitter/X"
                    elif "tiktok.com" in link:
                        platform = "TikTok"
                    elif "youtube.com" in link:
                        platform = "YouTube"
                    elif "linkedin.com" in link:
                        platform = "LinkedIn"
                    elif "github.com" in link:
                        platform = "GitHub"
                    elif "reddit.com" in link:
                        platform = "Reddit"
                    
                    results.append(SearchResult(
                        platform=platform,
                        title=result.get("title", ""),
                        snippet=result.get("snippet", ""),
                        link=link,
                        position=len(results) + 1
                    ))
            except Exception as e:
                logger.warning(f"SerpAPI search error for query '{query}': {str(e)}")
                continue
                
    except Exception as e:
        logger.error(f"SerpAPI client error: {str(e)}")
    
    return results

# Auth endpoints
# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
@api_router.post("/auth/session")
async def process_session(request: Request, response: Response):
    """Process session_id from Emergent Auth and create user session"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get session data
    async with httpx.AsyncClient() as http_client:
        auth_response = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        auth_data = auth_response.json()
    
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Check if user exists, create if not
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Create session
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Remove old sessions for this user
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one(session_doc)
    
    # Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user, "message": "Session created successfully"}

@api_router.get("/auth/me")
async def get_current_user_endpoint(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user and clear session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out successfully"}

# OSINT Scan endpoints
@api_router.post("/scan/username")
async def scan_username(request: Request):
    """Perform OSINT scan on a username"""
    body = await request.json()
    username = body.get("username", "").strip()
    platform_filter = body.get("platform_filter", "all")
    
    if not username:
        raise HTTPException(status_code=400, detail="Username required")
    
    if len(username) < 2 or len(username) > 50:
        raise HTTPException(status_code=400, detail="Username must be 2-50 characters")
    
    # Get current user if authenticated
    user = await get_current_user(request)
    user_id = user.user_id if user else None
    
    # Check platform existence
    platform_results = []
    for platform in PLATFORMS:
        result = await check_platform_existence(username, platform)
        platform_results.append(result)
    
    # Search with SerpAPI
    search_results = await search_with_serpapi(username, platform_filter)
    
    # Calculate risk score
    risk_score, risk_level, risk_factors = calculate_risk_score(platform_results, search_results)
    
    # Create scan result
    scan = ScanResult(
        user_id=user_id,
        username=username,
        platform_filter=platform_filter,
        platforms=platform_results,
        search_results=search_results,
        risk_score=risk_score,
        risk_level=risk_level,
        risk_factors=risk_factors,
        is_paid=False
    )
    
    # Save to database
    scan_doc = scan.model_dump()
    scan_doc["created_at"] = scan_doc["created_at"].isoformat()
    scan_doc["platforms"] = [p.model_dump() for p in scan.platforms]
    scan_doc["search_results"] = [s.model_dump() for s in scan.search_results]
    if scan.risk_factors:
        scan_doc["risk_factors"] = scan.risk_factors.model_dump()
    
    await db.scans.insert_one(scan_doc)
    
    # Return teaser data (limited search results for free tier)
    return {
        "scan_id": scan.scan_id,
        "username": scan.username,
        "platforms": [p.model_dump() for p in scan.platforms],
        "search_results_preview": [s.model_dump() for s in scan.search_results[:3]],  # Only 3 for free
        "total_search_results": len(scan.search_results),
        "risk_score": scan.risk_score,
        "risk_level": scan.risk_level,
        "risk_factors": scan.risk_factors.model_dump() if scan.risk_factors else None,
        "is_paid": False,
        "serpapi_available": bool(os.environ.get("SERPAPI_API_KEY", "").strip())
    }

@api_router.get("/scan/{scan_id}")
async def get_scan(scan_id: str, request: Request):
    """Get scan results by ID"""
    scan_doc = await db.scans.find_one({"scan_id": scan_id}, {"_id": 0})
    
    if not scan_doc:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    # Check if scan is paid
    if scan_doc.get("is_paid"):
        return scan_doc
    
    # Return teaser for unpaid
    return {
        "scan_id": scan_doc["scan_id"],
        "username": scan_doc["username"],
        "platforms": scan_doc["platforms"],
        "search_results_preview": scan_doc["search_results"][:3],
        "total_search_results": len(scan_doc.get("search_results", [])),
        "risk_score": scan_doc["risk_score"],
        "risk_level": scan_doc["risk_level"],
        "risk_factors": scan_doc.get("risk_factors"),
        "is_paid": False,
        "serpapi_available": bool(os.environ.get("SERPAPI_API_KEY", "").strip())
    }

@api_router.get("/scan/{scan_id}/full")
async def get_full_scan(scan_id: str, request: Request):
    """Get full scan results (requires payment)"""
    scan_doc = await db.scans.find_one({"scan_id": scan_id}, {"_id": 0})
    
    if not scan_doc:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    if not scan_doc.get("is_paid"):
        raise HTTPException(status_code=402, detail="Payment required for full report")
    
    # Add recommendations
    recommendations = []
    if scan_doc["risk_score"] > 30:
        recommendations.append("Consider using unique usernames across platforms to reduce linkability")
    if scan_doc["risk_factors"] and scan_doc["risk_factors"].get("has_personal_identifiers"):
        recommendations.append("Review and remove personal information from public profiles")
    if scan_doc["risk_factors"] and scan_doc["risk_factors"].get("has_contact_patterns"):
        recommendations.append("Consider using a separate email for public-facing accounts")
    if len([p for p in scan_doc["platforms"] if p.get("status") == "found"]) > 5:
        recommendations.append("Consolidate or delete unused social media accounts")
    recommendations.append("Enable privacy settings on all platforms where available")
    recommendations.append("Set up Google Alerts for your username to monitor future mentions")
    
    return {
        **scan_doc,
        "recommendations": recommendations
    }

@api_router.get("/scans/history")
async def get_scan_history(request: Request):
    """Get user's scan history"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    scans = await db.scans.find(
        {"user_id": user.user_id},
        {"_id": 0, "scan_id": 1, "username": 1, "risk_score": 1, "risk_level": 1, "is_paid": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(50)
    
    return {"scans": scans}

# Payment endpoints
@api_router.post("/payments/create-checkout")
async def create_checkout_session(request: Request):
    """Create Stripe checkout session for premium report"""
    body = await request.json()
    scan_id = body.get("scan_id")
    origin_url = body.get("origin_url")
    
    if not scan_id or not origin_url:
        raise HTTPException(status_code=400, detail="scan_id and origin_url required")
    
    # Verify scan exists
    scan_doc = await db.scans.find_one({"scan_id": scan_id}, {"_id": 0})
    if not scan_doc:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    if scan_doc.get("is_paid"):
        raise HTTPException(status_code=400, detail="Scan already paid")
    
    user = await get_current_user(request)
    user_id = user.user_id if user else None
    
    # Initialize Stripe
    api_key = os.environ.get("STRIPE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    # Create checkout session - fixed amount on backend (security)
    success_url = f"{origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/results/{scan_id}"
    
    checkout_request = CheckoutSessionRequest(
        amount=4.99,  # Fixed price - €4.99
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "scan_id": scan_id,
            "user_id": user_id or "anonymous"
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = PaymentTransaction(
        user_id=user_id,
        scan_id=scan_id,
        session_id=session.session_id,
        amount=4.99,
        currency="eur",
        payment_status="initiated"
    )
    
    transaction_doc = transaction.model_dump()
    transaction_doc["created_at"] = transaction_doc["created_at"].isoformat()
    transaction_doc["updated_at"] = transaction_doc["updated_at"].isoformat()
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {
        "checkout_url": session.url,
        "session_id": session.session_id
    }

@api_router.get("/payments/status/{session_id}")
async def check_payment_status(session_id: str, request: Request):
    """Check payment status and unlock report if paid"""
    api_key = os.environ.get("STRIPE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Find transaction
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Update transaction status
    current_status = transaction.get("payment_status")
    new_status = status.payment_status
    
    # Only process if status changed and payment succeeded
    if new_status == "paid" and current_status != "paid":
        # Update transaction
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": "paid",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Unlock the scan
        scan_id = transaction.get("scan_id")
        await db.scans.update_one(
            {"scan_id": scan_id},
            {"$set": {"is_paid": True}}
        )
        
        return {
            "status": "paid",
            "scan_id": scan_id,
            "message": "Payment successful! Report unlocked."
        }
    elif new_status == "paid":
        # Already processed
        return {
            "status": "paid",
            "scan_id": transaction.get("scan_id"),
            "message": "Report already unlocked."
        }
    else:
        # Update status
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "status": new_status,
            "scan_id": transaction.get("scan_id"),
            "message": f"Payment status: {new_status}"
        }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        api_key = os.environ.get("STRIPE_API_KEY")
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            metadata = webhook_response.metadata
            scan_id = metadata.get("scan_id")
            
            if scan_id:
                # Update transaction
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {
                        "payment_status": "paid",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                # Unlock scan
                await db.scans.update_one(
                    {"scan_id": scan_id},
                    {"$set": {"is_paid": True}}
                )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"received": True, "error": str(e)}

# Health check
@api_router.get("/")
async def root():
    return {"message": "GetMyDigitalFootprint API", "status": "operational"}

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "serpapi_configured": bool(os.environ.get("SERPAPI_API_KEY", "").strip()),
        "stripe_configured": bool(os.environ.get("STRIPE_API_KEY"))
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
