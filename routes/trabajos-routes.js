const express = require("express");
const trabajosController = require("../controllers/trabajos-controller");
const uploader = require("../utils/uploader");
const router = express.Router();
const middlewares = require("../utils/middlewares");

router.get("/trabajos", 
    middlewares.verificarPermisos,
    trabajosController.obtenerVista);

router.get("/trabajos/obtener-trabajos/:pagina/:fechaMes", 
    middlewares.verificarPermisos,
    trabajosController.obtenerTrabajos);

router.post("/trabajos/guardar-trabajo", 
    middlewares.verificarPermisos,
    trabajosController.guardarTrabajo);
router.post("/trabajos/guardar-trabajo/:trabajoId", 

    middlewares.verificarPermisos,
    trabajosController.guardarTrabajo);

router.post("/trabajos/agregar-cobro/:trabajoId", 
    middlewares.verificarPermisos,
    trabajosController.agregarCobro);

router.post("/trabajos/agregar-registro-historial/:trabajoId", 
    middlewares.verificarPermisos,
    trabajosController.agregarRegistroHistorial);

router.post("/trabajos/agregar-archivo/:trabajoId", 
    middlewares.verificarPermisos,
    uploader.upload.single("file"),
    trabajosController.agregarArchivo);

router.post("/trabajos/agregar-costo/:trabajoId",
    middlewares.verificarPermisos,
    trabajosController.agregarCosto);

router.post("/trabajos/cerrar-trabajo/:trabajoId",
    middlewares.verificarPermisos,
    trabajosController.cerrarTrabajo);

router.post("/trabajos/subir-imagen",
    middlewares.verificarPermisos,
    uploader.upload.single("file"),
    trabajosController.subirImagen);

module.exports = router;