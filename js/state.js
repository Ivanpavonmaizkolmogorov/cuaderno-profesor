// --- GESTIÓN DE ESTADO GLOBAL ---

let connectedFileHandle = null;
let saveTimeout = null;

// Estado principal de la aplicación
let state = {
  db: {
    modules: [],
    students: [],
    grades: {}, // { studentId: { actividadId: [ {id, grade, date, type, observation} ] } }
    actividades: [], // { id, moduleId, name, trimestre, ceIds: [] }
    comments: {},
    trimesterGrades: {}, // { moduleId: { studentId: { T1: 7.5, T2: 8.0, ... } } }
  },
  // Estado de navegación y UI
  ui: {
    page: 'configuracion', // 'modulos', 'alumnos', 'configuracion'
    selectedModuleId: null,
    moduleView: 'tabla', // 'tabla', 'alumno'
    selectedStudentIdForView: null, // ID del alumno en la vista 'alumno'
  },
  // Almacén para notas calculadas
  calculatedGrades: {},
};

// --- GETTERS (para leer el estado) ---
export const getDB = () => state.db;
export const getUI = () => state.ui;
export const getCalculatedGrades = () => state.calculatedGrades;

// --- SETTERS (para modificar el estado) ---
export const setDB = (newDb) => {
  state.db = newDb;
};

export const setPage = (newPage) => {
  state.ui.page = newPage;
};

export const setSelectedModuleId = (moduleId) => {
  state.ui.selectedModuleId = moduleId;
};

export const setModuleView = (newView) => {
  state.ui.moduleView = newView;
};

export const setSelectedStudentIdForView = (studentId) => {
  state.ui.selectedStudentIdForView = studentId;
};

export const setCalculatedGrades = (grades) => {
  state.calculatedGrades = grades;
};

// --- LÓGICA DE LOCALSTORAGE ---

export async function connectToFile() {
  if (!window.showOpenFilePicker) {
    alert("Tu navegador no soporta la API para conectar archivos. Por favor, usa un navegador moderno como Chrome o Edge.");
    return;
  }

  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
    });
    connectedFileHandle = fileHandle;
    const file = await fileHandle.getFile();
    const content = await file.text();
    if (content) {
      const newDb = JSON.parse(content);
      // Validar la estructura básica del JSON
      if (newDb && newDb.modules && newDb.students && newDb.grades && newDb.comments && newDb.trimesterGrades && newDb.actividades) {
        setDB(newDb);
      } else {
        throw new Error("El archivo JSON no tiene la estructura de base de datos esperada.");
      }
    }
    return fileHandle.name; // Devuelve el nombre del archivo para la UI
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error("Error al conectar con el archivo:", error);
      alert(`Error al conectar con el archivo: ${error.message}`);
    }
    return null;
  }
}

export async function saveAsAndConnect() {
  if (!window.showSaveFilePicker) {
    alert("Tu navegador no soporta la API para guardar archivos. Por favor, usa un navegador moderno como Chrome o Edge.");
    return null;
  }

  try {
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: 'cuaderno_profesor.json',
      types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
    });
    connectedFileHandle = fileHandle;
    // Una vez conectado, forzamos un guardado inmediato del estado actual.
    saveDB(); 
    return fileHandle.name;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error("Error al guardar el archivo:", error);
      alert(`Error al guardar el archivo: ${error.message}`);
    }
    return null;
  }
}

export function disconnectFile() {
  connectedFileHandle = null;
}

export function isConnected() {
  return connectedFileHandle !== null;
}

export function getConnectedFileName() {
    return connectedFileHandle ? connectedFileHandle.name : null;
}

export function saveDB() {
  if (!connectedFileHandle) return;

  // Debounce: esperar 500ms de inactividad antes de guardar
  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(async () => {
    try {
      const writable = await connectedFileHandle.createWritable();
      await writable.write(JSON.stringify(state.db, null, 2));
      await writable.close();
      console.log(`Archivo "${connectedFileHandle.name}" guardado.`);
    } catch (error) {
      console.error("Error al guardar en el archivo conectado:", error);
      alert(`Error al guardar en el archivo: ${error.message}`);
    }
  }, 500);
}

// Ya no necesitamos loadDB, connectToFile lo reemplaza.