const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const http = require('http');
const url = require('url');
const { OAuth2Client } = require('google-auth-library');
const credentials = require('./electron-credentials'); // <-- Importar credenciales
const fs = require('fs').promises;

let currentLocalFile = null;
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
          reject(new Error(e.message));
        }
      }).listen(3000, () => {
        // Abrir la URL de autorización en el navegador predeterminado del usuario
        shell.openExternal(authorizeUrl);
      });

      server.on('error', (e) => {
        console.error('Error en el servidor local:', e);
        if (server && server.listening) server.close(); // Nos aseguramos de cerrar el servidor si falla al iniciar
        reject(new Error('No se pudo iniciar el servidor local para la autenticación.'));
      });
    });
  });

  // --- INICIO: MANEJADORES PARA GUARDADO LOCAL Y EN LA NUBE ---

  ipcMain.handle('save-file-dialog', async () => {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'Guardar como...',
      defaultPath: 'cuaderno_profesor.json',
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (canceled || !filePath) {
      return { success: false };
    }

    currentLocalFile = filePath;
    return { success: true, filePath };
  });

  ipcMain.handle('open-file-dialog', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: 'Conectar a archivo',
      properties: ['openFile'],
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: false };
    }

    currentLocalFile = filePaths[0];
    try {
      const content = await fs.readFile(currentLocalFile, 'utf-8');
      return { success: true, filePath: currentLocalFile, content };
    } catch (error) {
      console.error('Error al leer el archivo local:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('save-file-local', async (event, content) => {
    if (!currentLocalFile) {
      console.warn('Se intentó guardar localmente pero no hay archivo conectado.');
      return { success: false, error: 'No hay archivo conectado.' };
    }
    try {
      await fs.writeFile(currentLocalFile, JSON.stringify(content, null, 2));
      console.log(`Archivo local "${path.basename(currentLocalFile)}" guardado.`);
      return { success: true };
    } catch (error) {
      console.error('Error al guardar en archivo local:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-file-drive', async (event, fileId, content, accessToken) => {
    return await updateFileInDrive(fileId, content, accessToken);
  });

  ipcMain.handle('update-mirror-drive', async (event, fileName, content, accessToken) => {
    return await updateMirrorFileInDrive(fileName, content, accessToken);
  });

  // --- FIN: MANEJADORES ---

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// --- INICIO: FUNCIONES DE GUARDADO EN DRIVE (MOVIDAS AQUÍ) ---

async function updateFileInDrive(fileId, content, accessToken) {
  if (!fileId || !accessToken) {
    console.error("No se proporcionó fileId o accessToken para la actualización en Drive.");
    return false;
  }

  console.log(`[ELECTRON-MAIN] Iniciando actualización del archivo ${fileId} en Google Drive...`);
  oAuth2Client.setCredentials({ access_token: accessToken });

  const metadata = { mimeType: 'application/json' };
  const fileContent = JSON.stringify(content, null, 2);

  const body = `--foo_bar_baz\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--foo_bar_baz\r\nContent-Type: application/json\r\n\r\n${fileContent}\r\n--foo_bar_baz--`;

  try {
    const response = await oAuth2Client.request({
      url: `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`,
      method: 'PATCH',
      headers: { 'Content-Type': 'multipart/related; boundary=foo_bar_baz' },
      body: body,
    });

    if (response.status === 200) {
      console.log(`[ELECTRON-MAIN] Archivo ${fileId} actualizado correctamente en Google Drive.`);
      return true;
    } else {
      throw new Error(`Falló la subida: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error al actualizar el archivo en Google Drive:', error.message);
    return false;
  }
}

async function updateMirrorFileInDrive(originalFileName, content, accessToken) {
  if (!originalFileName || !content || !accessToken) {
    console.error("[ELECTRON-MAIN-MIRROR] Error: Faltan datos para actualizar el archivo espejo.");
    return false;
  }

  oAuth2Client.setCredentials({ access_token: accessToken });
  const mirrorDocName = originalFileName.replace(/\.json$/i, '');
  const mirrorMimeType = 'application/vnd.google-apps.document';
  console.log(`[ELECTRON-MAIN-MIRROR] Iniciando proceso para el Google Doc espejo: "${mirrorDocName}"`);

  try {
    // 1. Buscar el ID del archivo espejo
    const searchResponse = await oAuth2Client.request({
      url: `https://www.googleapis.com/drive/v3/files`,
      params: {
        q: `name='${mirrorDocName}' and mimeType='${mirrorMimeType}' and trashed=false`,
        fields: 'files(id)',
      },
    });

    let mirrorFileId = searchResponse.data.files.length > 0 ? searchResponse.data.files[0].id : null;

    // 2. Si no existe, crearlo
    if (!mirrorFileId) {
      console.log(`[ELECTRON-MAIN-MIRROR] El archivo espejo no existe. Creando uno nuevo...`);
      const createMetadata = { name: mirrorDocName, mimeType: mirrorMimeType };
      const createResponse = await oAuth2Client.request({
        url: 'https://www.googleapis.com/drive/v3/files',
        method: 'POST',
        body: JSON.stringify(createMetadata),
        headers: { 'Content-Type': 'application/json' },
      });
      mirrorFileId = createResponse.data.id;
      console.log(`[ELECTRON-MAIN-MIRROR] Google Doc espejo creado con ID: ${mirrorFileId}`);
    } else {
      console.log(`[ELECTRON-MAIN-MIRROR] Archivo espejo encontrado. ID: ${mirrorFileId}`);
    }

    // 3. Actualizar el contenido
    const updateMetadata = { mimeType: mirrorMimeType };
    const fileContent = JSON.stringify(content, null, 2);
    const body = `--foo_bar_baz\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(updateMetadata)}\r\n--foo_bar_baz\r\nContent-Type: text/plain\r\n\r\n${fileContent}\r\n--foo_bar_baz--`;

    const updateResponse = await oAuth2Client.request({
      url: `https://www.googleapis.com/upload/drive/v3/files/${mirrorFileId}?uploadType=multipart`,
      method: 'PATCH',
      headers: { 'Content-Type': 'multipart/related; boundary=foo_bar_baz' },
      body: body,
    });

    if (updateResponse.status === 200) {
      console.log(`[ELECTRON-MAIN-MIRROR] ¡ÉXITO! Google Doc espejo "${mirrorDocName}" actualizado.`);
      return true;
    } else {
      throw new Error(`Error al actualizar el contenido del Google Doc: ${updateResponse.statusText}`);
    }

  } catch (error) {
    console.error(`[ELECTRON-MAIN-MIRROR] ERROR en el proceso del archivo espejo:`, error.message);
    return false;
  }
}

// --- FIN: FUNCIONES DE GUARDADO EN DRIVE ---