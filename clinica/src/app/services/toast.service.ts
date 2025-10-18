import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new BehaviorSubject<ToastMessage[]>([]);
  public toasts$ = this.toastSubject.asObservable();

  constructor() { }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private addToast(toast: ToastMessage): void {
    const currentToasts = this.toastSubject.value;
    this.toastSubject.next([...currentToasts, toast]);

    // Auto remove toast after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        this.removeToast(toast.id);
      }, toast.duration || 5000);
    }
  }

  // Métodos públicos para mostrar diferentes tipos de toast
  success(message: string, duration: number = 4000): void {
    this.addToast({
      id: this.generateId(),
      message,
      type: 'success',
      duration,
      icon: '✅'
    });
  }

  error(message: string, duration: number = 6000): void {
    this.addToast({
      id: this.generateId(),
      message,
      type: 'error',
      duration,
      icon: '❌'
    });
  }

  warning(message: string, duration: number = 5000): void {
    this.addToast({
      id: this.generateId(),
      message,
      type: 'warning',
      duration,
      icon: '⚠️'
    });
  }

  info(message: string, duration: number = 4000): void {
    this.addToast({
      id: this.generateId(),
      message,
      type: 'info',
      duration,
      icon: 'ℹ️'
    });
  }

  // Métodos específicos para la clínica médica
  emailDuplicado(): void {
    this.error('📧 Este email ya está registrado en el sistema. Por favor, utilice otro email.', 6000);
  }

  dniDuplicado(): void {
    this.error('🆔 Este DNI ya está registrado en el sistema. Verifique el número ingresado.', 6000);
  }

  passwordDuplicado(): void {
    this.error('🔒 Esta contraseña ya está en uso. Por seguridad, elija una contraseña diferente.', 6000);
  }

  especialidadAdministrador(): void {
    this.error('👨‍💼 No puede registrarse como "Administrador" desde este formulario. Use el registro de especialista.', 6000);
  }

  cuentaCreada(tipoUsuario: string, nombre: string): void {
    let mensaje = '';
    let icono = '';
    
    switch (tipoUsuario.toLowerCase()) {
      case 'paciente':
        icono = '👤';
        mensaje = `¡Cuenta de paciente creada exitosamente! Bienvenido/a ${nombre} 🏥`;
        break;
      case 'especialista':
        icono = '👨‍⚕️';
        mensaje = `¡Cuenta de especialista creada! Dr./Dra. ${nombre}, su cuenta está pendiente de aprobación 📋`;
        break;
      case 'administrador':
        icono = '👨‍💼';
        mensaje = `¡Cuenta de administrador creada! Bienvenido/a ${nombre} al sistema médico 🏥`;
        break;
      default:
        icono = '✅';
        mensaje = `¡Cuenta creada exitosamente! Bienvenido/a ${nombre}`;
    }

    this.success(`${icono} ${mensaje}`, 5000);
  }

  removeToast(id: string): void {
    const currentToasts = this.toastSubject.value;
    this.toastSubject.next(currentToasts.filter(toast => toast.id !== id));
  }

  clearAll(): void {
    this.toastSubject.next([]);
  }
}