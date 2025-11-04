import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { PacientesService, Paciente } from '../../services/pacientes.service';
import { EmpleadosService, Empleado } from '../../services/empleados.service';
import { EstadisticasService } from '../../services/estadisticas.service';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../toast/toast.component';
import { slideFromBottomAnimation, fadeInAnimation } from '../../animations/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatProgressSpinnerModule, ToastComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [slideFromBottomAnimation, fadeInAnimation]
})
export class LoginComponent implements OnInit {

  fb = new FormBuilder();
  loading = false;

  // URLs de imágenes desde la base de datos
  imagenesUsuarios = {
    ana: 'https://randomuser.me/api/portraits/women/32.jpg', // fallback
    carlos: 'https://randomuser.me/portraits/men/32.jpg', // fallback
    maria: 'https://randomuser.me/api/portraits/women/68.jpg', // fallback
    rodriguez: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face', // fallback
    martinez: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face', // fallback
    admin: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' // fallback
  };

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  get f() { return this.loginForm.controls; }

  constructor(
    private pacientesService: PacientesService,
    private empleadosService: EmpleadosService,
    private estadisticasService: EstadisticasService,
    private router: Router,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    await this.cargarImagenesDesdeBaseDatos();
  }

  async cargarImagenesDesdeBaseDatos() {
    try {
      // Cargar pacientes
      const pacientes = await this.pacientesService.obtenerTodos();
      
      // Buscar Ana García
      const ana = pacientes.find((p: Paciente) => 
        p.email === 'ana@gmail.com' && p.foto1 && p.foto1.trim() !== ''
      );
      if (ana && ana.foto1) {
        this.imagenesUsuarios.ana = ana.foto1;
      }

      // Buscar Carlos López
      const carlos = pacientes.find((p: Paciente) => 
        p.email === 'carlos@gmail.com' && p.foto1 && p.foto1.trim() !== ''
      );
      if (carlos && carlos.foto1) {
        this.imagenesUsuarios.carlos = carlos.foto1;
      }

      // Buscar María Silva
      const maria = pacientes.find((p: Paciente) => 
        p.email === 'maria@gmail.com' && p.foto1 && p.foto1.trim() !== ''
      );
      if (maria && maria.foto1) {
        this.imagenesUsuarios.maria = maria.foto1;
      }

      // Cargar empleados
      const empleados = await this.empleadosService.obtenerTodos();

      // Buscar Dr. Rodríguez
      const rodriguez = empleados.find((e: Empleado) => 
        e.email === 'rodriguez@gmail.com' && e.imagenPerfil && e.imagenPerfil.trim() !== ''
      );
      if (rodriguez && rodriguez.imagenPerfil) {
        this.imagenesUsuarios.rodriguez = rodriguez.imagenPerfil;
      }

      // Buscar Dra. Martínez
      const martinez = empleados.find((e: Empleado) => 
        e.email === 'martinez@gmail.com' && e.imagenPerfil && e.imagenPerfil.trim() !== ''
      );
      if (martinez && martinez.imagenPerfil) {
        this.imagenesUsuarios.martinez = martinez.imagenPerfil;
      }

      // Buscar Admin
      const admin = empleados.find((e: Empleado) => 
        e.email === 'a@gmail.com' && e.imagenPerfil && e.imagenPerfil.trim() !== ''
      );
      if (admin && admin.imagenPerfil) {
        this.imagenesUsuarios.admin = admin.imagenPerfil;
      }

    } catch (error) {
      console.error('Error cargando imágenes desde la base de datos:', error);
      // Se mantienen las imágenes fallback ya definidas
    }
  }

  private async navigateWithSpinner(target: string): Promise<void> {
    this.loading = true;
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        void this.router.navigate([target]).finally(() => {
          this.loading = false;
          resolve();
        });
      }, 3000);
    });
  }

  /**
   * Registra el ingreso del usuario en las estadísticas
   */
  private async registrarIngresoUsuario(usuario: Paciente | Empleado, tipo: 'paciente' | 'especialista' | 'administrador'): Promise<void> {
    try {
      const usuarioLog = {
        id: usuario.id?.toString() || '',
        email: usuario.email || '',
        nombre: usuario.nombre || '',
        tipo: tipo
      };

      await this.estadisticasService.registrarIngreso(usuarioLog).toPromise();
      console.log('Ingreso registrado exitosamente para:', usuario.email);
    } catch (error) {
      console.error('Error al registrar ingreso en estadísticas:', error);
      // No interrumpimos el flujo de login por un error en estadísticas
    }
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toastService.error('⚠️ Por favor, completá todos los campos correctamente.');
      return;
    }
    
    this.loading = true;

    const { email: rawEmail, password: rawPassword } = this.loginForm.value;
    const email: string = rawEmail || '';
    const password: string = rawPassword || '';

    try {
      // Limpiar cualquier sesión previa
      this.pacientesService.logout();
      this.empleadosService.logout();
      
      // Buscar en pacientes
      const paciente: Paciente | null = await this.pacientesService.login(email, password);

      if (paciente) {
        // Verifico que el mail esté verificado
        if (paciente.emailVerificado == null) {
          this.toastService.warning('📧 Tu cuenta no fue verificada por mail. Revisá tu correo.');
          this.loading = false;
          return;
        }

        // Asegurar que empleados esté limpio cuando es paciente
        this.empleadosService.logout();
        
        // Guardar en localStorage
        localStorage.setItem('currentUser', JSON.stringify(paciente));
        
        // Registrar ingreso en estadísticas
        await this.registrarIngresoUsuario(paciente, 'paciente');
        
        this.toastService.success(`🏥 Bienvenido paciente ${paciente.nombre}`);
        // Redirigir al panel de turnos del paciente
        await this.navigateWithSpinner('/mis-turnos');
        return;
      }

      // Buscar en especialistas
      const empleado: Empleado | null = await this.empleadosService.login(email, password);

      if (empleado) {
        // Validar ambas condiciones
        if (empleado.emailVerificado == null) {
          this.toastService.warning('📧 Tu cuenta de especialista no fue verificada por mail.');
          this.loading = false;
          return;
        }

        if (!empleado.aprobado) {
          this.toastService.warning('⏳ Tu cuenta aún no fue aprobada por el administrador.');
          this.loading = false;
          return;
        }

        // Asegurar que pacientes esté limpio cuando es empleado
        this.pacientesService.logout();

        // Guardar en localStorage
        localStorage.setItem('currentUser', JSON.stringify(empleado));

        // Determinar tipo de usuario y registrar ingreso
        const tipoUsuario = empleado.especialidad?.toLowerCase() === 'administrador' ? 'administrador' : 'especialista';
        await this.registrarIngresoUsuario(empleado, tipoUsuario);

        if (empleado.especialidad?.toLowerCase() === 'administrador') {
            this.toastService.success(`👨‍💼 Bienvenido administrador ${empleado.nombre}`);
            await this.navigateWithSpinner('/panel-admin');
        } else {
            this.toastService.success(`👨‍⚕️ Bienvenido especialista ${empleado.nombre}`);
            await this.navigateWithSpinner('/turnos-especialista');
        }
       
        return;
      }

      this.toastService.error('🔐 Usuario o contraseña incorrecta');

    } catch (error) {
      console.error(error);
      this.toastService.error('⚠️ Error al iniciar sesión');
    } finally {
      this.loading = false;
    }
  }


  // Acceso rápido
  loginRapido(email: string, password: string) {
    this.loginForm.patchValue({ email, password });
  }

  // Método para manejar errores de imagen
  onImageError(event: any, fallbackText: string) {
    const img = event.target;
    img.style.display = 'none';
    
    // Crear div de fallback si no existe
    let fallback = img.nextElementSibling;
    if (!fallback || !fallback.classList.contains('avatar-fallback')) {
      fallback = document.createElement('div');
      fallback.classList.add('avatar-fallback');
      fallback.textContent = fallbackText;
      img.parentNode?.insertBefore(fallback, img.nextSibling);
    }
  }

  // Método para volver al welcome
  async volver() {
    await this.navigateWithSpinner('/welcome');
  }

}
