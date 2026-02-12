console.log("=== Buscando función para descifrar imágenes ===\n");

const fs = require('fs');
const path = require('path');

// 1. Leer messages-media.js completo
const baileysPath = require.resolve('@whiskeysockets/baileys');
const baileysDir = path.dirname(baileysPath);
const messagesMediaPath = path.join(baileysDir, 'Utils', 'messages-media.js');

if (!fs.existsSync(messagesMediaPath)) {
    console.log("❌ No se encontró messages-media.js");
    process.exit(1);
}

const content = fs.readFileSync(messagesMediaPath, 'utf8');
const lines = content.split('\n');

console.log("🔍 Buscando funciones relacionadas con descifrado de medios...\n");

// 2. Buscar funciones clave
const targetFunctions = [
    'downloadMediaMessage',
    'decryptMediaMessage',
    'downloadEncryptedContent',
    'getMediaDecryptionKey',
    'extractMediaInformation'
];

let foundFunctions = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const funcName of targetFunctions) {
        if (line.includes(funcName) && 
            (line.includes('function') || line.includes('export const') || line.includes('export async'))) {
            
            // Obtener la definición completa
            let funcLines = [line];
            let braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
            let j = i;
            
            while (braceCount > 0 && j < lines.length - 1) {
                j++;
                funcLines.push(lines[j]);
                braceCount += (lines[j].match(/{/g) || []).length - (lines[j].match(/}/g) || []).length;
            }
            
            foundFunctions.push({
                name: funcName,
                line: i + 1,
                definition: funcLines.join('\n')
            });
            
            break;
        }
    }
}

// 3. Mostrar funciones encontradas
if (foundFunctions.length > 0) {
    console.log(`✅ Encontradas ${foundFunctions.length} funciones:\n`);
    
    foundFunctions.forEach(func => {
        console.log(`📌 ${func.name} (línea ${func.line}):`);
        console.log("-".repeat(80));
        
        // Mostrar solo las primeras 10 líneas de la definición
        const defLines = func.definition.split('\n');
        defLines.slice(0, 15).forEach((l, idx) => {
            console.log(`${(idx + 1).toString().padStart(3)}: ${l}`);
        });
        
        if (defLines.length > 15) {
            console.log(`   ... y ${defLines.length - 15} líneas más`);
        }
        
        console.log("");
        
        // Extraer parámetros
        const firstLine = defLines[0];
        const paramMatch = firstLine.match(/\((.*?)\)/);
        if (paramMatch) {
            const params = paramMatch[1].split(',').map(p => p.trim());
            console.log(`   🔑 Parámetros: ${params.join(', ')}`);
        }
        
        console.log("");
    });
} else {
    console.log("❌ No se encontraron las funciones objetivo.");
    
    // Mostrar todas las exportaciones del archivo como alternativa
    console.log("\n🔍 Mostrando todas las exportaciones del archivo:");
    const exportLines = lines.filter(l => l.includes('export const') || l.includes('export async') || l.includes('export function'));
    
    exportLines.slice(0, 20).forEach(l => {
        const match = l.match(/export\s+(?:const|async|function)\s+(\w+)/);
        if (match) {
            console.log(`   - ${match[1]}`);
        }
    });
}

// 4. Buscar específicamente la lógica de descifrado AES
console.log("\n🔐 Buscando lógica de descifrado AES...");
const aesLines = lines.filter((l, i) => 
    l.includes('aesDecrypt') && 
    !l.includes('decryptMediaRetryData') &&
    i > 500 && i < 700  // Buscar en la misma área
);

if (aesLines.length > 0) {
    console.log(`\nEncontradas ${aesLines.length} líneas con aesDecrypt:\n`);
    
    // Mostrar contexto alrededor de cada línea
    aesLines.slice(0, 5).forEach((line, idx) => {
        const lineNum = lines.indexOf(line) + 1;
        console.log(`Línea ${lineNum}: ${line.trim()}`);
        
        // Mostrar 2 líneas antes y después para contexto
        const start = Math.max(0, lineNum - 3);
        const end = Math.min(lines.length, lineNum + 2);
        
        for (let i = start; i < end; i++) {
            if (i === lineNum - 1) {
                console.log(`  ${i + 1}: > ${lines[i]}`);
            } else {
                console.log(`  ${i + 1}:   ${lines[i]}`);
            }
        }
        console.log("");
    });
}

console.log("\n=== Búsqueda completada ===");
