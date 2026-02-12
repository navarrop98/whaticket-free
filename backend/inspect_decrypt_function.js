console.log("=== Inspección de decryptMediaRetryData ===\n");

const fs = require('fs');
const path = require('path');

// 1. Encontrar y leer el archivo messages-media.js
const baileysPath = require.resolve('@whiskeysockets/baileys');
const baileysDir = path.dirname(baileysPath);
const messagesMediaPath = path.join(baileysDir, 'Utils', 'messages-media.js');

console.log(`📁 Ruta del módulo: ${messagesMediaPath}`);

if (fs.existsSync(messagesMediaPath)) {
    const content = fs.readFileSync(messagesMediaPath, 'utf8');
    
    // 2. Encontrar decryptMediaRetryData
    const lines = content.split('\n');
    let inFunction = false;
    let functionLines = [];
    let braceCount = 0;
    
    console.log("\n🔍 Buscando decryptMediaRetryData...");
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('decryptMediaRetryData') && 
            (line.includes('function') || line.includes('=') || line.includes('async'))) {
            inFunction = true;
            console.log(`✅ Encontrada en línea ${i + 1}`);
        }
        
        if (inFunction) {
            functionLines.push(line);
            
            // Contar llaves para saber cuándo termina
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
            
            if (braceCount === 0 && functionLines.length > 1) {
                break;
            }
        }
    }
    
    // 3. Mostrar la función completa
    console.log("\n📝 FUNCIÓN decryptMediaRetryData:");
    console.log("=" .repeat(80));
    functionLines.forEach((line, idx) => {
        console.log(`${(idx + 1).toString().padStart(3)}: ${line}`);
    });
    console.log("=" .repeat(80));
    
    // 4. Extraer los parámetros que espera
    console.log("\n🔑 Parámetros esperados (de la definición):");
    const firstLine = functionLines[0];
    const paramMatch = firstLine.match(/\((.*?)\)/);
    if (paramMatch) {
        const params = paramMatch[1].split(',').map(p => p.trim());
        params.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p}`);
        });
    }
    
    // 5. Buscar llamadas a esta función en el código para ver ejemplos de uso
    console.log("\n🔎 Buscando ejemplos de uso en el código...");
    const usageMatches = [];
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('decryptMediaRetryData(') && !lines[i].includes('function')) {
            // Encontrar la llamada completa (puede ser multi-línea)
            let callLines = [lines[i]];
            let callBraceCount = (lines[i].match(/\(/g) || []).length - (lines[i].match(/\)/g) || []).length;
            let j = i;
            
            while (callBraceCount > 0 && j < lines.length - 1) {
                j++;
                callLines.push(lines[j]);
                callBraceCount += (lines[j].match(/\(/g) || []).length - (lines[j].match(/\)/g) || []).length;
            }
            
            const fullCall = callLines.join('\n').trim();
            usageMatches.push({ line: i + 1, call: fullCall });
            
            // Solo mostrar los primeros 2 usos
            if (usageMatches.length >= 2) break;
        }
    }
    
    if (usageMatches.length > 0) {
        console.log("\n📋 Ejemplos de uso encontrados:");
        usageMatches.forEach((usage, idx) => {
            console.log(`\nEjemplo ${idx + 1} (línea ${usage.line}):`);
            console.log(usage.call);
        });
    } else {
        console.log("No se encontraron ejemplos de uso en este archivo.");
    }
    
} else {
    console.log("❌ No se encontró messages-media.js");
}

console.log("\n=== Inspección completada ===");
