"""Authentication API Router.

AI-Powered Landslide Risk Intelligence & Early Warning System.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User, UserRoleEnum
from app.models.schemas import UserResponse, Token, UserCreate
from app.auth.security import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, require_role
)
from app.audit.logger import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate user and issue JWT Bearer Token."""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(data={"sub": user.username, "role": user.role})

    log_audit_event(
        db=db,
        action_type="USER_LOGIN",
        user_name=user.username,
        entity_type="User",
        entity_id=str(user.id)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return currently authenticated user profile."""
    return current_user


@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("ADMIN"))
):
    """List operational users (Admin only)."""
    return db.query(User).order_by(User.id.asc()).all()


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("ADMIN"))
):
    """Provision a new operational user account with role-based permissions (Admin only)."""
    # Check for existing username
    existing_user = db.query(User).filter(User.username == user_in.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{user_in.username}' is already registered."
        )

    # Check for existing email
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{user_in.email}' is already registered."
        )

    # Validate role
    role_str = user_in.role.upper()
    valid_roles = {r.value for r in UserRoleEnum}
    if role_str not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{user_in.role}'. Allowed: {list(valid_roles)}"
        )

    new_user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        role=role_str,
        is_active=user_in.is_active,
        hashed_password=get_password_hash(user_in.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit_event(
        db=db,
        action_type="CREATE_USER",
        user_name=admin_user.username,
        entity_type="User",
        entity_id=str(new_user.id),
        payload_summary={
            "created_username": new_user.username,
            "role": new_user.role,
            "email": new_user.email
        }
    )

    return new_user

