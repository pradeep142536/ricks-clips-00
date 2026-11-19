@echo off
title Push to GitHub Actions Renderer
echo ========================================================
echo   Rick's Clips - Push to GitHub Cloud Renderer
echo ========================================================
echo.
echo 1. Go to https://github.com/new and create a new repository.
echo    (Name it anything, e.g. "ricks-clips-render". Private or Public is fine).
echo.
echo 2. Copy the repository URL (e.g. https://github.com/YOUR_USER/ricks-clips-render.git).
echo.
set /p REPO_URL="Paste your GitHub repository URL here: "
if "%REPO_URL%"=="" goto end

cd /d "%~dp0"
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
echo.
echo Pushing project to GitHub...
git push -u origin main
echo.
echo ========================================================
echo   SUCCESS! Pushed to GitHub.
echo.
echo   Now open your repository on GitHub:
echo   1. Click on the "Actions" tab.
echo   2. Click "Render Full Episode".
echo   3. Click "Run workflow" -> "Run workflow".
echo.
echo   You can now close your browser and turn off your PC!
echo   When finished, download the video from the Actions tab.
echo ========================================================
pause
:end
