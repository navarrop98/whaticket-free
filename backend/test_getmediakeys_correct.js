console.log("=== Test getMediaKeys con parámetros correctos ===\n");

const { getMediaKeys, MEDIA_HKDF_KEY_MAPPING, hkdfInfoKey } = require('@whiskeysockets/baileys');

// 1. Tu mediaKey
const mediaKeyHex = 'a9df526e6aad7c034c49de368fcc57c8d00d29430754ca6a1b5586a835556f3c';
const mediaKeyBuffer = Buffer.from(mediaKeyHex, 'hex');

console.log(`📦 MediaKey original: ${mediaKeyHex.substring(0, 32)}...`);
console.log(`   Longitud: ${mediaKeyBuffer.length} bytes (esperado: 32)\n`);

// 2. Probar diferentes enfoques
console.log("🔍 Probando diferentes llamadas a getMediaKeys:");

// Enfoque 1: Como antes (probablemente incorrecto)
console.log("\n1. getMediaKeys(mediaKey, 'image'):");
try {
    const result1 = getMediaKeys(mediaKeyBuffer, 'image');
    console.log(`   Resultado: ${JSON.stringify(result1)}`);
    console.log(`   Tipo: ${typeof result1}`);
    if (result1 && typeof result1 === 'object') {
        console.log(`   Propiedades: ${Object.keys(result1).join(', ') || 'ninguna'}`);
        if (Object.keys(result1).length > 0) {
            Object.keys(result1).forEach(k => {
                const v = result1[k];
                console.log(`     ${k}: ${v ? `Buffer[${v.length}]` : 'null'}`);
            });
        }
    }
} catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
}

// Enfoque 2: Usando MEDIA_HKDF_KEY_MAPPING
console.log("\n2. Usando MEDIA_HKDF_KEY_MAPPING:");
console.log(`   MEDIA_HKDF_KEY_MAPPING['image'] = "${MEDIA_HKDF_KEY_MAPPING['image']}"`);

// Enfoque 3: Probando con hkdfInfoKey
console.log("\n3. Probando con hkdfInfoKey:");
if (hkdfInfoKey) {
    console.log(`   hkdfInfoKey tipo: ${typeof hkdfInfoKey}`);
    console.log(`   hkdfInfoKey valor: ${hkdfInfoKey}`);
} else {
    console.log(`   hkdfInfoKey es undefined`);
}

// Enfoque 4: Mirar el código fuente de getMediaKeys
console.log("\n4. Inspeccionando función getMediaKeys:");
try {
    const fs = require('fs');
    const path = require('path');
    
    const baileysPath = require.resolve('@whiskeysockets/baileys');
    const baileysDir = path.dirname(baileysPath);
    
    // Buscar el archivo que contiene getMediaKeys
    const libFiles = fs.readdirSync(baileysDir).filter(f => f.endsWith('.js'));
    
    for (const file of libFiles) {
        const content = fs.readFileSync(path.join(baileysDir, file), 'utf8');
        if (content.includes('getMediaKeys') && content.includes('function')) {
            console.log(`   Encontrado en: ${file}`);
            
            // Extraer la función
            const lines = content.split('\n');
            let inFunction = false;
            let functionLines = [];
            
            for (const line of lines) {
                if (line.includes('getMediaKeys') && (line.includes('function') || line.includes('='))) {
                    inFunction = true;
                }
                if (inFunction) {
                    functionLines.push(line);
                    if (line.trim().endsWith('}') && functionLines.length > 5) {
                        break;
                    }
                }
            }
            
            if (functionLines.length > 0) {
                console.log(`   📝 Definición (primeras líneas):`);
                functionLines.slice(0, 10).forEach(l => console.log(`      ${l}`));
            }
            break;
        }
    }
} catch (e) {
    console.log(`   ❌ Error inspeccionando: ${e.message}`);
}

// Enfoque 5: Probar decryptMediaRetryData (que es probablemente lo que Whaticket usa)
console.log("\n5. Probando decryptMediaRetryData:");
const { decryptMediaRetryData } = require('@whiskeysockets/baileys');

// Leer archivo cifrado
const fs = require('fs');
const encryptedPath = '/home/whaticketapp/whaticket-free/backend/public/3EB0F9701B052C8DECC12C.image';
const encryptedData = fs.readFileSync(encryptedPath);

console.log(`   Archivo: ${encryptedData.length} bytes`);

try {
    // decryptMediaRetryData probablemente espera una estructura específica
    const result = decryptMediaRetryData({
        mediaKey: mediaKeyBuffer,
        ciphertext: encryptedData,
        mediaType: MEDIA_HKDF_KEY_MAPPING['image'] || 'Image'
    });
    
    console.log(`   ✅ decryptMediaRetryData OK:`);
    console.log(`      Tipo resultado: ${typeof result}`);
    if (Buffer.isBuffer(result)) {
        console.log(`      Buffer: ${result.length} bytes`);
        console.log(`      Primeros bytes: ${result.slice(0, 4).toString('hex')}`);
    } else if (result && typeof result === 'object') {
        console.log(`      Objeto con keys: ${Object.keys(result).join(', ')}`);
    }
} catch (e) {
    console.log(`   ❌ Error decryptMediaRetryData: ${e.message}`);
    console.log(`      Stack: ${e.stack.split('\n')[0]}`);
}

console.log("\n=== Test completado ===");
