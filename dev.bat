@echo off
start /B python backend/main.py
cd frontend
npm run dev
