const mongoose = require('mongoose');

const cobroPagoSchema = new mongoose.Schema({
    fecha: Date,
    grupo: String,
    metodo: String, // Efectivo, Transferencia, Tarjeta, etc.
    monto: Number, // Monto del cobro
}, { timestamps: true });

module.exports = mongoose.model('CobroPago', cobroPagoSchema);