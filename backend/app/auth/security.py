"""Authentication, JWT Token Management & Role-Based Access Control (RBAC).

AI-Powered Landslide Risk Intelligence & Early Warning System.
Strict server-side authorization guards for disaster-management decision support.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, Any, Dict, List
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.entities import User, UserRoleEnum
from app.models.schemas import TokenData

# OAuth2 Bearer scheme; auto_error=False allows optional token extraction in dev mode
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash using constant-time check."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hash password using salted bcrypt with cost factor 12."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create cryptographically signed JWT token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Validate bearer token and retrieve authenticated user.

    Enforces strict token validation whenever a token is provided.
    In production mode or when STRICT_AUTH=True, anonymous requests are strictly rejected.
    In development/testing with STRICT_AUTH=False, provides a fallback operator context.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        # Check strict auth requirement
        if settings.STRICT_AUTH or settings.ENV == "production":
            raise credentials_exception

        # Development / Test fallback: lookup default admin user
        default_user = db.query(User).filter(User.username == "admin").first()
        if default_user and default_user.is_active:
            return default_user

        # Create transient test user if database not seeded
        return User(
            id=1,
            username="admin",
            email="ndrf.commander@disaster.gov.in",
            role="ADMIN",
            full_name="Default Dev Operator",
            is_active=True
        )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if not username:
            raise credentials_exception
        token_data = TokenData(username=username, role=role)
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None or not user.is_active:
        raise credentials_exception

    # Prefer role from database record for absolute consistency
    return user


def require_role(*allowed_roles: str):
    """Dependency factory ensuring user possesses one of the allowed operational roles.

    Independent server-side verification: Prevents client-side authorization bypass.
    Maps READ_ONLY and PUBLIC_VIEWER interchangeably.
    """
    normalized_allowed = set()
    for r in allowed_roles:
        normalized_allowed.add(r.upper())
        if r.upper() in ["READ_ONLY", "PUBLIC_VIEWER"]:
            normalized_allowed.add("READ_ONLY")
            normalized_allowed.add("PUBLIC_VIEWER")

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = (current_user.role or "").upper()
        if user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {list(allowed_roles)}, your role: {current_user.role}"
            )
        return current_user

    return role_checker


def mask_sensitive_data(data: Any) -> Any:
    """Recursively mask sensitive keys from logging outputs, errors, and dictionaries."""
    SENSITIVE_KEYS = {
        "password", "hashed_password", "token", "access_token",
        "secret", "secret_key", "authorization", "api_key",
        "private_key", "credentials"
    }

    if isinstance(data, dict):
        masked = {}
        for k, v in data.items():
            if any(s in k.lower() for s in SENSITIVE_KEYS):
                masked[k] = "[REDACTED]"
            else:
                masked[k] = mask_sensitive_data(v)
        return masked
    elif isinstance(data, list):
        return [mask_sensitive_data(item) for item in data]
    return data
