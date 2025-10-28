const { jsPDF } = window.jspdf;

export function generateStudentReport(student, modules, grades) {
  if (!student) return;

  const doc = new jsPDF();

  // --- Título ---
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Informe de Calificaciones", 105, 20, { align: "center" });

  // --- Datos del Alumno ---
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text(`Alumno: ${student.name}`, 14, 35);
  doc.line(14, 37, 196, 37); // Línea separadora

  let yPosition = 50;

  // --- Iterar sobre los módulos del alumno ---
  modules.forEach(moduleInfo => {
    if (yPosition > 250) { // Si nos acercamos al final de la página, añadir una nueva
      doc.addPage();
      yPosition = 20;
    }

    // --- Cabecera del Módulo ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(230, 230, 230); // Gris claro
    doc.rect(14, yPosition - 5, 182, 10, 'F');
    doc.text(moduleInfo.module.modulo, 16, yPosition);
    doc.text(`Nota Final: ${moduleInfo.finalGrade.toFixed(2)}`, 194, yPosition, { align: "right" });
    yPosition += 12;

    // --- Tabla de Resultados de Aprendizaje (RAs) ---
    moduleInfo.module.resultados_de_aprendizaje.forEach(ra => {
      const raGrade = moduleInfo.raTotals[ra.ra_id] || 0;
      const descriptionLines = doc.splitTextToSize(ra.ra_descripcion, 150); // Ajustar texto a la anchura

      // Comprobar si algún CE de este RA es dual
      const isDualRa = ra.criterios_de_evaluacion.some(ce => ce.dual);

      // --- Cabecera del RA ---
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(245, 245, 245); // Gris muy claro
      doc.rect(14, yPosition - 4, 182, 6, 'F');
      doc.text(ra.ra_id, 16, yPosition);
      doc.text(ra.ra_descripcion, 35, yPosition);
      doc.text(raGrade.toFixed(2), 194, yPosition, { align: "right" });
      yPosition += 8;

      // --- Desglose de Criterios de Evaluación (CEs) ---
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);

      ra.criterios_de_evaluacion.forEach(ce => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        const ceGrade = (grades[student.id] && grades[student.id][ce.ce_id] != null) ? grades[student.id][ce.ce_id] : 'S.C.'; // S.C. = Sin Calificar
        const ceDescriptionLines = doc.splitTextToSize(ce.ce_descripcion, 110);

        doc.setFont("helvetica", "normal");
        doc.text(ce.ce_id, 20, yPosition);
        doc.text(ceDescriptionLines, 45, yPosition);
        
        doc.setFont("helvetica", "bold");
        doc.text(`${ce.peso}%`, 168, yPosition, { align: "right" });
        doc.text(typeof ceGrade === 'number' ? ceGrade.toFixed(2) : ceGrade, 194, yPosition, { align: "right" });

        if (ce.dual) {
          doc.saveGraphicsState();
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 255);
          doc.text("Dual", 20, yPosition + 4);
          doc.restoreGraphicsState();
        }

        yPosition += (ceDescriptionLines.length * 4) + 4;
      });

      doc.setTextColor(0, 0, 0); // Restaurar color de texto
      yPosition += 4; // Espacio entre RAs
    });

    yPosition += 5; // Espacio entre módulos
  });

  // --- Pie de página ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, 105, 287, { align: "center" });
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 287);
  }

  // --- Guardar el PDF ---
  doc.save(`Informe_${student.name.replace(/ /g, "_")}.pdf`);
}