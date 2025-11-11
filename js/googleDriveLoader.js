/**
 * Módulo para manejar la autenticación de Google y la selección de archivos JSON desde Drive.
 */
import { CREDENTIALS } from './credentials.js';

// --- Configuración de Credenciales ---
// Estas credenciales se obtuvieron de tu proyecto de Google Cloud.

// El código detecta si se ejecuta en Electron y elige el ID correcto.
const isElectron = navigator.userAgent.toLowerCase().includes('electron');
const CLIENT_ID = isElectron ? CREDENTIALS.CLIENT_ID_DESKTOP : CREDENTIALS.CLIENT_ID_WEB;

const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

// --- Variables de estado del módulo ---
let tokenClient;
let gapiInited = false;
let gisInited = false;
let onJsonLoadedCallback; // Función a la que se llamará con los datos del JSON
let driveButton;

/**
 * Habilita el botón de Drive una vez que ambas APIs (GAPI y GIS) están listas.
 */
function enableDriveButtonIfReady() {
  if (gapiInited && gisInited && driveButton) {
    driveButton.disabled = false;
    driveButton.querySelector('.btn-text').textContent = 'Conectar con Drive';
  }
}

/**
 * Callback que se ejecuta cuando el usuario ha interactuado con el Picker.
 * @param {object} data - Objeto con la información del archivo seleccionado.
 * @param {string} accessToken - Token de acceso para realizar peticiones a la API.
 */
function pickerCallback(data, accessToken) {
  if (data.action === window.google.picker.Action.PICKED) {
    const fileId = data.docs[0].id;
    // Con el ID del archivo, procedemos a descargar su contenido.
    fetchFileContent(fileId, accessToken);
  }
}

/**
 * Crea y muestra la ventana del Google Picker para que el usuario elija un archivo.
 * @param {string} accessToken - El token de OAuth2 necesario para autorizar al Picker.
 */
function createPicker(accessToken) {
  const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
  // Filtramos para que solo se puedan seleccionar archivos JSON.
  view.setMimeTypes("application/json,text/plain");

  const picker = new window.google.picker.PickerBuilder()
    .setAppId(CLIENT_ID.split('-')[0]) // El App ID es la primera parte del Client ID.
    .setOAuthToken(accessToken)
    .addView(view)
    .build();
  picker.setVisible(true);
}

/**
 * Utiliza la API de Google Drive para descargar el contenido de un archivo.
 * @param {string} fileId - El ID del archivo a descargar.
 * @param {string} accessToken - El token de OAuth2 para autorizar la descarga.
 */
async function fetchFileContent(fileId, accessToken) {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error al descargar el archivo: ${response.statusText}`);
    }

    const content = await response.json();
    // Si se especificó una función de callback, la llamamos con el contenido del JSON.
    if (onJsonLoadedCallback) {
      onJsonLoadedCallback(content);
    }
  } catch (err) {
    console.error("Error al procesar el archivo JSON:", err);
    alert(`Hubo un problema al leer el archivo: ${err.message}`);
  }
}

/**
 * Carga un script de forma dinámica y devuelve una promesa que se resuelve cuando ha cargado.
 * @param {string} src La URL del script a cargar.
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

/**
 * Carga e inicializa las APIs de Google (GAPI y GIS).
 */
async function initializeGoogleApis() {
  try {
    // Cargar los scripts en paralelo
    await Promise.all([
      loadScript('https://apis.google.com/js/api.js'),
      loadScript('https://accounts.google.com/gsi/client')
    ]);

    // Ahora que los scripts están cargados, inicializamos los clientes
    await new Promise(resolve => window.gapi.load('client:picker', resolve));
    gapiInited = true;

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          createPicker(tokenResponse.access_token);
        }
      },
    });
    gisInited = true;

    enableDriveButtonIfReady();
  } catch (error) {
    console.error("Error al cargar las APIs de Google:", error);
    alert("No se pudieron cargar los servicios de Google. Por favor, recarga la página.");
  }
}

/**
 * Función principal que se exporta. Prepara y activa el botón para cargar desde Drive.
 * @param {string} buttonId - El ID del elemento HTML del botón.
 * @param {function} onJsonLoaded - La función que recibirá los datos del JSON cargado.
 */
export function initGoogleDriveButton(buttonId, onJsonLoaded) {
  onJsonLoadedCallback = onJsonLoaded;
  driveButton = document.getElementById(buttonId);

  if (!driveButton) {
    console.error(`No se encontró el botón con el id: ${buttonId}`);
    return;
  }

  // Deshabilitar el botón al inicio hasta que las APIs estén listas.
  driveButton.disabled = true;
  driveButton.querySelector('.btn-text').textContent = 'Cargando...';

  // Iniciar la carga e inicialización de las APIs de Google
  initializeGoogleApis();

  // Añadimos el evento de clic al botón.
  driveButton.addEventListener('click', () => {
    if (tokenClient) {
      // Al hacer clic, solicitamos un token de acceso.
      // El callback de `initTokenClient` se encargará del resto.
      tokenClient.requestAccessToken({ prompt: '' });
    } else {
      alert("El cliente de autenticación de Google aún no está listo. Por favor, espera un momento.");
    }
  });
}