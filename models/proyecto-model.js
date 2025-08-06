const mongoose = require('mongoose');

const proyectoSchema = new mongoose.Schema({
    grupo: String,
    nombre: String,
    imagen: String, // URL de la imagen del proyecto
    archivos: [{
        fecha: Date,
        nombre: String, // Nombre del archivo
        detalle: String, // Detalle del archivo
        tamano: Number,
        bloqueado: Boolean, // Indica si el archivo está bloqueado o no
    }],
}, { timestamps: true });

module.exports = mongoose.model('Proyecto', proyectoSchema);