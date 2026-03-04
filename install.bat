@echo off
echo === Task Tracker CLI Installer ===
echo.

REM 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed.
    echo Install it from https://nodejs.org/ and try again.
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo Node.js found: %%v

REM 2. Install local dependencies
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: npm install failed.
    exit /b 1
)

REM 3. Install globally
echo Installing tt globally...
call npm install -g .
if %errorlevel% neq 0 (
    echo Error: global install failed.
    exit /b 1
)

REM 4. Verify tt is on PATH
where tt >nul 2>nul
if %errorlevel% equ 0 (
    echo.
    echo Success! tt is installed and available on your PATH.
    echo Try running: tt today
) else (
    REM 5. Print PATH instructions
    for /f "tokens=*" %%p in ('npm prefix -g') do set NPM_PREFIX=%%p
    echo.
    echo tt was installed but is not on your PATH.
    echo Add the following directory to your system PATH:
    echo.
    echo   %NPM_PREFIX%
    echo.
    echo To do this: Settings ^> System ^> About ^> Advanced system settings
    echo   ^> Environment Variables ^> Edit PATH ^> Add the directory above.
    echo Then restart your terminal.
)
