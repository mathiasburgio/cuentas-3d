/*
TODO:
- Implementar la descargar de archivos varios. Ej. imagenes, documentos, etc.
- Cifrar backups

NOTAS:
- Para usar este modulo se requiere tener configuradas las variables de entorno MONGO_URI y CONTROL_ACCESS_KEY
- Por defecto se require que exista el directorio /uploads/backups/ para que se pueda guardar el backup
- La verificacion de espacio en disco parece ser un poco lenta (1000ms aprox), modificar en caso de que sea necesario
- Para restore automatico se puede dejar el archivo de backup en la carpeta /uploads/backups/restore.backup y llamar a /control/restore-backup?accessToken=TOKEN

*/

/* const {  MongoTransferer, MongoDBDuplexConnector, LocalFileSystemDuplexConnector } = require('mongodb-snapshot'); */
const { MongoClient } = require('mongodb');
const { erase, write, read } = require('@apostrophecms/mongodb-snapshot');

const process = require('process');
const utils = require("../utils/utils");
const os = require('os');
const fs = require('fs');
const path = require('path');
const checkDiskSpace = require('check-disk-space').default;
const cron = require('node-cron') ;

const Trabajo = require("../models/trabajo-model");

const isWindows = os.platform() === 'win32';
const isLinux = os.platform() === 'linux';
const isMac = os.platform() === 'darwin';

const MONGO_URI = process.env?.MONGO_URI || null;
const CONTROL_ACCESS_KEY = process.env?.CONTROL_ACCESS_KEY || null;
let controlToken = {token: null, expires: null};

async function dumpMongo2Localfile(mongoUri=null, outputPath=null) {

    outputPath = outputPath || path.join(__dirname, "../uploads/backups/");
    if(outputPath[outputPath.length - 1] !== '/') outputPath += '/';
    let backupName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.backup`;

    const client = new MongoClient(mongoUri || MONGO_URI);
    await client.connect();
    const db = await client.db();
    // Writes the contents of db to myfilename.snapshot, including indexes
    // Two collections are excluded (optional third argument)
    await write(db, outputPath + backupName, {
        // No password hashes please
        /* exclude: [ 'aposUsersSafe' ],
        filters: {
            aposDocs: {
                type: {
                    // No users please
                    $ne: '@apostrophecms/user'  
                }
            }
        } */
    });
    console.log(`Backup finish`);
}

async function restoreLocalfile2Mongo(mongoUri=null, restoreFilePath=null) {

    const client = new MongoClient(mongoUri || MONGO_URI);
    await client.connect();
    const db = await client.db();
    // If you want to replace the current contents and avoid unique key errors and/or duplicate
    // documents, call erase first
    await erase(db);
    // Two collections are excluded (optional third argument)
    if(!restoreFilePath) restoreFilePath = path.join(__dirname, "../uploads/backups/restore.backup");
    await read(db, restoreFilePath, { exclude: [ 'coll3', 'coll4' ]});
    
    fs.renameSync(restoreFilePath, restoreFilePath + ".done"); // Renombro el archivo de backup para evitar que se vuelva a restaurar
}

function getAccess(req, res){
    let { controllAccessKey } = req.body;
    if(!controllAccessKey) return res.status(400).end("Control Access Key is required");
    if(CONTROL_ACCESS_KEY !=  controllAccessKey) return res.status(401).end("Control Access Key is incorrect");
    
    controlToken = {
        token: utils.getUUID(),
        expires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiration
    };
    
    res.status(200).json({
        message: "Control Access granted",
        token: controlToken.token,
        expires: controlToken.expires
    });
}

async function makeBackup(req, res) {
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader?.split(' ')[1];
    if(!accessToken || !controlToken.token || controlToken.token !== accessToken || new Date(controlToken.expires) < new Date()) {
        return res.status(401).end("Unauthorized access. Please provide a valid access token.");
    }

    try{
        let t0 = performance.now();
        console.log("Starting scheduled backup...");
        await dumpMongo2Localfile();
        let t1 = performance.now();
        console.log(`Backup completed successfully. Time taken: ${(t1 - t0).toFixed(2)} ms`);
        res.status(200).end("Backup completed successfully.");
    }catch(err){
        console.error("Error during backup:", err);
        return res.status(500).end("Error during backup: " + err.message);
    }
}
async function restoreBackup(req, res) {
    const accessToken = authHeader?.split(' ')[1];
    if(!accessToken || !controlToken.token || controlToken.token !== accessToken || new Date(controlToken.expires) < new Date()) {
        return res.status(401).end("Unauthorized access. Please provide a valid access token.");
    }

    let restoreFilePath = path.join(__dirname, "../uploads/backups/restore.backup");
    if(!fs.existsSync(restoreFilePath)) return res.status(408).end("Backup file not found");
        
    try {
        await restoreLocalfile2Mongo(null, restoreFilePath);
        res.status(200).end("Backup restored successfully.");
    } catch (error) {
        console.error("Error restoring backup:", error);
        res.status(500).end("Error restoring backup: " + error.message);
    }
}

async function downloadBackup(req, res) {
    const accessToken = authHeader?.split(' ')[1];
    if(!accessToken || !controlToken.token || controlToken.token !== accessToken || new Date(controlToken.expires) < new Date()) {
        return res.status(401).end("Unauthorized access. Please provide a valid access token.");
    }

    let index = req.params?.index || 0;
    let outputPath =  path.join(__dirname, "../uploads/backups/");
    
    try {
        // Ordeno los archivos por fecha de creación, de más reciente a más antiguo
        // Al contener la fecha de creacion en el nombre del archivo, puedo ordenarlos alfabéticamente
        const files = await fs.promises.readdir(outputPath);
        files
        .filter(file => file.endsWith('.backup')) // Filtrar solo archivos de backup
        .sort((a,b)=>b.localeCompare(a)); // Ordeno por fecha de creación (alfabéticamente)
        
        // Conservo solo los 10 archivos más recientes
        files.forEach((file, i) => {
            if(i > 5) fs.unlinkSync(path.join(outputPath, file)); // Elimino archivos más antiguos que 10
        });

        res.setHeader('Content-Disposition', `attachment; filename="${files[index]}"`);
        res.sendFile(`${outputPath}${files[index]}`);
    } catch (error) {
        console.error("Error downloading backup:", error);
        res.status(500).end("Error downloading backup: " + error.message);
    }
}

function ping(req, res){
    const accessToken = authHeader?.split(' ')[1];
    if(!accessToken || !controlToken.token || controlToken.token !== accessToken || new Date(controlToken.expires) < new Date()) {
        return res.status(401).end("Unauthorized access. Please provide a valid access token.");
    }
    res.status(200).send("pong");
}

async function pingMongo(req, res){
    const accessToken = authHeader?.split(' ')[1];
    if(!accessToken || !controlToken.token || controlToken.token !== accessToken || new Date(controlToken.expires) < new Date()) {
        return res.status(401).end("Unauthorized access. Please provide a valid access token.");
    }

    try{
        let trabajos = await Trabajo.find({}).limit(5);
        res.status(200).json({
            message: "MongoDB is connected and working",
            query: "Trabajos.find({}).limit(5)",
            trabajos: trabajos.map(trabajo => trabajo.titulo)
        });
    }catch(err){
        res.status(500).json({
            message: "Error connecting to MongoDB",
            error: err.toString()
        });
    }
}

async function status(req, res){
    const accessToken = authHeader?.split(' ')[1];
    if(!accessToken || !controlToken.token || controlToken.token !== accessToken || new Date(controlToken.expires) < new Date()) {
        return res.status(401).end("Unauthorized access. Please provide a valid access token.");
    }

    let t0 = performance.now();
    // Memoria libre y total del sistema
    const totalMem = os.totalmem() / 1024 / 1024;
    const freeMem = os.freemem() / 1024 / 1024;
    //console.log(`RAM Total: ${totalMem.toFixed(2)} MB | Libre: ${freeMem.toFixed(2)} MB`);

    const cpus = os.cpus();
    const cpuUsage = cpus.map(cpu => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b);
        const usage = 100 - (cpu.times.idle * 100 / total);
        return usage.toFixed(2) + '%';
    });

    const diskSpace = await checkDiskSpace(isWindows ? 'C:' : '/');


    let t1 = performance.now();
    res.status(200).json({
        responseTime: (t1 - t0).toFixed(2) + ' ms',
        message: "Server is running",
        uptime: process.uptime(),
        memory: {
            total: totalMem.toFixed(2) + ' MB',
            free: freeMem.toFixed(2) + ' MB',
            used: (totalMem - freeMem).toFixed(2) + ' MB',
            usedPercent: ((totalMem - freeMem) / totalMem * 100).toFixed(2) + '%',
        },
        diskSpace: {
            total: (diskSpace.size / 1024 / 1024).toFixed(2) + ' MB',
            free: (diskSpace.free / 1024 / 1024).toFixed(2) + ' MB',
            used: ((diskSpace.size - diskSpace.free) / 1024 / 1024).toFixed(2) + ' MB',
            usedPercent: ((diskSpace.size - diskSpace.free) / diskSpace.size * 100).toFixed(2) + '%'
        },
        cpuUsage: cpuUsage,
        platform: os.platform(),
        arch: os.arch(),
        cpus: cpus.length
    });
}

// Programo un backup cada 6 horas
cron.schedule('0 */12 * * *', async () => {
    try {
        let t0 = performance.now();
        console.log("Starting scheduled backup...");
        await dumpMongo2Localfile();
        let t1 = performance.now();
        console.log(`Backup completed successfully. Time taken: ${(t1 - t0).toFixed(2)} ms`);
    } catch (error) {
        console.error("Error during scheduled backup:", error);
    }
}, {
    scheduled: true,
    timezone: "America/Argentina/Buenos_Aires"
});

module.exports = {
    dumpMongo2Localfile,
    restoreLocalfile2Mongo,
    getAccess,
    makeBackup,
    restoreBackup,
    downloadBackup,
    ping,
    pingMongo,
    status
};