// --- LÓGICA DE CÁLCULO ---

export function calculateModuleGrades(module, students, grades) {
  if (!module || !students || students.length === 0) return {};
  const studentData = {};
  const ras = module.resultados_de_aprendizaje;

  for (const student of students) {
    if (!student || !student.id) continue;

    const studentGrades = grades && grades[student.id] ? grades[student.id] : {};
    let moduleTotalWeighted = 0;
    let moduleTotalWeight = 0;
    const raTotals = {};

    for (const ra of ras) {
      let raWeightedTotal = 0;
      let raTotalWeight = 0;

      for (const ce of ra.criterios_de_evaluacion) {
        const weight = typeof ce.peso === 'number' ? ce.peso : 0;
        // Permitir null/undefined como 0
        const grade = typeof studentGrades[ce.ce_id] === 'number' ? studentGrades[ce.ce_id] : 0;
        const validGrade = Math.max(0, Math.min(10, grade));

        raWeightedTotal += (validGrade * weight);
        raTotalWeight += weight;
      }

      const raGrade = (raTotalWeight > 0) ? (raWeightedTotal / raTotalWeight) : 0;
      raTotals[ra.ra_id] = parseFloat(raGrade.toFixed(2));

      moduleTotalWeighted += raWeightedTotal;
      moduleTotalWeight += raTotalWeight;
    }

    const moduleGrade = (moduleTotalWeight > 0) ? (moduleTotalWeighted / moduleTotalWeight) : 0;

    studentData[student.id] = {
      raTotals,
      moduleGrade: parseFloat(moduleGrade.toFixed(2)),
    };
  }
  return studentData;
}