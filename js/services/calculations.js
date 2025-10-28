// --- LÓGICA DE CÁLCULO ---

export function calculateModuleGrades(module, students, grades, actividades) {
  if (!module || !students || students.length === 0) return {};

  const studentData = {};
  const ras = module.resultados_de_aprendizaje;
  const moduleActividades = actividades.filter(a => a.moduleId === module.id);

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
        const grade = ceFinalGrades[ce.ce_id] ?? 0; // Si no hay nota, es un 0
        raWeightedTotal += (grade * weight);
        raTotalWeight += weight;
      }

      const raGrade = (raTotalWeight > 0) ? (raWeightedTotal / raTotalWeight) : 0;
      raTotals[ra.ra_id] = parseFloat(raGrade.toFixed(2));
    }

    // La nota del módulo es la media de las notas de los RAs (sin ponderar entre ellos)
    const raGrades = Object.values(raTotals);
    const moduleGrade = raGrades.length > 0 ? raGrades.reduce((sum, grade) => sum + grade, 0) / raGrades.length : 0;

    studentData[student.id] = {
      raTotals,
      moduleGrade: parseFloat(moduleGrade.toFixed(2)),
    };
  }
  return studentData;
}