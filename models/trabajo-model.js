const mongoose = require('mongoose');

const oid = mongoose.Schema.Types.ObjectId;
const mixed = mongoose.Schema.Types.Mixed;

const trabajoSchema = new mongoose.Schema({
    fecha: Date,
    nombre: String,
    descripcion: String, // Descripción del trabajo
    categoria: String, // Ej. Llaveros, Figuras, Prototipos, etc.
    estado: String, // Presupuesto, En Proceso, Completado, Entregado, Cancelado
    fechaEntrega: Date, // fecha en la cual se debe entregar el trabajo
    cantidad: Number, // ej. 100 (medallas)
    cliente: {
        nombre: String,
        telefono: String
    },
    cobros: [{
        fecha: Date,
        monto: Number,
        metodo: String, // Efectivo, Transferencia, Tarjeta, etc.
        cancelado: Boolean // Indica si el cobro fue cancelado o eliminado
    }],
    precioPorUnidad: Number, // Valor total del trabajo por unidad
    pesoFilamentoUnidad: Number, // Peso del filamento por unidad en Gramos
    tiempoImpresionUnidad: Number, // Tiempo estimado de impresión en minutos
    historial: [{
        fecha: Date,
        estado: String, // Estado del trabajo en esa fecha
        observaciones: String // Observaciones sobre el estado del trabajo
    }],
    costos: {
        electricoKwh: Number,     // ($/Kwh) Costo de energía por unidad 
        porcentajeReinversion: Number, // (%) Costo de reinversión por unidad 
        filamentoKg: Number,   // (Kg) Costo de filamento por unidad 
    },
    costosVariables: [{
        detalle: String,
        costoPorUnidad: Number, // Costo por unidad del trabajo
    }],
    archivos: [{
        fecha: Date,
        archivo: String,
        detalle: String,
        cancelado: Boolean // Indica si el archivo fue cancelado o eliminado
    }],
    imagen: String,
    placasImpresion: [{
        detalle: String,
        gramos: Number,
        minutos: Number,
        unidades: Number,
        boquilla: Number
    }],
    cerrado: Boolean, // Indica si el trabajo está cerrado (no se pueden agregar más cobros o registros)
}, { timestamps: true });

module.exports = mongoose.model('Trabajo', trabajoSchema);