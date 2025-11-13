const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const http = require('http');
const url = require('url');
const { OAuth2Client } = require('google-auth-library');
const credentials = require('./electron-credentials'); // <-- Importar credenciales

// --- CONFIGURACIÓN DE OAUTH OFICIAL DE GOOGLE ---
const REDIRECT_URI = 'http://localhost:3000';
const oAuth2Client = new OAuth2Client({ // <-- Se añade la llave de apertura
  clientId: credentials.CLIENT_ID,
  clientSecret: credentials.CLIENT_SECRET,
  redirectUri: REDIRECT_URI // <-- Se añade el nombre de la propiedad 'redirectUri'
}); // <-- Se añade la llave de cierre

let mainWindow; // Hacemos la ventana principal accesible globalmente

function createWindow() {
  // Crea la ventana del navegador.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    // IMPORTANTE: Necesitamos un preload script para comunicar el main y el renderer de forma segura
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // y carga el index.html de la aplicación.
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  ipcMain.handle('google-oauth-start', () => {
    let server; // Definimos el servidor aquí para que sea accesible en todo el ámbito de la promesa

    return new Promise((resolve, reject) => {
      // Generar la URL de autorización
      const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/drive.file',
        prompt: 'consent' // Pide consentimiento siempre para obtener un refresh_token
      });
      
      // Crear un servidor local para escuchar el callback
      server = http.createServer(async (req, res) => {
        try {
          // Extraer el código de la URL de redirección
          const code = url.parse(req.url, true).query.code;
          
          // Enviar una respuesta al navegador para que el usuario sepa que puede cerrarlo
          res.end('<h1>Autenticación exitosa. Puedes cerrar esta pestaña.</h1>');

          // Intercambiar el código por tokens
          const { tokens } = await oAuth2Client.getToken(code);
          oAuth2Client.setCredentials(tokens);

          console.log('Tokens obtenidos:', tokens);
          server.close(); // Cerramos el servidor en el caso de éxito
          resolve({ success: true, token: tokens });

        } catch (e) {
          console.error('Error al obtener tokens:', e);
          if (server && server.listening) server.close(); // Nos aseguramos de cerrar el servidor en caso de error
          reject({ success: false, error: e.message });
        }
      }).listen(3000, () => {
        // Abrir la URL de autorización en el navegador predeterminado del usuario
        shell.openExternal(authorizeUrl);
      });

      server.on('error', (e) => {
        console.error('Error en el servidor local:', e);
        if (server && server.listening) server.close(); // Nos aseguramos de cerrar el servidor si falla al iniciar
        reject({ success: false, error: 'No se pudo iniciar el servidor local para la autenticación.' });
      });
    });
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});