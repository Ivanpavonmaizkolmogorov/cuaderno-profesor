const { jsPDF } = window.jspdf;
import { getDB, getCalculatedGrades } from '../state.js';
import { calculateModuleGrades } from './calculations.js';
import { handleExportFullStudentReport } from '../handlers.js';

/**
 * Genera un informe PDF detallado para un alumno/a.
 * @param {object} options - Opciones para la generación del informe.
 * @param {object} options.student - El objeto del alumno.
 * @param {Array<object>} options.modulesData - Array con los datos de los módulos y las notas calculadas.
 * @param {object} options.db - El objeto completo de la base de datos.
 * @param {jsPDF} [options.doc] - Un documento jsPDF existente para continuar dibujando en él.
 * @returns {{doc: jsPDF, yPosition: number}|undefined} - Devuelve el documento y la posición Y si se proporciona un doc.
 */
export function generateStudentReport({ student, modulesData, db, doc = null }) {
  try {
    if (!student) return;

    const isNewDoc = !doc;
    if (isNewDoc) {
      doc = new jsPDF();
    }
    let yPosition = 20;
    const pageMargin = 14;
    const contentWidth = doc.internal.pageSize.width - (pageMargin * 2);

    const checkAndAddPage = () => {
      if (yPosition > 260) { // Margen inferior
        doc.addPage();
        yPosition = 20;
      }
    };

    const { actividades: allActividades, grades: allGrades } = db;


    // --- Título ---
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Informe de Calificaciones", doc.internal.pageSize.width / 2, yPosition, { align: "center" });
    yPosition += 15;

    // --- Datos del Alumno ---
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text(`Alumno/a: ${student.name}`, pageMargin, yPosition);
    yPosition += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(pageMargin, yPosition, pageMargin + contentWidth, yPosition); // Línea separadora
    yPosition += 10;

    // --- Iterar sobre los módulos del alumno/a ---
    modulesData.forEach((moduleInfo, index) => {
      // Antes de dibujar un nuevo módulo (excepto el primero), forzamos un salto de página.
      if (index > 0) {
        doc.addPage();
        yPosition = 20; // Reiniciamos la posición Y al margen superior
      }

      // --- Cabecera del Módulo y Nota Final ---
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(230, 230, 230); // Gris claro
      doc.rect(pageMargin, yPosition - 5, contentWidth, 10, 'F');
      doc.text(moduleInfo.module.modulo, pageMargin + 2, yPosition);

      // --- INICIO: DESGLOSE DE NOTA FINAL ---
      if (moduleInfo.breakdown && moduleInfo.breakdown.totalAdjustment !== 0) {
        const breakdownText = `Base: ${moduleInfo.breakdown.baseGrade.toFixed(2)} | Ajuste: ${moduleInfo.breakdown.totalAdjustment.toFixed(2)} | Final: ${moduleInfo.moduleGrade.toFixed(2)}`;
        doc.setFontSize(9);
        doc.text(breakdownText, pageMargin + contentWidth - 2, yPosition, { align: "right" });
      } else {
        doc.text(`Nota Final: ${moduleInfo.moduleGrade.toFixed(2)}`, pageMargin + contentWidth - 2, yPosition, { align: "right" });
      }
      // --- FIN: DESGLOSE DE NOTA FINAL ---
      yPosition += 12;

      // --- Tabla de Resultados de Aprendizaje (RAs) ---
      moduleInfo.module.resultados_de_aprendizaje.forEach(ra => {
        checkAndAddPage();
        const raGrade = moduleInfo.raTotals[ra.ra_id] || 0;

        // --- Cabecera del RA ---
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setFillColor(245, 245, 245); // Gris muy claro
        doc.rect(pageMargin, yPosition - 4, contentWidth, 6, 'F');
        doc.text(ra.ra_id, pageMargin + 2, yPosition);
        doc.text(ra.ra_descripcion, pageMargin + 20, yPosition);
        doc.text(raGrade.toFixed(2), pageMargin + contentWidth - 2, yPosition, { align: "right" });
        yPosition += 8;

        // --- Desglose de Criterios de Evaluación (CEs) ---
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);

        ra.criterios_de_evaluacion.forEach(ce => {
          checkAndAddPage();
          const ceGrade = (moduleInfo.ceFinalGrades && moduleInfo.ceFinalGrades[ce.ce_id] != null) ? moduleInfo.ceFinalGrades[ce.ce_id] : null;
          const ceDescriptionLines = doc.splitTextToSize(ce.ce_descripcion, 120);

          // Columna Izquierda: Info del CE
          doc.setFont("helvetica", "normal");
          doc.text(`${ce.ce_id} (Peso: ${ce.peso}%)`, pageMargin + 5, yPosition);
          yPosition += 4;
          doc.setFont("helvetica", "italic");
          doc.setTextColor(100, 100, 100);
          doc.text(ceDescriptionLines, pageMargin + 5, yPosition);
          yPosition += (ceDescriptionLines.length * 4);

          // Añadir la referencia a la UD
          if (ce.ud_ref) {
            doc.setFont("helvetica", "italic");
            doc.setTextColor(0, 0, 200); // Color azul para la referencia
            doc.text(ce.ud_ref, pageMargin + 5, yPosition);
            yPosition += 4;
          }
          
          // Columna Derecha: Nota del CE
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          if (ceGrade !== null) {
              doc.setTextColor(ceGrade >= 5 ? 0 : 200, ceGrade >= 5 ? 100 : 0, 0); // Verde o Rojo
              doc.text(ceGrade.toFixed(2), pageMargin + contentWidth - 2, yPosition - (ceDescriptionLines.length * 2), { align: "right" });
          } else {
              doc.setTextColor(150, 150, 150);
              doc.text('S.C.', pageMargin + contentWidth - 2, yPosition - (ceDescriptionLines.length * 2), { align: "right" });
          }
          doc.setFontSize(9);
          doc.setTextColor(50, 50, 50);

          // --- Desglose de actividades y cálculos para este CE ---
          const actividadesQueEvaluanEsteCE = allActividades.filter(act => act.moduleId === moduleInfo.module.id && act.ceIds.includes(ce.ce_id));
          const notasDeActividades = actividadesQueEvaluanEsteCE.map(act => {
              const attempts = allGrades[student.id]?.[act.id] || [];
              if (attempts.length === 0) return null;
              return { name: act.name, grade: Math.max(...attempts.map(a => a.grade)), trimestre: act.trimestre };
          }).filter(Boolean);
          
          if (notasDeActividades.length > 0) {
              yPosition += 2;
              doc.setFontSize(8);
              doc.setFont("helvetica", "italic");
              doc.setTextColor(120, 120, 120);

              doc.text('Actividades evaluables:', pageMargin + 8, yPosition);
              yPosition += 4;

              notasDeActividades.forEach(notaAct => {
                  checkAndAddPage();
                  doc.text(`- ${notaAct.name} (T${notaAct.trimestre}): ${notaAct.grade.toFixed(2)}`, pageMargin + 10, yPosition);
                  yPosition += 4;
              });

              if (notasDeActividades.length > 1 && ceGrade !== null) {
                  const formulaMedia = `Media: (${notasDeActividades.map(n => n.grade.toFixed(2)).join(' + ')}) / ${notasDeActividades.length} = ${ceGrade.toFixed(2)}`;
                  doc.text(formulaMedia, pageMargin + 10, yPosition);
                  yPosition += 4;
              }

              if (ceGrade !== null) {
                  const aportacion = (ceGrade * ce.peso) / 100;
                  const formulaAportacion = `Aportación: (${ceGrade.toFixed(2)} x ${ce.peso}%) / 100 = ${aportacion.toFixed(3)}`;
                  doc.text(formulaAportacion, pageMargin + 10, yPosition);
                  yPosition += 4;
              }

              doc.setFontSize(9); // Restaurar tamaño de fuente
              doc.setTextColor(50, 50, 50); // Restaurar color
          }

          yPosition += 5; // Espacio entre CEs
          doc.setDrawColor(230, 230, 230);
          doc.line(pageMargin + 5, yPosition - 3, pageMargin + contentWidth - 5, yPosition - 3);
        });

        doc.setTextColor(0, 0, 0); // Restaurar color de texto
        yPosition += 4; // Espacio entre RAs
      });

      yPosition += 10; // Espacio entre módulos
    });

    // --- Pie de página ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, 287, { align: "center" });
      doc.text(`Generado el: ${new Date().toLocaleString()}`, pageMargin, 287);
    }

    // --- Guardar el PDF ---
    if (isNewDoc) {
      doc.save(`Informe_${student.name.replace(/ /g, "_")}.pdf`);
    } else {
      // Si estamos añadiendo a un documento existente, devolvemos el doc y la posición para el siguiente.
      return { doc, yPosition };
    }
  } catch (error) {
    console.error("Error al generar el PDF:", error);
    alert("Se produjo un error inesperado al generar el PDF. Revisa la consola para más detalles.");
  }
}

/**
 * Genera un único informe PDF combinado con los datos de todos los alumnos.
 * @param {object} db - El objeto completo de la base de datos.
 */
export function generateCombinedReport(db) {
  const doc = new jsPDF();
  const allStudents = db.students;

  allStudents.forEach((student, index) => {
    console.log(`[generateCombinedReport] Añadiendo alumno ${index + 1}/${allStudents.length}: ${student.name}`);

    // 1. Obtener los módulos en los que está matriculado el alumno.
    const enrolledModules = db.modules.filter(m => m.studentIds?.includes(student.id));

    // 2. Calcular las notas para esos módulos.
    const modulesDataForPdf = enrolledModules.map(module => {
      const finalGrades = calculateModuleGrades(module, [student], db.grades, db.actividades, null, db.aptitudes)[student.id] || { moduleGrade: 0, raTotals: {}, ceFinalGrades: {} };
      return { module, ...finalGrades };
    });

    // 3. Si no es el primer alumno, añadimos una nueva página para empezar.
    if (index > 0) {
      doc.addPage();
    }

    // 4. Llamar a generateStudentReport para que dibuje en el documento existente.
    generateStudentReport({
      student,
      modulesData: modulesDataForPdf,
      db,
      doc // Pasamos el documento existente.
    });
  });

  // --- Pie de página final para el documento combinado ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, 287, { align: "center" });
  }

  doc.save(`Informe_Completo_Todos_Alumnos.pdf`);
}