// --- GESTIÓN DE ESTADO GLOBAL ---
import { updateFileInDrive } from './googleDriveLoader.js';

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
    selectedActividadId: null, // ID de la actividad para la página de detalle
    studentPageModuleFilter: 'all', // 'all' o un ID de módulo
    studentNameSuggestions: null, // { suggestions: [], moduleId: '' }
  },
  // Almacén para notas calculadas
  calculatedGrades: {},
};

let driveState = {
  isConnected: false,
  fileId: null,
  fileName: null,
  accessToken: null, // Guardaremos el token aquí para reusarlo
}

// --- GETTERS (para leer el estado) ---
export const getDB = () => state.db;
export const getUI = () => state.ui;
export const getCalculatedGrades = () => state.calculatedGrades;

// --- SETTERS (para modificar el estado) ---

export const setDriveConnection = (fileId, fileName, accessToken) => {
  driveState.isConnected = true;
  driveState.fileId = fileId;
  driveState.fileName = fileName;
  driveState.accessToken = accessToken;
};

export const getDriveState = () => driveState;

export const disconnectDrive = () => {
  driveState = { isConnected: false, fileId: null, fileName: null };
};

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

export const setSelectedActividadId = (actividadId) => {
  state.ui.selectedActividadId = actividadId;
};

export const setStudentPageModuleFilter = (moduleId) => {
  state.ui.studentPageModuleFilter = moduleId;
};

export const setCalculatedGrades = (grades) => {
  state.calculatedGrades = grades;
};

export function setUIProperty(key, value) {
  state.ui[key] = value;
}

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
  // --- INICIO DE LA CORRECCIÓN ---
  // La función ahora no se detiene, sino que intenta guardar en los destinos que estén activos.
  let isSaving = false;

  // 1. Lógica de guardado en archivo local (si está conectado)
  if (connectedFileHandle) {
    isSaving = true;
    // Debounce: esperar 500ms de inactividad antes de guardar
    if (saveTimeout) clearTimeout(saveTimeout);

    saveTimeout = setTimeout(async () => {
      try {
        const writable = await connectedFileHandle.createWritable();
        await writable.write(JSON.stringify(state.db, null, 2));
        await writable.close();
        console.log(`Archivo local "${connectedFileHandle.name}" guardado.`);
      } catch (error) {
        console.error("Error al guardar en el archivo local:", error);
      }
    }, 500);
  }

  // --- INICIO: LÓGICA DE GUARDADO EN LA NUBE ---
  // --- INICIO: LOGS DE DIAGNÓSTICO ---
  console.log('[LOG-SAVE] Verificando condiciones para guardado en la nube...');
  console.log(`[LOG-SAVE] - ¿Conectado a Drive?: ${driveState.isConnected}`);
  console.log(`[LOG-SAVE] - ¿Tenemos File ID?: ${driveState.fileId ? 'Sí' : 'No'}`);
  console.log(`[LOG-SAVE] - ¿Tenemos Access Token?: ${driveState.accessToken ? 'Sí' : 'No'}`);
  // --- FIN: LOGS DE DIAGNÓSTICO ---
  if (driveState.isConnected && driveState.fileId && driveState.accessToken) {
    console.log('[LOG-SAVE] ¡Condiciones cumplidas! Iniciando guardado en la nube.');
    showSavingIndicator(true); // Muestra "Guardando en la nube..."
    updateFileInDrive(driveState.fileId, state.db, driveState.accessToken)
      .then(success => {
        if (success) {
          console.log("Sincronización con Google Drive completada.");
          showSavingIndicator(false, false); // Guardado exitoso
        } else {
          console.error("Falló la sincronización con Google Drive.");
          showSavingIndicator(false, true); // Hubo un error
        }
      });
  } else {
    console.log('[LOG-SAVE] Condiciones no cumplidas. No se intentará guardar en la nube.');
  }
  // --- FIN: LÓGICA DE GUARDADO EN LA NUBE ---

  // Si no se activó ningún guardado, lo indicamos.
  if (!isSaving && !(driveState.isConnected && driveState.fileId)) {
    console.warn("saveDB fue llamado, pero no hay ninguna conexión activa (ni local ni en la nube) para guardar los datos.");
  }
  // --- FIN DE LA CORRECCIÓN ---
}

// Ya no necesitamos loadDB, connectToFile lo reemplaza.

/**
 * Muestra un indicador visual sutil sobre el estado del guardado en la nube.
 * @param {boolean} isSaving - True si está en proceso de guardado.
 * @param {boolean} [hasError=false] - True si el guardado finalizó con error.
 */
function showSavingIndicator(isSaving, hasError = false) {
  let indicator = document.getElementById('cloud-save-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'cloud-save-indicator';
    // Clases base para posicionamiento y transición
    indicator.className = 'fixed bottom-4 right-4 flex items-center gap-2 text-white text-sm py-2 px-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-y-20 opacity-0';
    document.body.appendChild(indicator);
  }

  // Limpiar clases de color anteriores
  indicator.classList.remove('bg-gray-800', 'bg-green-600', 'bg-red-600');

  if (isSaving) {
    indicator.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Guardando en la nube...
    `;
    indicator.classList.add('bg-gray-800');
    // Forzar reflow para que la animación de entrada funcione
    void indicator.offsetWidth; 
    indicator.classList.remove('translate-y-20', 'opacity-0');
  } else {
    if (hasError) {
      indicator.innerHTML = `<span>❌</span> Error al guardar`;
      indicator.classList.add('bg-red-600');
    } else {
      indicator.innerHTML = `<span>✔️</span> Guardado en la nube`;
      indicator.classList.add('bg-green-600');
    }
    // Ocultar el indicador después de unos segundos
    setTimeout(() => {
      indicator.classList.add('translate-y-20', 'opacity-0');
    }, 2500);
  }
}