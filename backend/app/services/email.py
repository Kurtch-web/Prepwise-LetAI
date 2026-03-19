"""
Email service for sending professional HTML emails
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from ..config import FRONTEND_ORIGIN


class EmailService:
    """Service for sending professional HTML emails"""
    
    def __init__(self):
        self.email_from = os.getenv('EMAIL_FROM', 'noreply@letreviewhub.com')
        self.email_password = os.getenv('EMAIL_PASSWORD', '')
        self.smtp_server = 'smtp.gmail.com'
        self.smtp_port = 587
    
    async def send_verification_code(self, email: str, code: str, full_name: str) -> bool:
        """Send verification code email for signup"""
        subject = '🔐 Verify Your LET Review Hub Account'
        
        html_content = self._render_verification_template(
            full_name=full_name,
            code=code
        )
        
        return await self._send_email(email, subject, html_content)
    
    async def send_password_reset_code(self, email: str, code: str, username: str) -> bool:
        """Send password reset code email"""
        subject = '🔑 Reset Your LET Review Hub Password'
        
        html_content = self._render_password_reset_template(
            username=username,
            code=code
        )
        
        return await self._send_email(email, subject, html_content)
    
    async def send_welcome_email(self, email: str, full_name: str, username: str) -> bool:
        """Send welcome email after successful signup"""
        subject = '👋 Welcome to LET Review Hub!'
        
        html_content = self._render_welcome_template(
            full_name=full_name,
            username=username
        )
        
        return await self._send_email(email, subject, html_content)
    
    async def send_password_reset_success(self, email: str, full_name: str) -> bool:
        """Send confirmation email after password reset"""
        subject = '✅ Your Password Has Been Reset'
        
        html_content = self._render_password_reset_success_template(
            full_name=full_name
        )
        
        return await self._send_email(email, subject, html_content)
    
    async def _send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send email using SMTP"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = self.email_from
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Attach HTML content
            msg.attach(MIMEText(html_content, 'html'))
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email_from, self.email_password)
                server.send_message(msg)
            
            print(f"✓ Email sent to {to_email}")
            return True
        
        except Exception as e:
            print(f"✗ Failed to send email to {to_email}: {str(e)}")
            return False
    
    def _render_verification_template(self, full_name: str, code: str) -> str:
        """Render HTML template for verification code email"""
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Account</title>
            <style>
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }}
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    padding: 40px 20px;
                    text-align: center;
                }}
                .header h1 {{
                    font-size: 28px;
                    margin-bottom: 10px;
                }}
                .content {{
                    padding: 40px 30px;
                }}
                .greeting {{
                    font-size: 16px;
                    color: #1f2937;
                    margin-bottom: 20px;
                }}
                .message {{
                    font-size: 14px;
                    color: #4b5563;
                    line-height: 1.6;
                    margin-bottom: 30px;
                }}
                .code-box {{
                    background: #f3f4f6;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin: 30px 0;
                }}
                .code {{
                    font-size: 32px;
                    font-weight: bold;
                    color: #10b981;
                    letter-spacing: 5px;
                    font-family: 'Courier New', monospace;
                }}
                .code-note {{
                    font-size: 12px;
                    color: #6b7280;
                    margin-top: 10px;
                }}
                .footer {{
                    background: #f9fafb;
                    padding: 20px 30px;
                    border-top: 1px solid #e5e7eb;
                    font-size: 12px;
                    color: #6b7280;
                    text-align: center;
                }}
                .footer a {{
                    color: #10b981;
                    text-decoration: none;
                }}
                .security-note {{
                    background: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                    font-size: 13px;
                    color: #92400e;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💡 LET Review Hub</h1>
                    <p>Verify Your Account</p>
                </div>
                
                <div class="content">
                    <div class="greeting">Hi {full_name},</div>
                    
                    <div class="message">
                        Thank you for signing up to <strong>LET Review Hub</strong>! To complete your registration, please verify your email address using the code below.
                    </div>
                    
                    <div class="code-box">
                        <div class="code">{code}</div>
                        <div class="code-note">This code expires in 10 minutes</div>
                    </div>
                    
                    <div class="message">
                        Enter this code in the verification field on our website to complete your account setup and start your LET exam preparation journey.
                    </div>
                    
                    <div class="security-note">
                        <strong>Security Note:</strong> Never share this code with anyone. LET Review Hub staff will never ask for your verification code.
                    </div>
                </div>
                
                <div class="footer">
                    <p>If you didn't create this account, please ignore this email.</p>
                    <p style="margin-top: 10px;">© 2026 LET Review Hub. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _render_password_reset_template(self, username: str, code: str) -> str:
        """Render HTML template for password reset code email"""
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
            <style>
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }}
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                    padding: 40px 20px;
                    text-align: center;
                }}
                .header h1 {{
                    font-size: 28px;
                    margin-bottom: 10px;
                }}
                .content {{
                    padding: 40px 30px;
                }}
                .greeting {{
                    font-size: 16px;
                    color: #1f2937;
                    margin-bottom: 20px;
                }}
                .message {{
                    font-size: 14px;
                    color: #4b5563;
                    line-height: 1.6;
                    margin-bottom: 30px;
                }}
                .code-box {{
                    background: #fef3c7;
                    border: 2px solid #fcd34d;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin: 30px 0;
                }}
                .code {{
                    font-size: 32px;
                    font-weight: bold;
                    color: #d97706;
                    letter-spacing: 5px;
                    font-family: 'Courier New', monospace;
                }}
                .code-note {{
                    font-size: 12px;
                    color: #6b7280;
                    margin-top: 10px;
                }}
                .footer {{
                    background: #f9fafb;
                    padding: 20px 30px;
                    border-top: 1px solid #e5e7eb;
                    font-size: 12px;
                    color: #6b7280;
                    text-align: center;
                }}
                .security-note {{
                    background: #fee2e2;
                    border-left: 4px solid #ef4444;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                    font-size: 13px;
                    color: #7f1d1d;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔑 LET Review Hub</h1>
                    <p>Password Reset Request</p>
                </div>
                
                <div class="content">
                    <div class="greeting">Hi {username},</div>
                    
                    <div class="message">
                        We received a request to reset your password. If this was you, use the code below to create a new password.
                    </div>
                    
                    <div class="code-box">
                        <div class="code">{code}</div>
                        <div class="code-note">This code expires in 10 minutes</div>
                    </div>
                    
                    <div class="message">
                        Enter this code on the password reset page to set a new password for your LET Review Hub account.
                    </div>
                    
                    <div class="security-note">
                        <strong>⚠️ Security Alert:</strong> If you didn't request a password reset, someone else may have access to your account. Please secure it immediately or contact support.
                    </div>
                </div>
                
                <div class="footer">
                    <p>If you didn't request a password reset, you can safely ignore this email.</p>
                    <p style="margin-top: 10px;">© 2026 LET Review Hub. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _render_welcome_template(self, full_name: str, username: str) -> str:
        """Render HTML template for welcome email"""
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to LET Review Hub</title>
            <style>
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }}
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    padding: 40px 20px;
                    text-align: center;
                }}
                .header h1 {{
                    font-size: 28px;
                    margin-bottom: 10px;
                }}
                .content {{
                    padding: 40px 30px;
                }}
                .greeting {{
                    font-size: 16px;
                    color: #1f2937;
                    margin-bottom: 20px;
                }}
                .message {{
                    font-size: 14px;
                    color: #4b5563;
                    line-height: 1.6;
                    margin-bottom: 20px;
                }}
                .features {{
                    margin: 30px 0;
                }}
                .feature {{
                    display: flex;
                    gap: 10px;
                    margin: 15px 0;
                    font-size: 14px;
                    color: #4b5563;
                }}
                .feature-icon {{
                    font-size: 20px;
                    min-width: 25px;
                }}
                .cta-button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    padding: 12px 30px;
                    border-radius: 6px;
                    text-decoration: none;
                    font-weight: bold;
                    margin: 20px 0;
                    text-align: center;
                }}
                .footer {{
                    background: #f9fafb;
                    padding: 20px 30px;
                    border-top: 1px solid #e5e7eb;
                    font-size: 12px;
                    color: #6b7280;
                    text-align: center;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💡 LET Review Hub</h1>
                    <p>Welcome Aboard!</p>
                </div>
                
                <div class="content">
                    <div class="greeting">Hi {full_name},</div>
                    
                    <div class="message">
                        Welcome to <strong>LET Review Hub</strong>! Your account is now active and you're ready to start your LET exam preparation journey.
                    </div>
                    
                    <div class="message">
                        <strong>Your Account Details:</strong><br>
                        Username: <code>{username}</code>
                    </div>
                    
                    <div class="features">
                        <div class="feature">
                            <div class="feature-icon">📚</div>
                            <div>Access comprehensive GenEd & ProfEd study materials</div>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">🎯</div>
                            <div>Create personalized study plans tailored to your exam date</div>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">✅</div>
                            <div>Track your progress with detailed analytics</div>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">🏆</div>
                            <div>Join thousands of successful LET exam takers</div>
                        </div>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="{FRONTEND_ORIGIN}/dashboard" class="cta-button">Start Studying Now</a>
                    </div>
                </div>
                
                <div class="footer">
                    <p>If you have any questions, please don't hesitate to contact our support team.</p>
                    <p style="margin-top: 10px;">© 2026 LET Review Hub. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _render_password_reset_success_template(self, full_name: str) -> str:
        """Render HTML template for password reset success email"""
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset Successful</title>
            <style>
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }}
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    padding: 40px 20px;
                    text-align: center;
                }}
                .header h1 {{
                    font-size: 28px;
                    margin-bottom: 10px;
                }}
                .content {{
                    padding: 40px 30px;
                }}
                .greeting {{
                    font-size: 16px;
                    color: #1f2937;
                    margin-bottom: 20px;
                }}
                .message {{
                    font-size: 14px;
                    color: #4b5563;
                    line-height: 1.6;
                    margin-bottom: 30px;
                }}
                .success-box {{
                    background: #dcfce7;
                    border: 2px solid #86efac;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin: 30px 0;
                }}
                .success-message {{
                    font-size: 16px;
                    font-weight: bold;
                    color: #15803d;
                }}
                .footer {{
                    background: #f9fafb;
                    padding: 20px 30px;
                    border-top: 1px solid #e5e7eb;
                    font-size: 12px;
                    color: #6b7280;
                    text-align: center;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ LET Review Hub</h1>
                    <p>Password Reset Successful</p>
                </div>
                
                <div class="content">
                    <div class="greeting">Hi {full_name},</div>
                    
                    <div class="success-box">
                        <div class="success-message">✓ Your password has been successfully reset</div>
                    </div>
                    
                    <div class="message">
                        Your LET Review Hub account password has been changed. You can now log in with your new password.
                    </div>
                    
                    <div class="message">
                        If you didn't make this change or suspect unauthorized access to your account, please reset your password again immediately or contact our support team.
                    </div>
                </div>
                
                <div class="footer">
                    <p>© 2026 LET Review Hub. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """


# Create singleton instance
email_service = EmailService()
