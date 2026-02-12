const { downloadMediaMessage, getUrlInfo } = require('@whiskeysockets/baileys');
const fs = require('fs').promises;
const path = require('path');

async function testDecryptLowLevel() {
    console.log("=== Test de Descifrado (Bajo Nivel) ===\n");
    
    // Tus datos conocidos
    const mediaKeyHex = 'a9df526e6aad7c034c49de368fcc57c8d00d29430754ca6a1b5586a835556f3c';
    const encryptedFilePath = '/home/whaticketapp/whaticket-free/backend/public/3EB0F9701B052C8DECC12C.image';
    
    try {
        // 1. Leer el archivo cifrado completo
        const encryptedData = await fs.readFile(encryptedFilePath);
        console.log(`📊 Archivo cifrado: ${encryptedData.length} bytes`);
        
        // 2. Mostrar estructura del archivo
        console.log(`   Primeros 16 bytes (posible IV): ${encryptedData.slice(0, 16).toString('hex')}`);
        console.log(`   Últimos 16 bytes: ${encryptedData.slice(-16).toString('hex')}`);
        
        // 3. Intentar usar la función decryptMediaRef directamente
        // Buscamos funciones de descifrado en Baileys
        const baileysModule = require('@whiskeysockets/baileys');
        console.log(`\n🔍 Funciones disponibles en Baileys:`);
        Object.keys(baileysModule)
            .filter(key => key.toLowerCase().includes('decrypt') || key.toLowerCase().includes('media'))
            .forEach(key => console.log(`   - ${key}`));
        
        // 4. Intentar con WAProto si está disponible
        let protoAvailable = false;
        try {
            const { proto } = require('@whiskeysockets/baileys');
            if (proto && proto.Message) {
                protoAvailable = true;
                console.log(`\n✅ WAProto disponible para construir mensaje`);
            }
        } catch (e) {
            console.log(`\n⚠️ WAProto no disponible: ${e.message}`);
        }
        
        // 5. Enfoque alternativo: Simular un mensaje completo
        console.log(`\n🔧 Construyendo mensaje simulado...`);
        
        const fakeMessage = {
            key: {
                remoteJid: '1234567890@s.whatsapp.net',
                id: '3EB0F9701B052C8DECC12C'
            },
            message: {
                imageMessage: {
                    url: `file://${encryptedFilePath}`,
                    mediaKey: Buffer.from(mediaKeyHex, 'hex').toString('base64'),
                    mimetype: 'image/jpeg',
                    fileSha256: encryptedData.slice(-32), // Últimos 32 bytes podrían ser hash
                    fileLength: encryptedData.length,
                    height: 800,
                    width: 600,
                    mediaKeyTimestamp: Date.now().toString(),
                    directPath: '/v/t62.7118-24/3EB0F9701B052C8DECC12C'
                }
            },
            messageTimestamp: Date.now(),
            status: 'SERVER_ACK'
        };
        
        console.log(`📨 Mensaje simulado construido con:`);
        console.log(`   - mediaKey: ${fakeMessage.message.imageMessage.mediaKey.substring(0, 30)}...`);
        console.log(`   - fileLength: ${fakeMessage.message.imageMessage.fileLength}`);
        
        // 6. Intentar descifrar con el mensaje simulado
        console.log(`\n🔐 Intentando descifrar con mensaje simulado...`);
        
        try {
            const decryptedBuffer = await downloadMediaMessage(
                fakeMessage,
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: async () => {
                        console.log(`   📞 Reupload request simulada`);
                        return { 
                            mediaKey: Buffer.from(mediaKeyHex, 'hex'),
                            directPath: fakeMessage.message.imageMessage.directPath
                        };
                    }
                }
            );
            
            console.log(`\n✅ ¡DESCIFRADO EXITOSO!`);
            console.log(`   Tamaño: ${decryptedBuffer.length} bytes`);
            
            // Verificar si es JPEG
            const firstBytes = decryptedBuffer.slice(0, 3).toString('hex').toUpperCase();
            console.log(`   Primeros bytes: ${firstBytes}`);
            
            if (firstBytes === 'FFD8FF') {
                console.log(`   ✅ Formato JPEG válido`);
                
                const outputPath = '/tmp/descifrado_final.jpg';
                await fs.writeFile(outputPath, decryptedBuffer);
                console.log(`   💾 Guardado en: ${outputPath}`);
                
                // Mostrar información del archivo
                const stats = await fs.stat(outputPath);
                console.log(`   📁 Tamaño final: ${stats.size} bytes`);
            }
            
            return { success: true, buffer: decryptedBuffer };
            
        } catch (innerError) {
            console.error(`\n❌ Error en downloadMediaMessage: ${innerError.message}`);
            console.error(`   Detalles: ${innerError.stack.split('\n')[0]}`);
            
            // 7. Último recurso: Buscar funciones internas de descifrado
            console.log(`\n🔍 Buscando funciones internas de descifrado...`);
            
            // Intentar acceder a funciones internas
            const baileysPath = require.resolve('@whiskeysockets/baileys');
            const baileysDir = path.dirname(baileysPath);
            
            console.log(`   Ruta de Baileys: ${baileysDir}`);
            
            // Listar archivos en el directorio de Baileys
            const files = await fs.readdir(baileysDir);
            const decryptFiles = files.filter(f => f.toLowerCase().includes('decrypt') || f.toLowerCase().includes('crypt'));
            console.log(`   Archivos relacionados: ${decryptFiles.join(', ') || 'ninguno'}`);
            
            throw innerError;
        }
        
    } catch (error) {
        console.error(`\n💥 Error general: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Ejecutar
testDecryptLowLevel().then(result => {
    console.log("\n=== Test finalizado ===");
    process.exit(result.success ? 0 : 1);
});
