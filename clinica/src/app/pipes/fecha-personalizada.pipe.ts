import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fechaPersonalizada',
  standalone: true
})
export class FechaPersonalizadaPipe implements PipeTransform {
  transform(value: Date | string): string {
    if (!value) return '';
    
    const fecha = new Date(value);
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return fecha.toLocaleDateString('es-ES', opciones);
  }
}