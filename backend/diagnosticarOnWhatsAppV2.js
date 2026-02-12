const { default: makeWASocket } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

// Importar el authState personalizado de Whaticket
async function getAuthState() {
  try {
    // Intentar cargar el authState de Whaticket
    const authStateModule = require('./dist/helpers/authState');
    return await authStateModule.authState('sessions');
  } catch (error) {
    console.log('❌ No se pudo cargar authState de Whaticket:', error.message);
    
    // Fallback: usar implementación simple
    console.log('⚠️  Usando implementación simple...');
    
    const sessionPath = 'sessions';
    if (!fs.existsSync(sessionPath)) {
      throw new Error('No existe carpeta sessions/');
    }
    
    // Cargar creds.json manualmente
    const credsPath = path.join(sessionPath, 'creds.json');
    if (!fs.existsSync(credsPath)) {
      throw new Error('No existe creds.json en sessions/');
    }
    
    const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    
    return {
      state: {
        creds,
        keys: {
          get: async () => ({}),
          set: async () => {}
        }
      },
      saveCreds: () => {}
    };
  }
}

async function diagnosticarOnWhatsAppV2() {
  console.log('🔍 DIAGNÓSTICO onWhatsApp V2');
  console.log('=============================');
  
  try {
    // Obtener authState
    const { state, saveCreds } = await getAuthState();
    
    if (!state.creds || !state.creds.me) {
      console.log('❌ Credenciales NO válidas o sesión expirada');
      console.log('   Creds disponibles:', Object.keys(state.creds || {}));
      return;
    }
    
    console.log('✅ Credenciales cargadas');
    console.log('   Usuario:', state.creds.me.id || 'Desconocido');
    console.log('   Plataforma:', state.creds.platform || 'Desconocida');
    
    // Crear socket
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: { level: 'warn' }
    });
    
    // Configurar eventos
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      console.log('📡 Estado conexión:', connection);
      
      if (connection === 'open') {
        console.log('✅ WhatsApp CONECTADO');
      }
      
      if (connection === 'close') {
        const error = lastDisconnect?.error;
        console.log('❌ WhatsApp DESCONECTADO');
        if (error) {
          console.log('   Error:', error.message);
          console.log('   Status:', error.status);
        }
      }
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    // Esperar 10 segundos para que se estabilice la conexión
    console.log('⏳ Esperando 10 segundos para conexión...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Verificar si está conectado
    if (!sock.user) {
      console.log('❌ WhatsApp NO conectado después de 10 segundos');
      return;
    }
    
    console.log('✅ WhatsApp listo para pruebas');
    console.log('   Usuario conectado:', sock.user.id);
    
    // TEST: LID problemático
    console.log('\n🧪 TEST: LID 28308196585718@lid');
    console.log('-------------------------------');
    
    try {
      const testLID = '28308196585718@lid';
      console.log('Consultando:', testLID);
      
      // Usar promise con timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout después de 10 segundos')), 10000);
      });
      
      const queryPromise = sock.onWhatsApp(testLID);
      const results = await Promise.race([queryPromise, timeoutPromise]);
      
      console.log('✅ Resultado recibido');
      
      if (results && results.length > 0) {
        console.log('   Existe:', results[0].exists);
        console.log('   JID:', results[0].jid);
        console.log('   ✅ LID CONVERTIDO EXITOSAMENTE');
      } else {
        console.log('   ❌ LID no existe o no devolvió resultados');
        console.log('   Results:', JSON.stringify(results, null, 2));
      }
      
    } catch (error) {
      console.log('❌ Error en onWhatsApp:');
      console.log('   Mensaje:', error.message);
      console.log('   Código:', error.code);
      console.log('   Status:', error.status);
      
      // Intentar verificar si es error de token
      if (error.message.includes('token') || error.message.includes('403')) {
        console.log('⚠️  PROBLEMA DE TOKEN/AUTENTICACIÓN');
        console.log('   Posible causa: Sesión expirada o token inválido');
      }
    }
    
    // Cerrar conexión
    await sock.end();
    console.log('\n✅ Diagnóstico completado');
    
  } catch (error) {
    console.log('❌ Error general en diagnóstico:', error.message);
    console.log('Stack:', error.stack);
  }
}

diagnosticarOnWhatsAppV2().catch(console.error);
