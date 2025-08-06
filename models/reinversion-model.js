const mongoose = require('mongoose');

const oid = mongoose.Schema.Types.ObjectId;
const mixed = mongoose.Schema.Types.Mixed;

const reinversionSchema = new mongoose.Schema({
    fecha: Date,
    detalle: String,
    monto: Number, // Monto de la reinversión
}, { timestamps: true });

module.exports = mongoose.model('Reinversion', reinversionSchema);