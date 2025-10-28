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
      const relevantActividades = moduleActividades.filter(act => act.ceIds.includes(ce.ce_id));
      let highestGrade = -1;

      relevantActividades.forEach(act => {
        const attempts = studentGradesByActividad[act.id] || [];
        if (attempts.length > 0) {
          const maxAttemptGrade = Math.max(...attempts.map(att => att.grade));
          if (maxAttemptGrade > highestGrade) {
            highestGrade = maxAttemptGrade;
          }
        }
      });

      if (highestGrade !== -1) {
        ceFinalGrades[ce.ce_id] = highestGrade;
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
        // Solo incluir en el cálculo si el CE tiene una nota explícita (incluyendo 0).
        if (ceFinalGrades[ce.ce_id] !== undefined) {
          raWeightedTotal += (ceFinalGrades[ce.ce_id] * weight);
          raTotalWeight += weight;
        }
      }

      const raGrade = (raTotalWeight > 0) ? (raWeightedTotal / raTotalWeight) : 0;
      raTotals[ra.ra_id] = parseFloat(raGrade.toFixed(2));
    }

    // La nota del módulo es la media de las notas de los RAs (sin ponderar entre ellos)
    // Si es un cálculo trimestral, solo promediamos los RAs que tienen nota.
    // Si es el cálculo final, promediamos todos los RAs (los no evaluados cuentan como 0).
    const allRaGrades = Object.values(raTotals);
    const evaluatedRaGrades = allRaGrades.filter(grade => grade > 0);


    const totalSumOfGrades = allRaGrades.reduce((sum, grade) => sum + grade, 0);
    const divisor = trimestre ? (evaluatedRaGrades.length || 1) : ras.length;

    const moduleGrade = totalSumOfGrades / divisor;


    studentData[student.id] = {
      raTotals,
      moduleGrade: parseFloat(moduleGrade.toFixed(2)),
    };
  }
  return studentData;
}