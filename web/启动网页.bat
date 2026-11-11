@echo off
cd /d "%~dp0"
py -3 website-source/c09-viewer/serve.py --port 8809 --open
pause
