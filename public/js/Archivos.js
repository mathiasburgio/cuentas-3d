class Archivos{
    constructor(inicializar = false) {
        this.configuracion = null;
        this.listadoProyectos = [];
        this.proyectoActual = null;
        this.listadoTrabajos = [];
        if(inicializar) this.init();
    }
    async init(){

        this.configuracion = await $.get("/configuracion");


        $("[name='buscar']").on("keyup", ev => {
            this.listarProyectos();
        }).on("change", ev => {
            this.listarProyectos();
        });

        $("[name='crear-proyecto']").on("click", ev => {
            this.modalCrearProyecto();
        });

        this.cargarProyectos();
    }
    async cargarProyectos() {
        this.listadoProyectos = await $.get("/archivos/obtener-proyectos");
        this.listarProyectos();
    }
    async listarProyectos() {
        let palabra = $("[name='buscar']").val().trim().toLowerCase();
        this.listadoProyectos = this.listadoProyectos || [];
        let html = "";
        this.listadoProyectos.forEach(proyecto => {
            if(palabra && !proyecto.nombre.toLowerCase().includes(palabra) && !proyecto.grupo.toLowerCase().includes(palabra)) return;

            html += `<tr _id="${proyecto._id}">
                <td>${proyecto.grupo}</td>
                <td>${proyecto.nombre}</td>
                <td class='text-right'>${proyecto.archivos.length}</td>
                <td class='text-right'>
                    <button class="btn btn-primary" name="verArchivos"><i class="fas fa-search"></i></button>
                </td>
            </tr>`;
        });
        $("[name='tabla-proyectos'] tbody").html(html);

        $("[name='verArchivos']").on("click", ev => {
            let ele = $(ev.currentTarget);
            let tr = ele.closest("tr");
            let _id = tr.attr("_id");
            this.proyectoActual = this.listadoProyectos.find(p => p._id === _id);
            this.modalArchivos();
        });
    }
    modalCrearProyecto() {
        let fox = $("#modal-crear-proyecto").html();
        modal.show({
            title: "Crear Proyecto",
            body: fox,
            buttons: "back"
        })
        
        let grupos = this.listadoProyectos.reduce((acc, proyecto) => {
            if(!acc.includes(proyecto.grupo)) acc.push(proyecto.grupo);
            return acc;
        }, []);

        $("#modal [name='grupo']").html(`<option value=''>-Seleccione un grupo-</option>` + utils.getOptions({ar: grupos}));

        $("#modal [name='crear-grupo']").on("click", async ev => {
            let ele = $(ev.currentTarget);
            let v = await modal.addPopover({querySelector: ele, type: "input", label: "Grupo", placeholder: "Ingrese el nombre del grupo"});
            if(!v) return;

            $("#modal [name='grupo']").append(`<option value="${v}">${v}</option>`);
            $("#modal [name='grupo']").val(v);
        });   

        $("#modal [name='crear']").on("click", async ev => {
            let ele = $(ev.currentTarget);
            let grupo = $("#modal [name='grupo']").val().trim();
            let nombre = $("#modal [name='nombre']").val().trim();
            if(!grupo || !nombre || grupo.length < 3 || nombre.length < 3) return modal.addPopover({querySelector: ele, message: "Grupo y nombre son requeridos"});

            let resp = await $.post({
                url: "/archivos/crear-proyecto", 
                data: {grupo, nombre}
            });

            $("[name='buscar']").val("");
            this.listadoProyectos.push(resp);
            this.listarProyectos();
            modal.hide();
        });
    }
    modalSubirArchivo() {
        let fox = $("#modal-subir-archivo").html();
        modal.show({
            title: "Agregar Archivo",
            body: fox,
            size: "md",
            buttons: "back"
        });

        $("#modal [name='archivo']").on("change", ev=>{
            let ele = $(ev.currentTarget);
            let archivo = ele.prop("files")[0];
        });

        $("#modal [name='subir']").on("click", async ev=>{
            let ele = $(ev.currentTarget);
            let archivo = $("#modal [name='archivo']").prop("files")[0];
            let detalle = $("#modal [name='detalle']").val().trim();
            
            if(!archivo) return modal.addPopover({querySelector: ele, message: "Archivo no válido"});
            if(!detalle || detalle.length < 3) return modal.addPopover({querySelector: ele, message: "Detalle no válido"});

            let formData = new FormData();
            formData.append("archivo", archivo);
            formData.append("detalle", detalle);

            let resp = await $.post({
                url: `/archivos/subir-archivo/${this.proyectoActual._id}`,
                data: formData,
                processData: false,
                contentType: false
            });
            console.log(resp);
            this.proyectoActual.archivos = resp.archivos;
            this.listarProyectos();
            modal.hide(false, ()=>{
                this.modalArchivos();
            });
        });
    }
    modalArchivos(){
        let fox = $("#modal-archivos").html();
        modal.show({
            title: `Archivos del Proyecto: ${this.proyectoActual.nombre}`,
            body: fox,
            size: "lg",
            buttons: "back"
        });

        let tbody = "";
        this.proyectoActual.archivos.forEach(archivo => {
            let tamano = archivo.tamano / 1024;
            if(tamano < 1024) tamano = `${tamano.toFixed(2)} Kb`;
            else tamano = `${(tamano / 1024).toFixed(2)} Mb`;

            tbody += `<tr _id="${archivo._id}">
                <td>${fechas.parse2(archivo.fecha, "USA_FECHA_HORA")}</td>
                <td>${archivo.detalle}</td>
                <td class="text-right">${tamano}</td>
                <td class="text-right">
                    <button class="btn btn-primary btn-sm" name="descargar"><i class="fas fa-download"></i></button>    
                </td>
            </tr>`;
        });
        console.log(tbody);
        $("#modal table tbody").html(tbody);

        $("#modal table [name='descargar']").on("click", ev => {
            let ele = $(ev.currentTarget);
            let tr = ele.closest("tr");
            let _id = tr.attr("_id");
            let archivo = this.proyectoActual.archivos.find(a => a._id === _id);
            
            let w = window.open(`/files3d/${archivo.nombre}`, "_blank");
        });
        

        $("#modal [name='subir-archivo']").on("click", ev => {
            modal.hide(false, () => {
                this.modalSubirArchivo();
            });
        });
    }
}