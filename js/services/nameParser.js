/**
 * Analiza una lista de nombres completos y los convierte al formato "Apellidos, Nombre".
 * @param {string} text - El texto con un nombre por línea.
 * @returns {Array<object>} Un array de objetos, cada uno con el nombre original y el formato sugerido.
 */
export function parseStudentNames(text) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) {
    return [];
  }

  return lines.map((originalName, index) => {
    const trimmedName = originalName.trim();
    let suggestedName = trimmedName; // Por defecto, es el mismo

    // Si el nombre no contiene coma, intentamos adivinar el formato.
    if (!trimmedName.includes(',')) {
      const parts = trimmedName.split(' ').filter(p => p);
      if (parts.length > 1) {
        const firstName = parts.shift(); // Asumimos que la primera palabra es el nombre
        const lastNames = parts.join(' '); // El resto son apellidos
        suggestedName = `${lastNames}, ${firstName}`;
      }
    }

    return {
      id: `suggestion-${index}`,
      original: trimmedName,
      suggested: suggestedName,
    };
  });
}
