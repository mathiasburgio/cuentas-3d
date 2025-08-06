const multer = require("multer");
const path = require("path")
const fs = require("fs");

// Configuración de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Directorio donde se guardarán los archivos
        cb(null, 'uploads/temp/');
    },
    filename: (req, file, cb) => {
        // Cambiar el nombre del archivo
        const timestamp = Date.now(); // Agregar un timestamp para evitar duplicados
        const ext = path.extname(file.originalname); // Obtener la extensión original
        cb(null, `file-${timestamp}${ext}`); // Ejemplo: file-1631548971234.jpg
    },
});
const upload = multer({storage});

module.exports = {
    upload
};