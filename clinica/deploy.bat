@echo off
echo ========================================
echo    DESPLEGANDO CLINICA ONLINE
echo ========================================

echo 1. Limpiando builds anteriores...
if exist "dist" rmdir /s /q dist
echo    - Carpeta dist eliminada

echo.
echo 2. Construyendo la aplicacion Angular...
call ng build --configuration=production
if %errorlevel% neq 0 (
    echo ERROR: Fallo en el build de Angular
    pause
    exit /b 1
)

echo.
echo 3. Verificando archivos generados...
if exist "dist\clinica\browser\index.html" (
    echo    - ✓ index.html encontrado
    dir "dist\clinica\browser" /w
) else (
    echo    - ✗ ERROR: No se encontraron archivos compilados
    pause
    exit /b 1
)

echo.
echo 4. Desplegando a Firebase Hosting...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo ERROR: Fallo en el deploy de Firebase
    pause
    exit /b 1
)

echo.
echo ========================================
echo    ✓ DESPLIEGUE COMPLETADO EXITOSAMENTE
echo ========================================
echo Tu aplicacion esta disponible en:
echo https://clinica-online-6537c.web.app/

pause