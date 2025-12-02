
export const CryptoEngine = {
    async hash(text) {
        const msgBuffer = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },
    pseudoRandom(seed) {
        let s = seed;
        return function () {
            s = Math.sin(s) * 10000;
            return s - Math.floor(s);
        };
    },
    generateParams(seed, studentCode, questionConfig, questionIndex) {
        const combinedSeed = parseInt(seed) + parseInt(studentCode) + (questionIndex * 1337);
        const rng = this.pseudoRandom(combinedSeed);

        const vars = {};
        for (const [key, rule] of Object.entries(questionConfig.variables)) {
            if (Array.isArray(rule)) {
                const index = Math.floor(rng() * rule.length);
                vars[key] = rule[index];
            } else if (typeof rule === 'object' && rule.min !== undefined) {
                const min = rule.min;
                const max = rule.max;
                vars[key] = Math.floor(rng() * (max - min + 1)) + min;
            }
        }

        const keys = Object.keys(vars);
        const values = Object.values(vars);
        const formulaFunc = new Function(...keys, 'const { max, min, round, floor, ceil, abs, random, sqrt, pow, sin, cos, tan, PI } = Math; return ' + questionConfig.formula);
        const result = formulaFunc(...values);

        let question = questionConfig.question;
        for (const [key, val] of Object.entries(vars)) {
            question = question.split('{' + key + '}').join(val);
        }

        return { vars, result, question, formula: questionConfig.formula };
    },
    async generateProof(seed, studentCode, score) {
        const s = String(seed).trim();
        const c = String(studentCode).trim();
        let scoreStr = score;
        if (typeof score === 'number') {
            scoreStr = (score % 1 === 0) ? score.toString() : score.toFixed(1);
        }
        const raw = 'TASK-' + s + '-STUDENT-' + c + '-SCORE-' + scoreStr;
        const hash = await this.hash(raw);
        return hash.substring(0, 10).toUpperCase();
    },
    renderQuestion(params, index) {
        // Returns the HTML for the question card (used in Reconstruction)
        // Note: Styles should be compatible with Tailwind (Teacher App)
        // For Student App (Vanilla CSS), we might need a different renderer or shared styles.
        // Currently, this is designed for the Teacher's Reconstruction View.

        // Format numbers with comma for Spanish display
        const resultStr = String(params.result).replace('.', ',');
        const varsStr = JSON.stringify(params.vars).replace(/\./g, ',');

        return `
            <div class="flex justify-between items-start mb-2">
                <span class="font-bold text-gray-700 dark:text-gray-300">Pregunta ${index + 1}</span>
                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Correcta: ${resultStr}</span>
            </div>
            <div class="text-gray-800 dark:text-gray-200 mb-2">${params.question}</div>
            <div class="text-xs text-gray-500 font-mono mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>Variables: ${varsStr}</div>
                <div class="mt-1 text-blue-600 dark:text-blue-400">𝑓(x) = ${params.formula || 'N/A'}</div>
            </div>
        `;
    }
};

export function verifyProof(seed, studentCode, score) {
    return CryptoEngine.generateProof(seed, studentCode, score);
}

export async function generateStudentHTML(taskName, seed, config, antiCopyMode = true, googleScriptUrl = '', students = [], moduleName = '', secureMode = false) {
    let taskConfig = config;
    if (!taskConfig) {
        taskConfig = {
            questions: [{
                variables: { a: { min: 0, max: 100 }, b: { min: 0, max: 100 } },
                formula: "a + b",
                question: "Calcula: <strong>{a} + {b}</strong>",
                tolerance: 0
            }]
        };
    } else if (!taskConfig.questions) {
        taskConfig = { questions: [config] };
    }

    // Add students array to taskConfig for name lookup
    taskConfig.students = students;

    // Generate Access Codes Map if Secure Mode is on
    let accessCodesMap = {};
    if (secureMode && students.length > 0) {
        for (const student of students) {
            // Generate 4-char code: Hash(Seed + ID)
            const raw = `ACCESS-${seed}-${student.id}`;
            const hash = await CryptoEngine.hash(raw);
            const code = hash.substring(0, 4).toUpperCase();
            accessCodesMap[code] = student.id;
        }
    }

    // Build the CryptoEngine code as a string array
    const cryptoEngineCode = [
        'const CryptoEngine = {',
        `    async hash(text) {
        const msgBuffer = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },`,
        `    pseudoRandom(seed) {
        let s = seed;
        return function () {
            s = Math.sin(s) * 10000;
            return s - Math.floor(s);
        };
    },`,
        `    generateParams(seed, studentCode, questionConfig, questionIndex) {
        const combinedSeed = parseInt(seed) + parseInt(studentCode) + (questionIndex * 1337);
        const rng = this.pseudoRandom(combinedSeed);

        const vars = {};
        for (const [key, rule] of Object.entries(questionConfig.variables)) {
            if (Array.isArray(rule)) {
                const index = Math.floor(rng() * rule.length);
                vars[key] = rule[index];
            } else if (typeof rule === 'object' && rule.min !== undefined) {
                const min = rule.min;
                const max = rule.max;
                vars[key] = Math.floor(rng() * (max - min + 1)) + min;
            }
        }

        const keys = Object.keys(vars);
        const values = Object.values(vars);
        const formulaFunc = new Function(...keys, 'const { max, min, round, floor, ceil, abs, random, sqrt, pow, sin, cos, tan, PI } = Math; return ' + questionConfig.formula);
        const result = formulaFunc(...values);

        let question = questionConfig.question;
        for (const [key, val] of Object.entries(vars)) {
            question = question.split('{' + key + '}').join(val);
        }

        return { vars, result, question, formula: questionConfig.formula };
    },`,
        `    async generateProof(seed, studentCode, score) {
        const s = String(seed).trim();
        const c = String(studentCode).trim();
        let scoreStr = score;
        if (typeof score === 'number') {
            scoreStr = (score % 1 === 0) ? score.toString() : score.toFixed(1);
        }
        const raw = 'TASK-' + s + '-STUDENT-' + c + '-SCORE-' + scoreStr;
        const hash = await this.hash(raw);
        return hash.substring(0, 10).toUpperCase();
    }`,
        '};'
    ].join('\n');

    // Anti-copy protection scripts (concatenated as single line strings)
    const antiCopyScript = antiCopyMode ?
        'document.addEventListener("contextmenu", e => { if(typeof GOD_MODE!=="undefined"&&GOD_MODE)return; e.preventDefault(); });' +
        'document.addEventListener("copy", e => { if(typeof GOD_MODE!=="undefined"&&GOD_MODE)return; e.preventDefault(); });' +
        'document.addEventListener("cut", e => { if(typeof GOD_MODE!=="undefined"&&GOD_MODE)return; e.preventDefault(); });' +
        'document.addEventListener("paste", e => { if(typeof GOD_MODE!=="undefined"&&GOD_MODE)return; e.preventDefault(); });' +
        'document.addEventListener("keydown", e => { if(typeof GOD_MODE!=="undefined"&&GOD_MODE)return; if ((e.ctrlKey || e.metaKey) && ["c","v","u","p"].includes(e.key)) e.preventDefault(); });'
        : '';

    const antiCopyCSS = antiCopyMode ?
        'body { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }' +
        'input, button, textarea { -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text; user-select: text; }'
        : '';

    // Build the complete HTML using template literals
    // Note: Using template literals here is safe because this code runs in Node/Electron main,
    // not in the generated student HTML
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${taskName}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f8fafc; color: #1e293b; padding-bottom: 100px; }
        .header { text-align: center; margin-bottom: 2rem; }
        .card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); padding: 2rem; margin-bottom: 2rem; }
        .scenario-box { background: #eff6ff; border-left: 5px solid #3b82f6; padding: 1.5rem; margin-bottom: 2rem; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .scenario-box h3 { margin-top: 0; color: #1e40af; }
        .question-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; transition: transform 0.2s; }
        .question-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .question-card.solved { border-color: #22c55e; background-color: #f0fdf4; }
        .question-card.skipped { border-color: #ef4444; background-color: #fef2f2; opacity: 0.8; }
        .q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .q-badge { background: #e2e8f0; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.85rem; font-weight: bold; }
        .q-badge.correct { background: #22c55e; color: white; }
        .q-badge.skipped { background: #ef4444; color: white; }
        input, button { font-size: 1rem; padding: 0.75rem; border-radius: 6px; border: 1px solid #cbd5e1; width: 100%; box-sizing: border-box; margin-top: 0.5rem; }
        button { background: #3b82f6; color: white; border: none; cursor: pointer; font-weight: 600; margin-top: 1rem; }
        button:hover { background: #2563eb; }
        button:disabled { background: #94a3b8; cursor: not-allowed; }
        .skip-btn { background: transparent; color: #ef4444; border: 1px solid #ef4444; margin-top: 0.5rem; }
        .skip-btn:hover { background: #fef2f2; }
        .finish-btn { position: fixed; bottom: 30px; right: 30px; z-index: 1000; background: #1e293b; color: white; padding: 1rem 2rem; border-radius: 50px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 1.1rem; border: none; cursor: pointer; transition: transform 0.2s, background 0.2s; width: auto; }
        .finish-btn:hover { background: #0f172a; transform: scale(1.05); }
        .finish-btn:hover { background: #0f172a; transform: scale(1.05); }
        .feedback { margin-top: 1rem; font-weight: bold; min-height: 1.5rem; }
        .hidden { display: none; }
        #final-section { text-align: center; margin-top: 3rem; padding: 2rem; background: #1e293b; color: white; border-radius: 12px; }
        #phrase-display { font-family: monospace; font-size: 2rem; letter-spacing: 2px; color: #4ade80; margin: 1rem 0; word-break: break-all; }
        ${antiCopyCSS}
    </style>
</head>
<body>
    <div class="header">
        <h1>${taskName}</h1>
        <p>${secureMode ? '⚠️ <strong>PASO OBLIGATORIO:</strong> Pide a tu profesor tu <strong>CÓDIGO DE ACCESO</strong> personal (4 letras/números) para poder empezar.' : 'Introduce tu código de lista (ej: 1, 2, 3...) para desbloquear los ejercicios.'}</p>
    </div>
    <div id="login-card" class="card">
        <label><strong>${secureMode ? 'Código de Acceso:' : 'Código de Alumno:'}</strong></label>
        <input type="${secureMode ? 'text' : 'number'}" id="student-code" placeholder="${secureMode ? 'Ej: A1B2' : 'Ej: 5'}" required style="text-transform: uppercase;">
        <button id="start-btn">Comenzar Tarea</button>
    </div>
    <div id="dashboard" class="hidden">
        ${taskConfig.scenario ? `<div class="scenario-box">${taskConfig.scenario}</div>` : ''}
        <div id="questions-list"></div>
        <button id="manual-finish-btn" class="finish-btn" onclick="finishTask()">🏁 Finalizar y Entregar</button>
        <div id="final-section" class="hidden">
            <h2>🎉 ¡Tarea Completada!</h2>
            <p>Entrega esta clave a tu profesor:</p>
            <div id="phrase-display">...</div>
            <p>Nota calculada: <span id="final-score-display"></span> / 10</p>
            <p id="google-status" style="margin-top:1rem; font-style:italic; color:#64748b;"></p>
        </div>
    </div>
    <script>
        ${antiCopyScript}
        const TASK_SEED = ${seed};
        const TASK_CONFIG = ${JSON.stringify(taskConfig)};
        const GOOGLE_URL = "${googleScriptUrl || ''}";
        const MODULE_NAME = "${(moduleName || '').replace(/"/g, '\\"')}";
        const TASK_NAME = "${(taskName || '').replace(/"/g, '\\"')}";
        const SECURE_MODE = ${secureMode};
        const ACCESS_CODES = ${JSON.stringify(accessCodesMap)};
        ${cryptoEngineCode}
        
        // --- GLOBAL ERROR HANDLER (Nivel 1) ---
        window.onerror = function(msg, url, line, col, error) {
            showErrorBtn(msg + "\\nLine: " + line + ":" + col);
            return false;
        };
        window.addEventListener('unhandledrejection', function(event) {
            showErrorBtn("Unhandled Promise Rejection: " + event.reason);
        });

        function showErrorBtn(details) {
            let btn = document.getElementById('debug-bug-btn');
            if(!btn) {
                btn = document.createElement('div');
                btn.id = 'debug-bug-btn';
                btn.innerHTML = '🐞';
                btn.style.cssText = 'position:fixed; bottom:10px; right:10px; font-size:24px; cursor:pointer; z-index:9999; background:rgba(255,0,0,0.2); padding:5px; border-radius:50%;';
                btn.onclick = () => alert("DEBUG ERROR:\\n" + details);
                document.body.appendChild(btn);
            }
        }

        // --- GOD MODE (Nivel 2) ---
        let GOD_MODE = false;
        const GOD_PIN = "5332";
        // Sequence: Up, Down, Right, Left (x3)
        const GOD_SEQ = [
            "ArrowUp", "ArrowDown", "ArrowRight", "ArrowLeft",
            "ArrowUp", "ArrowDown", "ArrowRight", "ArrowLeft",
            "ArrowUp", "ArrowDown", "ArrowRight", "ArrowLeft"
        ];
        let godSeqIndex = 0;
        let pinAttempts = 0;

        document.addEventListener('keydown', (e) => {
            if (GOD_MODE) return; // Already active
            
            // Check Sequence
            if (e.key === GOD_SEQ[godSeqIndex]) {
                godSeqIndex++;
                if (godSeqIndex === GOD_SEQ.length) {
                    godSeqIndex = 0;
                    showPinModal();
                }
            } else {
                godSeqIndex = 0; // Reset if mistake
            }
        });

        function showPinModal() {
            pinAttempts = 0;
            let modal = document.getElementById('god-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'god-modal';
                modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:20000; display:flex; justify-content:center; align-items:center;';
                modal.innerHTML = \`
                    <div style="background:white; padding:2rem; border-radius:12px; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.5);">
                        <h2 style="margin-top:0; color:#1e293b;">🕵️ Acceso Profesor</h2>
                        <p style="margin-bottom:1rem; color:#64748b;">Introduce el PIN de seguridad</p>
                        <input type="password" id="god-pin-input" maxlength="4" style="font-size:2rem; letter-spacing:10px; text-align:center; width:150px; margin-bottom:1rem; border:2px solid #e2e8f0; border-radius:8px;">
                        <div id="god-msg" style="height:20px; color:red; margin-bottom:1rem; font-weight:bold;"></div>
                        <button onclick="checkPin()" style="width:100%; background:#3b82f6; color:white; border:none; padding:10px; border-radius:6px; font-size:1rem; cursor:pointer;">Desbloquear</button>
                        <button onclick="closeGodModal()" style="width:100%; background:transparent; color:#64748b; border:none; padding:10px; margin-top:5px; cursor:pointer;">Cancelar</button>
                    </div>
                \`;
                document.body.appendChild(modal);
            }
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            setTimeout(() => document.getElementById('god-pin-input').focus(), 100);
            
            // Enter key support
            const input = document.getElementById('god-pin-input');
            input.value = '';
            input.onkeydown = (e) => { if(e.key === 'Enter') checkPin(); };
        }

        window.closeGodModal = function() {
            const modal = document.getElementById('god-modal');
            if(modal) modal.style.display = 'none';
            godSeqIndex = 0;
        };

        window.checkPin = function() {
            const input = document.getElementById('god-pin-input');
            const msg = document.getElementById('god-msg');
            
            if (input.value === GOD_PIN) {
                closeGodModal();
                activateGodMode();
            } else {
                pinAttempts++;
                input.value = '';
                input.focus();
                if (pinAttempts >= 3) {
                    alert("⛔ Demasiados intentos fallidos.");
                    closeGodModal();
                } else {
                    msg.textContent = "PIN Incorrecto (" + pinAttempts + "/3)";
                }
            }
        };

        function activateGodMode() {
            console.log("DEBUG: Activating God Mode");
            GOD_MODE = true;
            
            // 1. Generate Badges (Hidden by default)
            document.querySelectorAll('.question-card').forEach((card, index) => {
                if(card.querySelector('.god-sol-badge')) return;
                
                const result = studentAnswers[index].correctAnswer;
                
                // Try to find formula
                let formula = "N/A";
                try {
                     const qConfig = TASK_CONFIG.questions[index];
                     if (qConfig.type === 'parallel' && qConfig.items && qConfig.items.length > 0) {
                         if (typeof memberIndex !== 'undefined' && memberIndex !== -1) {
                             const itemIndex = memberIndex % qConfig.items.length;
                             if (qConfig.items[itemIndex] && qConfig.items[itemIndex].formula) {
                                 formula = qConfig.items[itemIndex].formula;
                             }
                         } else {
                             formula = "Paralelo (Sin Grupo)";
                         }
                     } else if (qConfig.formula) {
                         formula = qConfig.formula;
                     }
                } catch(e) { console.error(e); }

                const contentDiv = card.querySelector('.q-content');

                // Badge 1: Solution (Yellow)
                const solBadge = document.createElement('div');
                solBadge.className = 'god-sol-badge';
                solBadge.style.cssText = 'display:none; background:#fef08a; color:#854d0e; padding:4px 8px; border-radius:4px; font-weight:bold; margin-top:5px; border:1px solid #fde047; margin-right:5px;';
                solBadge.innerHTML = '👁️ Sol: ' + result;
                contentDiv.appendChild(solBadge);

                // Badge 2: Formula (Blue)
                const formBadge = document.createElement('div');
                formBadge.className = 'god-formula-badge';
                formBadge.style.cssText = 'display:none; background:#dbeafe; color:#1e40af; padding:4px 8px; border-radius:4px; font-family:monospace; font-size:0.9rem; margin-top:5px; border:1px solid #93c5fd;';
                formBadge.innerHTML = '📐 𝑓(x): ' + formula;
                contentDiv.appendChild(formBadge);
            });
            
            // 2. Visual Indicator & Controls
            let indicator = document.getElementById('god-indicator');
            if(!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'god-indicator';
                indicator.style.cssText = "position:fixed; top:0; left:0; width:100%; background:#ef4444; color:white; padding:8px; font-weight:bold; z-index:10000; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 10px rgba(0,0,0,0.2);";
                indicator.innerHTML = \`
                    <span style="margin-left:20px;">🔓 MODO DIOS</span>
                    <div>
                        <button onclick="toggleGodAnswers()" id="god-sol-btn" style="margin-right:10px; background:rgba(255,255,255,0.2); color:white; border:1px solid white; padding:5px 15px; border-radius:20px; cursor:pointer;">👁️ Soluciones</button>
                        <button onclick="toggleGodFormulas()" id="god-form-btn" style="margin-right:10px; background:rgba(255,255,255,0.2); color:white; border:1px solid white; padding:5px 15px; border-radius:20px; cursor:pointer;">📐 Fórmulas</button>
                        <button onclick="deactivateGodMode()" style="margin-right:20px; background:white; color:#ef4444; border:none; padding:5px 15px; border-radius:20px; font-weight:bold; cursor:pointer;">🔒 Echar Candado</button>
                    </div>
                \`;
                document.body.appendChild(indicator);
            }
            indicator.style.display = 'flex';
        }

        window.toggleGodAnswers = function() {
            const badges = document.querySelectorAll('.god-sol-badge');
            const btn = document.getElementById('god-sol-btn');
            let isHidden = true;
            
            badges.forEach(b => {
                if (b.style.display === 'none') {
                    b.style.display = 'inline-block';
                    isHidden = false;
                } else {
                    b.style.display = 'none';
                    isHidden = true;
                }
            });
            
            if(btn) {
                btn.style.background = isHidden ? 'rgba(255,255,255,0.2)' : 'white';
                btn.style.color = isHidden ? 'white' : '#ef4444';
            }
        };

        window.toggleGodFormulas = function() {
            const badges = document.querySelectorAll('.god-formula-badge');
            const btn = document.getElementById('god-form-btn');
            let isHidden = true;
            
            badges.forEach(b => {
                if (b.style.display === 'none') {
                    b.style.display = 'inline-block';
                    isHidden = false;
                } else {
                    b.style.display = 'none';
                    isHidden = true;
                }
            });
            
            if(btn) {
                btn.style.background = isHidden ? 'rgba(255,255,255,0.2)' : 'white';
                btn.style.color = isHidden ? 'white' : '#ef4444';
            }
        };

        window.deactivateGodMode = function() {
            console.log("DEBUG: Deactivating God Mode");
            GOD_MODE = false;
            
            // Hide Indicator
            const indicator = document.getElementById('god-indicator');
            if(indicator) indicator.style.display = 'none';
            
            // Remove Answer Badges
            document.querySelectorAll('.god-sol-badge').forEach(el => el.remove());
            document.querySelectorAll('.god-formula-badge').forEach(el => el.remove());
            
            alert("🔒 MODO DIOS DESACTIVADO\\nLas protecciones se han reactivado.");
        };
        
        let studentCode = "";
        let studentName = "";
        let currentGroup = null;
        let memberIndex = -1;
        let questionStates = [];
        let studentAnswers = []; // Store student's answers for PDF
        let isFinished = false;
        
        document.getElementById("start-btn").addEventListener("click", () => {
            let inputCode = document.getElementById("student-code").value.trim();
            console.log("DEBUG: Input Code:", inputCode);
            console.log("DEBUG: Secure Mode:", SECURE_MODE);

            if(!inputCode) return alert("Introduce tu código");
            
            if (SECURE_MODE) {
                inputCode = inputCode.toUpperCase();
                console.log("DEBUG: Normalized Code:", inputCode);
                console.log("DEBUG: Available Codes:", Object.keys(ACCESS_CODES));

                if (ACCESS_CODES[inputCode]) {
                    // Map Access Code to Real Student ID
                    studentCode = String(ACCESS_CODES[inputCode]);
                    console.log("DEBUG: Login Success! Student ID:", studentCode);
                } else {
                    console.warn("DEBUG: Code not found in map.");
                    alert("❌ Código de Acceso Incorrecto.");
                    return;
                }
            } else {
                studentCode = inputCode;
            }
            
            // Find student name from TASK_CONFIG.students array
            const student = TASK_CONFIG.students?.find(s => String(s.id) === String(studentCode));
            
            if (!student) {
                alert("❌ Código no válido.\\n\\nEste código no pertenece a la lista de alumnos de esta clase.\\nPor favor, verifica tu número de lista.");
                return;
            }

            // COOPERATIVE CHECK
            if (TASK_CONFIG.mode === 'cooperative') {
                if (!TASK_CONFIG.groups) {
                    alert("Error: Modo cooperativo sin grupos definidos.");
                    return;
                }
                // Check if student is in any group
                // Groups are { id: 1, members: [id1, id2] }
                const group = TASK_CONFIG.groups.find(g => g.members.includes(parseInt(studentCode)) || g.members.includes(String(studentCode)));
                
                if (!group) {
                    alert("❌ No perteneces a ningún equipo asignado.\\nConsulta con tu profesor.");
                    return;
                }
                currentGroup = group;
                // Find index in members array
                memberIndex = group.members.findIndex(m => m == studentCode);
                alert(\`👥 ¡Bienvenido al Equipo \${group.id}!\\nEres el Miembro \${memberIndex + 1}.\`);
            }

            studentName = student.name;
            initDashboard();
        });
        
        function initDashboard() {
            document.getElementById("login-card").classList.add("hidden");
            document.getElementById("dashboard").classList.remove("hidden");
            const container = document.getElementById("questions-list");
            container.innerHTML = "";
            
            TASK_CONFIG.questions.forEach((qConfig, index) => {
                // Determine Seed: Individual (StudentCode) or Cooperative (GroupId)
                let seedForParams = studentCode;
                let configToUse = { ...qConfig };

                if (TASK_CONFIG.mode === 'cooperative' && currentGroup) {
                    // PARALLEL MODE: Each member gets a specific sub-task
                    if (qConfig.type === 'parallel' && qConfig.items && qConfig.items.length > 0) {
                        // Use Individual Seed for Parallel Items (so they are unique to the student)
                        seedForParams = studentCode;
                        
                        // Select item for this member (modulo distribution)
                        const itemIndex = memberIndex % qConfig.items.length;
                        configToUse = { ...qConfig.items[itemIndex] };
                        
                        // Add visual indicator
                        configToUse.question = "<div class='mb-2 text-xs font-bold text-blue-600 uppercase tracking-wider'>Misión Individual</div>" + configToUse.question;
                    } 
                    else {
                        // STANDARD COOPERATIVE: Shared question with shards
                        const groupId = parseInt(currentGroup.id) || 0;
                        seedForParams = groupId * 9999; // Deterministic group seed
                        
                        // Handle Shards (Fragmented Info)
                        if (qConfig.shards && qConfig.shards.length > 0) {
                            // Distribute shards among group members
                            const groupSize = currentGroup.members.length;
                            const myShards = qConfig.shards.filter((_, i) => (i % groupSize) === memberIndex);
                            
                            if (myShards.length > 0) {
                                const shardsHtml = myShards.map(s => "<div class='mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-purple-800 text-sm'><strong>🧩 Pista:</strong><br>" + s + "</div>").join('');
                                configToUse.question = qConfig.question + "<div class='mt-4'>" + shardsHtml + "</div>";
                            }
                        }
                    }
                }

                let params;
                try {
                    params = CryptoEngine.generateParams(TASK_SEED, seedForParams, configToUse, index);
                } catch (e) {
                    console.error("Error generating params:", e);
                    params = { vars: {}, result: 0, question: "Error: " + e.message };
                }
                
                questionStates.push({ solved: false, skipped: false, attempts: 0, result: params.result });
                
                // Store question and correct answer for PDF
                studentAnswers.push({
                    question: params.question,
                    studentAnswer: null,
                    correctAnswer: params.result,
                    isCorrect: false,
                    wasSkipped: false
                });
                
                const card = document.createElement("div");
                card.className = "question-card";
                if (index > 0) card.classList.add("hidden"); // Hide future questions
                card.id = "q-card-" + index;
                card.innerHTML = "<div class='q-header'><span><strong>Pregunta " + (index + 1) + "</strong></span><span class='q-badge' id='badge-" + index + "'>Pendiente</span></div><div class='q-content'>" + params.question + "</div><div id='input-area-" + index + "'><input type='text' inputmode='decimal' id='input-" + index + "' placeholder='Tu respuesta (usa coma , para decimales)' class='w-full p-2 border rounded'><button onclick='checkAnswer(" + index + ")'>Comprobar</button><button onclick='skipAnswer(" + index + ")' id='skip-btn-" + index + "' class='skip-btn hidden'>Saltar Pregunta (0 pts)</button></div><div class='feedback' id='feedback-" + index + "'></div>";
                container.appendChild(card);
            });
        }
        
        function revealNext(index) {
            const nextCard = document.getElementById("q-card-" + (index + 1));
            if (nextCard) {
                nextCard.classList.remove("hidden");
                nextCard.scrollIntoView({ behavior: "smooth" });
            }
        }
        
        window.checkAnswer = function(index) {
            if(isFinished) return;
            const input = document.getElementById("input-" + index);
            let val = input.value;
            const feedback = document.getElementById("feedback-" + index);
            
            if(!val) return;
            
            // STRICT: Forbid dots
            if(val.includes('.')) {
                feedback.textContent = "⚠️ Usa COMA (,) para decimales. No uses punto."; 
                feedback.style.color = "orange"; 
                return; 
            }
            
            // Support comma as decimal separator (convert to dot for calculation)
            val = val.replace(',', '.');
            
            if(isNaN(val)) {
                feedback.textContent = "⚠️ Por favor, introduce un número válido"; 
                feedback.style.color = "orange"; 
                return; 
            }
            
            const answer = parseFloat(val);
            const state = questionStates[index];
            const qConfig = TASK_CONFIG.questions[index];
            const tolerance = (qConfig.tolerance !== undefined) ? qConfig.tolerance : 0.01;
            state.attempts++;
            
            // Store student's answer
            studentAnswers[index].studentAnswer = answer;
            
            console.log("DEBUG Check Q" + (index+1) + ": Input=" + answer + ", Expected=" + state.result + ", Diff=" + Math.abs(answer - state.result) + ", Tolerance=" + tolerance);

            if(Math.abs(answer - state.result) <= tolerance) { 
                state.solved = true; 
                studentAnswers[index].isCorrect = true;
                markAsSolved(index); 
                revealNext(index);
            }
            else { 
                feedback.textContent = "❌ Incorrecto"; 
                feedback.style.color = "red"; 
                if(state.attempts >= 2) document.getElementById("skip-btn-" + index).classList.remove("hidden"); 
            }
            if(questionStates.every(q => q.solved || q.skipped)) finishTask(true);
        };
        
        window.skipAnswer = function(index) {
            if(isFinished) return;
            if(confirm("¿Seguro que quieres saltar? Obtendrás 0 puntos en esta pregunta.")) {
                questionStates[index].skipped = true;
                studentAnswers[index].wasSkipped = true;
                markAsSkipped(index);
                revealNext(index);
                if(questionStates.every(q => q.solved || q.skipped)) finishTask(true);
            }
        };
        
        window.finishTask = async function(auto = false) {
            if(isFinished) return;
            
            // Capture any pending inputs before finishing
            questionStates.forEach((state, index) => {
                if (!state.solved && !state.skipped) {
                    const input = document.getElementById("input-" + index);
                    if (input && input.value.trim() !== "") {
                        let val = input.value.trim();
                        // Support comma
                        const valNum = val.replace(',', '.');
                        studentAnswers[index].studentAnswer = isNaN(valNum) ? val : parseFloat(valNum);
                    }
                }
            });

            const pending = questionStates.filter(q => !q.solved && !q.skipped).length;
            const correctCount = questionStates.filter(q => q.solved).length;
            if(!auto && pending > 0) {
                if(!confirm("ATENCION: Tienes " + pending + " preguntas SIN RESPONDER O INCORRECTAS.\\n\\nSi finalizas ahora:\\n- Las preguntas que YA has acertado se guardan (Puntos: " + correctCount + ").\\n- Las " + pending + " preguntas restantes contarán como 0 puntos.\\n\\n¿Quieres entregar la tarea así?")) return;
            }
            isFinished = true;
            document.querySelectorAll("input, button").forEach(el => el.disabled = true);
            document.getElementById("manual-finish-btn").classList.add("hidden");
            const totalQuestions = questionStates.length;
            const finalScore = (correctCount / totalQuestions) * 10;
            const phrase = await CryptoEngine.generateProof(TASK_SEED, studentCode, finalScore);
            document.getElementById("final-section").classList.remove("hidden");
            document.getElementById("phrase-display").textContent = phrase;
            document.getElementById("final-score-display").textContent = finalScore.toFixed(1);
            document.getElementById("final-section").scrollIntoView({ behavior: "smooth" });
            if(GOOGLE_URL) {
                const statusEl = document.getElementById("google-status");
                statusEl.textContent = "Enviando nota de '" + TASK_NAME + "' al profesor...";
                try {
                    // Prepare detailed answer data for evidence
                    const answersData = studentAnswers.map((ans, idx) => ({
                        questionNumber: idx + 1,
                        question: ans.question.replace(/<[^>]*>/g, ''), // Remove HTML tags
                        studentAnswer: ans.wasSkipped ? 'SALTADA' : (ans.studentAnswer !== null ? ans.studentAnswer : 'Sin respuesta'),
                        correctAnswer: ans.correctAnswer,
                        isCorrect: ans.isCorrect,
                        wasSkipped: ans.wasSkipped
                    }));
                    
                    await fetch(GOOGLE_URL, { 
                        method: "POST", 
                        mode: "no-cors", 
                        headers: { "Content-Type": "text/plain" }, 
                        body: JSON.stringify({ 
                            studentName,
                            studentCode, 
                            moduleName: MODULE_NAME,
                            taskName: TASK_NAME,
                            score: Number(finalScore.toFixed(1)), 
                            phrase, 
                            seed: TASK_SEED, 
                            timestamp: new Date().toISOString(),
                            answers: answersData,
                            totalQuestions: totalQuestions,
                            correctCount: correctCount,
                            taskConfig: TASK_CONFIG // Send full config for reconstruction
                        }) 
                    });
                    statusEl.textContent = "✅ Nota y evidencias enviadas al profesor correctamente."; statusEl.style.color = "green";
                } catch(e) { console.error(e); statusEl.textContent = "⚠️ No se pudo enviar automáticamente. Por favor envía la clave manualmente."; statusEl.style.color = "orange"; }
            }
        };
        
        function markAsSolved(index) {
            const answer = studentAnswers[index].studentAnswer;
            document.getElementById("q-card-" + index).classList.add("solved");
            document.getElementById("badge-" + index).textContent = "Completado";
            document.getElementById("badge-" + index).classList.add("correct");
            document.getElementById("input-area-" + index).innerHTML = '<div style="padding:10px; background:#dcfce7; color:#166534; border-radius:6px; border:1px solid #bbf7d0;"><strong>✅ Respuesta Guardada:</strong> ' + answer + '</div>';
            document.getElementById("feedback-" + index).textContent = "";
        }
        
        function markAsSkipped(index) {
            document.getElementById("q-card-" + index).classList.add("skipped");
            document.getElementById("badge-" + index).textContent = "Saltado";
            document.getElementById("badge-" + index).classList.add("skipped");
            document.getElementById("input-area-" + index).innerHTML = '<p style="color:red; font-weight:bold;">⏭️ Pregunta Saltada (0 puntos)</p>';
            document.getElementById("feedback-" + index).textContent = "";
        }
        
    </script>
</body>
</html>`;

    // Return the HTML string - let the caller decide how to save it
    return html;
}
