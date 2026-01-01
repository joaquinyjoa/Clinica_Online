# 🏥 Clínica Online - Sistema de Gestión de Turnos Médicos

[![Angular](https://img.shields.io/badge/Angular-17+-red.svg)](https://angular.io/)
[![Firebase](https://img.shields.io/badge/Firebase-hosting-orange.svg)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green.svg)](https://supabase.com/)

## 📋 Descripción

**Clínica Online** es una plataforma web moderna y completa para la gestión de turnos médicos. Permite a pacientes, especialistas y administradores interactuar de manera eficiente en un entorno digital seguro y fácil de usar.

### 🚀 [Ver Demo en Vivo](https://clinica-online-6537c.web.app)

---

## ✨ Características Principales

### 👥 **Gestión de Usuarios Multi-Rol**
- **Pacientes**: Solicitud y gestión de turnos
- **Especialistas**: Administración de horarios y consultas
- **Administradores**: Control total del sistema

### 📅 **Sistema de Turnos Inteligente**
- Reserva de turnos en 3 pasos intuitivos
- Validación en tiempo real de disponibilidad
- Integración con horarios de especialistas
- Prevención de dobles reservas

### 🔐 **Seguridad y Autenticación**
- Sistema de login seguro
- Validación de roles y permisos
- Protección de rutas sensibles

---

## 🖼️ Capturas de Pantalla

### 🏠 Pantalla de Bienvenida
*Interfaz principal que da la bienvenida a los usuarios*

![Pantalla de Bienvenida](./screenshots/welcome.png)

### 🔑 Sistema de Autenticación
*Login y registro de usuarios con validación*

![Login](./screenshots/login.png)

### 👤 Registro de Pacientes
*Proceso de registro para nuevos pacientes*

![Registro Paciente - Paso 1](./screenshots/registro_paciente_1.png)
![Registro Paciente - Paso 2](./screenshots/registro_paciente_2.png)

### 👨‍⚕️ Registro de Especialistas
*Proceso de registro para profesionales médicos*

![Registro Especialista - Paso 1](./screenshots/registro_especialista_1.png)
![Registro Especialista - Paso 2](./screenshots/registro_especialista_2.png)

### 📅 Solicitar Turno
*Sistema intuitivo para reservar citas médicas en 3 pasos*

![Solicitar Turno - Paso 1](./screenshots/solicitarTurno1.png)
![Solicitar turno - Paso 2](./screenshots/solicitarTurno2.png)
![Solicitar turno - Paso 3](./screenshots/solicitarTurno3.png)

### 📅 Solicitar Turno Administrador
*Sistema intuitivo para reservar citas médicas en 3 pasos*
![Solicitar Turno Administrador - Paso 1](./screenshots/solicitarTurno_admin_parte1.png)
![Solicitar turno Administrador - Paso 2](./screenshots/solicitarTurno_admin_parte2.pn)
![Solicitar turno Administrador - Paso 3](./screenshots/solicitarTurno_admin_parte3.png)
![Solicitar turno Administrador - Paso 4](./screenshots/solicitarTurno_admin_parte4.png)
![Solicitar turno Administrador - Paso 5](./screenshots/solicitarTurno_admin_parte5.png)

### 👤 Panel de Pacientes - Mis Turnos
*Vista completa de turnos para pacientes con filtros avanzados*

![Mis Turnos - Paciente](./screenshots/paciente_mis_turnos.png)
![Filtros Avanzados - Paciente](./screenshots/historias_busqueda_avanzada.png)

### 👤 Panel de Pacientes - Mi Perfil
*Datos de la persona y modiicable*
![Mi perfil parte 1](./screenshots/mi_perfil_parte1.png)
![Filtros Avanzados - Paciente](./screenshots/mi_perfil_parte2.png)

### 👨‍⚕️ Panel de Especialistas
*Gestión completa de turnos y pacientes para especialistas*

![Panel Especialista - Turnos](./screenshots/mis_turnos_especialistas.png)
![Especialista - Gestión Horarios](./screenshots/mi_perfil_especialista_parte2.png)
![Especialista - Historia Clínica](./screenshots/historia_clinica_especialista_parte1.png)
![Especialista - Historia Clínica parte 2](./screenshots/historia_clinica_especialista_parte2.png)
![Especialista - Mi Perfil](./screenshots/mi_perfil_especialista_parte1.png)
![Especialista - Mi Perfil parte 2](./screenshots/mi_perfil_especialista_parte2.png)
![Especialista - Mi Perfil parte 3](./screenshots/mi_perfil_especialista_parte3.png)

### 👨‍💼 Panel de Administrador
*Control total del sistema para administradores*

![Admin - Ver Administradores](./screenshots/admin_filtro_admin_parte1.png)
![Admin - Alta de Administradores](./screenshots/admin_filtro_admin_parte2.png)
![Admin - Ver Especialistas](./screenshots/admin_filtro_especialistas_parte1.png)
![Admin - Alta de Especialistas](./screenshots/admin_filtro_especialistas_parte2.png)
![Admin - Ver Pacientes](./screenshots/admin_filtro_pacientes_parte1.png)
![Admin - Alta de Pacientes](./screenshots/admin_filtro_pacientes_parte2.png)
![Admin - Estadísticas](./screenshots/estadistica_admin_parte1.png)
![Admin - Estadísticas parte 2](./screenshots/estadistica_admin_parte2.png)
![Admin - Turnos Globales](./screenshots/gestion_turnos_admin.png)

---

## 🎯 Funcionalidades Detalladas por Rol

### 👤 **Panel de Pacientes**

#### 📋 **Mis Turnos**
- ✅ **Vista completa** de todos los turnos (pendientes, realizados, cancelados)
- ✅ **Filtros avanzados** por especialidad, especialista, estado y fecha
- ✅ **Acciones disponibles**: Cancelar, calificar atención, completar encuesta
- ✅ **Historial clínico** completo con datos médicos detallados
- ✅ **Estados dinámicos** con colores intuitivos

#### 🩺 **Solicitar Turno**
- ✅ **Flujo de 3 pasos** optimizado y guiado
- ✅ **Selección de especialidad** con disponibilidad en tiempo real
- ✅ **Calendario inteligente** que muestra solo fechas disponibles
- ✅ **Confirmación automática** por email

#### 👤 **Mi Perfil**
- ✅ **Datos personales** editables
- ✅ **Historial médico** completo
- ✅ **Fotos de perfil** actualizables

---

### 👨‍⚕️ **Panel de Especialistas**

#### 📅 **Gestión de Turnos**
- ✅ **Vista calendario** con todos los turnos asignados
- ✅ **Filtros por estado**: pendientes, realizados, cancelados
- ✅ **Acciones**: Aceptar, rechazar, finalizar consulta
- ✅ **Comentarios médicos** para cada turno

#### 🕐 **Configuración de Horarios**
- ✅ **Horarios flexibles** por día de la semana
- ✅ **Disponibilidad mañana/tarde** configurable
- ✅ **Bloques de tiempo** personalizables

#### 📋 **Historia Clínica**
- ✅ **Creación de registros** médicos detallados
- ✅ **Campos dinámicos** personalizables
- ✅ **Datos vitales**: altura, peso, presión, temperatura
- ✅ **Diagnósticos y tratamientos**

#### 👨‍⚕️ **Mi Perfil Profesional**
- ✅ **Especialidades múltiples**
- ✅ **Datos profesionales** actualizables
- ✅ **Estado de aprobación** visible

---

### 👨‍💼 **Panel de Administrador**

#### 👥 **Gestión de Usuarios**
- ✅ **CRUD completo** de pacientes, especialistas y administradores
- ✅ **Validación de duplicados** automática
- ✅ **Aprobación de especialistas** con un clic
- ✅ **Verificación de emails** manual

#### 📊 **Estadísticas y Reportes**
- ✅ **Dashboard completo** con métricas clave
- ✅ **Gráficos interactivos** de turnos por especialidad
- ✅ **Exportación a Excel** de datos de usuarios
- ✅ **Reportes de ingresos** por fecha
- ✅ **Filtros avanzados** por período y especialista

#### 🏥 **Gestión Global de Turnos**
- ✅ **Vista completa** de todos los turnos del sistema
- ✅ **Cancelación masiva** con motivos
- ✅ **Creación de turnos** para cualquier paciente
- ✅ **Filtros múltiples** por todos los campos

#### 📄 **Exportación de Datos**
- ✅ **Historias clínicas en PDF** por paciente
- ✅ **Datos de usuarios en Excel**
- ✅ **Reportes personalizados**

---

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- ![Angular](https://img.shields.io/badge/Angular-DD0031?style=flat&logo=angular&logoColor=white) **Angular 17+** - Framework principal
- ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white) **TypeScript** - Lenguaje de programación
- ![SCSS](https://img.shields.io/badge/SCSS-CC6699?style=flat&logo=sass&logoColor=white) **SCSS** - Estilos avanzados
- ![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=flat&logo=bootstrap&logoColor=white) **Bootstrap** - Framework CSS

### **Backend & Base de Datos**
- ![Supabase](https://img.shields.io/badge/Supabase-181818?style=flat&logo=supabase&logoColor=white) **Supabase** - Base de datos PostgreSQL
- ![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=flat&logo=firebase&logoColor=white) **Firebase Hosting** - Alojamiento web

### **Herramientas de Desarrollo**
- ![Git](https://img.shields.io/badge/Git-F05032?style=flat&logo=git&logoColor=white) **Git** - Control de versiones
- ![VSCode](https://img.shields.io/badge/VS_Code-0078D4?style=flat&logo=visual%20studio%20code&logoColor=white) **VS Code** - Editor de código
- ![npm](https://img.shields.io/badge/npm-CB3837?style=flat&logo=npm&logoColor=white) **npm** - Gestor de paquetes

---

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Node.js (v18 o superior)
- npm
- Angular CLI
- Firebase CLI
- Cuenta de Supabase

### **Pasos de Instalación**

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/joaquinyjoa/Clinica_Online.git
   cd Clinica_Online/clinica
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Crear archivo de configuración de Firebase
   # Configurar credenciales de Supabase en services/supabase.service.ts
   ```

4. **Ejecutar en modo desarrollo**
   ```bash
   ng serve
   ```
   La aplicación estará disponible en `http://localhost:4200`

5. **Compilar para producción**
   ```bash
   ng build
   ```

6. **Desplegar en Firebase**
   ```bash
   firebase login
   firebase deploy
   ```

---

## 📱 Resumen de Funcionalidades

### 👤 **Pacientes**
- ✅ Registro y login seguro con validación dual
- ✅ Solicitar turnos en flujo de 3 pasos intuitivo
- ✅ Gestión completa de turnos con filtros avanzados
- ✅ Acceso a historial clínico detallado
- ✅ Sistema de calificación y encuestas

### 👨‍⚕️ **Especialistas**
- ✅ Panel de gestión de turnos con calendario
- ✅ Configuración flexible de horarios de atención
- ✅ Creación de historias clínicas completas
- ✅ Gestión de múltiples especialidades
- ✅ Sistema de aprobación profesional

### 👨‍💼 **Administradores**
- ✅ Control total de usuarios del sistema
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Exportación de datos en múltiples formatos
- ✅ Gestión global de turnos y especialistas
- ✅ Sistema de reportes avanzados

> 📋 **Ver funcionalidades detalladas** en la sección [Funcionalidades Detalladas por Rol](#-funcionalidades-detalladas-por-rol)

---

---


## 👨‍💻 Desarrollador

**Joaquín**
- GitHub: [@joaquinyjoa](https://github.com/joaquinyjoa)
- Email: joaquinalfredogreco@gmail.com

