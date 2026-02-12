// Configurar variable de entorno al inicio
process.env.NODE_OPTIONS = '--openssl-legacy-provider';

//simple express server to run frontend production build;
const express = require("express");
const path = require("path");
const app = express();

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "build")));

// Para Express 5, usar patrón de ruta correcto
// Opción 1: Capturar todas las rutas que no sean archivos estáticos
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Para SPA: redirigir todas las rutas al index.html
app.get("*", function (req, res, next) {
  // Si la ruta parece un archivo (tiene extensión), pasar al siguiente middleware
  if (req.path.includes('.')) {
    return next();
  }
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Iniciar servidor
const PORT = 3333;
app.listen(PORT, () => {
  console.log(`Servidor frontend corriendo en puerto ${PORT}`);
});
