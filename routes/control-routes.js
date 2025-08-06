const express = require("express");
const router = express.Router();
const path = require("path");
const control = require("../controllers/control-controller.js");
const middlewares = require("../utils/middlewares");

router.post("/control/get-access",
    middlewares.createRateLimit(3, 5), 
    control.getAccess);

router.get("/control/make-backup",
    control.makeBackup);

router.get("/control/restore-backup",
    control.restoreBackup);

router.get(["/control/download-backup", "/control/download-backup/:index"],
    control.downloadBackup);

router.get("/control/ping",
    control.ping);

router.get("/control/ping-mongo",
    control.pingMongo);

router.get("/control/status",
    control.status);

module.exports = router;