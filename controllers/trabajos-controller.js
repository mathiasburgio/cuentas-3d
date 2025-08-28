const Trabajo = require("../models/trabajo-model");
const Archivo = require("../models/proyecto-model");
const fs = require("fs");
const path = require("path");
const configuracion = require("../configuracion.json");

function obtenerVista(req, res){
    res.sendFile( path.join(__dirname, "..", "views", "trabajos.html") );
}

async function obtenerTrabajos(req, res){
    try {
        let {pagina, fechaMes} = req.params;
        pagina = parseInt(pagina) || 1;
        const trabajosPorPagina = 100; // Definir cuántos trabajos mostrar por página
        let query = {};

        if(fechaMes != "-1"){
            let desde = new Date(fechaMes);
            desde.setDate(1);
            desde.setHours(0, 0, 0, 0);
    
            let hasta = new Date(fechaMes);
            hasta.setMonth(hasta.getMonth() + 1);
            hasta.setDate(1);
            hasta.setHours(0, 0, 0, 0);
            query = {fecha: {$gte: desde, $lt: hasta}};
        }
        const trabajos = await Trabajo.find(query)
            .skip((pagina - 1) * trabajosPorPagina)
            .limit(trabajosPorPagina)
            .sort({ fecha: -1 }); // Ordenar por fecha descendente

        res.status(200).json(trabajos);
    } catch (error) {
        console.error("Error al obtener los trabajos:", error);
        res.status(500).end(error.toString());
    }
}

async function guardarTrabajo(req, res){
    try {
        const trabajoData = req.body;
        const trabajoId = req.params?.trabajoId || null;
        
        let trabajo;
        if(trabajoId){
            trabajo = await Trabajo.findOne({_id: trabajoId});
            if(!trabajo) throw "Trabajo no encontrado";
            if(trabajo.cerrado) throw "No se puede modificar un trabajo cerrado";

            // Actualizar los campos del trabajo
            Object.assign(trabajo, trabajoData);
            await trabajo.save();
        }else{
            trabajoData.cobros = [];
            trabajoData.historial = [{
                fecha: new Date(),
                estado: trabajoData.estado,
                observaciones: "Trabajo creado"
            }];
            trabajoData.costos = {};
            trabajoData.costos.electricoKwh = configuracion.costos.electricoKwh;
            trabajoData.costos.porcentajeReinversion = configuracion.costos.porcentajeReinversion;
            trabajoData.costos.filamentoKg = configuracion.costos.filamentoKg;
            trabajoData.cerrado = false; // Por defecto, un nuevo trabajo no está cerrado

            trabajo = await Trabajo.create(trabajoData);
        }
        res.status(201).json(trabajo);
    } catch (error) {
        console.error("Error al guardar el trabajo:", error);
        res.status(500).end(error.toString());
    }
}

async function agregarCobro(req, res){
    try{
        const trabajoId = req.params.trabajoId;
        if(!trabajoId) throw "ID de trabajo no proporcionado";

        const {fecha, monto, metodo} = req.body;
        if(!monto || !metodo) throw "Datos de pago incompletos";

        // Buscar el trabajo por ID
        const trabajo = await Trabajo.findOne({_id: trabajoId});
        if(!trabajo) throw "Trabajo no encontrado";
        if(trabajo.cerrado) throw "No se pueden agregar costos a un trabajo cerrado";

        // Agregar el cobro al trabajo
        trabajo.cobros.push({
            fecha: fecha,
            monto: monto,
            metodo: metodo
        });
        trabajo.markModified('cobros'); // Marcar el campo como modificado para que Mongoose lo guarde
        // Guardar los cambios en el trabajo
        await trabajo.save();

        res.status(200).json(trabajo);
    }catch(error){
        console.error("Error al agregar el cobro:", error);
        res.status(500).end(error.toString());
    }
}

async function agregarRegistroHistorial(req, res){
    try {
        const trabajoId = req.params.trabajoId;
        if (!trabajoId) throw "ID de trabajo no proporcionado";

        const { observaciones } = req.body;
        if (!observaciones) throw "Observaciones no proporcionadas";

        // Buscar el trabajo por ID
        const trabajo = await Trabajo.findOne({_id: trabajoId});
        if (!trabajo) throw "Trabajo no encontrado";
        if(trabajo.cerrado) throw "No se pueden agregar registros a un trabajo cerrado";

        // Agregar un registro al historial
        trabajo.historial.push({
            fecha: new Date(),
            estado: trabajo.estado,
            observaciones: observaciones
        });

        // Guardar los cambios en el trabajo
        await trabajo.save();

        res.status(200).json(trabajo);
    } catch (error) {
        console.error("Error al agregar el registro al historial:", error);
        res.status(500).end(error.toString());
    }
}

async function agregarArchivo(req, res){
    try {
        const trabajoId = req.params.trabajoId;
        if (!trabajoId) throw "ID de trabajo no proporcionado";

        const { detalle } = req.body;
        if (!detalle) throw "Datos de archivo incompletos";

        // Buscar el trabajo por ID
        const trabajo = await Trabajo.findOne({_id: trabajoId});
        if (!trabajo) throw "Trabajo no encontrado";

        let file = req.file;
        if(!file) throw "ERROR: No se ha subido ningun archivo";
        
        let oldPath = path.join(__dirname, "../uploads/temp/", file.filename);
        let newPath = path.join(__dirname, "../uploads/files3d/", file.filename);

        await fs.promises.rename(oldPath, newPath);

        // Agregar el archivo al trabajo
        trabajo.archivos.push({
            fecha: new Date(),
            archivo: file.filename,
            detalle: detalle,
        });

        // Guardar los cambios en el trabajo
        await trabajo.save();

        res.status(200).json(trabajo);
    } catch (error) {
        console.error("Error al agregar el archivo:", error);
        res.status(500).end(error.toString());
    }
}

async function agregarCosto(req, res){
    try {
        const trabajoId = req.params.trabajoId;
        if (!trabajoId) throw "ID de trabajo no proporcionado";
        const { detalle, costoPorUnidad } = req.body;
        if (!detalle || !costoPorUnidad) throw "Datos de costo incompletos";
        // Buscar el trabajo por ID
        const trabajo = await Trabajo.findOne({_id: trabajoId});
        if (!trabajo) throw "Trabajo no encontrado";
        if(trabajo.cerrado) throw "No se pueden agregar costos a un trabajo cerrado";

        // Agregar el costo al trabajo
        trabajo.costosVariables.push({
            fecha: new Date(),
            detalle: detalle,
            costoPorUnidad: costoPorUnidad
        });

        // Guardar los cambios en el trabajo
        await trabajo.save();

        res.status(200).json(trabajo);
    } catch (error) {
        console.error("Error al agregar el costo:", error);
        res.status(500).end(error.toString());
    }
}

async function cerrarTrabajo(req, res){
    try {
        const trabajoId = req.params.trabajoId;
        if (!trabajoId) throw "ID de trabajo no proporcionado";

        // Buscar el trabajo por ID
        const trabajo = await Trabajo.findOne({_id: trabajoId});
        if (!trabajo) throw "Trabajo no encontrado";

        // Cambiar el estado del trabajo a cerrado
        trabajo.cerrado = true;

        // Guardar los cambios en el trabajo
        await trabajo.save();

        res.status(200).json(trabajo);
    } catch (error) {
        console.error("Error al cerrar el trabajo:", error);
        res.status(500).end(error.toString());
    }
}

async function subirImagen(req, res){
    try{
        if(!req.file) throw new Error("Archivo no válido");

        let ext = req.file.originalname.split(".").pop();
        if(["jpg", "jpeg", "png"].includes(ext.toLowerCase()) == false) throw new Error("Solo se permiten imágenes JPG, JPEG o PNG");
        const oldPath = path.join(__dirname, "../uploads/temp/", req.file.filename);
        const newPath = path.join(__dirname, "../uploads/images/", req.file.filename);
        await fs.promises.rename(oldPath, newPath);
        res.status(200).json(req.file.filename);
    }catch(error){
        console.error("Error al subir el archivo:", error);
        res.status(500).end(error.toString());
    }
}

module.exports = {
    obtenerVista,
    obtenerTrabajos,
    guardarTrabajo,
    agregarCobro,
    agregarRegistroHistorial,
    agregarArchivo,
    agregarCosto,
    cerrarTrabajo,
    subirImagen
};