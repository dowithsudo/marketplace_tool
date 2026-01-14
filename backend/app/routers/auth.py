from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from .. import database, models, schemas, auth
from ..deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        # We return success even if user not found for security (prevent email enumeration)
        return {"message": "If that email is registered, you will receive a reset link."}
    
    # Create reset token (valid for 15 mins)
    reset_token_expires = timedelta(minutes=15)
    reset_token = auth.create_access_token(
        data={"sub": user.email, "purpose": "password_reset"}, 
        expires_delta=reset_token_expires
    )
    
    # In a real app, send email here.
    # We'll just log it for now since this is a local/demo version.
    print(f"DEBUG: Password reset token for {user.email}: {reset_token}")
    
    return {"message": "If that email is registered, you will receive a reset link."}

@router.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(database.get_db)):
    try:
        from jose import jwt, JWTError
        payload = jwt.decode(request.token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        purpose: str = payload.get("purpose")
        
        if email is None or purpose != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid token")
            
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=400, detail="Invalid token")
            
        user.hashed_password = auth.get_password_hash(request.new_password)
        db.add(user)
        db.commit()
        
        return {"message": "Password updated successfully"}
        
    except JWTError:
        raise HTTPException(status_code=400, detail="Token has expired or is invalid")

@router.post("/change-password")
def change_password(request: schemas.ChangePasswordRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    # Verify old password
    if not auth.verify_password(request.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash and update to new password
    current_user.hashed_password = auth.get_password_hash(request.new_password)
    db.add(current_user)
    db.commit()
    
    return {"message": "Password changed successfully"}
