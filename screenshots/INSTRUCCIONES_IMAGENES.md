# 📸 Cómo Agregar Imágenes al README

## 🎯 Objetivo
Capturar y subir imágenes de tu aplicación para mostrar en el README de GitHub.

## 📋 Lista de Imágenes Necesarias

Toma capturas de pantalla de las siguientes pantallas y guárdalas con estos nombres exactos:

### 🏠 **Pantalla Principal**
- `welcome.png` - Página de bienvenida

### 🔑 **Autenticación**
- `login.png` - Pantalla de login
- `register.png` - Pantalla de registro

### 📅 **Solicitar Turno (3 pasos)**
- `paso1-profesional.png` - Selección de profesional
- `paso2-especialidad.png` - Selección de especialidad  
- `paso3-fecha-hora.png` - Selección de fecha y hora

### 👨‍⚕️ **Paneles de Usuario**
- `panel-especialista.png` - Vista del especialista
- `panel-admin.png` - Panel de administración
- `mis-turnos.png` - Vista de turnos del paciente

## 🛠️ Pasos para Agregar las Imágenes

### **Método 1: Usando la carpeta screenshots/ (Recomendado)**

1. **Tomar las capturas:**
   - Abre tu aplicación en: https://clinica-online-6537c.web.app
   - Navega por cada pantalla
   - Toma capturas de pantalla (Windows: `Win + Shift + S`)

2. **Guardar las imágenes:**
   - Guarda cada imagen en la carpeta `screenshots/` con los nombres exactos listados arriba
   - Formato recomendado: PNG o JPG
   - Resolución: 1200-1500px de ancho máximo

3. **Subir al repositorio:**
   ```bash
   git add screenshots/
   git commit -m "📸 Agregar capturas de pantalla al README"
   git push origin main
   ```

### **Método 2: Usando GitHub Issues (Alternativo)**

1. Ve a tu repositorio en GitHub
2. Crea un nuevo Issue
3. Arrastra y suelta las imágenes en el campo de comentario
4. GitHub generará URLs automáticamente
5. Copia las URLs y reemplázalas en el README

## ✅ Verificación

Después de subir las imágenes:
1. Ve a tu repositorio en GitHub
2. Verifica que las imágenes se muestren correctamente en el README
3. Si alguna imagen no se ve, verifica la ruta y el nombre del archivo

## 🎨 Consejos para Mejores Capturas

- **Usa un navegador limpio** sin extensiones visibles
- **Captura en resolución alta** pero optimiza el tamaño
- **Muestra funcionalidades clave** en cada imagen
- **Mantén consistencia** en el estilo de las capturas
- **Evita información sensible** (datos personales reales)

## 🔄 Actualizar README

Si cambias los nombres de las imágenes, actualiza las rutas correspondientes en el README.md:

```markdown
![Nombre de la imagen](./screenshots/nombre-archivo.png)
```

---

*Una vez que tengas todas las imágenes, tu README se verá profesional y completo* ✨