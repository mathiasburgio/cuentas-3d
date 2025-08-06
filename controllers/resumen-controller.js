const Trabajo = require("../models/trabajo-model");
const Reinversion = require("../models/reinversion-model");
const path = require("path");
const fechas = require("../utils/fechas");

function obtenerVista(req, res){
    res.sendFile( path.join(__dirname, "..", "views", "resumen.html") );
}

async function obtenerResumen(req, res){
    try{
        let fecha = req.params.fecha;
        if(!fecha) throw new Error("Fecha no proporcionada");

        // De la fecha obtengo el año y mes
        let [anio, mes] = fecha.split("-");

        const fechaInicio = new Date(`${anio}-${mes}-01T00:01`);
        const fechaFin = new Date(fechaInicio);
        fechaFin.setMonth(fechaFin.getMonth() + 1);

        const trabajos = await Trabajo.find({
            fecha: {
                $gte: fechaInicio,
                $lt: fechaFin
            }
        });

        const reinversiones = await Reinversion.find({
            fecha: {
                $gte: fechaInicio,
                $lt: fechaFin
            }
        });

        res.status(200).json({ trabajos, reinversiones });
    }catch(error){
        console.error("Error al obtener el resumen:", error);
        res.status(500).end(error.toString());
    };
}

async function ejecutarReinversion(req, res){
    try{
        const { fecha, detalle, monto, mesAnio } = req.body;

        if(!fecha || !detalle || !monto || !mesAnio) throw new Error("Faltan datos obligatorios");

        let f1 = fechas.parse2(fecha, "USA_FECHA"); // Validar formato de fecha
        let [f1Anio, f1Mes] = f1.split("-");
        let [f2Anio, f2Mes] = mesAnio.split("-");
        if(f1Anio !== f2Anio || f1Mes !== f2Mes) throw new Error("La fecha de la reinversión debe coincidir con el mes y año del resumen");

        const registro = await Reinversion.create({ fecha, detalle, monto });
        res.status(200).json(registro);
    }catch(error){
        console.error("Error al ejecutar la reinversión:", error);
        res.status(500).end(error.toString());
    };
}

module.exports = {
    obtenerVista,
    obtenerResumen,
    ejecutarReinversion
};