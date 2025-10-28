// --- LÓGICA DE CÁLCULO ---

export function calculateModuleGrades(module, students, grades, actividades, trimestre = null) {
  if (!module || !students || students.length === 0) return {};

  const studentData = {};
  const ras = module.resultados_de_aprendizaje;
  
  // Filtrar actividades por trimestre si se especifica uno.
  let moduleActividades = actividades.filter(a => a.moduleId === module.id);
  if (trimestre) {
    moduleActividades = moduleActividades.filter(a => a.trimestre === trimestre);
  }

  for (const student of students) {
    if (!student || !student.id) continue;

    const studentGradesByActividad = grades[student.id] || {};
    const ceFinalGrades = {};

    // 1. Calcular la nota final de cada CE basándose en las actividades
    const allCes = ras.flatMap(ra => ra.criterios_de_evaluacion);
    allCes.forEach(ce => {
      const actividadesQueEvaluanEsteCE = moduleActividades.filter(act => act.ceIds.includes(ce.ce_id));
      const gradesFromActivities = [];

      actividadesQueEvaluanEsteCE.forEach(act => {
        const attempts = studentGradesByActividad[act.id] || [];
        if (attempts.length > 0) {
          const maxAttemptGrade = Math.max(...attempts.map(att => att.grade));
          gradesFromActivities.push(maxAttemptGrade);
        }
      });

      if (gradesFromActivities.length > 0) {
        const averageGrade = gradesFromActivities.reduce((sum, g) => sum + g, 0) / gradesFromActivities.length;
        ceFinalGrades[ce.ce_id] = averageGrade;
      }
    });

    // 2. Calcular las notas de los RAs y del módulo usando las notas finales de los CEs
    let moduleTotalWeighted = 0;
    let moduleTotalWeight = 0;
    const raTotals = {};

    for (const ra of ras) {
      let raWeightedTotal = 0;
      let raTotalWeight = 0;

      for (const ce of ra.criterios_de_evaluacion) {
        const weight = ce.peso || 0;
        // Para la nota final (trimestre es null), si un CE no tiene nota, su nota es 0.
        // Para una nota trimestral, solo se consideran los CEs con nota en ese trimestre.
        if (ceFinalGrades[ce.ce_id] !== undefined) {
          raWeightedTotal += (ceFinalGrades[ce.ce_id] * weight);
          raTotalWeight += weight;
        } else if (trimestre === null) {
          // Si es el cálculo final y el CE no tiene nota, su peso sí cuenta (nota 0).
          raWeightedTotal += 0; // La nota es 0
          raTotalWeight += weight;
        }
      }

      const raGrade = (raTotalWeight > 0) ? (raWeightedTotal / raTotalWeight) : 0;
      raTotals[ra.ra_id] = parseFloat(raGrade.toFixed(2));
    }

    let moduleGrade;

    if (trimestre) {
      // Para cálculos trimestrales, la nota del módulo es la media ponderada de TODOS los CEs
      // que han sido evaluados en este trimestre, independientemente del RA al que pertenezcan.
      let trimesterCeWeightedTotal = 0;
      let trimesterCeTotalWeight = 0;

      // Iterar a través de todos los CEs del módulo
      for (const ra of ras) {
        for (const ce of ra.criterios_de_evaluacion) {
          // Si este CE tiene una nota final (es decir, ha sido evaluado en este trimestre)
          if (ceFinalGrades[ce.ce_id] !== undefined) {
            const grade = ceFinalGrades[ce.ce_id];
            const weight = ce.peso || 0;
            trimesterCeWeightedTotal += (grade * weight);
            trimesterCeTotalWeight += weight;
          }
        }
      }
      moduleGrade = (trimesterCeTotalWeight > 0) ? (trimesterCeWeightedTotal / trimesterCeTotalWeight) : 0;
    } else {
      // Para la nota final, la nota del módulo es la media ponderada de TODOS los CEs del módulo.
      // Los CEs no evaluados explícitamente (no presentes en ceFinalGrades) cuentan como 0.
      let finalCeWeightedTotal = 0;
      let finalCeTotalWeight = 0;

      // Iterar a través de todos los CEs del módulo (allCes ya contiene todos los CEs)
      allCes.forEach(ce => {
        const grade = ceFinalGrades[ce.ce_id] ?? 0; // Si no hay nota, es un 0 para la final
        const weight = ce.peso || 0;
        finalCeWeightedTotal += (grade * weight);
        finalCeTotalWeight += weight;
      });
      moduleGrade = (finalCeTotalWeight > 0) ? (finalCeWeightedTotal / finalCeTotalWeight) : 0;
    }


    studentData[student.id] = {
      raTotals,
      moduleGrade: parseFloat(moduleGrade.toFixed(2)),
      ceFinalGrades, // Devolvemos las notas finales de los CEs
    };
  }
  return studentData;
}