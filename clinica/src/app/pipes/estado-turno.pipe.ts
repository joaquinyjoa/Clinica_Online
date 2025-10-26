import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estadoTurno',
  standalone: true
})
export class EstadoTurnoPipe implements PipeTransform {
  transform(estado: string): string {
    const estados: { [key: string]: string } = {
      'pendiente': '⏳ Pendiente',
      'confirmado': '✅ Confirmado',
      'cancelado': '❌ Cancelado',
      'realizado': '✔️ Realizado',
      'ausente': '❌ Ausente'
    };
    
    return estados[estado.toLowerCase()] || estado;
  }
}