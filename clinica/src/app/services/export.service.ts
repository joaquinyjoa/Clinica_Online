import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  /**
   * Obtiene todos los pacientes
   */
  private async obtenerTodosLosPacientes() {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*');
    
    if (error) throw error;
    return data;
  }

  /**
   * Obtiene todos los especialistas
   */
  private async obtenerTodosLosEspecialistas() {
    const { data, error } = await supabase
      .from('empleados')
      .select('*');
    
    if (error) throw error;
    return data;
  }

  /**
   * Obtiene un paciente por ID
   */
  private async obtenerPacientePorId(pacienteId: number) {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', pacienteId)
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Obtiene turnos realizados de un paciente con información del especialista
   */
  private async obtenerTurnosRealizadosPaciente(pacienteId: number) {
    const { data, error } = await supabase
      .from('turnos')
      .select(`
        *,
        empleados!especialistaid (
          nombre,
          apellido
        )
      `)
      .eq('pacienteid', pacienteId)
      .eq('estado', 'realizado')
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    
    // Transformar datos para incluir nombre del especialista
    return data?.map(turno => ({
      ...turno,
      especialista_nombre: turno.empleados 
        ? `${turno.empleados.nombre} ${turno.empleados.apellido}`
        : 'No disponible'
    }));
  }

  /**
   * Genera y descarga un archivo Excel con los datos de todos los usuarios
   * Solo para administradores
   */
  async exportarUsuariosExcel() {
    try {
      // Obtener usuarios de ambas tablas
      const [pacientes, especialistas] = await Promise.all([
        this.obtenerTodosLosPacientes(),
        this.obtenerTodosLosEspecialistas()
      ]);

      // Preparar datos para Excel
      const datosExcel = [
        // Headers
        ['Tipo', 'ID', 'Nombre', 'Apellido', 'DNI', 'Email', 'Especialidad', 'Obra Social', 'Estado Verificación', 'Estado Aprobación'],
        
        // Pacientes
        ...pacientes.map((p: any) => [
          'Paciente',
          p.id,
          p.nombre,
          p.apellido,
          p.dni,
          p.email,
          '-',
          p.obraSocial || '-',
          p.emailVerificado ? 'Verificado' : 'Pendiente',
          'N/A'
        ]),
        
        // Especialistas
        ...especialistas.map((e: any) => [
          'Especialista',
          e.id,
          e.nombre,
          e.apellido,
          e.dni,
          e.email,
          e.especialidad,
          '-',
          e.emailVerificado ? 'Verificado' : 'Pendiente',
          e.aprobado ? 'Aprobado' : 'Pendiente'
        ])
      ];

      // Crear workbook y worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(datosExcel);

      // Configurar anchos de columna
      const columnWidths = [
        { wpx: 100 }, // Tipo
        { wpx: 50 },  // ID
        { wpx: 120 }, // Nombre
        { wpx: 120 }, // Apellido
        { wpx: 100 }, // DNI
        { wpx: 200 }, // Email
        { wpx: 120 }, // Especialidad
        { wpx: 120 }, // Obra Social
        { wpx: 120 }, // Verificación
        { wpx: 120 }  // Aprobación
      ];
      ws['!cols'] = columnWidths;

      // Agregar estilos a los headers
      const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "D3D3D3" } }
        };
      }

      // Agregar worksheet al workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

      // Generar nombre de archivo con fecha
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `usuarios_clinica_${fecha}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, nombreArchivo);

      return true;
    } catch (error) {
      console.error('Error al exportar usuarios a Excel:', error);
      throw error;
    }
  }

  /**
   * Genera y descarga un PDF con la historia clínica del paciente
   */
  async exportarHistoriaClinicaPDF(pacienteId: number) {
    try {
      // Obtener datos del paciente
      const paciente = await this.obtenerPacientePorId(pacienteId);
      
      // Obtener turnos realizados del paciente
      const turnosRealizados = await this.obtenerTurnosRealizadosPaciente(pacienteId);

      if (!paciente) {
        throw new Error('Paciente no encontrado');
      }

      // Crear nuevo PDF
      const doc = new jsPDF();
      
      // Configuración de colores
      const colorPrimario: [number, number, number] = [102, 126, 234]; // #667eea

      // Header con logo (simulado con texto)
      doc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('🏥 CLÍNICA ONLINE', 20, 25);
      
      // Título del documento
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('HISTORIA CLÍNICA', 20, 60);

      // Fecha de emisión
      const fechaEmision = new Date().toLocaleDateString('es-ES');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de emisión: ${fechaEmision}`, 20, 70);

      // Información del paciente
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DATOS DEL PACIENTE', 20, 90);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      let yPos = 100;
      
      doc.text(`Nombre: ${paciente.nombre} ${paciente.apellido}`, 20, yPos);
      yPos += 8;
      doc.text(`DNI: ${paciente.dni || 'No registrado'}`, 20, yPos);
      yPos += 8;
      doc.text(`Email: ${paciente.email}`, 20, yPos);
      yPos += 8;
      doc.text(`Obra Social: ${paciente.obraSocial || 'No registrada'}`, 20, yPos);
      yPos += 20;

      // Historial de consultas
      if (turnosRealizados && turnosRealizados.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('HISTORIAL DE CONSULTAS', 20, yPos);
        yPos += 15;

        // Preparar datos para la tabla
        const datosTabla = turnosRealizados.map((turno: any) => [
          new Date(turno.fecha).toLocaleDateString('es-ES'),
          turno.horario,
          turno.especialidad,
          turno.especialista_nombre || 'N/D',
          turno.comentarioespecialista || 'Sin comentarios',
          turno.calificacion ? `${turno.calificacion}/5` : '-'
        ]);

        // Crear tabla
        autoTable(doc, {
          startY: yPos,
          head: [['Fecha', 'Hora', 'Especialidad', 'Especialista', 'Diagnóstico/Observaciones', 'Calificación']],
          body: datosTabla,
          theme: 'grid',
          headStyles: {
            fillColor: colorPrimario,
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 9,
            cellPadding: 3
          },
          columnStyles: {
            0: { cellWidth: 25 }, // Fecha
            1: { cellWidth: 20 }, // Hora
            2: { cellWidth: 30 }, // Especialidad
            3: { cellWidth: 35 }, // Especialista
            4: { cellWidth: 70 }, // Observaciones
            5: { cellWidth: 20 }  // Calificación
          },
          margin: { left: 20, right: 20 }
        });

      } else {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.text('No se encontraron consultas realizadas.', 20, yPos);
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Página ${i} de ${pageCount}`, 180, 285);
        doc.text('Documento generado automáticamente por Clínica Online', 20, 285);
      }

      // Generar nombre de archivo
      const nombreArchivo = `historia_clinica_${paciente.nombre}_${paciente.apellido}_${fechaEmision.replace(/\//g, '-')}.pdf`;

      // Descargar PDF
      doc.save(nombreArchivo);

      return true;
    } catch (error) {
      console.error('Error al generar PDF de historia clínica:', error);
      throw error;
    }
  }
}