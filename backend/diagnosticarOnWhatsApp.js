const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

async function diagnosticarOnWhatsApp() {
  console.log('🔍 INICIANDO DIAGNÓSTICO onWhatsApp');
  console.log('====================================');
  
  // Verificar si existe sesión
  const sessionPath = 'whatsapp-session';
  if (!fs.existsSync(sessionPath)) {
    console.log('❌ NO hay carpeta de sesión WhatsApp');
    return;
  }
  
  console.log('📁 Sesión encontrada en:', sessionPath);
  
  try {
    // Cargar sesión existente
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    
    // Verificar credenciales
    if (!state.creds.me) {
      console.log('❌ Credenciales NO válidas o sesión expirada');
      return;
    }
    
    console.log('✅ Credenciales cargadas');
    console.log('   Usuario:', state.creds.me?.id || 'Desconocido');
    console.log('   Plataforma:', state.creds.platform || 'Desconocida');
    
    // Crear socket
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: { level: 'silent' }
    });
    
    let conexionAbierta = false;
    let timeoutId;
    
    // Configurar timeout
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Timeout: No se pudo conectar en 30 segundos'));
      }, 30000);
    });
    
    // Esperar conexión
    const conexion = new Promise((resolve) => {
      sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        console.log('📡 Estado conexión:', connection);
        
        if (connection === 'open') {
          clearTimeout(timeoutId);
          conexionAbierta = true;
          console.log('✅ WhatsApp CONECTADO');
          resolve(true);
        }
        
        if (connection === 'close') {
          const error = lastDisconnect?.error;
          console.log('❌ WhatsApp DESCONECTADO');
          if (error) {
            console.log('   Error:', error.message);
            console.log('   Status:', error.status);
          }
          resolve(false);
        }
      });
    });
    
    // Guardar credenciales
    sock.ev.on('creds.update', saveCreds);
    
    // Esperar conexión o timeout
    const conectado = await Promise.race([conexion, timeout]);
    
    if (!conectado) {
      console.log('❌ No se pudo conectar a WhatsApp');
      return;
    }
    
    // ESPERAR 3 segundos para estabilizar
    console.log('⏳ Esperando 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // TEST 1: Número conocido (debería funcionar)
    console.log('\n🧪 TEST 1: Número tradicional conocido');
    console.log('--------------------------------------');
    try {
      // Usar un número que sabes que existe (puedes cambiarlo)
      const testNumber = '5492478409220@s.whatsapp.net';
      console.log('   Consultando:', testNumber);
      
      const results = await sock.onWhatsApp(testNumber);
      console.log('   ✅ Resultado:', results ? 'Éxito' : 'Fallo');
      
      if (results && results.length > 0) {
        console.log('   Existe:', results[0].exists);
        console.log   ('   JID:', results[0].jid);
      } else {
        console.log('   ❌ No hay resultados');
      }
    } catch (error) {
      console.log('   ❌ Error:', error.message);
      console.log('   Status:', error.status);
      console.log('   Code:', error.code);
    }
    
    // TEST 2: LID problemático
    console.log('\n🧪 TEST 2: LID (28308196585718@lid)');
    console.log('--------------------------------------');
    try {
      const testLID = '28308196585718@lid';
      console.log('   Consultando LID:', testLID);
      
      const results = await sock.onWhatsApp(testLID);
      console.log('   ✅ Resultado:', results ? 'Recibido' : 'Vacío');
      
      if (results && results.length > 0) {
        console.log('   Existe:', results[0].exists);
        console.log('   JID:', results[0].jid);
      } else {
        console.log('   ❌ LID no devolvió resultados');
      }
    } catch (error) {
      console.log('   ❌ Error LID:', error.message);
      console.log('   Status:', error.status);
      console.log('   Code:', error.code);
      if (error.response) {
        console.log('   Response:', JSON.stringify(error.response, null, 2));
      }
    }
    
    // TEST 3: Solo número sin @
    console.log('\n🧪 TEST 3: Solo número (sin @s.whatsapp.net)');
    console.log('--------------------------------------------');
    try {
      const testNum = '5492478409220';
      console.log('   Consultando:', testNum);
      
      const results = await sock.onWhatsApp(testNum);
      console.log('   ✅ Resultado:', results ? 'Recibido' : 'Vacío');
      
      if (results && results.length > 0) {
        console.log('   Existe:', results[0].exists);
        console.log('   JID:', results[0].jid);
      } else {
        console.log('   ❌ No hay resultados');
      }
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }
    
    // TEST 4: Verificar estado de conexión
    console.log('\n🧪 TEST 4: Estado general');
    console.log('-------------------------');
    console.log('   Conexión activa:', conexionAbierta);
    console.log('   Creds.me:', sock.authState.creds.me?.id);
    
    // Cerrar conexión limpia
    await sock.end();
    console.log('\n✅ Diagnóstico completado');
    
  } catch (error) {
    console.log('❌ Error en diagnóstico:', error.message);
    console.log('Stack:', error.stack);
  }
}

diagnosticarOnWhatsApp().catch(console.error);
