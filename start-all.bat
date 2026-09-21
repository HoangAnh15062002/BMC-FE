@echo off
chcp 65001 > nul
title BMC Construction ERP - Trình Khởi Động Hệ Thống

echo ============================================================
echo   🚀 KHỞI ĐỘNG HỆ THỐNG BMC CONSTRUCTION ENTERPRISE ERP
echo ============================================================
echo.

:: 1. Kiểm tra dịch vụ SQL Server
echo [1/3] Đang kiểm tra cơ sở dữ liệu SQL Server...
sc query "MSSQL$SQLEXPRESS" | find "RUNNING" > nul
if %ERRORLEVEL% equ 0 (
    echo  -> SQL Server SQLEXPRESS đang hoạt động.
) else (
    echo  -> Đang khởi động SQL Server...
    net start "MSSQL$SQLEXPRESS" > nul 2>&1
)

:: 2. Khởi động Backend API (.NET 9)
echo.
echo [2/3] Đang khởi động Backend API (.NET 9) tại http://localhost:5191...
start "BMC Backend API (Port 5191)" cmd /k "cd /d D:\PHANMEMBMC\BMC-BE && dotnet run --project BMC.Api\BMC.Api.csproj --launch-profile http"

:: 3. Khởi động Frontend (React / Vite)
echo.
echo [3/3] Đang khởi động Frontend Web tại http://localhost:5173...
start "BMC Frontend Web (Port 5173)" cmd /k "cd /d D:\PHANMEMBMC\BMC-FE && npm run dev"

:: Chờ 3 giây rồi mở trình duyệt
timeout /t 3 /nobreak > nul
echo.
echo ============================================================
echo  ✅ HỆ THỐNG ĐÃ SẴN SÀNG!
echo  👉 Web App:    http://localhost:5173
echo  👉 API Server: http://localhost:5191
echo  👉 Tài khoản:  admin / Admin@123
echo ============================================================
echo.
start http://localhost:5173
