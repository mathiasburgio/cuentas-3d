const express = require("express");
const homeController = require("../controllers/home-controller");
const router = express.Router();
const middlewares = require("../utils/middlewares");

router.get("/home", 
    middlewares.verificarPermisos,
    homeController.obtenerVista);

module.exports = router;