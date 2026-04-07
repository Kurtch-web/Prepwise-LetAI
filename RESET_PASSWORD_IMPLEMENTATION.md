# Reset Password Implementation Guide

## Overview
A complete password reset flow has been implemented connecting the frontend to the backend REST API.

## Backend Endpoints (Already Implemented)

### 1. Request Reset Code
**Endpoint:** `POST /auth/forgot-password`
- **Input:** `{ email: string }`
- **Output:** `{ success: boolean, message: string, exists: boolean }`
- **Validation:** Email must be CVSU domain (@cvsu.edu.ph)
- **Behavior:**
  - Generates a 6-digit reset code
  - Stores code in DB with 10-minute expiry
  - Sends code via email (non-blocking)
  - Does NOT reveal if email exists (for security)

### 2. Reset Password
**Endpoint:** `POST /auth/reset-password`
- **Input:** `{ email: string, code: string, new_password: string, confirm_password: string }`
- **Output:** `{ success: boolean, message: string }`
- **Validation:**
  - Email must be CVSU domain (@cvsu.edu.ph)
  - Code must be 6 digits
  - Passwords must match
  - Password must be at least 8 characters
  - Code must be valid and not expired
- **Behavior:**
  - Updates user password with PBKDF2 hash
  - Marks reset code as used
  - Sends confirmation email (non-blocking)

## Frontend Implementation

### 1. Service Methods (authService.ts)
Added two new methods to `authService`:

```typescript
// Request password reset code
async forgotPassword(email: string): Promise<{ success: boolean; message: string; exists: boolean }>

// Reset password with verification code
async resetPassword(
  email: string,
  code: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ success: boolean; message: string }>
```

### 2. UI Component (ResetPasswordPage.tsx)
New page with 3-step flow:

#### Step 1: Email Entry
- User enters their CVSU email
- Frontend validates CVSU domain (@cvsu.edu.ph)
- Calls `authService.forgotPassword(email)`
- On success, moves to Step 2

#### Step 2: Code & Password Reset
- User enters 6-digit code from email
- User enters new password and confirmation
- Validation:
  - Code is exactly 6 digits
  - Password is at least 8 characters
  - Passwords match
- Calls `authService.resetPassword(email, code, newPassword, confirmPassword)`
- Includes "Resend Code" button with 60-second countdown
- On success, moves to Step 3

#### Step 3: Success Confirmation
- Displays success message with animation
- Auto-redirects to login page after 2 seconds

### 3. Routing (AppShell.tsx)
Added `/reset-password` route to AppShell:
```typescript
<Route path="/reset-password" element={<ResetPasswordPage />} />
```

### 4. Navigation (LoginPage.tsx)
Added "Forgot Password?" link in LoginPage:
```typescript
<Link to="/reset-password" className="...">
  Forgot password?
</Link>
```

## User Flow

### Normal Reset Password Flow
1. User lands on login page
2. Clicks "Forgot Password?" link
3. Redirected to `/reset-password`
4. Enters email address → System sends reset code
5. Receives email with 6-digit code
6. Enters code + new password
7. Password updated successfully
8. Auto-redirected to login page
9. Logs in with new password

### Error Handling
- **Invalid Email Format:** Shows validation error (must be @cvsu.edu.ph)
- **Code Expired:** Shows error message, allows resend
- **Invalid Code:** Shows error message
- **Password Mismatch:** Shows validation error
- **Weak Password:** Shows validation error (< 8 characters)
- **Network Error:** Shows user-friendly error message

## Features

✅ **Three-Step Process**
- Email validation
- Code verification
- Password reset

✅ **Email Validation**
- Enforces CVSU domain (@cvsu.edu.ph)
- Real-time feedback

✅ **Code Management**
- 60-second resend countdown
- Easy resend button
- Clear expiry messages

✅ **Password Security**
- Minimum 8 characters
- Match confirmation
- Password visibility toggle
- Backend PBKDF2 hashing

✅ **User Experience**
- Light/dark theme support
- Loading states
- Success animations
- Clear error messages
- Progress indication
- Responsive design

✅ **Accessibility**
- Semantic HTML
- Form validation
- Keyboard navigation support
- Screen reader friendly

## Testing Checklist

### Frontend
- [ ] Navigate to /reset-password
- [ ] Enter valid CVSU email → Code sent message appears
- [ ] Click "Resend Code" → Countdown starts
- [ ] Enter 6-digit code from console output (backend logs to terminal)
- [ ] Enter new password + confirmation
- [ ] Click "Reset Password" → Success screen appears
- [ ] Auto-redirected to /login after 2 seconds
- [ ] Login with new password works

### Error Cases
- [ ] Invalid email (non-CVSU) → Error message
- [ ] Empty fields → Validation errors
- [ ] Code doesn't match 6 digits → Error
- [ ] Passwords don't match → Error
- [ ] Password < 8 chars → Error
- [ ] Expired code → Error, allow resend
- [ ] Non-existent email → Generic message (no user enumeration)

### Backend Logging
When testing, the backend logs the reset code to terminal:
```
============================================================
[PASSWORD RESET] Email: user@cvsu.edu.ph
[PASSWORD RESET] Reset Code: 123456
[PASSWORD RESET] Code expires in 10 minutes
============================================================
```

## Environment Variables Required

No new environment variables needed. Uses existing:
- `VITE_API_BASE` (Frontend API base URL)
- `EMAIL_FROM`, `EMAIL_PASSWORD` (Backend email)

## File Changes Summary

| File | Change |
|------|--------|
| `frontend/src/services/authService.ts` | Added `forgotPassword()` and `resetPassword()` methods |
| `frontend/src/views/ResetPasswordPage.tsx` | NEW - Complete reset password page component |
| `frontend/src/routes/AppShell.tsx` | Added `/reset-password` route |
| `frontend/src/views/LoginPage.tsx` | Added "Forgot Password?" link |

## Security Considerations

✅ **Implemented**
- CVSU email domain enforcement
- 6-digit random codes with 10-minute expiry
- PBKDF2-HMAC-SHA256 password hashing (390k iterations)
- One-time use codes (marked as used after validation)
- Non-revealing error messages (doesn't confirm if email exists)
- HTTPS-ready (secure cookie flag set to False for dev, True for prod)

⚠️ **To Verify in Production**
- [ ] Set `secure=True` on cookies (requires HTTPS)
- [ ] Store `SECRET_KEY` in environment variable, not hardcoded
- [ ] Enable email verification in email service
- [ ] Set up rate limiting on password reset endpoints
- [ ] Add CSRF protection if needed
- [ ] Monitor for reset code enumeration attacks

## Next Steps / Future Enhancements

- Add rate limiting to prevent brute force
- Add user activity logging for security audits
- Send admin notifications for suspicious reset attempts
- Add password strength meter
- Support security questions as alternative
- Add two-factor authentication
- Email notification when password is changed
