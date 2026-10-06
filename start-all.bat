@echo off
chcp 65001 > nul
title BMC Construction ERP - Trinh Khoi Dong He Thong

echo ============================================================
echo   [BMC] KHOI DONG HE THONG BMC CONSTRUCTION ERP
echo ============================================================
echo.

:: 1. Kiem tra SQL Server
echo [1/3] Kiem tra co so du lieu SQL Server...
sc query "MSSQL$SQLEXPRESS" | find "RUNNING" > nul
if %ERRORLEVEL% equ 0 (
    echo  -^> SQL Server SQLEXPRESS dang hoat dong.
) else (
    echo  -^> Dang khoi dong SQL Server...
    net start "MSSQL$SQLEXPRESS" > nul 2>&1
)

:: 2. Khoi dong Backend API (.NET 9)
echo.
echo [2/3] Dang khoi dong Backend API (.NET 9) tai http://localhost:5191...
start "BMC Backend API (Port 5191)" cmd /k "cd /d D:\PHANMEMBMC\BMC-BE && dotnet run --project BMC.Api\BMC.Api.csproj --launch-profile http"

:: 3. Khoi dong Frontend (React / Vite)
echo.
echo [3/3] Dang khoi dong Frontend Web tai http://localhost:5173...
start "BMC Frontend Web (Port 5173)" cmd /k "cd /d D:\PHANMEMBMC\BMC-FE && npm run dev"

ping 127.0.0.1 -n 4 > nul
echo.
echo ============================================================
echo  HE THONG DA DUOC KHOI DONG!
echo  - Web App:    http://localhost:5173
echo  - API Server: http://localhost:5191
echo  - Tai khoan:  admin / Admin@123
echo ============================================================
echo.
start http://localhost:5173
