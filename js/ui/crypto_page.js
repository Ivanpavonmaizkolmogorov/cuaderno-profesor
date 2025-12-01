
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
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Configuración JSON</label>
                        <textarea id="crypto-task-json" rows="6" class="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700 font-mono text-xs" placeholder='{"questions": [...]}'></textarea>
                        <button type="button" id="crypto-load-example-btn" class="text-xs text-blue-500 hover:underline mt-1">Cargar Ejemplo</button>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL Google Apps Script (Opcional)</label>
                        <div class="flex gap-2">
                            <input type="url" id="crypto-google-url" class="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700 text-xs" placeholder="https://script.google.com/macros/s/...">
                            <button type="button" id="crypto-help-btn" class="px-3 py-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors" title="Ver Guía de Configuración">
                                ❓
                            </button>
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
    var sheet = doc.getActiveSheet();

    var headers = sheet.getRange(1, 1, 1, 5).getValues()[0];
    if (headers[0] !== "Timestamp") {
      sheet.appendRow(["Timestamp", "Alumno", "Nota", "Clave (Hash)", "Semilla"]);
    }

    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      new Date(),
      data.studentCode,
      data.score,
      data.phrase,
      data.seed
    ]);

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
    const googleUrlInput = document.getElementById('crypto-google-url');
    if (db.googleScriptUrl && googleUrlInput) {
        googleUrlInput.value = db.googleScriptUrl;
    }

    // Save Google Script URL when changed
    if (googleUrlInput) {
        googleUrlInput.addEventListener('blur', () => {
            const db = getDB();
            db.googleScriptUrl = googleUrlInput.value.trim();
            localStorage.setItem('cuaderno-profesor-db', JSON.stringify(db));
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
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getActiveSheet();

    var headers = sheet.getRange(1, 1, 1, 5).getValues()[0];
    if (headers[0] !== "Timestamp") {
      sheet.appendRow(["Timestamp", "Alumno", "Nota", "Clave (Hash)", "Semilla"]);
    }

    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      new Date(),
      data.studentCode,
      data.score,
      data.phrase,
      data.seed
    ]);

    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": e }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
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

    // Load Example
    const exampleBtn = document.getElementById('crypto-load-example-btn');
    if (exampleBtn) {
        exampleBtn.addEventListener('click', () => {
            const example = {
                "scenario": "<h3>Supuesto: La Tienda</h3><p>IVA del 21%.</p>",
                "questions": [
                    {
                        "variables": { "precio": { "min": 10, "max": 100 } },
                        "formula": "precio * 1.21",
                        "question": "Precio final de {precio}€ + IVA?"
                    }
                ]
            };
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

            const htmlContent = generateStudentHTML(name, seed, config, antiCopy, googleUrl);

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
                            const code = 100 + i + 1;
                            const proof = await CryptoEngine.generateProof(seed, code, 10);

                            const tr = document.createElement('tr');
                            tr.className = "border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700";
                            tr.innerHTML = `
    < td class="px-4 py-2" > ${student.name}</td >
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
}
