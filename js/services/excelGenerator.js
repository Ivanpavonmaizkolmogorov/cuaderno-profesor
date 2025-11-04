// js/services/excelGenerator.js

/**
 * Ayudante para obtener nombres de columnas de Excel (A, B, ..., Z, AA, AB, ...).
 * @param {number} n - Índice de la columna (base 1).
 * @returns {string} Nombre de la columna.
 */
function getColName(n) {
  let s = '';
  while (n > 0) {
    s = String.fromCharCode(((n - 1) % 26) + 65) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/**
 * Función principal para generar y descargar el Excel con fórmulas.
 * @param {object} db - El objeto de la base de datos (de state.getDB()).
 */
export function exportToExcel(db) {
    console.log("--- exportToExcel INICIADO (Generador) ---"); // Chivato 7

  if (!window.XLSX) {
    console.error("¡ERROR! La librería SheetJS (window.XLSX) no está cargada."); // Chivato 8
    alert("Error: La librería SheetJS (XLSX) no está cargada.");
    return;
  }
  
  const wb = XLSX.utils.book_new();

  console.log("Iniciando exportación a Excel...", db);

  // --- 1. Iterar por cada MÓDULO para crear una PESTAÑA ---
  for (const module of db.modules) {
    if (!module || !module.resultados_de_aprendizaje) continue;

    console.log(`Procesando módulo: ${module.modulo}`);

    // Objeto de la hoja de cálculo (worksheet). Lo construiremos celda por celda.
    const ws = {}; 
    const students = (module.studentIds || [])
      .map(id => db.students.find(s => s.id === id))
      .filter(Boolean);
    
    // Ordenamos los elementos para tener un layout predecible
    const moduleActividades = db.actividades
      .filter(a => a.moduleId === module.id)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    const allCes = module.resultados_de_aprendizaje
      .flatMap(ra => ra.criterios_de_evaluacion.map(ce => ({ ...ce, ra_id: ra.ra_id })))
      .sort((a, b) => a.ce_id.localeCompare(b.ce_id));
    
    const allRas = module.resultados_de_aprendizaje
      .sort((a, b) => a.ra_id.localeCompare(b.ra_id));

    let colIndex = 1;
    // Usamos un Map para rastrear qué columna (letra) corresponde a qué dato
    // Ej: { 'act_id123': 'B', 'ce_RA1-a': 'F' }
    const colMap = new Map(); 

    // --- 2. CONSTRUIR LA FILA DE CABECERA (Fila 1) ---

    // Columna A: Alumno/a
    ws['A1'] = { t: 's', v: 'Alumno/a' };
    colIndex++;

    // Columnas para Actividades (B, C, D...)
    for (const act of moduleActividades) {
      const colName = getColName(colIndex);
      ws[`${colName}1`] = { t: 's', v: `${act.name} (T${act.trimestre})` };
      colMap.set(`act_${act.id}`, colName); // 'act_uuid' -> 'B'
      colIndex++;
    }

    // Columnas para los Criterios de Evaluación (Avg. CE)
    for (const ce of allCes) {
      const colName = getColName(colIndex);
      ws[`${colName}1`] = { t: 's', v: `Avg: ${ce.ce_id}` };
      colMap.set(`ce_${ce.ce_id}`, colName); // 'ce_RA1-a' -> 'F'
      colIndex++;
    }

    // Columnas para los Resultados de Aprendizaje (Nota RA)
    for (const ra of allRas) {
      const colName = getColName(colIndex);
      ws[`${colName}1`] = { t: 's', v: `Nota: ${ra.ra_id}` };
      colMap.set(`ra_${ra.ra_id}`, colName); // 'ra_RA1' -> 'I'
      colIndex++;
    }

    // Columna Final: Nota Módulo
    const moduleCol = getColName(colIndex);
    ws[`${moduleCol}1`] = { t: 's', v: 'Nota Final Módulo' };
    colMap.set('module_final', moduleCol);
    colIndex++;

    // --- 3. CONSTRUIR LAS FILAS DE DATOS (Fila 2 en adelante) ---
    let rowIndex = 2;
    for (const student of students) {
      const studentGrades = db.grades[student.id] || {};
      const rowNum = rowIndex; // Fila actual (ej: 2)

      // Columna A: Nombre del Alumno
      ws[`A${rowNum}`] = { t: 's', v: student.name };

      // Columnas de Actividades (Valores brutos)
      // Aquí ponemos la nota máxima de la actividad
      for (const act of moduleActividades) {
        const colName = colMap.get(`act_${act.id}`);
        const attempts = studentGrades[act.id] || [];
        const maxGrade = attempts.length > 0 ? Math.max(...attempts.map(a => a.grade)) : 0;
        ws[`${colName}${rowNum}`] = { t: 'n', v: maxGrade, z: '0.00' };
      }

      // Columnas de Criterios de Evaluación (¡FORMULA!)
      // Lógica: La nota del CE es la media de las notas máximas de las actividades que lo evalúan.
      for (const ce of allCes) {
        const colName = colMap.get(`ce_${ce.ce_id}`);
        // 1. Encontrar las actividades que evalúan este CE
        const actsForThisCE = moduleActividades.filter(act => act.ceIds.includes(ce.ce_id));
        // 2. Obtener las letras de las columnas de esas actividades
        const gradeCells = actsForThisCE
          .map(act => colMap.get(`act_${act.id}`))
          .filter(Boolean)
          .map(col => `${col}${rowNum}`); // Ej: ['B2', 'C2']
        
        // 3. Crear la fórmula de Excel
        let formula = '0';
        if (gradeCells.length > 0) {
          // Tu lógica es: "averageGrade = ... / gradesFromActivities.length"
          // Esto es un AVERAGE simple en Excel.
          formula = `AVERAGE(${gradeCells.join(',')})`;
        }
        ws[`${colName}${rowNum}`] = { t: 'n', f: formula, z: '0.00' };
      }

      // Columnas de Resultados de Aprendizaje (¡FORMULA!)
      // Lógica: La nota del RA es la media ponderada de sus CEs.
      for (const ra of allRas) {
        const colName = colMap.get(`ra_${ra.ra_id}`);
        const ceColsForRA = [];
        const ceWeightsForRA = [];

        for (const ce of ra.criterios_de_evaluacion) {
          const ceCol = colMap.get(`ce_${ce.ce_id}`);
          if (ceCol) {
            ceColsForRA.push(`${ceCol}${rowNum}`); // Ej: 'F2'
            ceWeightsForRA.push(ce.peso || 0);     // Ej: 50
          }
        }
        
        let formula = '0';
        if (ceColsForRA.length > 0) {
          // Tu lógica: "raWeightedTotal / raTotalWeight"
          // En Excel, la media ponderada (si las celdas no son contiguas) es:
          // ((F2 * 50) + (G2 * 50)) / (50 + 50)
          const weightedParts = ceColsForRA.map((col, i) => `(${col}*${ceWeightsForRA[i]})`);
          const totalWeight = ceWeightsForRA.reduce((a, b) => a + b, 0);

          if (totalWeight > 0) {
            formula = `(${weightedParts.join('+')})/${totalWeight}`;
          }
        }
        ws[`${colName}${rowNum}`] = { t: 'n', f: formula, z: '0.00' };
      }

      // Columna de Nota Final del Módulo (¡FORMULA!)
      // Lógica: Media ponderada de TODOS los CEs del módulo (los no evaluados cuentan como 0).
      const moduleGradeCol = colMap.get('module_final');
      const allCeCells = [];
      const allCeWeights = [];

      for (const ce of allCes) { // Usamos la lista completa de CEs
         const ceCol = colMap.get(`ce_${ce.ce_id}`);
         if (ceCol) {
           allCeCells.push(`${ceCol}${rowNum}`);
           allCeWeights.push(ce.peso || 0);
         }
      }

      let formula = '0';
      if (allCeCells.length > 0) {
         const weightedParts = allCeCells.map((col, i) => `(${col}*${allCeWeights[i]})`);
         const totalWeight = allCeWeights.reduce((a, b) => a + b, 0);
         if (totalWeight > 0) {
           formula = `(${weightedParts.join('+')})/${totalWeight}`;
         }
      }
      ws[`${moduleGradeCol}${rowNum}`] = { t: 'n', f: formula, z: '0.00' };

      rowIndex++;
    }
    
    // --- 4. FINALIZAR LA HOJA (WS) ---
    // Definir el rango de la hoja (ej: A1:K10)
    const range = { s: { c: 0, r: 0 }, e: { c: colIndex - 1, r: rowIndex - 1 } };
    ws['!ref'] = XLSX.utils.encode_range(range);
    
    // Limpiar el nombre del módulo para la pestaña (máx 31 chars, sin caracteres especiales)
    const sheetName = module.modulo.replace(/[\/\\?*\[\]]/g, '').substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  // --- 5. DISPARAR LA DESCARGA DEL LIBRO (WB) ---
  console.log("Generación completa. Descargando archivo...");
  XLSX.writeFile(wb, "Cuaderno_Profesor_Con_Formulas.xlsx");
}