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
    if (yPosition > 260) { // Si nos acercamos al final de la página, añadir una nueva
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
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("RA", 16, yPosition);
    doc.text("Descripción", 35, yPosition);
    doc.text("Nota", 194, yPosition, { align: "right" });
    yPosition += 2;
    doc.line(14, yPosition, 196, yPosition);
    yPosition += 5;

    doc.setFont("helvetica", "normal");
    moduleInfo.module.resultados_de_aprendizaje.forEach(ra => {
      const raGrade = moduleInfo.raTotals[ra.ra_id] || 0;
      const descriptionLines = doc.splitTextToSize(ra.ra_descripcion, 140); // Ajustar texto a la anchura

      // Comprobar si algún CE de este RA es dual
      const isDualRa = ra.criterios_de_evaluacion.some(ce => ce.dual);
      if (isDualRa) {
        doc.setFont("helvetica", "bold");
      }

      doc.text(ra.ra_id, 16, yPosition);
      doc.text(descriptionLines, 35, yPosition);
      doc.text(raGrade.toFixed(2), 194, yPosition, { align: "right" });

      if (isDualRa) {
        doc.setFont("helvetica", "normal"); // Volver a la fuente normal
      }

      yPosition += (descriptionLines.length * 5) + 3; // Incrementar Y según las líneas de texto
    });

    yPosition += 10; // Espacio entre módulos
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