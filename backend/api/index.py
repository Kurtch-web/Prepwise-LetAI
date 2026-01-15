"""
Vercel serverless function entry point for FastAPI
This file allows FastAPI to run on Vercel's Python runtime
"""
import sys
from pathlib import Path

# Add parent directory to path so we can import the app
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app

# Export the app for Vercel
__all__ = ['app']
