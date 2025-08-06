const Proyecto = require("../models/proyecto-model");
const path = require("path");
const fechas = require("../utils/fechas");
const fs = require("fs");

function obtenerVista(req, res){
    res.sendFile( path.join(__dirname, "..", "views", "archivos.html") );
}

async function obtenerProyectos(req, res){
    try{
        
        const proyectos = await Proyecto.find();
        res.status(200).json(proyectos);
    }catch(error){
        console.error("Error al obtener proyectos/archivos:", error);
        res.status(500).end(error.toString());
    };
}
async function crearProyecto(req, res){
    try{
        const { grupo, nombre } = req.body;
        if(!grupo || !nombre) throw new Error("Grupo y nombre son requeridos");
        const nuevoProyecto = new Proyecto({
            grupo,
            nombre,
            archivos: []
        });
        await nuevoProyecto.save();
        res.status(201).json(nuevoProyecto);
    }catch(error){
        console.error("Error al crear el proyecto:", error);
        res.status(500).end(error.toString());
    }
}
async function subirArchivo(req, res){
    try{
        const proyectoId = req.params.proyectoId;
        const { detalle } = req.body;
        if(!detalle || !req.file) throw new Error("Detalle y archivo son requeridos");

        let ext = req.file.originalname.split(".").pop();
        const archivo = {
            fecha: new Date(),
            nombre: req.file.filename,
            detalle: `${detalle} [ ${ext} ]`,
            tamano: req.file.size,
            bloqueado: false // Por defecto, el archivo no está bloqueado
        };

        const proyecto = await Proyecto.findById({_id: proyectoId});
        if(!proyecto) throw new Error("Proyecto no encontrado");
        proyecto.archivos.push(archivo);
        await proyecto.save();
        // Mover el archivo a la carpeta correspondiente
        const oldPath = path.join(__dirname, "../uploads/temp/", req.file.filename);
        const newPath = path.join(__dirname, "../uploads/files3d/", req.file.filename);
        await fs.promises.rename(oldPath, newPath);
        res.status(200).json(proyecto);
    }catch(error){
        console.error("Error al subir el archivo:", error);
        res.status(500).end(error.toString());
    }
}


module.exports = {
    obtenerVista,
    obtenerProyectos,
    crearProyecto,
    subirArchivo
};