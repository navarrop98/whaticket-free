const { 
    getMediaKeys,
    decryptMediaRetryData,
    MEDIA_KEYS,
    MEDIA_HKDF_KEY_MAPPING 
} = require('@whiskeysockets/baileys');
const fs = require('fs').promises;
const crypto = require('crypto');

async function testDecryptDirect() {
    console.log("=== Test de Descifrado Directo (Funciones Internas) ===\n");
    
    // Tus datos
    const mediaKeyHex = 'a9df526e6aad7c034c49de368fcc57c8d00d29430754ca6a1b5586a835556f3c';
    const encryptedFilePath = '/home/whaticketapp/whaticket-free/backend/public/3EB0F9701B052C8DECC12C.image';
    
    try {
        // 1. Leer archivo
        const encryptedData = await fs.readFile(encryptedFilePath);
        console.log(`📊 Archivo cifrado: ${encryptedData.length} bytes`);
        
        // 2. Verificar estructura
        const first16 = encryptedData.slice(0, 16);
        const last32 = encryptedData.slice(-32);
        console.log(`   Primeros 16 bytes (IV esperado): ${first16.toString('hex')}`);
        console.log(`   Últimos 32 bytes (SHA256 esperado): ${last32.toString('hex')}`);
        
        // 3. Verificar Media Keys de WhatsApp
        console.log(`\n🔑 Media Keys de WhatsApp:`);
        console.log(`   IMAGE: ${MEDIA_KEYS.IMAGE}`);
        console.log(`   VIDEO: ${MEDIA_KEYS.VIDEO}`);
        console.log(`   AUDIO: ${MEDIA_KEYS.AUDIO}`);
        console.log(`   DOCUMENT: ${MEDIA_KEYS.DOCUMENT}`);
        
        // 4. Usar getMediaKeys para derivar claves (forma CORRECTA en Baileys v6)
        const mediaKeyBuffer = Buffer.from(mediaKeyHex, 'hex');
        console.log(`\n🔐 Derivando claves con getMediaKeys...`);
        
        // Probar con cada tipo de media
        const mediaTypes = ['image', 'video', 'audio', 'document'];
        
        for (const mediaType of mediaTypes) {
            console.log(`\n🔄 Probando tipo: ${mediaType.toUpperCase()}`);
            
            try {
                // Obtener claves derivadas para este tipo
                const derivedKeys = getMediaKeys(mediaKeyBuffer, mediaType);
                
                console.log(`   ✅ Claves derivadas obtenidas:`);
                console.log(`      - encKey (32 bytes): ${derivedKeys.encKey.length === 32 ? '✅' : '❌'} ${derivedKeys.encKey.length}`);
                console.log(`      - macKey (32 bytes): ${derivedKeys.macKey.length === 32 ? '✅' : '❌'} ${derivedKeys.macKey.length}`);
                console.log(`      - iv (32 bytes): ${derivedKeys.iv ? derivedKeys.iv.length : 'N/A'}`);
                
                // 5. Separar partes del archivo cifrado
                // En Baileys v6: IV(16) + ciphertext + mac(10) ???
                // Tu archivo: 68090 bytes total
                // Si IV son primeros 16: ciphertext = 68090 - 16 - ??? (mac/hash)
                
                // Hipótesis 1: IV(16) + ciphertext + sha256(32)
                const ciphertextWithHash = encryptedData.slice(16); // Remover IV
                const possibleHash = ciphertextWithHash.slice(-32);
                const ciphertextOnly = ciphertextWithHash.slice(0, -32);
                
                console.log(`   🔍 Estructura hipótesis 1 (IV+data+SHA256):`);
                console.log(`      - IV: 16 bytes`);
                console.log(`      - Ciphertext: ${ciphertextOnly.length} bytes`);
                console.log(`      - Hash (SHA256?): ${possibleHash.length} bytes`);
                console.log(`      - ¿Múltiplo de 16? ${ciphertextOnly.length % 16 === 0 ? '✅' : '❌'} (resto: ${ciphertextOnly.length % 16})`);
                
                // 6. Intentar descifrar con aesDecryptWithIV
                const { aesDecryptWithIV } = require('@whiskeysockets/baileys');
                
                console.log(`   🔓 Intentando descifrar con aesDecryptWithIV...`);
                
                try {
                    // aesDecryptWithIV espera: ciphertext, IV, key
                    const decrypted = aesDecryptWithIV(
                        ciphertextOnly, 
                        first16, // IV
                        derivedKeys.encKey
                    );
                    
                    console.log(`   ✅ Descifrado exitoso: ${decrypted.length} bytes`);
                    
                    // Verificar si es JPEG
                    if (decrypted.length >= 3) {
                        const firstBytes = decrypted.slice(0, 3).toString('hex').toUpperCase();
                        console.log(`      Primeros bytes: ${firstBytes}`);
                        
                        if (firstBytes === 'FFD8FF') {
                            console.log(`      🎉 ¡JPEG VÁLIDO DETECTADO!`);
                            
                            // Guardar
                            const outputPath = `/tmp/descifrado_${mediaType}.jpg`;
                            await fs.writeFile(outputPath, decrypted);
                            console.log(`      💾 Guardado en: ${outputPath}`);
                            
                            return { 
                                success: true, 
                                mediaType: mediaType,
                                buffer: decrypted,
                                path: outputPath 
                            };
                        }
                    }
                    
                    // Si no es JPEG, guardar igual para análisis
                    const outputPath = `/tmp/descifrado_${mediaType}.bin`;
                    await fs.writeFile(outputPath, decrypted);
                    console.log(`      💾 Guardado como binario: ${outputPath}`);
                    
                } catch (decryptError) {
                    console.log(`      ❌ Error en descifrado: ${decryptError.message}`);
                }
                
                // Hipótesis 2: IV(16) + ciphertext + mac(10) + padding(?)
                // 68090 - 16 = 68074
                // Si mac son 10 bytes: 68074 - 10 = 68064
                const ciphertextWithMac = encryptedData.slice(16);
                const possibleMac = ciphertextWithMac.slice(-10);
                const ciphertextForMac = ciphertextWithMac.slice(0, -10);
                
                console.log(`\n   🔍 Estructura hipótesis 2 (IV+data+MAC10):`);
                console.log(`      - IV: 16 bytes`);
                console.log(`      - Ciphertext: ${ciphertextForMac.length} bytes`);
                console.log(`      - MAC (10 bytes?): ${possibleMac.length} bytes`);
                console.log(`      - ¿Múltiplo de 16? ${ciphertextForMac.length % 16 === 0 ? '✅' : '❌'} (resto: ${ciphertextForMac.length % 16})`);
                
                // Intentar descifrar esta estructura
                try {
                    const { aesDecryptWithIV } = require('@whiskeysockets/baileys');
                    const decrypted = aesDecryptWithIV(
                        ciphertextForMac,
                        first16,
                        derivedKeys.encKey
                    );
                    
                    console.log(`      🔓 Descifrado 2: ${decrypted.length} bytes`);
                    
                    if (decrypted.length >= 3) {
                        const firstBytes = decrypted.slice(0, 3).toString('hex').toUpperCase();
                        console.log(`      Primeros bytes: ${firstBytes}`);
                        
                        if (firstBytes === 'FFD8FF') {
                            console.log(`      🎉 ¡JPEG VÁLIDO EN HIPÓTESIS 2!`);
                            
                            const outputPath = `/tmp/descifrado_${mediaType}_hyp2.jpg`;
                            await fs.writeFile(outputPath, decrypted);
                            console.log(`      💾 Guardado: ${outputPath}`);
                            
                            return { 
                                success: true, 
                                mediaType: mediaType,
                                buffer: decrypted,
                                path: outputPath 
                            };
                        }
                    }
                } catch (e) {
                    // Continuar con siguiente tipo
                }
                
            } catch (keyError) {
                console.log(`   ❌ Error con ${mediaType}: ${keyError.message}`);
            }
        }
        
        console.log(`\n⚠️  Ninguna combinación produjo un JPEG válido.`);
        console.log(`💡 Prueba manualmente con:`);
        console.log(`   node -e "const {getMediaKeys, aesDecryptWithIV} = require('@whiskeysockets/baileys'); const fs = require('fs'); const data = fs.readFileSync('${encryptedFilePath}'); const keys = getMediaKeys(Buffer.from('${mediaKeyHex}', 'hex'), 'image'); const iv = data.slice(0,16); const cipher = data.slice(16, -32); const dec = aesDecryptWithIV(cipher, iv, keys.encKey); console.log(dec.slice(0,4).toString('hex'));"`);
        
        return { success: false, error: "No JPEG found" };
        
    } catch (error) {
        console.error(`\n💥 Error general: ${error.message}`);
        console.error(error.stack);
        return { success: false, error: error.message };
    }
}

// Ejecutar
testDecryptDirect().then(result => {
    console.log("\n=== Test finalizado ===");
    process.exit(result.success ? 0 : 1);
});
