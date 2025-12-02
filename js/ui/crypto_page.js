
import { getDB } from '../state.js';
import { generateStudentHTML, CryptoEngine } from '../crypto/engine.js';
import { ICONS } from './constants.js';

export function renderCryptoPage() {
    const db = getDB();
    const modules = db.modules || [];

    return `
    <div class="container mx-auto px-6 py-8">
        <h2 class="text-3xl font-bold mb-6">Generador de Tareas Criptográficas</h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- CREAR TAREA -->
            <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
                <h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
                    ${ICONS.Plus || '➕'} Crear Nueva Tarea
                </h3>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">📂 Historial de Tareas (Cargar Configuración)</label>
                    <div class="flex gap-2">
                        <select id="crypto-history-select" class="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700 text-sm">
                            <option value="">-- Nueva Tarea --</option>
                            ${(db.cryptoTasks || []).slice().reverse().map(t => `<option value="${t.id}">${t.name} (${new Date(t.createdAt).toLocaleDateString()})</option>`).join('')}
                        </select>
                        <button type="button" id="crypto-import-history-btn" class="px-3 py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors" title="Importar Tareas desde Excel">
                            🔄
                        </button>
                        <button type="button" id="crypto-delete-task-btn" class="px-3 py-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors" title="Borrar Tarea Seleccionada">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <form id="crypto-task-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de la Tarea</label>
                        <input type="text" id="crypto-task-name" class="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700" placeholder="Ej: Examen Tema 1" required>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semilla (Seed)</label>
                        <div class="flex gap-2">
                            <input type="number" id="crypto-task-seed" class="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700" placeholder="Aleatorio si está vacío">
                            <button type="button" id="crypto-generate-seed-btn" class="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300">🎲</button>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clase / Módulo (Alumnos)</label>
                        <select id="crypto-module-select" class="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700">
                            <option value="">-- Seleccionar Clase --</option>
                            ${modules.map(m => `<option value="${m.id}">${m.modulo}</option>`).join('')}
                        </select>
                        <p class="text-xs text-gray-500 mt-1">Se usarán los alumnos matriculados en este módulo.</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modo de Trabajo</label>
                        <div class="flex gap-4 mb-4">
                            <label class="inline-flex items-center cursor-pointer">
                                <input type="radio" name="crypto-task-mode" value="individual" checked class="form-radio text-blue-600">
                                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Individual</span>
                            </label>
                            <label class="inline-flex items-center cursor-pointer">
                                <input type="radio" name="crypto-task-mode" value="cooperative" class="form-radio text-purple-600">
                                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300 font-bold text-purple-600">Cooperativo (Nuevo)</span>
                            </label>
                        </div>
                        
                        <div class="mb-4">
                            <label class="inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="crypto-secure-mode" class="form-checkbox text-green-600 h-5 w-5" checked>
                                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300 font-bold">🔒 Modo Seguro (Anti-Suplantación)</span>
                            </label>
                            <p class="text-xs text-gray-500 ml-7 mt-1">Genera códigos de acceso únicos (ej: A1B2) en lugar de usar el número de lista. Evita que un alumno entre como otro.</p>
                        </div>

                        <!-- Group Management Panel (Hidden by default) -->
                        <div id="group-management-panel" class="hidden mt-2 p-4 border border-purple-200 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <h4 class="font-bold text-purple-800 dark:text-purple-300 mb-2 text-sm">👥 Gestión de Equipos (Arrastrar y Soltar)</h4>
                            
                            <div class="flex items-center gap-2 mb-4">
                                <button type="button" id="auto-group-btn" class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded transition-colors">
                                    🎲 Reparto Aleatorio
                                </button>
                                <input type="number" id="group-size-input" value="3" min="2" max="10" class="w-12 p-1 border rounded text-sm text-center" title="Tamaño para aleatorio">
                                <span class="text-gray-400">|</span>
                                <button type="button" id="add-group-btn" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-colors">
                                    + Añadir Grupo
                                </button>
                                <button type="button" id="reset-groups-btn" class="px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 text-xs font-bold rounded transition-colors">
                                    Reiniciar
                                </button>
                            </div>

                            <div class="flex gap-4 h-80">
                                <!-- Student Pool -->
                                <div class="w-1/3 flex flex-col">
                                    <h5 class="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Sin Asignar</h5>
                                    <div id="student-pool" class="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 overflow-y-auto space-y-1 drop-zone">
                                        <p class="text-xs text-gray-400 text-center mt-4">Selecciona una clase...</p>
                                    </div>
                                </div>
                                
                                <!-- Groups Grid -->
                                <div class="w-2/3 flex flex-col">
                                    <h5 class="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Equipos</h5>
                                    <div id="groups-grid" class="flex-1 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded p-2 overflow-y-auto grid grid-cols-2 gap-2 content-start">
                                        <!-- Groups will appear here -->
                                    </div>
                                </div>
                            </div>
                            <!-- Hidden input to store final config -->
                            <input type="hidden" id="groups-config-json">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Configuración JSON</label>
                        <textarea id="crypto-task-json" rows="6" class="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700 font-mono text-xs" placeholder='{"questions": [...]}'></textarea>
                        <button type="button" id="crypto-load-example-btn" class="text-xs text-blue-500 hover:underline mt-1">Cargar Ejemplo</button>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL Google Apps Script (Opcional)</label>
                        <div class="flex gap-2">
                            <input type="url" id="crypto-google-url" class="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700 text-xs" placeholder="https://script.google.com/macros/s/...">
                            <button type="button" id="crypto-paste-url-btn" class="px-3 py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors whitespace-nowrap" title="Pegar desde Portapapeles">
                                📋 Pegar
                            </button>
                            <button type="button" id="crypto-help-btn" class="px-3 py-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors" title="Ver Guía de Configuración">
                                ❓
                            </button>
                            <a href="https://script.google.com/home" target="_blank" class="px-3 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors" title="Abrir Google Apps Script">
                                📝
                            </a>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                        <input type="checkbox" id="crypto-anti-copy" class="h-4 w-4 text-red-600" checked>
                        <label for="crypto-anti-copy" class="text-sm font-medium text-red-800 dark:text-red-300">Activar Protección Anti-Copia</label>
                    </div>

                    <button type="submit" class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
                        Generar Tarea HTML
                    </button>
                </form>
            </div>

            <!-- VERIFICAR -->
            <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
                <h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
                    ${ICONS.Check || '✅'} Verificar Respuesta
                </h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semilla de la Tarea</label>
                        <input type="number" id="verify-seed" class="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código del Alumno</label>
                        <input type="number" id="verify-student-code" class="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clave (Hash)</label>
                        <input type="text" id="verify-hash" class="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700 font-mono">
                    </div>
                    
                    <button id="verify-btn" class="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors">
                        Verificar Nota
                    </button>

                    <div id="verify-result" class="hidden p-4 rounded-lg text-center font-bold text-lg"></div>
                </div>

                <hr class="my-6 border-gray-200 dark:border-gray-700">

                <h4 class="font-semibold mb-2">Simular Examen del Alumno (Solucionario)</h4>
                <p class="text-sm text-gray-500 mb-4">Genera el examen exacto que está viendo el alumno ahora mismo para ver sus datos y soluciones.</p>
                <button id="reconstruct-btn" class="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors mb-4">
                    👁️ Simular Examen y Ver Soluciones
                </button>
                <button id="view-access-codes-btn" class="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors mb-4 hidden">
                    🔑 Ver Códigos de Acceso (Modo Seguro)
                </button>
                <textarea id="verify-json" class="hidden"></textarea> <!-- Hidden input for reconstruction logic -->
                <div id="reconstruction-container" class="space-y-4 hidden max-h-96 overflow-y-auto p-2 border rounded dark:border-gray-700"></div>

                <hr class="my-6 border-gray-200 dark:border-gray-700">

                <h4 class="font-semibold mb-2">Visor de Notas (Excel)</h4>
                <p class="text-sm text-gray-500 mb-2">Consulta las notas guardadas en Google Sheets sin salir de la app.</p>
                <button id="import-grades-btn" class="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors mb-4">
                    📥 Reconstrucción de Tareas
                </button>

                <hr class="my-6 border-gray-200 dark:border-gray-700">

                <h4 class="font-semibold mb-2">Tabla Maestra (Previsualización)</h4>
                <p class="text-sm text-gray-500 mb-2">Genera una tarea para ver aquí las claves de solución.</p>
                <div id="master-table-preview" class="overflow-x-auto max-h-60 border rounded dark:border-gray-700">
                    <table class="w-full text-sm text-left">
                        <thead class="bg-gray-100 dark:bg-gray-700 text-xs uppercase">
                            <tr>
                                <th class="px-4 py-2">Alumno</th>
                                <th class="px-4 py-2">Código</th>
                                <th class="px-4 py-2">Clave (10)</th>
                            </tr>
                        </thead>
                        <tbody id="master-table-body">
                            <tr><td colspan="3" class="px-4 py-2 text-center text-gray-500">Sin datos</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    
    <!-- MODAL DE AYUDA GOOGLE SHEETS -->
    <div id="google-help-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-11/12 md:w-2/3 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold">Cómo configurar Google Sheets</h3>
                <button id="close-google-help" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl">&times;</button>
            </div>
            
            <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <p>Sigue estos pasos para recibir las notas automáticamente en una hoja de cálculo:</p>
                
                <ol class="list-decimal list-inside space-y-2 ml-2">
                    <li>Crea una nueva hoja en <a href="https://sheets.new" target="_blank" class="text-blue-500 hover:underline">Google Sheets</a>.</li>
                    <li>Ve al menú <strong>Extensiones</strong> > <strong>Apps Script</strong>.</li>
                    <li>Borra el código que aparece y pega el siguiente script:</li>
                </ol>

                <div class="relative">
                    <pre class="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs font-mono overflow-x-auto select-all">
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    
    // Hoja de resumen de notas
    var summarySheet = doc.getSheetByName("Notas") || doc.insertSheet("Notas");
    var headers = summarySheet.getRange(1, 1, 1, 8).getValues()[0];
    if (headers[0] !== "Timestamp") {
      summarySheet.appendRow(["Timestamp", "Nombre", "Código", "Clase", "Nota", "Clave (Hash)", "Semilla", "Total Preguntas", "Correctas"]);
    }
    
    summarySheet.appendRow([
      new Date(),
      data.studentName || "",
      data.studentCode,
      data.moduleName || "",
      data.score,
      data.phrase,
      data.seed,
      data.totalQuestions || "",
      data.correctCount || ""
    ]);
    
    // Hoja de respuestas detalladas (evidencias)
    if (data.answers && data.answers.length > 0) {
      var answersSheet = doc.getSheetByName("Evidencias") || doc.insertSheet("Evidencias");
      var answersHeaders = answersSheet.getRange(1, 1, 1, 8).getValues()[0];
      if (answersHeaders[0] !== "Timestamp") {
        answersSheet.appendRow(["Timestamp", "Nombre", "Código", "Clase", "Semilla", "#", "Pregunta", "Respuesta Alumno", "Correcta"]);
      }
      
      data.answers.forEach(function(ans) {
        answersSheet.appendRow([
          new Date(),
          data.studentName || "",
          data.studentCode,
          data.moduleName || "",
          data.seed,
          ans.questionNumber,
          ans.question,
          ans.studentAnswer,
          ans.isCorrect ? "SÍ" : "NO"
        ]);
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": e }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
</pre>
                    <button id="copy-script-btn" class="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 text-xs rounded hover:bg-blue-600">Copiar</button>
                </div>

                <ol class="list-decimal list-inside space-y-2 ml-2" start="4">
                    <li>Haz clic en <strong>Implantar</strong> (Deploy) > <strong>Nueva implementación</strong>.</li>
                    <li>Selecciona el tipo: <strong>Aplicación web</strong>.</li>
                    <li>Configura:
                        <ul class="list-disc list-inside ml-6 mt-1 text-gray-600 dark:text-gray-400">
                            <li>Descripción: "Receptor de Notas" (o lo que quieras).</li>
                            <li>Ejecutar como: <strong>Yo</strong> (tu cuenta).</li>
                            <li>Quién tiene acceso: <strong>Cualquier usuario</strong> (Anyone). <span class="text-red-500 font-bold">*Importante</span></li>
                        </ul>
                    </li>
                    <li>Haz clic en <strong>Implantar</strong>. Autoriza el acceso si te lo pide.</li>
                    <li>Copia la <strong>URL de la aplicación web</strong> generada.</li>
                    <li>Pega esa URL en el campo "URL Google Apps Script" de esta aplicación.</li>
                </ol>
            </div>
            
            <div class="mt-6 text-right">
                <button id="close-google-help-btn-2" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Entendido</button>
            </div>
        </div>
    </div>
    `;
}

export function attachCryptoListeners() {
    // Load saved Google Script URL
    const db = getDB();

    // --- SAFETY NET: Recover History from LocalStorage if session is empty ---
    try {
        const localData = localStorage.getItem('cuaderno-profesor-db');
        if (localData) {
            const localDB = JSON.parse(localData);

            // 1. Recover Google URL
            if (!db.googleScriptUrl && localDB.googleScriptUrl) {
                db.googleScriptUrl = localDB.googleScriptUrl;
            }

            // 2. Recover Tasks if session is empty but local has data
            if ((!db.cryptoTasks || db.cryptoTasks.length === 0) && localDB.cryptoTasks && localDB.cryptoTasks.length > 0) {
                console.log("DEBUG: Recovering crypto tasks from LocalStorage safety net.");
                db.cryptoTasks = localDB.cryptoTasks;
            }
        }
    } catch (e) {
        console.error("Error reading from localStorage:", e);
    }

    const googleUrlInput = document.getElementById('crypto-google-url');

    // Default URL if none saved
    const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyFme8d4_NvfwCPvjKRxNi7w6gJgHl2_h3pi8mAZCSjbIZKnnc0ZNm1hQWuQaKqJat2jA/exec';

    if (!db.googleScriptUrl) {
        console.log("DEBUG: No saved Google URL, using default.");
        db.googleScriptUrl = DEFAULT_SCRIPT_URL;
        // Save to DB immediately
        localStorage.setItem('cuaderno-profesor-db', JSON.stringify(db));
    }

    if (googleUrlInput) {
        googleUrlInput.value = db.googleScriptUrl;
    }

    // History Loader
    const historySelect = document.getElementById('crypto-history-select');

    // Refresh Dropdown if we recovered data
    if (historySelect && db.cryptoTasks && db.cryptoTasks.length > 0) {
        // Check if dropdown is empty (has only default option)
        if (historySelect.options.length <= 1) {
            historySelect.innerHTML = `<option value="">-- Nueva Tarea --</option>` +
                db.cryptoTasks.slice().reverse().map(t => `<option value="${t.id}">${t.name} (${new Date(t.createdAt).toLocaleDateString()})</option>`).join('');
        }
    }

    if (historySelect) {
        historySelect.addEventListener('change', () => {
            const taskId = historySelect.value;
            if (!taskId) {
                // Clear form for new task
                document.getElementById('crypto-task-name').value = '';
                document.getElementById('crypto-task-seed').value = '';
                document.getElementById('crypto-task-json').value = '';
                return;
            }

            const db = getDB();
            const task = db.cryptoTasks.find(t => t.id === taskId);
            if (task) {
                document.getElementById('crypto-task-name').value = task.name;
                document.getElementById('crypto-task-seed').value = task.seed;
                document.getElementById('crypto-task-json').value = JSON.stringify(task.config, null, 2);
                if (task.moduleId) document.getElementById('crypto-module-select').value = task.moduleId;

                // Toggle Secure Mode Button
                const viewCodesBtn = document.getElementById('view-access-codes-btn');
                if (viewCodesBtn) {
                    if (task.secureMode) {
                        viewCodesBtn.classList.remove('hidden');
                    } else {
                        viewCodesBtn.classList.add('hidden');
                    }
                }
            }
        });
    }

    // View Access Codes Logic
    const viewCodesBtn = document.getElementById('view-access-codes-btn');
    if (viewCodesBtn) {
        viewCodesBtn.addEventListener('click', async () => {
            const historySelect = document.getElementById('crypto-history-select');
            const taskId = historySelect.value;
            if (!taskId) return;

            const db = getDB();
            const task = db.cryptoTasks.find(t => t.id === taskId);
            if (!task || !task.moduleId) {
                alert("No se puede recuperar la lista de alumnos de esta tarea.");
                return;
            }

            const module = db.modules.find(m => m.id === task.moduleId);
            if (!module || !module.studentIds) return;

            const students = module.studentIds.map((id, index) => {
                const s = db.students.find(s => s.id === id);
                return s ? { ...s, originalIndex: index } : null;
            }).filter(Boolean);

            // Sort alphabetically (Robust)
            students.sort((a, b) => {
                const nameA = (a.apellidos || '') + ' ' + (a.nombre || '') || a.name || '';
                const nameB = (b.apellidos || '') + ' ' + (b.nombre || '') || b.name || '';
                return nameA.localeCompare(nameB);
            });

            let rows = '';
            for (const s of students) {
                // Use originalIndex + 1 (List Number) to match the HTML generator logic
                const listNumber = s.originalIndex + 1;
                const raw = `ACCESS-${task.seed}-${listNumber}`;
                const hash = await CryptoEngine.hash(raw);
                const code = hash.substring(0, 4).toUpperCase();
                const displayName = s.apellidos ? `${s.apellidos}, ${s.nombre}` : s.name;

                rows += `<tr class="border-b dark:border-gray-700">
                    <td class="p-2">${displayName}</td>
                    <td class="p-2 font-mono font-bold text-center text-blue-600 dark:text-blue-400 text-lg select-all">${code}</td>
                </tr>`;
            }

            // Create Modal
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;';
            modal.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-11/12 md:w-1/2 max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold">🔑 Códigos de Acceso - ${task.name}</h3>
                        <button class="text-gray-500 hover:text-gray-700 text-2xl" onclick="this.closest('div').parentElement.parentElement.remove()">&times;</button>
                    </div>
                    <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">Proyecta esta lista o diles su código a cada alumno. Deben introducirlo tal cual para entrar.</p>
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-100 dark:bg-gray-700">
                                <th class="p-2">Alumno</th>
                                <th class="p-2 text-center">Código</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <div class="mt-6 text-right">
                        <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onclick="this.closest('div').parentElement.parentElement.remove()">Cerrar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        });
    }

    // Delete Task Logic
    const deleteBtn = document.getElementById('crypto-delete-task-btn');
    if (deleteBtn && historySelect) {
        deleteBtn.addEventListener('click', () => {
            const taskId = historySelect.value;
            if (!taskId) {
                alert("Selecciona una tarea del historial para borrarla.");
                return;
            }

            const db = getDB();
            const taskIndex = db.cryptoTasks.findIndex(t => t.id === taskId);

            if (taskIndex !== -1) {
                const taskName = db.cryptoTasks[taskIndex].name;
                if (confirm(`¿Estás seguro de que quieres borrar la tarea "${taskName}"?\n\nEsta acción no se puede deshacer.`)) {
                    // Remove
                    db.cryptoTasks.splice(taskIndex, 1);

                    // Save
                    localStorage.setItem('cuaderno-profesor-db', JSON.stringify(db));
                    if (window.saveDB) window.saveDB();

                    // Update UI
                    historySelect.innerHTML = `<option value="">-- Nueva Tarea --</option>` +
                        db.cryptoTasks.slice().reverse().map(t => `<option value="${t.id}">${t.name} (${new Date(t.createdAt).toLocaleDateString()})</option>`).join('');

                    // Clear form
                    document.getElementById('crypto-task-name').value = '';
                    document.getElementById('crypto-task-seed').value = '';
                    document.getElementById('crypto-task-json').value = '';
                    historySelect.value = "";

                    alert("Tarea borrada correctamente.");
                }
            }
        });
    }

    // Save Google Script URL when changed
    if (googleUrlInput) {
        googleUrlInput.addEventListener('blur', () => {
            const db = getDB();
            db.googleScriptUrl = googleUrlInput.value.trim();
            localStorage.setItem('cuaderno-profesor-db', JSON.stringify(db));
        });
    }

    // Paste URL from clipboard
    const pasteUrlBtn = document.getElementById('crypto-paste-url-btn');
    if (pasteUrlBtn && googleUrlInput) {
        pasteUrlBtn.addEventListener('click', async () => {
            // User's Google Apps Script URL
            const predefinedUrl = 'https://script.google.com/macros/s/AKfycbyFme8d4_NvfwCPvjKRxNi7w6gJgHl2_h3pi8mAZCSjbIZKnnc0ZNm1hQWuQaKqJat2jA/exec';

            googleUrlInput.value = predefinedUrl;

            // Trigger save
            const db = getDB();
            db.googleScriptUrl = predefinedUrl;
            localStorage.setItem('cuaderno-profesor-db', JSON.stringify(db));

            // Visual feedback
            const originalText = pasteUrlBtn.innerHTML;
            pasteUrlBtn.innerHTML = '✅ Listo';
            setTimeout(() => pasteUrlBtn.innerHTML = originalText, 1500);
        });
    }

    // Help Modal Logic
    const helpBtn = document.getElementById('crypto-help-btn');
    const modal = document.getElementById('google-help-modal');
    const closeBtn = document.getElementById('close-help-modal');
    const closeBtn2 = document.getElementById('close-help-modal-btn-2'); // Renamed from close-google-help-btn-2
    const copyBtn = document.getElementById('copy-script-btn'); // Renamed from copyScriptBtn

    if (helpBtn && modal) {
        helpBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        });

        const closeModal = () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        };

        closeBtn?.addEventListener('click', closeModal);
        closeBtn2?.addEventListener('click', closeModal);

        // Close on click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Copy script button functionality
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const code = `function doPost(e) {
  var lock = LockService.getScriptLock();
  // 2. Ve a "Implantar" > "Gestionar implementaciones"
  // 3. Pulsa el icono de LÁPIZ (Editar)
  // 4. En "Versión", selecciona "Nueva versión"
  // 5. Pulsa "Implantar"
  // 
  // ¡IMPORTANTE! Si haces esto, la URL NO cambia y no tienes que actualizarla en la app.
  // Si creas una "Nueva implementación" desde cero, la URL cambiará y tendrás que poner la nueva en la app.

  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    
    // Hoja de resumen de notas
    var summarySheet = doc.getSheetByName("Notas") || doc.insertSheet("Notas");
    var headersRange = summarySheet.getRange(1, 1, 1, summarySheet.getLastColumn() || 1);
    var headers = headersRange.getValues()[0];
    
    // Inicializar si está vacía
    if (headers[0] !== "Timestamp") {
      headers = ["Timestamp", "Nombre", "Código", "Clase", "Nota", "Clave (Hash)", "Semilla", "Total Preguntas", "Correctas", "Tarea", "Config", "Respuestas"];
      summarySheet.appendRow(headers);
    } else {
      // Check if "Respuestas" column exists, if not add it
      var foundRespuestas = false;
      for (var i = 0; i < headers.length; i++) {
        if (headers[i] === "Respuestas") foundRespuestas = true;
      }
      if (!foundRespuestas) {
        // Add header
        summarySheet.getRange(1, headers.length + 1).setValue("Respuestas");
        // Update headers array
        headers.push("Respuestas");
      }
    }
    
    // VERIFICAR DUPLICADOS: Búsqueda robusta de columnas
    var allData = summarySheet.getDataRange().getValues();
    var sheetHeaders = allData[0];
    
    // Función auxiliar para buscar índice de columna por varios nombres
    function findColIndex(headers, possibleNames) {
      for (var i = 0; i < headers.length; i++) {
        var h = String(headers[i]).toLowerCase().trim();
        for (var j = 0; j < possibleNames.length; j++) {
          if (h === possibleNames[j].toLowerCase()) return i;
        }
      }
      return -1;
    }

    var codeIndex = findColIndex(sheetHeaders, ["Código", "Codigo", "Code", "Student Code", "Id"]);
    var seedIndex = findColIndex(sheetHeaders, ["Semilla", "Seed", "Random"]);
    var taskIndex = findColIndex(sheetHeaders, ["Tarea", "Task", "Prueba"]);

    // Si encontramos las columnas, verificamos duplicados
    if (codeIndex !== -1 && seedIndex !== -1) {
       for (var i = 1; i < allData.length; i++) {
         var row = allData[i];
         // Check if Code AND Seed match (same student taking same exam instance)
         // Also check Task Name if available to be extra sure
         var sameCode = String(row[codeIndex]) === String(data.studentCode);
         var sameSeed = String(row[seedIndex]) === String(data.seed);
         var sameTask = taskIndex !== -1 ? (String(row[taskIndex]) === String(data.taskName)) : true;

         if (sameCode && sameSeed && sameTask) {
             return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": "DUPLICATE_SUBMISSION: Ya has entregado esta tarea." }))
               .setMimeType(ContentService.MimeType.JSON);
         }
       }
    }

    // Preparar fila
    var newRow = [];
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      if (header === "Timestamp") newRow.push(new Date());
      else if (header === "Nombre") newRow.push(data.studentName);
      else if (header === "Código") newRow.push(data.studentCode);
      else if (header === "Clase") newRow.push(data.moduleName || "");
      else if (header === "Nota") {
          // v2.0 FIX: Force comma for Spanish Sheets
          var val = data.score;
          if (typeof val === 'number') val = String(val);
          val = val.replace('.', ',');
          newRow.push(val);
      }
      else if (header === "Clave (Hash)") newRow.push(data.phrase);
      else if (header === "Semilla") newRow.push(data.seed);
      else if (header === "Total Preguntas") newRow.push(data.totalQuestions);
      else if (header === "Correctas") newRow.push(data.correctCount);
      else if (header === "Tarea") newRow.push(data.taskName);
      else if (header === "Config") newRow.push(JSON.stringify(data.taskConfig));
      else if (header === "Respuestas") newRow.push(JSON.stringify(data.answers)); 
      else newRow.push("");
    }
    
    summarySheet.appendRow(newRow);
    
    // Hoja de respuestas detalladas (evidencias)
    if (data.answers && data.answers.length > 0) {
      var answersSheet = doc.getSheetByName("Evidencias") || doc.insertSheet("Evidencias");
      var answersHeaders = answersSheet.getRange(1, 1, 1, 10).getValues()[0];
      if (answersHeaders[0] !== "Timestamp") {
        answersSheet.appendRow(["Timestamp", "Nombre", "Código", "Clase", "Semilla", "#", "Pregunta", "Respuesta Alumno", "Correcta", "Tarea"]);
      }
      
      data.answers.forEach(function(ans) {
        answersSheet.appendRow([
          new Date(),
          data.studentName || "",
          data.studentCode,
          data.moduleName || "",
          data.seed,
          ans.questionNumber,
          ans.question,
          ans.studentAnswer,
          ans.isCorrect ? "SÍ" : "NO",
          data.taskName || ""
        ]);
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": e }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName("Notas");
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": "No sheet named Notas" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);
  
  var results = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      obj[header] = row[index];
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(results))
    .setMimeType(ContentService.MimeType.JSON);
}`;
                navigator.clipboard.writeText(code).then(() => {
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = '¡Copiado!';
                    setTimeout(() => copyBtn.textContent = originalText, 2000);
                });
            });
        }
    }

    // Generate Seed
    const seedBtn = document.getElementById('crypto-generate-seed-btn');
    if (seedBtn) {
        seedBtn.addEventListener('click', () => {
            document.getElementById('crypto-task-seed').value = Math.floor(Math.random() * 9000) + 1000;
        });
    }

    // Load History
    const historyDropdown = document.getElementById('crypto-history-select');
    if (historyDropdown) {
        historyDropdown.addEventListener('change', (e) => {
            const taskId = e.target.value;
            if (!taskId) return;

            const db = getDB();
            const task = db.cryptoTasks?.find(t => t.id === taskId);
            if (task) {
                document.getElementById('crypto-task-name').value = task.name || "";
                document.getElementById('crypto-task-seed').value = task.seed || "";
                document.getElementById('crypto-module-select').value = task.moduleId || "";
                document.getElementById('crypto-task-json').value = task.config ? JSON.stringify(task.config, null, 2) : "";
                document.getElementById('crypto-google-url').value = task.googleUrl || "";
                document.getElementById('crypto-anti-copy').checked = task.antiCopy !== false;

                // Set mode if exists
                if (task.config && task.config.mode) {
                    const modeRadio = document.querySelector(`input[name="crypto-task-mode"][value="${task.config.mode}"]`);
                    if (modeRadio && !modeRadio.disabled) {
                        modeRadio.checked = true;
                        // Trigger change event to show/hide panel
                        modeRadio.dispatchEvent(new Event('change'));
                    }

                    // RESTORE GROUPS
                    if (task.config.mode === 'cooperative' && task.config.groups) {
                        console.log("DEBUG: Attempting to restore groups", task.config.groups);

                        // Determine Module ID: Use saved ID or current selection fallback
                        let targetModuleId = task.moduleId;
                        const moduleSelect = document.getElementById('crypto-module-select');

                        if (!targetModuleId) {
                            if (moduleSelect) {
                                targetModuleId = moduleSelect.value;
                                console.log("DEBUG: Fallback to selected module:", targetModuleId);
                                console.log("DEBUG: Module Select Options:", moduleSelect.options.length);
                            }
                        }

                        if (targetModuleId) {
                            const module = db.modules.find(m => m.id === targetModuleId);
                            console.log("DEBUG: Module found:", module);

                            // Auto-select the module in the dropdown if it wasn't selected
                            if (moduleSelect && moduleSelect.value !== targetModuleId) {
                                moduleSelect.value = targetModuleId;
                            }

                            if (module && module.studentIds) {
                                const allStudents = module.studentIds.map(id => db.students.find(s => s.id === id)).filter(Boolean);
                                console.log("DEBUG: All Students:", allStudents);

                                // Reconstruct groups state
                                groups = [];
                                const assignedIds = new Set();

                                task.config.groups.forEach(g => {
                                    const groupMembers = [];
                                    g.members.forEach(memberCode => {
                                        // MemberCode is the List Index (1-based)
                                        const index = parseInt(memberCode) - 1;
                                        if (index >= 0 && index < allStudents.length) {
                                            const student = allStudents[index];
                                            groupMembers.push(student);
                                            assignedIds.add(student.id);
                                        } else {
                                            console.warn("DEBUG: Student not found for code", memberCode, "Index:", index);
                                        }
                                    });
                                    if (groupMembers.length > 0) groups.push(groupMembers);
                                });

                                console.log("DEBUG: Reconstructed Groups:", groups);

                                // Update unassigned
                                unassignedStudents = allStudents.filter(s => !assignedIds.has(s.id));

                                // Render
                                renderUI();
                                updateGroupsConfig();
                            }
                        } else {
                            console.warn("DEBUG: No moduleId found (saved or selected)");
                            // Save pending groups to restore later when module is selected
                            pendingGroupsConfig = task.config.groups;
                            alert("⚠️ ¡Atención!\n\nEsta tarea antigua no tiene guardada la clase a la que pertenece.\n\nPara recuperar los grupos:\n1. Cierra este mensaje.\n2. Selecciona la CLASE correcta en el desplegable 'Clase / Módulo'.\n\nLos grupos aparecerán automáticamente al seleccionar la clase.");
                        }
                    } else {
                        console.log("DEBUG: No groups to restore or not cooperative");
                    }
                }
            }
        });
    }

    // Import History from Excel
    const importHistoryBtn = document.getElementById('crypto-import-history-btn');
    if (importHistoryBtn) {
        importHistoryBtn.addEventListener('click', async () => {
            const googleUrl = document.getElementById('crypto-google-url').value;
            if (!googleUrl) {
                alert("Por favor, introduce la URL del Script de Google para importar.");
                return;
            }

            importHistoryBtn.textContent = "⏳";
            try {
                const response = await fetch(googleUrl);
                const data = await response.json();

                if (Array.isArray(data)) {
                    const db = getDB();
                    if (!db.cryptoTasks) db.cryptoTasks = [];

                    let importedCount = 0;
                    data.forEach(row => {
                        // Find config column (Config or JSON)
                        const getVal = (key) => {
                            const keys = Object.keys(row);
                            let k = keys.find(k => k.toLowerCase() === key.toLowerCase());
                            if (!k) k = keys.find(k => k.toLowerCase().includes(key.toLowerCase()));
                            return k ? row[k] : null;
                        };

                        const taskName = getVal("Tarea");
                        const seed = getVal("Semilla");
                        const configRaw = getVal("Config") || getVal("JSON");
                        const className = getVal("Clase");

                        if (taskName && seed && configRaw) {
                            // Check if exists
                            const exists = db.cryptoTasks.find(t => t.name === taskName && t.seed == seed);
                            if (!exists) {
                                let config = null;
                                try { config = JSON.parse(configRaw); } catch (e) { }

                                if (config) {
                                    // CLEANUP: Remove students list from config to keep it generic
                                    if (config.students) delete config.students;

                                    // Resolve Module ID
                                    let moduleId = null;
                                    if (className) {
                                        const module = db.modules.find(m => m.name === className);
                                        if (module) moduleId = module.id;
                                    }

                                    db.cryptoTasks.push({
                                        id: Date.now().toString() + Math.random(),
                                        name: taskName,
                                        seed: seed,
                                        config: config,
                                        moduleId: moduleId,
                                        googleUrl: googleUrl,
                                        createdAt: new Date().toISOString()
                                    });
                                    importedCount++;
                                }
                            }
                        }
                    });

                    if (importedCount > 0) {
                        localStorage.setItem('cuaderno-profesor-db', JSON.stringify(db));
                        if (window.saveDB) window.saveDB();
                        alert(`✅ Se han importado ${importedCount} tareas al historial.`);

                        // Update dropdown dynamically without reloading
                        const historyDropdown = document.getElementById('crypto-history-select');
                        if (historyDropdown) {
                            historyDropdown.innerHTML = `<option value="">-- Nueva Tarea --</option>` +
                                db.cryptoTasks.slice().reverse().map(t => `<option value="${t.id}">${t.name} (${new Date(t.createdAt).toLocaleDateString()})</option>`).join('');
                        }
                    } else {
                        alert("No se encontraron tareas nuevas para importar.");
                    }
                }
            } catch (err) {
                console.error(err);
                alert("Error al importar: " + err.message);
            } finally {
                importHistoryBtn.textContent = "🔄";
            }
        });
    }



    // Cooperative Mode Logic
    const modeRadios = document.querySelectorAll('input[name="crypto-task-mode"]');
    const groupPanel = document.getElementById('group-management-panel');
    const autoGroupBtn = document.getElementById('auto-group-btn');
    const addGroupBtn = document.getElementById('add-group-btn');
    const resetGroupsBtn = document.getElementById('reset-groups-btn');
    const studentPool = document.getElementById('student-pool');
    const groupsGrid = document.getElementById('groups-grid');

    // State
    let unassignedStudents = [];
    let groups = []; // Array of arrays of student objects
    let pendingGroupsConfig = null; // Store groups here if module is missing during load

    // Toggle Panel
    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'cooperative') {
                groupPanel.classList.remove('hidden');
                loadStudentsFromModule(); // Initial load
            } else {
                groupPanel.classList.add('hidden');
            }
        });
    });

    function loadStudentsFromModule() {
        const moduleId = document.getElementById('crypto-module-select').value;
        if (!moduleId) {
            studentPool.innerHTML = '<p class="text-xs text-gray-400 text-center mt-4">Selecciona una clase...</p>';
            return;
        }
        const db = getDB();
        const module = db.modules.find(m => m.id === moduleId);
        if (!module || !module.studentIds) return;

        // Reset
        unassignedStudents = module.studentIds.map(id => db.students.find(s => s.id === id)).filter(Boolean);
        groups = [];
        renderUI();
    }

    // Listen for Module Change to reload pool
    const moduleSelect = document.getElementById('crypto-module-select');

    function updateReconstructionSelector() {
        const moduleId = moduleSelect.value;
        const select = document.getElementById('reconstruct-student-select');
        if (!select) return;

        select.innerHTML = '<option value="">-- Seleccionar Alumno --</option>';

        if (!moduleId) return;

        const db = getDB();
        const module = db.modules.find(m => m.id === moduleId);
        if (module && module.studentIds) {
            // Map students with their original index (which acts as the Code)
            const students = module.studentIds.map((id, index) => {
                const s = db.students.find(s => s.id === id);
                return s ? { ...s, originalIndex: index } : null;
            }).filter(Boolean);

            // Sort for display (Robust)
            students.sort((a, b) => {
                const nameA = (a.apellidos || '') + ' ' + (a.nombre || '') || a.name || '';
                const nameB = (b.apellidos || '') + ' ' + (b.nombre || '') || b.name || '';
                return nameA.localeCompare(nameB);
            });

            students.forEach(s => {
                const code = s.originalIndex + 1;
                const displayName = s.apellidos ? `${s.apellidos}, ${s.nombre}` : s.name;
                const option = document.createElement('option');
                option.value = code;
                option.textContent = `${displayName} (ID: ${code})`;
                select.appendChild(option);
            });
        }
    }

    // Add listener to reconstruction selector
    const reconstructSelect = document.getElementById('reconstruct-student-select');
    if (reconstructSelect) {
        reconstructSelect.addEventListener('change', (e) => {
            const codeInput = document.getElementById('verify-student-code');
            if (codeInput) codeInput.value = e.target.value;
        });
    }

    if (moduleSelect) {
        moduleSelect.addEventListener('change', () => {
            updateReconstructionSelector(); // Update selector on change
            if (!groupPanel.classList.contains('hidden')) {
                loadStudentsFromModule();

                // Check if we have pending groups to restore
                if (pendingGroupsConfig) {
                    console.log("DEBUG: Restoring pending groups for new module...");
                    const db = getDB();
                    const moduleId = moduleSelect.value;
                    const module = db.modules.find(m => m.id === moduleId);

                    if (module && module.studentIds) {
                        const allStudents = module.studentIds.map(id => db.students.find(s => s.id === id)).filter(Boolean);

                        groups = [];
                        const assignedIds = new Set();

                        pendingGroupsConfig.forEach(g => {
                            const groupMembers = [];
                            g.members.forEach(memberCode => {
                                const index = parseInt(memberCode) - 1;
                                if (index >= 0 && index < allStudents.length) {
                                    const student = allStudents[index];
                                    groupMembers.push(student);
                                    assignedIds.add(student.id);
                                }
                            });
                            if (groupMembers.length > 0) groups.push(groupMembers);
                        });

                        // Update unassigned
                        unassignedStudents = allStudents.filter(s => !assignedIds.has(s.id));

                        // Render
                        renderUI();
                        updateGroupsConfig();

                        // Clear pending
                        pendingGroupsConfig = null;
                        console.log("DEBUG: Pending groups restored!");
                    }
                }
            }
        });
    }

    function renderUI() {
        // Render Pool
        studentPool.innerHTML = '';
        unassignedStudents.forEach(s => {
            studentPool.appendChild(createStudentEl(s));
        });
        // Drop zone for Pool
        setupDropZone(studentPool, (studentId) => {
            moveStudentToPool(studentId);
        });

        // Render Groups
        groupsGrid.innerHTML = '';
        groups.forEach((group, groupIndex) => {
            const groupEl = document.createElement('div');
            groupEl.className = "bg-white dark:bg-gray-800 p-2 rounded border border-purple-200 dark:border-purple-800 shadow-sm flex flex-col h-32";
            groupEl.innerHTML = `
                <div class="flex justify-between items-center mb-1 border-b border-gray-100 dark:border-gray-700 pb-1">
                    <span class="font-bold text-purple-700 dark:text-purple-400 text-xs">Grupo ${groupIndex + 1} (${group.length})</span>
                    <button class="text-red-400 hover:text-red-600 text-xs font-bold px-1" title="Eliminar Grupo">×</button>
                </div>
                <div class="flex-1 overflow-y-auto space-y-1 group-drop-zone bg-gray-50 dark:bg-gray-900/50 rounded p-1"></div>
            `;

            // Delete Group Btn
            groupEl.querySelector('button').addEventListener('click', () => {
                // Return students to pool
                unassignedStudents.push(...group);
                groups.splice(groupIndex, 1);
                renderUI();
            });

            const dropZone = groupEl.querySelector('.group-drop-zone');
            group.forEach(s => {
                dropZone.appendChild(createStudentEl(s));
            });

            setupDropZone(dropZone, (studentId) => {
                moveStudentToGroup(studentId, groupIndex);
            });

            groupsGrid.appendChild(groupEl);
        });

        // Update hidden input for Submit handler
        updateGroupsConfig();
    }

    function createStudentEl(student) {
        const el = document.createElement('div');
        el.className = "bg-white dark:bg-gray-700 p-1 px-2 rounded border border-gray-200 dark:border-gray-600 text-xs cursor-move hover:bg-blue-50 dark:hover:bg-blue-900 shadow-sm select-none truncate";
        el.draggable = true;
        el.textContent = student.name;
        el.title = student.name;
        el.dataset.id = student.id;

        el.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', student.id);
            e.dataTransfer.effectAllowed = 'move';
            el.classList.add('opacity-50');
        });

        el.addEventListener('dragend', () => {
            el.classList.remove('opacity-50');
        });

        return el;
    }

    function setupDropZone(el, onDrop) {
        el.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            el.classList.add('bg-blue-50', 'dark:bg-blue-900/30');
        });
        el.addEventListener('dragleave', () => {
            el.classList.remove('bg-blue-50', 'dark:bg-blue-900/30');
        });
        el.addEventListener('drop', (e) => {
            e.preventDefault();
            el.classList.remove('bg-blue-50', 'dark:bg-blue-900/30');
            const studentId = e.dataTransfer.getData('text/plain');
            if (studentId) onDrop(studentId);
        });
    }

    function findStudentAndRemove(id) {
        // Check pool
        let idx = unassignedStudents.findIndex(s => s.id == id); // loose equality for string/number match
        if (idx !== -1) return unassignedStudents.splice(idx, 1)[0];

        // Check groups
        for (let g of groups) {
            idx = g.findIndex(s => s.id == id);
            if (idx !== -1) return g.splice(idx, 1)[0];
        }
        return null;
    }

    function moveStudentToPool(id) {
        const s = findStudentAndRemove(id);
        if (s) {
            unassignedStudents.push(s);
            renderUI();
        }
    }

    function moveStudentToGroup(id, groupIndex) {
        const s = findStudentAndRemove(id);
        if (s) {
            groups[groupIndex].push(s);
            renderUI();
        }
    }

    function updateGroupsConfig() {
        // We need to map Student DB IDs to List Indices (1, 2, 3...) because that's what students use to login
        const moduleId = document.getElementById('crypto-module-select').value;
        let moduleStudentIds = [];
        if (moduleId) {
            const db = getDB();
            const module = db.modules.find(m => m.id === moduleId);
            if (module) moduleStudentIds = module.studentIds;
        }

        const configGroups = groups.map((g, i) => ({
            id: i + 1,
            members: g.map(s => {
                const index = moduleStudentIds.indexOf(s.id);
                // Return 1-based index if found, otherwise keep original ID (fallback)
                return index !== -1 ? index + 1 : s.id;
            })
        }));

        const input = document.getElementById('groups-config-json');
        if (input) input.value = JSON.stringify(configGroups);
    }

    // Buttons Logic
    if (autoGroupBtn) {
        autoGroupBtn.addEventListener('click', () => {
            // Move everyone to pool first to ensure full shuffle? Or just shuffle pool?
            // Let's reset everything to pool first
            groups.forEach(g => unassignedStudents.push(...g));
            groups = [];

            const size = parseInt(document.getElementById('group-size-input').value) || 3;
            if (unassignedStudents.length === 0) {
                loadStudentsFromModule(); // Try reload if empty
                if (unassignedStudents.length === 0) return;
            }

            unassignedStudents.sort(() => Math.random() - 0.5);

            while (unassignedStudents.length > 0) {
                // Take chunk
                const chunk = unassignedStudents.splice(0, size);
                groups.push(chunk);
            }
            renderUI();
        });
    }

    if (addGroupBtn) {
        addGroupBtn.addEventListener('click', () => {
            groups.push([]);
            renderUI();
        });
    }

    if (resetGroupsBtn) {
        resetGroupsBtn.addEventListener('click', () => {
            groups.forEach(g => unassignedStudents.push(...g));
            groups = [];
            renderUI();
        });
    }

    // Load Example
    const exampleBtn = document.getElementById('crypto-load-example-btn');
    if (exampleBtn) {
        exampleBtn.addEventListener('click', () => {
            const mode = document.querySelector('input[name="crypto-task-mode"]:checked').value;
            let example;

            if (mode === 'cooperative') {
                example = {
                    "scenario": "<h3>Misión: Protocolo Fantasma</h3><p>Agentes, para activar el sistema debéis obtener vuestros códigos de acceso individuales y luego combinarlos.</p>",
                    "questions": [
                        // BLOQUE 1: INICIACIÓN
                        {
                            "type": "parallel",
                            "items": [
                                { "variables": { "a": { "min": 2, "max": 9 } }, "formula": "a * 10", "question": "Fase 1 (Individual): Calcula {a} x 10." },
                                { "variables": { "b": { "min": 2, "max": 9 } }, "formula": "b * 10 + 5", "question": "Fase 1 (Individual): Calcula {b} x 10 + 5." }
                            ]
                        },
                        {
                            "type": "parallel",
                            "items": [
                                { "variables": { "c": { "min": 1, "max": 5 } }, "formula": "c + 100", "question": "Fase 2 (Individual): Suma 100 a {c}." },
                                { "variables": { "d": { "min": 1, "max": 5 } }, "formula": "d + 200", "question": "Fase 2 (Individual): Suma 200 a {d}." }
                            ]
                        },
                        {
                            "shards": ["El resultado de la Fase 1 fue {r1}", "El resultado de la Fase 2 fue {r2}"],
                            "variables": { "r1": { "min": 20, "max": 95 }, "r2": { "min": 101, "max": 205 } },
                            "formula": "r1 + r2",
                            "question": "CHECKPOINT 1 (Grupal): Sumad vuestros resultados de la Fase 1 y Fase 2."
                        },

                        // BLOQUE 2: OPERACIONES INTERMEDIAS
                        {
                            "type": "parallel",
                            "items": [
                                { "variables": { "e": { "min": 50, "max": 60 } }, "formula": "e - 10", "question": "Fase 4 (Individual): Resta 10 a {e}." },
                                { "variables": { "f": { "min": 50, "max": 60 } }, "formula": "f - 20", "question": "Fase 4 (Individual): Resta 20 a {f}." }
                            ]
                        },
                        {
                            "type": "parallel",
                            "items": [
                                { "variables": { "g": { "min": 2, "max": 8 } }, "formula": "g * 2", "question": "Fase 5 (Individual): Dobla el valor de {g}." },
                                { "variables": { "h": { "min": 2, "max": 8 } }, "formula": "h * 3", "question": "Fase 5 (Individual): Triplica el valor de {h}." }
                            ]
                        },
                        {
                            "type": "parallel",
                            "items": [
                                { "variables": { "i": { "min": 20, "max": 40 } }, "formula": "i / 2", "question": "Fase 6 (Individual): Divide {i} entre 2." },
                                { "variables": { "j": { "min": 20, "max": 40 } }, "formula": "j / 2", "question": "Fase 6 (Individual): Divide {j} entre 2." }
                            ]
                        },
                        {
                            "shards": ["Clave Fase 4: {k1}", "Clave Fase 5: {k2}", "Clave Fase 6: {k3}"],
                            "variables": { "k1": { "min": 30, "max": 50 }, "k2": { "min": 4, "max": 24 }, "k3": { "min": 10, "max": 20 } },
                            "formula": "k1 + k2 + k3",
                            "question": "CHECKPOINT 2 (Grupal): Sumad los resultados de las Fases 4, 5 y 6."
                        },

                        // BLOQUE 3: FASE FINAL
                        {
                            "type": "parallel",
                            "items": [
                                { "variables": { "k": { "min": 2, "max": 5 } }, "formula": "k * k", "question": "Fase 8 (Individual): Calcula el cuadrado de {k}." },
                                { "variables": { "l": { "min": 2, "max": 5 } }, "formula": "l * l * l", "question": "Fase 8 (Individual): Calcula el cubo de {l}." }
                            ]
                        },
                        {
                            "shards": ["El cuadrado fue {sq}", "El cubo fue {cb}"],
                            "variables": { "sq": { "min": 4, "max": 25 }, "cb": { "min": 8, "max": 125 } },
                            "formula": "cb - sq",
                            "question": "Fase 9 (Grupal): Restad el Cuadrado al Cubo (Cubo - Cuadrado)."
                        },
                        {
                            "shards": ["Suma Checkpoint 1: {cp1}", "Suma Checkpoint 2: {cp2}", "Resultado Fase 9: {f9}"],
                            "variables": { "cp1": { "min": 100, "max": 300 }, "cp2": { "min": 50, "max": 100 }, "f9": { "min": 1, "max": 100 } },
                            "formula": "cp1 + cp2 + f9",
                            "question": "MISIÓN FINAL: Introducid la suma de TODOS los resultados grupales anteriores (Checkpoint 1 + Checkpoint 2 + Fase 9)."
                        }
                    ]
                };
            } else {
                example = {
                    "scenario": "<h3>Supuesto: La Tienda</h3><p>Estamos en una tienda con un IVA del 21%.</p><p>Hoy hay un descuento especial del 10% en ropa.</p>",
                    "questions": [
                        {
                            "variables": { "precio": { "min": 10, "max": 100 } },
                            "formula": "Number((precio * 1.21).toFixed(2))",
                            "question": "Calcula el precio final con IVA de un producto que cuesta {precio}€."
                        },
                        {
                            "variables": { "precioRopa": { "min": 20, "max": 80 } },
                            "formula": "Number((precioRopa * 0.90).toFixed(2))",
                            "question": "Una camisa cuesta {precioRopa}€. Aplica el descuento del 10%."
                        },
                        {
                            "variables": { "cantidad": { "min": 2, "max": 10 }, "precioUnitario": { "min": 5, "max": 15 } },
                            "formula": "Number((cantidad * precioUnitario).toFixed(2))",
                            "question": "Si compro {cantidad} unidades a {precioUnitario}€ cada una, ¿cuánto pago en total?"
                        },
                        {
                            "variables": { "total": { "min": 10, "max": 50 }, "pagado": { "min": 50, "max": 100 } },
                            "formula": "Number((pagado - total).toFixed(2))",
                            "question": "La cuenta es de {total}€ y pago con {pagado}€. ¿Cuánto me devuelven?"
                        }
                    ]
                };
            }
            document.getElementById('crypto-task-json').value = JSON.stringify(example, null, 2);
        });
    }

    // Submit Form
    const form = document.getElementById('crypto-task-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('crypto-task-name').value;
            let seed = document.getElementById('crypto-task-seed').value;
            if (!seed) seed = Math.floor(Math.random() * 9000) + 1000;

            const moduleId = document.getElementById('crypto-module-select').value;
            const jsonText = document.getElementById('crypto-task-json').value;
            const googleUrl = document.getElementById('crypto-google-url').value;
            const antiCopy = document.getElementById('crypto-anti-copy').checked;

            let config = null;
            try {
                config = jsonText ? JSON.parse(jsonText) : null;
            } catch (err) {
                alert("Error en el JSON: " + err.message);
                return;
            }

            // Add Mode to Config
            const mode = document.querySelector('input[name="crypto-task-mode"]:checked').value;
            if (config) {
                config.mode = mode;
            } else {
                alert("⚠️ Debes introducir una configuración JSON válida (o cargar un ejemplo).");
                return;
            }

            if (!config.questions || !Array.isArray(config.questions) || config.questions.length === 0) {
                alert("⚠️ El JSON debe contener una lista de preguntas ('questions').");
                return;
            }

            // Add Groups if Cooperative
            if (mode === 'cooperative') {
                const groupsJson = document.getElementById('groups-config-json').value;
                let groups = [];
                try {
                    groups = groupsJson ? JSON.parse(groupsJson) : [];
                } catch (e) { }

                // Filter empty groups
                groups = groups.filter(g => g.members && g.members.length > 0);

                if (groups.length > 0) {
                    if (!config) config = {};
                    config.groups = groups;
                } else {
                    alert("⚠️ Modo Cooperativo seleccionado pero no has generado grupos.");
                    return;
                }
            }

            const moduleSelect = document.getElementById('crypto-module-select');
            const moduleName = moduleSelect.options[moduleSelect.selectedIndex].text;

            // Prepare student list with codes for the HTML generator
            let studentsForTask = [];
            if (moduleId) {
                const db = getDB();
                const module = db.modules.find(m => m.id === moduleId);
                if (module && module.studentIds) {
                    studentsForTask = module.studentIds.map((sId, index) => {
                        const s = db.students.find(st => st.id === sId);
                        if (s) {
                            // Code generation logic must match the preview table logic (index + 1)
                            return { id: index + 1, name: s.name };
                        }
                        return null;
                    }).filter(Boolean);
                }
            }

            const secureMode = document.getElementById('crypto-secure-mode').checked;

            // SAVE TASK TO HISTORY
            const db = getDB();
            if (!db.cryptoTasks) db.cryptoTasks = [];

            // Check if updating existing or creating new
            const existingIndex = db.cryptoTasks.findIndex(t => t.name === name && t.seed == seed);

            const taskData = {
                id: existingIndex !== -1 ? db.cryptoTasks[existingIndex].id : Date.now().toString(),
                name,
                seed,
                moduleId,
                config,
                googleUrl,
                antiCopy,
                secureMode,
                createdAt: new Date().toISOString()
            };

            if (existingIndex !== -1) {
                db.cryptoTasks[existingIndex] = taskData;
            } else {
                db.cryptoTasks.push(taskData);
            }

            // Save DB
            localStorage.setItem('cuaderno-profesor-db', JSON.stringify(db));
            // Trigger global save if available
            if (window.saveDB) window.saveDB();

            // Update dropdown dynamically
            const historySelect = document.getElementById('crypto-history-select');
            if (historySelect) {
                // Re-render options
                historySelect.innerHTML = `<option value="">-- Nueva Tarea --</option>` +
                    db.cryptoTasks.slice().reverse().map(t => `<option value="${t.id}">${t.name} (${new Date(t.createdAt).toLocaleDateString()})</option>`).join('');
                historySelect.value = taskData.id;
                // Trigger change event to update UI (show simulation buttons, etc.)
                historySelect.dispatchEvent(new Event('change'));
            }

            const htmlContent = await generateStudentHTML(name, seed, config, antiCopy, googleUrl, studentsForTask, moduleName, secureMode);

            // Copy HTML to clipboard
            navigator.clipboard.writeText(htmlContent).then(() => {
                const fileName = `Tarea - ${name.replace(/\s+/g, '-')}.html`;
                alert(`✅ HTML copiado al portapapeles.\n\nPara guardar la tarea: \n1.Abre un editor de texto(Bloc de notas, TextEdit, VSCode, etc.) \n2.Pega el contenido(Cmd + V / Ctrl + V) \n3.Guarda como: ${fileName} \n4.Asegúrate de usar la extensión.html`);
            }).catch(err => {
                console.error('Error al copiar:', err);
                // Fallback: show in a modal
                const modal = document.createElement('div');
                modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;';
                modal.innerHTML = `
    < div style = "background:white;padding:2rem;border-radius:8px;max-width:80%;max-height:80%;overflow:auto;" >
                        <h2>HTML Generado</h2>
                        <p>Copia este contenido y guárdalo como archivo .html:</p>
                        <textarea id="html-output" style="width:100%;height:400px;font-family:monospace;font-size:12px;">${htmlContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
                        <div style="margin-top:1rem;text-align:right;">
                            <button onclick="navigator.clipboard.writeText(document.getElementById('html-output').value).then(() => alert('Copiado!')).catch(() => alert('Selecciona el texto y copia manualmente'))" style="margin-right:0.5rem;">Copiar</button>
                            <button onclick="this.closest('div[style*=fixed]').remove()">Cerrar</button>
                        </div>
                    </div >
    `;
                document.body.appendChild(modal);
            });

            // Generate Master Table Preview if module is selected
            if (moduleId) {
                const db = getDB();
                const module = db.modules.find(m => m.id === moduleId);
                if (module && module.studentIds) {
                    const tbody = document.getElementById('master-table-body');
                    tbody.innerHTML = '';

                    for (let i = 0; i < module.studentIds.length; i++) {

                        const sId = module.studentIds[i];
                        const student = db.students.find(s => s.id === sId);
                        if (student) {
                            // We use a simple integer code based on index for now, or we could use a hash of the ID
                            // To keep it simple and consistent with the previous logic:
                            const code = i + 1;
                            const proof = await CryptoEngine.generateProof(seed, code, 10);

                            const tr = document.createElement('tr');
                            tr.className = "border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700";
                            tr.innerHTML = `
                                <td class="px-4 py-2">${student.name}</td>
                                <td class="px-4 py-2 font-bold">${code}</td>
                                <td class="px-4 py-2 font-mono text-blue-600 dark:text-blue-400">${proof}</td>
                            `;
                            tbody.appendChild(tr);
                        }
                    }
                }
            }
        });
    }

    // Verify
    const verifyBtn = document.getElementById('verify-btn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', async () => {
            const seed = document.getElementById('verify-seed').value;
            const code = document.getElementById('verify-student-code').value;
            const hash = document.getElementById('verify-hash').value;
            const resultDiv = document.getElementById('verify-result');

            if (!seed || !code || !hash) return;

            let foundScore = -1;
            for (let i = 0; i <= 100; i++) {
                const score = i / 10;
                const check = await CryptoEngine.generateProof(seed, code, score);
                if (check === hash) {
                    foundScore = score;
                    break;
                }
            }

            resultDiv.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800');
            if (foundScore !== -1) {
                resultDiv.classList.add('bg-green-100', 'text-green-800');
                resultDiv.textContent = `✅ Nota Correcta: ${foundScore} `;
            } else {
                resultDiv.classList.add('bg-red-100', 'text-red-800');
                resultDiv.textContent = `❌ Clave Inválida`;
            }
        });
    }

    // Reconstruction
    const reconstructBtn = document.getElementById('reconstruct-btn');
    if (reconstructBtn) {
        reconstructBtn.addEventListener('click', () => {
            const seed = document.getElementById('verify-seed').value;
            const code = document.getElementById('verify-student-code').value;
            const jsonText = document.getElementById('crypto-task-json').value;

            if (!seed || !code) {
                alert("Por favor, introduce la Semilla y el Código del Alumno arriba.");
                return;
            }

            if (!jsonText) {
                alert("⚠️ Falta la Configuración JSON.\n\nPara reconstruir el examen, necesito saber qué preguntas eran.\nCarga el JSON de la tarea en el formulario de la izquierda.");
                return;
            }

            let config;
            try {
                config = JSON.parse(jsonText);
            } catch (err) {
                alert("El JSON de configuración no es válido.");
                return;
            }

            const container = document.getElementById('reconstruction-container');
            container.innerHTML = '';
            container.classList.remove('hidden');

            // Render Scenario if present
            if (config.scenario) {
                const scenarioDiv = document.createElement('div');
                scenarioDiv.className = "p-4 mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm";
                scenarioDiv.innerHTML = `<h4 class="font-bold text-blue-800 dark:text-blue-300 mb-2">Escenario / Supuesto</h4>${config.scenario}`;
                container.appendChild(scenarioDiv);
            }

            const questions = config.questions || [config];

            questions.forEach((qConfig, index) => {
                try {
                    let seedForParams = code;
                    let configToUse = { ...qConfig };

                    // Cooperative Logic for Reconstruction
                    if (config.mode === 'cooperative' && config.groups) {
                        const group = config.groups.find(g => g.members.includes(parseInt(code)) || g.members.includes(String(code)));
                        if (group) {
                            const memberIndex = group.members.findIndex(m => m == code);

                            // PARALLEL MODE
                            if (qConfig.type === 'parallel' && qConfig.items && qConfig.items.length > 0) {
                                if (memberIndex !== -1) {
                                    const itemIndex = memberIndex % qConfig.items.length;
                                    configToUse = { ...qConfig.items[itemIndex] };
                                    seedForParams = code; // Individual seed
                                    configToUse.question = "<div class='mb-2 text-xs font-bold text-blue-600 uppercase tracking-wider'>Misión Individual</div>" + configToUse.question;
                                }
                            }
                            else {
                                // STANDARD COOPERATIVE
                                const groupId = parseInt(group.id) || 0;
                                seedForParams = groupId * 9999;

                                // Show ALL Shards for the Group (Teacher View)
                                if (qConfig.shards && qConfig.shards.length > 0) {
                                    const groupSize = group.members.length;
                                    let allShardsHtml = "";

                                    qConfig.shards.forEach((shard, i) => {
                                        const assignedMemberIndex = i % groupSize;
                                        const assignedMemberName = "Miembro " + (assignedMemberIndex + 1);
                                        allShardsHtml += "<div class='mt-2 p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs rounded'><strong>🧩 Pista (" + assignedMemberName + "):</strong><br>" + shard + "</div>";
                                    });

                                    configToUse.question = qConfig.question + "<div class='mt-4'>" + allShardsHtml + "</div>";
                                }
                            }
                        }
                    }

                    const params = CryptoEngine.generateParams(seed, seedForParams, configToUse, index);

                    const card = document.createElement('div');
                    card.className = "p-4 border rounded dark:border-gray-700 bg-gray-50 dark:bg-gray-900";
                    card.innerHTML = CryptoEngine.renderQuestion(params, index);
                    container.appendChild(card);
                } catch (e) {
                    console.error(e);
                    const errDiv = document.createElement('div');
                    errDiv.className = "p-2 text-red-500 text-xs";
                    errDiv.textContent = "Error generando pregunta " + (index + 1);
                    container.appendChild(errDiv);
                }
            });
        });
    }

    // Import Grades Logic
    const importBtn = document.getElementById('import-grades-btn');
    if (importBtn) {
        importBtn.addEventListener('click', async () => {
            const googleUrl = document.getElementById('crypto-google-url').value;
            if (!googleUrl) {
                alert("Necesitas configurar la URL de Google Apps Script primero.");
                return;
            }

            importBtn.disabled = true;
            importBtn.textContent = "⏳ Conectando...";

            try {
                // 1. Fetch data
                const response = await fetch(googleUrl);
                const data = await response.json();

                if (data.result === 'error') throw new Error(data.error);

                // 2. Analyze data to find unique Tasks for the current module (if selected) or all
                // We need to group by Task Name
                const tasksMap = {}; // { "TaskName": [rows...] }

                data.forEach(row => {
                    // Normalize keys
                    const getVal = (key) => {
                        const k = Object.keys(row).find(k => k.toLowerCase().includes(key.toLowerCase()));
                        return k ? row[k] : null;
                    };

                    const taskName = getVal("Tarea") || getVal("Task") || "Sin Nombre";
                    const moduleName = getVal("Clase") || getVal("Module") || "Desconocida";

                    if (!tasksMap[taskName]) tasksMap[taskName] = [];
                    tasksMap[taskName].push({ ...row, _moduleName: moduleName });
                });

                // 3. Show Modal to select Task
                const taskNames = Object.keys(tasksMap);
                if (taskNames.length === 0) {
                    alert("No se han encontrado tareas en el Excel.");
                    return;
                }

                // Create Modal dynamically
                const modal = document.createElement('div');
                modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

                const db = getDB();
                const activities = db.actividades || [];
                // Filter activities for current module if possible, but for now show all or let user choose
                // Better: Show a select for Target Activity

                modal.innerHTML = `
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[800px] max-h-[90vh] overflow-y-auto">
                        <h3 class="text-xl font-bold mb-4">Visor de Notas (Excel)</h3>
                        
                        <div class="mb-4 flex gap-4 items-end">
                            <div class="flex-1">
                                <label class="block text-sm font-medium mb-1">Selecciona la Tarea a visualizar</label>
                                <select id="import-task-select" class="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700">
                                    ${taskNames.map(t => `<option value="${t}">${t} (${tasksMap[t].length} notas)</option>`).join('')}
                                </select>
                            </div>
                            <button id="close-import" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300">Cerrar</button>
                        </div>

                        <div id="grades-preview-container" class="border rounded dark:border-gray-700 overflow-hidden">
                            <table class="w-full text-sm text-left">
                                <thead class="bg-gray-100 dark:bg-gray-700 text-xs uppercase">
                                    <tr>
                                        <th class="px-4 py-2">Alumno</th>
                                        <th class="px-4 py-2">Nota</th>
                                        <th class="px-4 py-2">Fecha</th>
                                        <th class="px-4 py-2">Semilla</th>
                                    </tr>
                                </thead>
                                <tbody id="grades-preview-body">
                                    <!-- Rows will be injected here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);

                // Modal Logic
                const taskSelect = document.getElementById('import-task-select');
                const tbody = document.getElementById('grades-preview-body');

                const renderTable = () => {
                    const selectedTaskName = taskSelect.value;
                    const selectedRows = tasksMap[selectedTaskName] || [];

                    tbody.innerHTML = selectedRows.map((row, index) => {
                        console.log(`[DEBUG] Row ${index}:`, row); // Log full row

                        const getVal = (key) => {
                            const keys = Object.keys(row);
                            // 1. Exact match (case insensitive)
                            let k = keys.find(k => k.toLowerCase() === key.toLowerCase());
                            // 2. Fuzzy match (if not found)
                            if (!k) k = keys.find(k => k.toLowerCase().includes(key.toLowerCase()));
                            return k ? row[k] : null;
                        };

                        const name = getVal("Nombre") || "Desconocido";
                        let score = getVal("Nota") || getVal("Score") || "-";
                        // Handle comma decimal from Google Sheets
                        if (typeof score === 'string') score = score.replace(',', '.');
                        console.log(`[DEBUG] Name: ${name}, Score: ${score}, Raw Score Val:`, getVal("Nota")); // Log specific fields

                        const dateRaw = getVal("Timestamp") || getVal("Fecha");
                        const date = dateRaw ? new Date(dateRaw).toLocaleString() : "-";
                        const seed = getVal("Semilla") || "-";

                        return `
                            <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td class="px-4 py-2 font-medium">${name}</td>
                                <td class="px-4 py-2 font-bold ${parseFloat(score) >= 5 ? 'text-green-600' : 'text-red-600'}">${score}</td>
                                <td class="px-4 py-2 text-gray-500">${date}</td>
                                <td class="px-4 py-2 font-mono text-xs">${seed}</td>
                                <td class="px-4 py-2">
                                    <div class="flex gap-2">
                                        <button class="reconstruct-row-btn text-purple-600 hover:text-purple-800 font-bold text-xs border border-purple-200 hover:border-purple-400 rounded px-2 py-1" 
                                                data-index="${index}"
                                                data-seed="${seed}" 
                                                data-code="${getVal("Código") || getVal("Code") || ""}"
                                                data-task="${selectedTaskName}">
                                            👁️ Ver Examen
                                        </button>
                                        <button class="pdf-row-btn text-red-600 hover:text-red-800 font-bold text-xs border border-red-200 hover:border-red-400 rounded px-2 py-1" 
                                                data-index="${index}"
                                                data-name="${name}"
                                                data-score="${score}"
                                                data-seed="${seed}" 
                                                data-code="${getVal("Código") || getVal("Code") || ""}"
                                                data-task="${selectedTaskName}">
                                            📄 PDF
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('');

                    // Add listeners to Reconstruct buttons
                    document.querySelectorAll('.reconstruct-row-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const index = e.target.dataset.index;
                            const seed = e.target.dataset.seed;
                            const code = e.target.dataset.code;
                            const taskName = e.target.dataset.task;

                            // Get config directly from the data array using index
                            const row = selectedRows[index];
                            const getVal = (key) => {
                                const k = Object.keys(row).find(k => k.toLowerCase().includes(key.toLowerCase()));
                                return k ? row[k] : null;
                            };

                            const configRaw = getVal("Config") || getVal("JSON");

                            let taskConfig = null;

                            // 1. Try to get config from Excel (Robust)
                            if (configRaw) {
                                if (typeof configRaw === 'object') {
                                    taskConfig = configRaw; // Already parsed?
                                } else if (typeof configRaw === 'string' && configRaw.trim() !== "") {
                                    try {
                                        taskConfig = JSON.parse(configRaw);
                                    } catch (err) {
                                        console.warn("Could not parse config from Excel:", err);
                                    }
                                }
                            }

                            // 2. Fallback: Try local history
                            if (!taskConfig) {
                                const db = getDB();
                                const historyTask = db.cryptoTasks?.find(t => t.name === taskName);
                                if (historyTask) taskConfig = historyTask.config;
                            }

                            if (taskConfig) {
                                // Close modal and populate reconstruction fields
                                modal.remove();
                                document.getElementById('verify-seed').value = seed;
                                document.getElementById('verify-student-code').value = code;
                                document.getElementById('crypto-task-json').value = JSON.stringify(taskConfig, null, 2);

                                // Trigger reconstruction
                                document.getElementById('reconstruct-btn').click();

                                // Scroll to reconstruction
                                document.getElementById('reconstruction-container').scrollIntoView({ behavior: 'smooth' });
                            } else {
                                alert(`No encuentro la configuración de la tarea "${taskName}".\n\nNo está guardada en el Excel(columna 'Config' vacía) ni en tu historial local.`);
                            }
                        });
                    });

                    // Add listeners to PDF buttons
                    document.querySelectorAll('.pdf-row-btn').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const index = e.target.dataset.index;
                            const name = e.target.dataset.name;
                            const score = e.target.dataset.score;
                            const seed = e.target.dataset.seed;
                            const code = e.target.dataset.code;
                            const taskName = e.target.dataset.task;

                            // Get config
                            const row = selectedRows[index];
                            const getVal = (key) => {
                                const keys = Object.keys(row);
                                let k = keys.find(k => k.toLowerCase() === key.toLowerCase());
                                if (!k) k = keys.find(k => k.toLowerCase().includes(key.toLowerCase()));
                                return k ? row[k] : null;
                            };
                            const configRaw = getVal("Config") || getVal("JSON");
                            let taskConfig = null;

                            if (configRaw) {
                                if (typeof configRaw === 'object') taskConfig = configRaw;
                                else if (typeof configRaw === 'string' && configRaw.trim() !== "") {
                                    try { taskConfig = JSON.parse(configRaw); } catch (err) { console.warn(err); }
                                }
                            }
                            if (!taskConfig) {
                                const db = getDB();
                                const historyTask = db.cryptoTasks?.find(t => t.name === taskName);
                                if (historyTask) taskConfig = historyTask.config;
                            }

                            if (!taskConfig) {
                                alert("No se puede generar el PDF porque falta la configuración de la tarea.");
                                return;
                            }

                            // Generate PDF
                            const { jsPDF } = window.jspdf;
                            const doc = new jsPDF();

                            // Header
                            doc.setFillColor(30, 41, 59); // Dark blue background
                            doc.rect(0, 0, 210, 40, 'F');

                            doc.setTextColor(255, 255, 255);
                            doc.setFontSize(22);
                            doc.setFont("helvetica", "bold");
                            // Remove "Examen:" prefix as requested
                            doc.text(taskName, 10, 15);

                            doc.setFontSize(12);
                            doc.setFont("helvetica", "normal");
                            doc.text(`Alumno: ${name} (Código: ${code})`, 10, 25);
                            doc.text(`Nota: ${score} / 10`, 10, 32);
                            doc.text(`Semilla: ${seed}`, 150, 25);
                            doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 32);

                            let y = 50;
                            doc.setTextColor(0);

                            // Scenario
                            if (taskConfig.scenario) {
                                doc.setFillColor(239, 246, 255); // Light blue
                                doc.setDrawColor(59, 130, 246); // Blue border
                                doc.roundedRect(10, y, 190, 20, 3, 3, 'FD'); // Initial height, will adjust

                                doc.setFontSize(11);
                                doc.setTextColor(30, 64, 175); // Dark blue text
                                doc.setFont("helvetica", "bold");
                                doc.text("Escenario / Supuesto", 15, y + 8);

                                doc.setFont("helvetica", "normal");
                                doc.setTextColor(0);
                                const scenarioText = taskConfig.scenario.replace(/<[^>]*>/g, '');
                                const splitScenario = doc.splitTextToSize(scenarioText, 180);
                                doc.text(splitScenario, 15, y + 15);

                                // Adjust height based on text
                                const height = (splitScenario.length * 5) + 20;
                                doc.roundedRect(10, y, 190, height, 3, 3, 'S'); // Redraw border with correct height
                                y += height + 10;
                            }

                            // Get Student Answers if available
                            const answersRaw = getVal("Respuestas") || getVal("Answers");
                            let studentAnswers = [];
                            if (answersRaw) {
                                try { studentAnswers = JSON.parse(answersRaw); } catch (e) { }
                            }

                            const questions = taskConfig.questions || [taskConfig];
                            questions.forEach((qConfig, i) => {
                                if (y > 250) { doc.addPage(); y = 20; }

                                const params = CryptoEngine.generateParams(seed, code, qConfig, i);
                                const ansObj = studentAnswers[i];
                                const studentAns = (ansObj && ansObj.studentAnswer !== null && ansObj.studentAnswer !== undefined) ? ansObj.studentAnswer : "Sin respuesta";
                                const isCorrect = ansObj ? ansObj.isCorrect : false;

                                // Question Card
                                doc.setFillColor(248, 250, 252); // Gray 50
                                doc.setDrawColor(226, 232, 240); // Gray 200
                                doc.roundedRect(10, y, 190, 45, 3, 3, 'FD'); // Base height

                                let currentY = y + 10;

                                // Question Number
                                doc.setFont("helvetica", "bold");
                                doc.setFontSize(12);
                                doc.setTextColor(71, 85, 105); // Slate 600
                                doc.text(`Pregunta ${i + 1}`, 15, currentY);

                                // Question Text
                                currentY += 8;
                                doc.setFont("helvetica", "normal");
                                doc.setFontSize(11);
                                doc.setTextColor(0);
                                const qText = params.question.replace(/<[^>]*>/g, '');
                                const splitQ = doc.splitTextToSize(qText, 180);
                                doc.text(splitQ, 15, currentY);
                                currentY += (splitQ.length * 5) + 5;

                                // Answers Section
                                doc.setFontSize(10);

                                // Format numbers with comma
                                const studentAnsStr = String(studentAns).replace('.', ',');
                                const resultStr = String(params.result).replace('.', ',');
                                const varsStr = JSON.stringify(params.vars).replace(/\./g, ',');

                                // Student Answer
                                doc.setTextColor(isCorrect ? 22 : 220, isCorrect ? 163 : 38, isCorrect ? 74 : 38); // Green or Red
                                doc.setFont("helvetica", "bold");
                                doc.text(`Tu Respuesta: ${studentAnsStr}`, 15, currentY);

                                // Correct Answer
                                doc.setTextColor(22, 163, 74); // Green
                                doc.text(`Correcta: ${resultStr}`, 100, currentY);

                                currentY += 8;

                                // Variables footer
                                doc.setDrawColor(226, 232, 240);
                                doc.line(15, currentY, 195, currentY);
                                currentY += 5;
                                doc.setFontSize(9);
                                doc.setTextColor(148, 163, 184); // Slate 400
                                doc.setFont("helvetica", "normal");
                                doc.text(`Variables: ${varsStr}`, 15, currentY);

                                // Adjust card height
                                const finalHeight = currentY - y + 5;
                                doc.roundedRect(10, y, 190, finalHeight, 3, 3, 'S'); // Redraw border

                                y += finalHeight + 10;
                            });

                            doc.save(`Examen_${name.replace(/\s+/g, '_')}_${taskName}.pdf`);
                        });
                    });
                };

                taskSelect.addEventListener('change', renderTable);
                document.getElementById('close-import').addEventListener('click', () => modal.remove());

                renderTable();

            } catch (e) {
                console.error(e);
                alert("Error: " + e.message);
            } finally {
                importBtn.disabled = false;
                importBtn.textContent = "📥 Ver Notas del Excel";
            }
        });
    }

}
