
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
        const formulaFunc = new Function(...keys, 'return ' + questionConfig.formula);
        const result = formulaFunc(...values);

        let question = questionConfig.question;
        for (const [key, val] of Object.entries(vars)) {
            question = question.split('{' + key + '}').join(val);
        }

        return { vars, result, question };
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
    }
};

export function verifyProof(seed, studentCode, score) {
    return CryptoEngine.generateProof(seed, studentCode, score);
}

export function generateStudentHTML(taskName, seed, config, antiCopyMode = true, googleScriptUrl = '') {
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

    // Build the CryptoEngine code as a string array
    const cryptoEngineCode = [
        'const CryptoEngine = {',
        '    async hash(text) {',
        '        const msgBuffer = new TextEncoder().encode(text);',
        '        const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);',
        '        const hashArray = Array.from(new Uint8Array(hashBuffer));',
        '        return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");',
        '    },',
        '    pseudoRandom(seed) {',
        '        let s = seed;',
        '        return function() {',
        '            s = Math.sin(s) * 10000;',
        '            return s - Math.floor(s);',
        '        };',
        '    },',
        '    generateParams(seed, studentCode, questionConfig, questionIndex) {',
        '        const combinedSeed = parseInt(seed) + parseInt(studentCode) + (questionIndex * 1337);',
        '        const rng = this.pseudoRandom(combinedSeed);',
        '        const vars = {};',
        '        for (const [key, rule] of Object.entries(questionConfig.variables)) {',
        '            if (Array.isArray(rule)) {',
        '                const index = Math.floor(rng() * rule.length);',
        '                vars[key] = rule[index];',
        '            } else if (typeof rule === "object" && rule.min !== undefined) {',
        '                vars[key] = Math.floor(rng() * (rule.max - rule.min + 1)) + rule.min;',
        '            }',
        '        }',
        '        const keys = Object.keys(vars);',
        '        const values = Object.values(vars);',
        '        const formulaFunc = new Function(...keys, "return " + questionConfig.formula);',
        '        const result = formulaFunc(...values);',
        '        let question = questionConfig.question;',
        '        for (const [key, val] of Object.entries(vars)) {',
        '            question = question.split("{" + key + "}").join(val);',
        '        }',
        '        return { vars, result, question };',
        '    },',
        '    async generateProof(seed, studentCode, score) {',
        '        const s = String(seed).trim();',
        '        const c = String(studentCode).trim();',
        '        let scoreStr = score;',
        '        if (typeof score === "number") {',
        '            scoreStr = (score % 1 === 0) ? score.toString() : score.toFixed(1);',
        '        }',
        '        const raw = "TASK-" + s + "-STUDENT-" + c + "-SCORE-" + scoreStr;',
        '        const hash = await this.hash(raw);',
        '        return hash.substring(0, 10).toUpperCase();',
        '    }',
        '};'
    ].join('\n');

    // Anti-copy protection scripts (concatenated as single line strings)
    const antiCopyScript = antiCopyMode ?
        'document.addEventListener("contextmenu", e => e.preventDefault());' +
        'document.addEventListener("copy", e => e.preventDefault());' +
        'document.addEventListener("cut", e => e.preventDefault());' +
        'document.addEventListener("paste", e => e.preventDefault());' +
        'document.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && ["c","v","u","p"].includes(e.key)) e.preventDefault(); });'
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
        <p>Introduce tu código para desbloquear los ejercicios.</p>
    </div>
    <div id="login-card" class="card">
        <label><strong>Código de Alumno:</strong></label>
        <input type="number" id="student-code" placeholder="Ej: 105">
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
        ${cryptoEngineCode}
        
        let studentCode = "";
        let questionStates = [];
        let isFinished = false;
        
        document.getElementById("start-btn").addEventListener("click", () => {
            studentCode = document.getElementById("student-code").value.trim();
            if(!studentCode) return alert("Introduce tu código");
            initDashboard();
        });
        
        function initDashboard() {
            document.getElementById("login-card").classList.add("hidden");
            document.getElementById("dashboard").classList.remove("hidden");
            const container = document.getElementById("questions-list");
            container.innerHTML = "";
            
            TASK_CONFIG.questions.forEach((qConfig, index) => {
                const params = CryptoEngine.generateParams(TASK_SEED, studentCode, qConfig, index);
                questionStates.push({ solved: false, skipped: false, attempts: 0, result: params.result });
                
                const card = document.createElement("div");
                card.className = "question-card";
                card.id = "q-card-" + index;
                card.innerHTML = \`<div class="q-header"><span><strong>Pregunta \${index + 1}</strong></span><span class="q-badge" id="badge-\${index}">Pendiente</span></div><div class="q-content">\${params.question}</div><div id="input-area-\${index}"><input type="number" id="input-\${index}" placeholder="Tu respuesta" step="any"><button onclick="checkAnswer(\${index})">Comprobar</button><button onclick="skipAnswer(\${index})" id="skip-btn-\${index}" class="skip-btn hidden">Saltar Pregunta (0 pts)</button></div><div class="feedback" id="feedback-\${index}"></div>\`;
                container.appendChild(card);
            });
        }
        
        window.checkAnswer = function(index) {
            if(isFinished) return;
            const input = document.getElementById("input-" + index);
            const val = input.value;
            const feedback = document.getElementById("feedback-" + index);
            if(val.includes(",")) { feedback.textContent = "⚠️ Usa PUNTO (.) para decimales"; feedback.style.color = "orange"; return; }
            if(!val) return;
            const answer = parseFloat(val);
            const state = questionStates[index];
            const qConfig = TASK_CONFIG.questions[index];
            const tolerance = (qConfig.tolerance !== undefined) ? qConfig.tolerance : 0.01;
            state.attempts++;
            if(Math.abs(answer - state.result) <= tolerance) { state.solved = true; markAsSolved(index); }
            else { feedback.textContent = "❌ Incorrecto"; feedback.style.color = "red"; if(state.attempts >= 2) document.getElementById("skip-btn-" + index).classList.remove("hidden"); }
            if(questionStates.every(q => q.solved || q.skipped)) finishTask(true);
        };
        
        window.skipAnswer = function(index) {
            if(isFinished) return;
            if(confirm("¿Seguro que quieres saltar? Obtendrás 0 puntos en esta pregunta.")) {
                questionStates[index].skipped = true;
                markAsSkipped(index);
                if(questionStates.every(q => q.solved || q.skipped)) finishTask(true);
            }
        };
        
        window.finishTask = async function(auto = false) {
            if(isFinished) return;
            const pending = questionStates.filter(q => !q.solved && !q.skipped).length;
            const correctCount = questionStates.filter(q => q.solved).length;
            if(!auto && pending > 0) {
                if(!confirm(\`⚠️ ATENCIÓN ⚠️\\n\\nTienes \${pending} preguntas SIN RESPONDER O INCORRECTAS.\\n\\nSi finalizas ahora:\\n- Las preguntas que YA has acertado se guardan (Puntos: \${correctCount}).\\n- Las \${pending} preguntas restantes contarán como 0 puntos.\\n\\n¿Quieres entregar la tarea así?\`)) return;
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
                statusEl.textContent = "Enviando nota al profesor...";
                try {
                    await fetch(GOOGLE_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentCode, score: finalScore.toFixed(1), phrase, seed: TASK_SEED, timestamp: new Date().toISOString() }) });
                    statusEl.textContent = "✅ Nota enviada al profesor correctamente."; statusEl.style.color = "green";
                } catch(e) { console.error(e); statusEl.textContent = "⚠️ No se pudo enviar automáticamente. Por favor envía la clave manualmente."; statusEl.style.color = "orange"; }
            }
        };
        
        function markAsSolved(index) {
            document.getElementById("q-card-" + index).classList.add("solved");
            document.getElementById("badge-" + index).textContent = "Completado";
            document.getElementById("badge-" + index).classList.add("correct");
            document.getElementById("input-area-" + index).innerHTML = '<p style="color:green; font-weight:bold;">✅ ¡Respuesta Correcta!</p>';
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
