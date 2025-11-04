import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { 
  EstadisticasService, 
  LogIngreso, 
  EstadisticaTurnos, 
  TurnosPorDia, 
  TurnosPorMedico 
} from '../../services/estadisticas.service';
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../toast/toast.component';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FechaPersonalizadaPipe } from '../../pipes/fecha-personalizada.pipe';
import { CapitalizarPipe } from '../../pipes/capitalizar.pipe';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-estadisticas',
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    ToastComponent,
    FechaPersonalizadaPipe,
    CapitalizarPipe
  ],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.scss'
})
export class Estadisticas implements OnInit {

  @ViewChild('especialidadChart', { static: false }) especialidadChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('diaChart', { static: false }) diaChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('solicitudosChart', { static: false }) solicitudosChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('finalizadosChart', { static: false }) finalizadosChart!: ElementRef<HTMLCanvasElement>;

  // Formularios para filtros de fecha
  filtroForm: FormGroup;
  
  // Datos para los gráficos
  logIngresos: LogIngreso[] = [];
  turnosPorEspecialidad: EstadisticaTurnos[] = [];
  turnosPorDia: TurnosPorDia[] = [];
  turnosSolicitadosPorMedico: TurnosPorMedico[] = [];
  turnosFinalizadosPorMedico: TurnosPorMedico[] = [];

  // Instancias de Chart.js
  chartEspecialidad?: Chart;
  chartDia?: Chart;
  chartSolicitados?: Chart;
  chartFinalizados?: Chart;

  // Estados de carga
  loading = false;
  loadingLogs = false;
  loadingEspecialidad = false;
  loadingDias = false;
  loadingSolicitados = false;
  loadingFinalizados = false;

  constructor(
    private estadisticasService: EstadisticasService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    // Inicializar formulario con fechas del mes actual
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    this.filtroForm = this.fb.group({
      fechaInicio: [this.formatDate(inicioMes)],
      fechaFin: [this.formatDate(finMes)]
    });
  }

  ngOnInit() {
    this.cargarTodasLasEstadisticas();
  }

  ngOnDestroy() {
    // Destruir gráficos para evitar memory leaks
    this.chartEspecialidad?.destroy();
    this.chartDia?.destroy();
    this.chartSolicitados?.destroy();
    this.chartFinalizados?.destroy();
  }

  /**
   * Carga todas las estadísticas con los filtros actuales
   */
  async cargarTodasLasEstadisticas() {
    this.loading = true;
    const { fechaInicio, fechaFin } = this.filtroForm.value;

    try {
      // Cargar datos en paralelo
      await Promise.all([
        this.cargarLogIngresos(fechaInicio, fechaFin),
        this.cargarTurnosPorEspecialidad(),
        this.cargarTurnosPorDia(fechaInicio, fechaFin),
        this.cargarTurnosSolicitadosPorMedico(fechaInicio, fechaFin),
        this.cargarTurnosFinalizadosPorMedico(fechaInicio, fechaFin)
      ]);

      this.toastService.success('📊 Estadísticas actualizadas correctamente');
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      this.toastService.error('❌ Error al cargar las estadísticas');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Carga el log de ingresos
   */
  private async cargarLogIngresos(fechaInicio: string, fechaFin: string) {
    this.loadingLogs = true;
    try {
      this.logIngresos = await this.estadisticasService.obtenerLogIngresos(fechaInicio, fechaFin).toPromise() || [];
    } catch (error) {
      console.error('Error cargando log de ingresos:', error);
    } finally {
      this.loadingLogs = false;
    }
  }

  /**
   * Carga estadísticas de turnos por especialidad
   */
  private async cargarTurnosPorEspecialidad() {
    this.loadingEspecialidad = true;
    try {
      this.turnosPorEspecialidad = await this.estadisticasService.obtenerTurnosPorEspecialidad().toPromise() || [];
      setTimeout(() => this.crearGraficoEspecialidad(), 100);
    } catch (error) {
      console.error('Error cargando turnos por especialidad:', error);
    } finally {
      this.loadingEspecialidad = false;
    }
  }

  /**
   * Carga estadísticas de turnos por día
   */
  private async cargarTurnosPorDia(fechaInicio: string, fechaFin: string) {
    this.loadingDias = true;
    try {
      this.turnosPorDia = await this.estadisticasService.obtenerTurnosPorDia(fechaInicio, fechaFin).toPromise() || [];
      setTimeout(() => this.crearGraficoDias(), 100);
    } catch (error) {
      console.error('Error cargando turnos por día:', error);
    } finally {
      this.loadingDias = false;
    }
  }

  /**
   * Carga estadísticas de turnos solicitados por médico
   */
  private async cargarTurnosSolicitadosPorMedico(fechaInicio: string, fechaFin: string) {
    this.loadingSolicitados = true;
    try {
      this.turnosSolicitadosPorMedico = await this.estadisticasService.obtenerTurnosSolicitadosPorMedico(fechaInicio, fechaFin).toPromise() || [];
      setTimeout(() => this.crearGraficoSolicitados(), 100);
    } catch (error) {
      console.error('Error cargando turnos solicitados por médico:', error);
    } finally {
      this.loadingSolicitados = false;
    }
  }

  /**
   * Carga estadísticas de turnos finalizados por médico
   */
  private async cargarTurnosFinalizadosPorMedico(fechaInicio: string, fechaFin: string) {
    this.loadingFinalizados = true;
    try {
      this.turnosFinalizadosPorMedico = await this.estadisticasService.obtenerTurnosFinalizadosPorMedico(fechaInicio, fechaFin).toPromise() || [];
      setTimeout(() => this.crearGraficoFinalizados(), 100);
    } catch (error) {
      console.error('Error cargando turnos finalizados por médico:', error);
    } finally {
      this.loadingFinalizados = false;
    }
  }

  // ========== CREACIÓN DE GRÁFICOS ==========

  /**
   * Crea gráfico circular de turnos por especialidad
   */
  private crearGraficoEspecialidad() {
    if (!this.especialidadChart?.nativeElement || this.turnosPorEspecialidad.length === 0) return;

    this.chartEspecialidad?.destroy();

    const ctx = this.especialidadChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: this.turnosPorEspecialidad.map(item => item.especialidad),
        datasets: [{
          data: this.turnosPorEspecialidad.map(item => item.cantidad),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Distribución de Turnos por Especialidad'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    };

    this.chartEspecialidad = new Chart(ctx, config);
  }

  /**
   * Crea gráfico de líneas de turnos por día
   */
  private crearGraficoDias() {
    if (!this.diaChart?.nativeElement || this.turnosPorDia.length === 0) return;

    this.chartDia?.destroy();

    const ctx = this.diaChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.turnosPorDia.map(item => item.fecha),
        datasets: [{
          label: 'Turnos por día',
          data: this.turnosPorDia.map(item => item.cantidad),
          borderColor: '#36A2EB',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Turnos por Día'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.chartDia = new Chart(ctx, config);
  }

  /**
   * Crea gráfico de barras de turnos solicitados por médico
   */
  private crearGraficoSolicitados() {
    if (!this.solicitudosChart?.nativeElement || this.turnosSolicitadosPorMedico.length === 0) return;

    this.chartSolicitados?.destroy();

    const ctx = this.solicitudosChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: this.turnosSolicitadosPorMedico.map(item => item.medico_nombre),
        datasets: [{
          label: 'Turnos Solicitados',
          data: this.turnosSolicitadosPorMedico.map(item => item.cantidad_solicitados || 0),
          backgroundColor: '#4BC0C0',
          borderColor: '#36A2EB',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Turnos Solicitados por Médico'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.chartSolicitados = new Chart(ctx, config);
  }

  /**
   * Crea gráfico de barras de turnos finalizados por médico
   */
  private crearGraficoFinalizados() {
    if (!this.finalizadosChart?.nativeElement || this.turnosFinalizadosPorMedico.length === 0) return;

    this.chartFinalizados?.destroy();

    const ctx = this.finalizadosChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: this.turnosFinalizadosPorMedico.map(item => item.medico_nombre),
        datasets: [{
          label: 'Turnos Finalizados',
          data: this.turnosFinalizadosPorMedico.map(item => item.cantidad_finalizados || 0),
          backgroundColor: '#9966FF',
          borderColor: '#7B4B94',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Turnos Finalizados por Médico'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.chartFinalizados = new Chart(ctx, config);
  }

  // ========== EXPORTACIÓN ==========

  /**
   * Exporta los datos a Excel
   */
  exportarExcel() {
    try {
      const wb = XLSX.utils.book_new();

      // Hoja de Log de Ingresos
      if (this.logIngresos.length > 0) {
        const logData = this.logIngresos.map(log => ({
          'Fecha': log.fecha_ingreso,
          'Hora': log.hora_ingreso,
          'Usuario': log.usuario_nombre,
          'Email': log.usuario_email,
          'Tipo': log.usuario_tipo
        }));
        const wsLogs = XLSX.utils.json_to_sheet(logData);
        XLSX.utils.book_append_sheet(wb, wsLogs, 'Log Ingresos');
      }

      // Hoja de Turnos por Especialidad
      if (this.turnosPorEspecialidad.length > 0) {
        const espData = this.turnosPorEspecialidad.map(esp => ({
          'Especialidad': esp.especialidad,
          'Cantidad': esp.cantidad,
          'Porcentaje': `${esp.porcentaje}%`
        }));
        const wsEsp = XLSX.utils.json_to_sheet(espData);
        XLSX.utils.book_append_sheet(wb, wsEsp, 'Turnos por Especialidad');
      }

      // Hoja de Turnos por Día
      if (this.turnosPorDia.length > 0) {
        const diaData = this.turnosPorDia.map(dia => ({
          'Fecha': dia.fecha,
          'Cantidad': dia.cantidad
        }));
        const wsDias = XLSX.utils.json_to_sheet(diaData);
        XLSX.utils.book_append_sheet(wb, wsDias, 'Turnos por Día');
      }

      // Generar archivo
      const fechaActual = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `estadisticas_clinica_${fechaActual}.xlsx`);
      
      this.toastService.success('📊 Datos exportados a Excel correctamente');
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      this.toastService.error('❌ Error al exportar a Excel');
    }
  }

  /**
   * Exporta los datos a PDF
   */
  exportarPDF() {
    try {
      const doc = new jsPDF();
      const fechaActual = new Date().toLocaleDateString('es-ES');
      
      // Título
      doc.setFontSize(18);
      doc.text('Estadísticas de la Clínica Online', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generado el: ${fechaActual}`, 20, 30);

      let yPosition = 50;

      // Log de Ingresos
      if (this.logIngresos.length > 0) {
        doc.setFontSize(14);
        doc.text('Log de Ingresos al Sistema', 20, yPosition);
        yPosition += 10;

        const logHeaders = [['Fecha', 'Hora', 'Usuario', 'Tipo']];
        const logData = this.logIngresos.slice(0, 20).map(log => [
          log.fecha_ingreso,
          log.hora_ingreso,
          log.usuario_nombre,
          log.usuario_tipo
        ]);

        autoTable(doc, {
          head: logHeaders,
          body: logData,
          startY: yPosition,
          theme: 'grid'
        });

        // Obtener la posición final de la tabla
        yPosition = (doc as any).lastAutoTable.finalY + 20;
      }

      // Turnos por Especialidad
      if (this.turnosPorEspecialidad.length > 0) {
        doc.setFontSize(14);
        doc.text('Turnos por Especialidad', 20, yPosition);
        yPosition += 10;

        const espHeaders = [['Especialidad', 'Cantidad', 'Porcentaje']];
        const espData = this.turnosPorEspecialidad.map(esp => [
          esp.especialidad,
          esp.cantidad.toString(),
          `${esp.porcentaje}%`
        ]);

        autoTable(doc, {
          head: espHeaders,
          body: espData,
          startY: yPosition,
          theme: 'grid'
        });
      }

      // Guardar PDF
      const fechaArchivo = new Date().toISOString().split('T')[0];
      doc.save(`estadisticas_clinica_${fechaArchivo}.pdf`);
      
      this.toastService.success('📄 Datos exportados a PDF correctamente');
    } catch (error) {
      console.error('Error exportando a PDF:', error);
      this.toastService.error('❌ Error al exportar a PDF');
    }
  }

  // ========== UTILIDADES ==========

  /**
   * Formatea fecha para input type="date"
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Actualiza filtros y recarga datos
   */
  onFiltroChange() {
    this.cargarTodasLasEstadisticas();
  }

  /**
   * Obtiene el total de ingresos
   */
  get totalIngresos(): number {
    return this.logIngresos.length;
  }

  /**
   * Obtiene el total de turnos
   */
  get totalTurnos(): number {
    return this.turnosPorEspecialidad.reduce((total, esp) => total + esp.cantidad, 0);
  }

}
