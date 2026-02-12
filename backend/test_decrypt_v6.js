const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

async function testDecrypt() {
    console.log("=== Test de Descifrado Baileys 6.7.19 ===\n");
    
    // 1. Tu MediaKey en Base64 (la original era hex)
    const mediaKeyHex = 'a9df526e6aad7c034c49de368fcc57c8d00d29430754ca6a1b5586a835556f3c';
    const mediaKeyBuffer = Buffer.from(mediaKeyHex, 'hex');
    
    // 2. Ruta del archivo cifrado
    const encryptedFilePath = '/home/whaticketapp/whaticket-free/backend/public/3EB0F9701B052C8DECC12C.image';
    
    try {
        // 3. Leer el archivo cifrado
        const encryptedData = await fs.readFile(encryptedFilePath);
        console.log(`📊 Archivo cifrado leído: ${encryptedData.length} bytes`);
        
        // 4. Crear estructura de mensaje fake para Baileys
        const fakeMessage = {
            directPath: '/v/t62.7118-24/3EB0F9701B052C8DECC12C',
            url: `file://${encryptedFilePath}`,
            mediaKey: mediaKeyBuffer,
            mediaKeyTimestamp: Date.now(),
            fileLength: encryptedData.length,
            mediaType: 'image'
        };
        
        console.log("🔐 Intentando descifrar con downloadMediaMessage...");
        
        // 5. Usar la función de Baileys 6.7.19
        const decryptedBuffer = await downloadMediaMessage(
            fakeMessage,
            'buffer',
            {},
            { 
                logger: { 
                    level: 'silent' // Silenciamos logs para claridad
                },
                reuploadRequest: async () => {
                    return { mediaKey: mediaKeyBuffer };
                }
            }
        );
        
        console.log(`\n✅ ¡DESCIFRADO EXITOSO!`);
        console.log(`   Tamaño del resultado: ${decryptedBuffer.length} bytes`);
        
        // 6. Verificar si es un JPEG válido
        const firstBytes = decryptedBuffer.slice(0, 3).toString('hex').toUpperCase();
        console.log(`   Primeros bytes (hex): ${firstBytes}`);
        
        if (firstBytes === 'FFD8FF') {
            console.log(`   ✅ Formato JPEG válido detectado (FF D8 FF = JPEG SOI marker)`);
            
            // 7. Guardar el resultado
            const outputPath = '/tmp/3EB0F9701B052C8DECC12C_DECRYPTED.jpg';
            await fs.writeFile(outputPath, decryptedBuffer);
            console.log(`   💾 Archivo guardado en: ${outputPath}`);
            
            // 8. Información adicional del JPEG
            try {
                // Buscar el marcador de fin de imagen
                const soiIndex = decryptedBuffer.indexOf(Buffer.from([0xFF, 0xD8]));
                const eoiIndex = decryptedBuffer.indexOf(Buffer.from([0xFF, 0xD9]));
                
                if (soiIndex !== -1 && eoiIndex !== -1) {
                    console.log(`   📸 Estructura JPEG: SOI en byte ${soiIndex}, EOF en byte ${eoiIndex + 2}`);
                }
            } catch (e) {
                // Ignorar errores de análisis
            }
        } else {
            console.log(`   ⚠️  Los primeros bytes (${firstBytes}) no corresponden a un JPEG estándar.`);
            console.log(`   ℹ️  Podría ser otro formato o el descifrado falló.`);
            
            // Guardar de todos modos para análisis
            const outputPath = '/tmp/3EB0F9701B052C8DECC12C_DECRYPTED.bin';
            await fs.writeFile(outputPath, decryptedBuffer);
            console.log(`   💾 Datos guardados en: ${outputPath} para inspección.`);
        }
        
        return { success: true, buffer: decryptedBuffer };
        
    } catch (error) {
        console.error(`\n❌ Error durante el descifrado:`);
        console.error(`   Mensaje: ${error.message}`);
        console.error(`   Stack: ${error.stack.split('\n')[0]}`);
        
        // Análisis de error más detallado
        if (error.message.includes('padding')) {
            console.error(`\n🔍 Posible problema de padding/PKCS7.`);
        }
        if (error.message.includes('mac') || error.message.includes('auth')) {
            console.error(`🔍 Posible problema de autenticación MAC.`);
        }
        
        return { success: false, error: error.message };
    }
}

// Ejecutar la prueba
testDecrypt().then(result => {
    console.log("\n=== Test finalizado ===");
    process.exit(result.success ? 0 : 1);
});
