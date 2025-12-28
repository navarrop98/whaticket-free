const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'dist/services/WbotServices/wbotMessageListener.js');
console.log('Buscando archivo en:', filePath);

if (!fs.existsSync(filePath)) {
  console.log('❌ Archivo no encontrado');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');
let found = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('.chats.get(')) {
    console.log(`✅ Encontrado en línea ${i+1}: ${lines[i].trim()}`);
    
    // Parchear la línea
    const original = lines[i];
    const patched = original.replace(
      /const count = (wbot\.store\.chats\.get\(.*?\));/,
      'const count = wbot.store && wbot.store.chats ? wbot.store.chats.get($2) : undefined;'
    );
    
    if (patched !== original) {
      lines[i] = patched;
      console.log('✅ Línea parcheada:', lines[i].trim());
    } else {
      // Intentar otro patrón
      const patched2 = original.replace(
        /\.chats\.get\(/,
        ' && $1.chats ? $1.chats.get('
      );
      if (patched2 !== original) {
        lines[i] = patched2;
        console.log('✅ Línea parcheada (patrón 2):', lines[i].trim());
      }
    }
    found = true;
    break;
  }
}

if (found) {
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log('✅ Archivo parcheado exitosamente');
} else {
  console.log('❌ No se encontró la línea con .chats.get()');
  // Buscar cualquier referencia a chats
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('chats')) {
      console.log(`Línea ${i+1}: ${lines[i].trim()}`);
    }
  }
}
