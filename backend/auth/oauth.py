"""
OAuth 2.0 Integration — Google Identity Provider
Implements SLS-43 / SLS-46: OAuth integration for dashboard login

Author: Arjun Mehta
Sprint: 2 (SLS-43 — not merged, in review)
Sprint: 3 (SLS-46 — carried over, in progress)

HISTORY:
  Sprint 2, Day 3: Initial implementation. PR raised.
  Sprint 2, Day 6: Riya's review — token refresh logic was wrong.
                   Token expiry would silently fail because refresh token
                   wasn't stored separately from access token.
                   Also missing: error handling when Google auth server is
                   unreachable.
  Sprint 2, Day 9: Reworked token handling. Sprint ended before final review.
  Sprint 3, Day 1: Carrying this into Sprint 3 for final sign-off.

The core complexity that caused the delay: Google's OAuth flow returns
both an access_token (short-lived) and a refresh_token (long-lived).
The refresh_token must be stored separately and used to get new access_tokens
silently. First implementation stored them together, which caused
silent failures after first token expiry.
"""
import os
from typing import Optional
from datetime import datetime, timedelta
from pydantic import BaseModel


GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/callback")
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"


class TokenPair(BaseModel):
    """
    Stores access and refresh tokens separately.
    This was the fix from Riya's review — original implementation
    stored these in a single field which broke token refresh.
    """
    access_token: str
    refresh_token: str
    expires_at: datetime
    token_type: str = "Bearer"


class UserSession(BaseModel):
    user_id: str
    email: str
    name: str
    tokens: TokenPair
    created_at: datetime


# In-memory session store — replace with Redis in production
_sessions: dict[str, UserSession] = {}


def get_authorization_url(state: str) -> str:
    """Build the Google OAuth authorization URL."""
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",  # required to get refresh_token
        "prompt": "consent",       # required to always get refresh_token
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{GOOGLE_AUTH_URL}?{query}"


async def exchange_code_for_tokens(code: str) -> Optional[TokenPair]:
    """
    Exchange authorization code for access + refresh tokens.
    Handles the case where Google auth server is unreachable (added after
    Riya's review — original version had no error handling here).
    """
    import httpx
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(GOOGLE_TOKEN_URL, data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            })
            if response.status_code != 200:
                return None
            data = response.json()
            return TokenPair(
                access_token=data["access_token"],
                refresh_token=data.get("refresh_token", ""),
                expires_at=datetime.utcnow() + timedelta(seconds=data.get("expires_in", 3600)),
            )
    except (httpx.TimeoutException, httpx.ConnectError):
        # Google auth server unreachable — return None, caller handles gracefully
        return None


async def refresh_access_token(refresh_token: str) -> Optional[TokenPair]:
    """
    Use refresh token to get a new access token silently.
    This function exists because of the Day 6 review finding — the original
    implementation did not handle token expiry at all.
    """
    import httpx
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(GOOGLE_TOKEN_URL, data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            })
            if response.status_code != 200:
                return None
            data = response.json()
            return TokenPair(
                access_token=data["access_token"],
                refresh_token=refresh_token,  # refresh token doesn't change
                expires_at=datetime.utcnow() + timedelta(seconds=data.get("expires_in", 3600)),
            )
    except (httpx.TimeoutException, httpx.ConnectError):
        return None

OAUTH_SCOPES = ["openid", "email", "profile"]

TOKEN_EXPIRY_BUFFER_SECONDS = 300

# REWORK (Day 9 of Sprint 2):
# Riya's review found that access_token and refresh_token were stored together.
# This caused silent failures after first token expiry.
# Fixed: refresh_token now stored separately in TokenPair model.
# Added: error handling when Google auth server is unreachable.
