// --- LÓGICA DE CÁLCULO ---

export function calculateModuleGrades(module, students, grades, actividades, trimestre, aptitudes = {}) {
  if (!module || !students || students.length === 0) return {};

  const studentData = {};
  const ras = module.resultados_de_aprendizaje;
  
  const moduleActividades = actividades.filter(a => a.moduleId === module.id && (!trimestre || a.trimestre === trimestre));

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
        } else if (!trimestre) { // Si no se especifica trimestre (cálculo final)
          // Si es el cálculo final y el CE no tiene nota, su peso sí cuenta (nota 0).
          raWeightedTotal += 0; // La nota es 0
          raTotalWeight += weight;
        }
      }

      const raGrade = (raTotalWeight > 0) ? (raWeightedTotal / raTotalWeight) : 0;
      raTotals[ra.ra_id] = parseFloat(raGrade.toFixed(2));
    }

    let moduleGrade;

    if (trimestre) { // Si estamos calculando para un trimestre específico
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

      const baseGrade = moduleGrade;
      // --- INICIO: APLICAR AJUSTE POR APTITUD ---
      const studentAptitudes = aptitudes[module.id]?.[student.id];
      if (trimestre && studentAptitudes) {
        const trimesterKey = `T${trimestre}`;
        const trimesterAptitudes = studentAptitudes[trimesterKey];
        if (trimesterAptitudes) {
          // --- INICIO: CÁLCULO GRANULAR ---
          // Ahora calculamos el ajuste para cada entrada individualmente y lo sumamos.
          const defaultBasePositiva = module.aptitudBasePositiva ?? 1.1;
          const defaultBaseNegativa = module.aptitudBaseNegativa ?? 1.1;

          const ajustePositivo = (trimesterAptitudes.positives || []).reduce((sum, entry) => {
            return sum + (Math.pow(entry.baseValue || defaultBasePositiva, 1) - 1);
          }, 0);
          const ajusteNegativo = (trimesterAptitudes.negatives || []).reduce((sum, entry) => {
            return sum + (Math.pow(entry.baseValue || defaultBaseNegativa, 1) - 1);
          }, 0);
          // --- FIN: CÁLCULO GRANULAR ---
          const totalAdjustment = ajustePositivo - ajusteNegativo;
          moduleGrade = baseGrade + totalAdjustment;

          // Guardamos el desglose para usarlo en la UI, PDF y Excel
          studentData[student.id] = studentData[student.id] || {};
          studentData[student.id].breakdown = {
            baseGrade: baseGrade,
            totalAdjustment: totalAdjustment,
            positiveAdjustment: ajustePositivo,
            negativeAdjustment: ajusteNegativo
          };
        }
      }
      // --- FIN: APLICAR AJUSTE POR APTITUD ---
    } else { // Si es el cálculo final (trimestre es undefined o null)
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

      const baseGrade = moduleGrade;
      // --- INICIO: APLICAR AJUSTE POR APTITUD A LA NOTA FINAL ---
      // Se calcula la SUMA de los ajustes de los tres trimestres.
      const studentAptitudes = aptitudes[module.id]?.[student.id];
      let totalCumulativeAdjustment = 0;

      if (studentAptitudes) {
        ['T1', 'T2', 'T3'].forEach(trimestreKey => {
          const trimesterAptitudes = studentAptitudes[trimestreKey];
          if (trimesterAptitudes) {
            const defaultBasePositiva = module.aptitudBasePositiva ?? 1.1;
            const defaultBaseNegativa = module.aptitudBaseNegativa ?? 1.1;
            const ajustePositivo = (trimesterAptitudes.positives || []).reduce((sum, entry) => {
              return sum + (Math.pow(entry.baseValue || defaultBasePositiva, 1) - 1);
            }, 0);
            const ajusteNegativo = (trimesterAptitudes.negatives || []).reduce((sum, entry) => {
              return sum + (Math.pow(entry.baseValue || defaultBaseNegativa, 1) - 1);
            }, 0);
            totalCumulativeAdjustment += (ajustePositivo - ajusteNegativo);
          }
        });
        moduleGrade = baseGrade + totalCumulativeAdjustment;
      }
      studentData[student.id] = studentData[student.id] || {};
      studentData[student.id].breakdown = {
        baseGrade: baseGrade,
        totalAdjustment: totalCumulativeAdjustment,
      };
      // --- FIN: APLICAR AJUSTE POR APTITUD A LA NOTA FINAL ---
    }


    // Aseguramos que el objeto del estudiante exista antes de añadirle propiedades
    if (!studentData[student.id]) {
      studentData[student.id] = {};
    }
    studentData[student.id].raTotals = raTotals;
    studentData[student.id].moduleGrade = parseFloat(moduleGrade.toFixed(2));
    studentData[student.id].ceFinalGrades = ceFinalGrades;
  }
  return studentData;
}