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
   * Retorna el logo embebido como base64 o genera un SVG placeholder
   */
  private async getLogoDataUrl(): Promise<string | null> {
    // Logo embebido como base64 (clínica online - cruz médica con hojas)
    const logoBase64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj4KICA8IS0tIENpcmN1bG8gZXh0ZXJpb3IgZ3JpcyBvc2N1cm8gLS0+CiAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI5NSIgZmlsbD0iIzNkNDA0NyIgc3Ryb2tlPSIjM2Q0MDQ3IiBzdHJva2Utd2lkdGg9IjIiLz4KICA8IS0tIENpcmN1bG8gaW50ZXJpb3IgYXp1bCBjbGFybyAtLT4KICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9Ijc1IiBmaWxsPSIjNTFiM2QxIiBzdHJva2U9IiM1MWIzZDEiIHN0cm9rZS13aWR0aD0iMiIvPgogIDwhLS0gQ3J1eiBtw6lkaWNhIC0tPgogIDxyZWN0IHg9Ijg1IiB5PSI2NSIgd2lkdGg9IjMwIiBoZWlnaHQ9IjcwIiBmaWxsPSIjM2Q0MDQ3Ii8+CiAgPHJlY3QgeD0iNjUiIHk9Ijg1IiB3aWR0aD0iNzAiIGhlaWdodD0iMzAiIGZpbGw9IiMzZDQwNDciLz4KICA8IS0tIEhvamFzIGRlY29yYXRpdmFzIC0tPgogIDxlbGxpcHNlIGN4PSI1NSIgY3k9IjE2NSIgcng9IjEyIiByeT0iMjAiIGZpbGw9IiM0ZGIwY2MiIHRyYW5zZm9ybT0icm90YXRlKC0zMCA1NSAxNjUpIi8+CiAgPGVsbGlwc2UgY3g9IjE0NSIgY3k9IjE2NSIgcng9IjEyIiByeT0iMjAiIGZpbGw9IiM0ZGIwY2MiIHRyYW5zZm9ybT0icm90YXRlKDMwIDE0NSAxNjUpIi8+CiAgPGVsbGlwc2UgY3g9IjMwIiBjeT0iMTQwIiByeD0iMTUiIHJ5PSIyNSIgZmlsbD0iIzRkYjBjYyIgdHJhbnNmb3JtPSJyb3RhdGUoLTQ1IDMwIDE0MCkiLz4KICA8ZWxsaXBzZSBjeD0iMTcwIiBjeT0iMTQwIiByeD0iMTUiIHJ5PSIyNSIgZmlsbD0iIzRkYjBjYyIgdHJhbnNmb3JtPSJyb3RhdGUoNDUgMTcwIDE0MCkiLz4KICA8IS0tIFB1bnRvIGNlbnRyYWwgLS0+CiAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTcwIiByPSI4IiBmaWxsPSIjNGRiMGNjIi8+Cjwvc3ZnPg==`;

    try {
      // Intentar usar el logo embebido
      console.debug('[ExportService] usando logo embebido como base64');
      return logoBase64;
    } catch (e) {
      console.warn('[ExportService] Error con logo embebido:', e);
    }

    try {
      // SVG placeholder sencillo con el color primario y texto como fallback
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='80'>
        <rect width='100%' height='100%' fill='#667eea'/>
        <text x='20' y='50' font-family='Arial, Helvetica, sans-serif' font-size='36' fill='white'>CLÍNICA</text>
      </svg>`;

      return await this.svgToPngDataUrl(svg, 300, 80);
    } catch (e) {
      console.warn('No se pudo generar logo placeholder:', e);
      return null;
    }
  }

  private async blobToDataURL(blob: Blob): Promise<string> {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async svgToPngDataUrl(svg: string, width = 300, height = 80): Promise<string> {
    return await new Promise((resolve, reject) => {
      try {
        const img = new Image();
        const svgData = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('No hay contexto de canvas'));
            // Clear canvas
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const pngData = canvas.toDataURL('image/png');
            resolve(pngData);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = (e) => reject(e);
        img.src = svgData;
      } catch (err) {
        reject(err);
      }
    });
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

      // Crear nuevo PDF (A4, mm)
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Configuración de colores
      const colorPrimario: [number, number, number] = [102, 126, 234]; // #667eea

      // Intentar obtener logo (assets/logo.png) o generar un placeholder SVG en base64
      const logoDataUrl = await this.getLogoDataUrl();

      // Función para dibujar cabecera en cada página
      const drawHeader = (currentDoc: jsPDF) => {
        currentDoc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        currentDoc.rect(0, 0, pageWidth, 30, 'F');

        if (logoDataUrl) {
          try {
            // Ajustar tamaño del logo a la altura del header
            const logoH = 18; // mm
            const logoW = 18; // mm (cuadrado)
            // No forzar formato; pasar solo dataURL para que jsPDF lo detecte
            currentDoc.addImage(logoDataUrl, 12, 6, logoW, logoH);
          } catch (e) {
            // si falla la inserción del logo, no interrumpe
            console.warn('No se pudo agregar logo al PDF:', e);
          }
        }

        // Texto de cabecera
        currentDoc.setTextColor(255, 255, 255);
        currentDoc.setFontSize(18);
        currentDoc.setFont('helvetica', 'bold');
        currentDoc.text('CLÍNICA ONLINE', 35, 18);
      };

      // Función footer
      const drawFooter = (currentDoc: jsPDF, pageNum: number, pageCount: number) => {
        currentDoc.setFontSize(8);
        currentDoc.setTextColor(128, 128, 128);
        const footerTextRight = `Página ${pageNum} de ${pageCount}`;
        currentDoc.text(footerTextRight, pageWidth - 20, pageHeight - 10);
        currentDoc.text('Documento generado automáticamente por Clínica Online', 12, pageHeight - 10);
      };

      // Título y datos del paciente (dibujados en la primera página antes de la tabla)
      drawHeader(doc);

      // Título del documento
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('HISTORIA CLÍNICA', 20, 40);

      // Fecha de emisión
      const fechaEmision = new Date().toLocaleDateString('es-ES');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de emisión: ${fechaEmision}`, 20, 47);

      // Información del paciente
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DATOS DEL PACIENTE', 20, 58);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      let yPos = 66;
      doc.text(`Nombre: ${paciente.nombre} ${paciente.apellido}`, 20, yPos);
      yPos += 6;
      doc.text(`DNI: ${paciente.dni || 'No registrado'}`, 20, yPos);
      yPos += 6;
      doc.text(`Email: ${paciente.email}`, 20, yPos);
      yPos += 6;
      doc.text(`Obra Social: ${paciente.obraSocial || 'No registrada'}`, 20, yPos);
      yPos += 10;

      // Historial de consultas
      if (turnosRealizados && turnosRealizados.length > 0) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('HISTORIAL DE CONSULTAS', 20, yPos);
        yPos += 8;

        // Preparar datos para la tabla
        const datosTabla = turnosRealizados.map((turno: any) => [
          new Date(turno.fecha).toLocaleDateString('es-ES'),
          turno.horario,
          turno.especialidad,
          turno.especialista_nombre || 'N/D',
          turno.comentarioespecialista || 'Sin comentarios',
          turno.calificacion ? `${turno.calificacion}/5` : '-'
        ]);

        // Crear tabla con opciones que permiten que la columna de observaciones haga wrap
        autoTable(doc, {
          startY: yPos + 2,
          head: [['Fecha', 'Hora', 'Especialidad', 'Especialista', 'Diagnóstico/Observaciones', 'Calificación']],
          body: datosTabla,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 3,
            overflow: 'linebreak'
          },
          headStyles: {
            fillColor: colorPrimario,
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 25 }, // Fecha
            1: { cellWidth: 20 }, // Hora
            2: { cellWidth: 30 }, // Especialidad
            3: { cellWidth: 35 }, // Especialista
            4: { cellWidth: 'auto', overflow: 'linebreak' }, // Observaciones permite wrap
            5: { cellWidth: 20 }  // Calificación
          },
          margin: { left: 12, right: 12, top: 10 },
          tableWidth: 'auto',
          showHead: 'everyPage',
          didDrawPage: (data) => {
            // data.pageNumber comienza en 1
            drawHeader(doc);
            drawFooter(doc, data.pageNumber, doc.getNumberOfPages());
          }
        });

      } else {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.text('No se encontraron consultas realizadas.', 20, yPos);
      }

      // Nombre del archivo
      const nombreArchivo = `historia_clinica_${paciente.nombre}_${paciente.apellido}_${fechaEmision.replace(/\//g, '-')}.pdf`;

      // Guardar PDF
      doc.save(nombreArchivo);

      return true;
    } catch (error) {
      console.error('Error al generar PDF de historia clínica:', error);
      throw error;
    }
  }
}