
const fs = require('fs');

function generateStudentHTML(taskName, seed, config, antiCopyMode, googleScriptUrl) {
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

    // HARDCODED CRYPTO ENGINE FOR STUDENT FILE
    const cryptoLogic = `
    const CryptoEngine = {
        async hash(text) {
            const msgBuffer = new TextEncoder().encode(text);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        },
        pseudoRandom(seed) {
            let s = seed;
            return function() {
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
                // Simple string replacement for {key}
                question = question.split('{' + key + '}').join(val);
            }
            
            // For nested expressions like {a+b}, we use a simpler regex that is easier to escape
            // We match curly braces explicitly. We use new RegExp to avoid literal issues in the injected string.
            // We need to escape the backslashes for the string, and then for the regex.
            // To get \{ in the regex, we need \\{ in the string.
            // To get \\{ in the string inside a template literal, we might need \\\\{
            const regex = new RegExp('\\\\{([^}]+)\\\\}', 'g');
            question = question.replace(regex, (match, expr) => {
                try {
                    let evalExpr = expr;
                    for (const [k, v] of Object.entries(vars)) {
                        // Replace variable names with values using word boundaries
                        // We construct the regex source string carefully
                        const varRegex = new RegExp('\\\\b' + k + '\\\\b', 'g');
                        evalExpr = evalExpr.replace(varRegex, v);
                    }
                    return eval(evalExpr);
                } catch(e) { return match; }
            });

            return { vars, result, question };
        },
        async generateProof(seed, studentCode, score) {
            const s = String(seed).trim();
            const c = String(studentCode).trim();
            let scoreStr = score;
            if (typeof score === 'number') {
                 scoreStr = (score % 1 === 0) ? score.toString() : score.toFixed(1);
            }
            const raw = \`TASK-\${s}-STUDENT-\${c}-SCORE-\${scoreStr}\`;
            const hash = await this.hash(raw);
            return hash.substring(0, 10).toUpperCase();
        }
    };
    `;

    const antiCopyScript = antiCopyMode ? `
    // ANTI-COPY PROTECTION
    document.addEventListener('contextmenu', event => event.preventDefault());
    ` : '';

    const antiCopyCSS = antiCopyMode ? `
        body {
            user-select: none;
        }
    ` : '';

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>${taskName}</title>
    <style>
        ${antiCopyCSS}
    </style>
</head>
<body>
    <script>
        ${antiCopyScript}
        const TASK_SEED = ${seed};
        const TASK_CONFIG = ${JSON.stringify(taskConfig)};
        const GOOGLE_URL = "${googleScriptUrl || ''}";
        ${cryptoLogic}

        console.log("Loaded");
    </script>
</body>
</html>
    `;

    return htmlContent;
}

const html = generateStudentHTML("Tarea Prueba", 1234, null, true, "http://google.com");
fs.writeFileSync('debug_output.html', html);
console.log("Generated debug_output.html");
