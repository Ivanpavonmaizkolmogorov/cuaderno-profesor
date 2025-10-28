// --- LÓGICA DE IMPORTACIÓN Y EXPORTACIÓN DE DATOS ---

export function importStudents(text) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) {
    throw new Error("No se encontraron alumnos en el texto.");
  }

  // Validación estricta: todas las líneas deben contener una coma.
  if (lines.some(line => !line.includes(','))) {
    throw new Error("Error de formato: Todas las líneas deben usar el formato 'Apellidos, Nombre'.\n\nPor favor, corrige el listado y vuelve a intentarlo.\nEjemplo: Pérez Padillo, Marta");
  }

  const sortByName = (a, b) => {
    const getNameParts = (fullName) => {
      if (fullName.includes(',')) {
        const parts = fullName.split(',');
        return { lastName: parts[0].trim(), firstName: parts[1].trim() };
      } else {
        // Heurística anterior como fallback: asume que la última palabra es el nombre
        const words = fullName.split(' ');
        const firstName = words.pop();
        const lastName = words.join(' ');
        return { lastName: lastName || firstName, firstName: lastName ? firstName : '' };
      }
    };

    const partsA = getNameParts(a.name);
    const partsB = getNameParts(b.name);

    const lastNameCompare = partsA.lastName.localeCompare(partsB.lastName, 'es', { sensitivity: 'base' });
    if (lastNameCompare !== 0) {
      return lastNameCompare;
    }
    return partsA.firstName.localeCompare(partsB.firstName, 'es', { sensitivity: 'base' });
  };

  const newStudents = lines.map(line => ({
    id: crypto.randomUUID(),
    name: line.trim()
  })).sort(sortByName);

  return newStudents;
}

export function importModule(text, currentModules) {
  const newModule = JSON.parse(text);
  if (!newModule.id || !newModule.modulo || !newModule.resultados_de_aprendizaje) {
    throw new Error("El JSON no tiene la estructura de módulo esperada (id, modulo, resultados_de_aprendizaje).");
  }

  if (currentModules.find(m => m.id === newModule.id)) {
    throw new Error(`Ya existe un módulo con el ID "${newModule.id}". No se puede importar duplicado.`);
  }

  return newModule;
}

export function downloadTextAsFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportData(db) {
  try {
    const json = JSON.stringify(db, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cuaderno_profesor_backup_${timestamp}.json`;
    downloadTextAsFile(json, filename, 'application/json');
  } catch (error) {
    console.error("Error exporting data:", error);
    throw new Error(`Error al exportar datos: ${error.message}`);
  }
}