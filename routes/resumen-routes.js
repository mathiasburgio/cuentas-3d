const express = require("express");
const resumenController = require("../controllers/resumen-controller");
const router = express.Router();
const middlewares = require("../utils/middlewares");

router.get("/resumen", 
    middlewares.verificarPermisos,
    resumenController.obtenerVista);
    
router.get("/resumen/obtener-resumen/:fecha", 
    middlewares.verificarPermisos,
    resumenController.obtenerResumen);

router.post("/resumen/ejecutar-reinversion", 
    middlewares.verificarPermisos,
    resumenController.ejecutarReinversion);

module.exports = router;