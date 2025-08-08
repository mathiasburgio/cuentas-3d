const express = require("express");
const archivosController = require("../controllers/archivos-controller");
const router = express.Router();
const middlewares = require("../utils/middlewares");
const uploader = require("../utils/uploader");

router.get("/archivos", 
    middlewares.verificarPermisos,
    archivosController.obtenerVista);
    
router.get("/archivos/obtener-proyectos", 
    middlewares.verificarPermisos,
    archivosController.obtenerProyectos);

router.post("/archivos/crear-proyecto",
    middlewares.verificarPermisos,
    archivosController.crearProyecto);

router.post("/archivos/subir-archivo/:proyectoId",
    middlewares.verificarPermisos,
    uploader.upload.single("file"),
    archivosController.subirArchivo);

module.exports = router;