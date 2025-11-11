import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  
  constructor(private router: Router) {}

  /**
   * Navega a una ruta con un spinner de 3 segundos
   * @param target - La ruta de destino
   * @param setLoading - Función para controlar el estado de loading del componente
   */
  navigateWithSpinner(target: string, setLoading: (loading: boolean) => void): void {
    setLoading(true);
    
    // Espera 3 segundos para mostrar el spinner
    setTimeout(() => {
      this.router.navigate([target]).finally(() => {
        setLoading(false);
      });
    }, 3000);
  }

  /**
   * Navega inmediatamente sin spinner (para botones de volver/home)
   * @param target - La ruta de destino
   */
  navigateImmediately(target: string): void {
    this.router.navigate([target]);
  }
}