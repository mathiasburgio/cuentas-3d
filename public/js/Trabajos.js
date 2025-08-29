class Trabajos{
    constructor(inicializar = false){
        this.configuracion = null;
        this.listadoTrabajos = [];
        this.trabajoActual = null;
        
        this.imagenTrabajo = null;
        this.accion = null;
        if(inicializar) this.init();
    }
    async init(){

        this.configuracion = await $.get("/configuracion");

        $("[name='nuevo']").on("click", (e) => {
            this.limpiarTodo();
            this.accion = "nuevo";
            this.imagenTrabajo = null;

            $("[name='fecha']").val(fechas.getNow(false));
            $("[name='fechaEntrega']").val(fechas.getNow(false));
            $("[name='estado']").val("presupuesto");
            $("[name='categoria']").val("sin asignar");
            $("[name='nuevo']").addClass("btn-primary").removeClass("btn-light");
            $("[name='modificar']").removeClass("btn-primary").addClass("btn-light");

            $("[name='datos'] input, [name='datos'] select").prop("disabled", false);
            $("[name='datos'] [name='guardar']").prop("disabled", false);
        });
        $("[name='modificar']").on("click", (e) => {
            modal.message("Seleccione un trabajo para modificar");
        });
        $("[name='cerrar']").on("click", (e) => {
            if(!this.trabajoActual) return modal.message("Seleccione un trabajo primero");
            if(this.trabajoActual.cerrado) return modal.message("El trabajo ya está cerrado");
            if(this.trabajoActual.estado != "entregado" && this.trabajoActual.estado != "cancelado") return modal.message("Solo se pueden cerrar trabajos que estén en estado <b>entregado</b> o <b>cancelado</b>");
            this.cerrarTrabajo();
        });
        $("[name='buscar']").on("keyup", (e) => {
            this.listarTrabajos();
        });
        $("[name='guardar']").on("click", (e) => {
            if(this.accion == null) return;
            this.guardarTrabajo();
        });

        $("[name='precioPorUnidad']").on("change", ev=>{
            let ele = $(ev.currentTarget);
            let precio = parseFloat(ele.val());
            let cantidad = parseFloat($("[name='cantidad']").val());
            if(isNaN(precio) || isNaN(cantidad)) return;
            let total = precio * cantidad;
            $("[name='precioTotal']").val(total.toFixed(2));
        })
        $("[name='precioTotal']").on("change", ev=>{
            let ele = $(ev.currentTarget);
            let total = parseFloat(ele.val());
            let cantidad = parseFloat($("[name='cantidad']").val());
            if(isNaN(total) || isNaN(cantidad)) return;
            let precio = total / cantidad;
            $("[name='precioPorUnidad']").val(precio.toFixed(2));
        });

        $("[name='pesoFilamentoUnidad']").on("change", ev=>{
            let ele = $(ev.currentTarget);
            let pesoFilamentoUnidad = parseFloat(ele.val());
            let cantidad = parseFloat($("[name='cantidad']").val());
            if(isNaN(pesoFilamentoUnidad) || isNaN(cantidad)) return;
            let total = pesoFilamentoUnidad * cantidad;
            $("[name='pesoFilamentoTotal']").val(total.toFixed(2));
        })

        $("[name='pesoFilamentoTotal']").on("change", ev=>{
            let ele = $(ev.currentTarget);
            let pesoFilamentoTotal = parseFloat(ele.val());
            let cantidad = parseFloat($("[name='cantidad']").val());
            if(isNaN(pesoFilamentoTotal) || isNaN(cantidad)) return;
            let pesoFilamentoUnidad = pesoFilamentoTotal / cantidad;
            $("[name='pesoFilamentoUnidad']").val(pesoFilamentoUnidad.toFixed(2));
        });

        $("[name='tiempoImpresionUnidad']").on("change", ev=>{
            let ele = $(ev.currentTarget);
            let tiempoImpresionUnidad = parseFloat(ele.val());
            let cantidad = parseFloat($("[name='cantidad']").val());
            if(isNaN(tiempoImpresionUnidad) || isNaN(cantidad)) return;
            let tiempoImpresionTotal = tiempoImpresionUnidad * cantidad;
            $("[name='tiempoImpresionTotal']").val(tiempoImpresionTotal.toFixed(2));
        });

        $("[name='tiempoImpresionTotal']").on("change", ev=>{
            let ele = $(ev.currentTarget);
            let tiempoImpresionTotal = parseFloat(ele.val());
            let cantidad = parseFloat($("[name='cantidad']").val());
            if(isNaN(tiempoImpresionTotal) || isNaN(cantidad)) return;
            let tiempoImpresionUnidad = tiempoImpresionTotal / cantidad;
            $("[name='tiempoImpresionUnidad']").val(tiempoImpresionUnidad.toFixed(2));
        });

        $("[name='agregarRegistroHistorial']").on("click", async ev=>{
            if(!this.trabajoActual) return modal.message("Seleccione un trabajo primero");
            if(this.trabajoActual.cerrado) return modal.message("No se pueden agregar registros a un trabajo cerrado");
            this.modalRegistroHistorial();
        });

        $("[name='agregarCobro']").on("click", async ev=>{
            if(!this.trabajoActual) return modal.message("Seleccione un trabajo primero");
            if(this.trabajoActual.cerrado) return modal.message("No se pueden agregar cobros a un trabajo cerrado");
            this.modalAgregarCobro();
        });

        $("[name='agregarArchivo']").on("click", async ev=>{
            if(!this.trabajoActual) return modal.message("Seleccione un trabajo primero");
            this.modalAgregarArchivo();
        });

        $("[name='agregarCosto']").on("click", async ev=>{
            if(!this.trabajoActual) return modal.message("Seleccione un trabajo primero");
            if(this.trabajoActual.cerrado) return modal.message("No se pueden agregar costos a un trabajo cerrado");
            this.modalAgregarCosto();
        });

        $("[name='calcular-horas-a-minutos']").on("click", async ev=>{
            if( $("[name='tiempoImpresionUnidad']").prop("disabled") ) return;
            let ele = $(ev.currentTarget);
            let p = await modal.prompt({querySelector: ele, type: "time", label: "Tiempo en formato HH:MM", value: "01:30"});
            if(!p) return;
            let [horas, minutos] = p.split(":").map(Number);
            let cantidad = parseFloat($("[name='cantidad']").val() || 1);
            console.log(horas, minutos, cantidad);
            $("[name='tiempoImpresionUnidad']").val(((horas * 60 + minutos) / cantidad).toFixed(2));
            $("[name='tiempoImpresionTotal']").val(horas * 60 + minutos);
            console.log(p);
        })

        $("[name='calculadora-costos']").on("click", ev=>{
            this.modalCalculadoraCostos();
        });

        $("[name='crear-categoria']").on("click", async ev=>{
            let prompt = await modal.prompt({label: "Categoría"});
            if(!prompt) return;
            if(prompt.length < 3) return modal.message("Categoría no válida");
            $("[name='categoria']").append(`<option value="${prompt}">${prompt}</option>`);
            $("[name='categoria']").val(prompt);
        });

        $("[name='filtro-ultimos-trabajos']").on("click", ev=>{
            let ele = $(ev.currentTarget);
            this.obtenerTrabajos(1, -1)
        });

        $("[name='filtro-seleccionar-anio-mes']").on("click", async ev=>{
            let [anio, mes] = fechas.getNow(false).split("-");
            let prompt = await modal.prompt({label: "Seleccionar mes", type: "month", value: (anio + "-" + mes)});
            if(!prompt) return;
            this.obtenerTrabajos(1, prompt + "-05");
        });

        $("[name='imagen-trabajo']").on("change", async ev=>{
            let file = ev.target.files[0];
            if(!file) return;
            if(file.type.indexOf("image/") != 0) return modal.message("El archivo debe ser una imagen válida");
            let resizer = new SimpleImagine({maxWidth: 800, maxHeight: 800, maxSize: (5 * 1024 * 1024)});
            let newFile = await resizer.resize({val: file});
            //console.log(newFile);
            let resp = await utils.uploadFile("/trabajos/subir-imagen", newFile);
            this.imagenTrabajo = resp;
        });

        $("[name='popover-imagen']").popover({
            content: ()=>{
                let src = "/images/" + this.imagenTrabajo;
                if(!this.imagenTrabajo) src = "/resources/sin-imagen.jpg";
                return "<div class='popover-img-container'><img src='" + src + "'></div>";
            },
            html: true,
            trigger: "hover"
        })


        this.obtenerTrabajos();
    }
    async obtenerTrabajos(pagina = 1, fechaMes = -1){
        let resp = await $.get(`/trabajos/obtener-trabajos/${pagina}/${fechaMes}`);
        this.listadoTrabajos = resp;
        this.listarTrabajos();
    }
    listarTrabajos(){
        this.limpiarTodo();


        let palabra = $("[name='buscar']").val().trim().toLowerCase();
        let tbody = "";
        this.listadoTrabajos.filter(trabajo => {
            return trabajo.nombre.toLowerCase().includes(palabra) || 
            trabajo.cliente.nombre.toLowerCase().includes(palabra);
        })
        .sort((a, b) => b.fecha.toString().localeCompare(a.fecha.toString()))
        .forEach(trabajo => {


            let sumaCobros = trabajo.cobros?.reduce((acc, cobro) => acc + cobro.monto, 0) || 0;
            let colorCobro = "light";
            if(parseInt(sumaCobros) == parseInt(trabajo.precioPorUnidad * trabajo.cantidad)) colorCobro = "success";
            else if(sumaCobros > 0 && parseInt(sumaCobros) < parseInt(trabajo.precioPorUnidad * trabajo.cantidad)) colorCobro = "warning";
            
            
            let colorEstado = "light";
            if(trabajo.estado == "presupuesto" || trabajo.estado == "en_proceso") colorEstado = "warning";
            if(trabajo.estado == "completado" || trabajo.estado == "entregado") colorEstado = "success";
            else if(trabajo.estado == "cancelado") colorEstado = "danger";

            tbody += `<tr _id="${trabajo._id}" class='cp'>
                <td><i class='fas fa-${trabajo.cerrado ? "lock text-danger" : "lock-open"}'></i></td>
                <td class='text-right'><small>${trabajo.fecha ? fechas.parse2(trabajo.fecha, "USA_FECHA") : "?"}</small></td>
                <td>${trabajo.nombre} (${trabajo.cliente.nombre})</td>
                <td class='text-right'>
                    <span class='badge badge-${colorCobro}'>$</span>
                    <span class='badge badge-${colorEstado}'>${trabajo.estado}</span>
                </td>
            </tr>`;
        });
        $("[name='tabla-trabajos'] tbody").html(tbody);
        
        
        $("[name='tabla-trabajos'] tbody [_id]").on("click", (e) => {
            let tr = $(e.currentTarget);
            tr.addClass("table-info").siblings().removeClass("table-info");
            let trabajoId = tr.attr("_id");
            this.trabajoActual = this.listadoTrabajos.find(t => t._id === trabajoId);
            if(!this.trabajoActual) return;
            this.imagenTrabajo = this.trabajoActual.imagen;

            this.accion = "modificar";
            $("[name='nuevo']").removeClass("btn-primary").addClass("btn-light");
            $("[name='modificar']").addClass("btn-primary").removeClass("btn-light");
            
            if(this.trabajoActual.cerrado != true){
                $("[name='datos'] input, [name='datos'] select").prop("disabled", false);
                $("[name='datos'] [name='guardar']").prop("disabled", false);
            }

            this.completarDatosTrabajo();
            this.listarHistorial();
            this.listarCobros();
            this.listarArchivos();
            this.listarCostos();
        });

        $("[name='tabla-trabajos'] tbody tr").each((ind, row)=>{
            let $row = $(row);
            let trabajo = this.listadoTrabajos.find(t => t._id === $row.attr("_id"));
            if(!trabajo || !trabajo?.imagen) return;
            
            $row.popover({
                container: "body",
                content: `<div class="popover-img-container">
                    <img src="/images/${trabajo.imagen}" alt="${trabajo.nombre}">
                </div>`,
                html: true,
                trigger: "hover",
                placement: "top"
            });
        })

        let distinctCategorias = this.listadoTrabajos.reduce((acc, item) => {
            if(item?.categoria && !acc.includes(item.categoria)) acc.push(item.categoria);
            return acc;
        }, []);
        let optCategorias = utils.getOptions({ar: distinctCategorias, text: "categoria" });
        $("[name='categoria']").html(optCategorias);
    }
    async guardarTrabajo(){
        try{
            let data = {
                cliente: {}
            };
            $("[name='datos'] input, [name='datos'] select").each((i, input) => {
                let name = $(input).attr("name");
                if(name== "imagen-trabajo") return; //la imagen se guarda aparte

                if(name){
                    if(name.startsWith("cliente.")){
                        let clienteField = name.split(".")[1];
                        data.cliente[clienteField] = ($(input).val() || "").toString().trim();
                    }else{
                        data[name] = ($(input).val() || "").toString().trim();
                    }
                }
            });
            console.log(data);
            if(!data.fecha) throw "Fecha no válida";
            if(!data.nombre || data.nombre.length < 3) throw "Nombre del trabajo no válido";
            //if(!data.descripcion || data.descripcion.length < 3) throw "Descripción del trabajo no válida";
            if(!data.estado || data.estado.length < 3) throw "Estado del trabajo no válido";
            if(!data.fechaEntrega) throw "Fecha de entrega no válida";
            if(!data.cantidad || isNaN(data.cantidad)) throw "Cantidad no válida";
            if(!data.precioPorUnidad || isNaN(data.precioPorUnidad)) throw "Precio no válido";
            if(!data.cliente.nombre || data.cliente.nombre.length < 3) throw "Nombre del cliente no válido";
            //if(!data.cliente.telefono || data.cliente.telefono.length < 3) throw "Teléfono del cliente no válido";
    
            data.fecha = data.fecha + "T08:00";
            data.fechaEntrega = data.fechaEntrega + "T08:00";
            data.imagen = this.imagenTrabajo;

            let resp = await $.post({
                url: "/trabajos/guardar-trabajo" + (this.accion === "modificar" ? `/${this.trabajoActual._id}` : ""),
                data: JSON.stringify(data),
                contentType: "application/json"
            });
    
            console.log(resp);
            if(this.accion === "nuevo"){
                this.listadoTrabajos.push(resp);
            }else{
                Object.assign(this.trabajoActual, data);
            }
            
            $("[name='buscar']").val("");
            this.listarTrabajos();
            modal.message("Trabajo guardado correctamente");
        }catch(error){
            modal.message("Error al guardar el trabajo: " + (error?.responseText || error));
            console.error("Error al guardar el trabajo:", error);
        }
    }

    completarDatosTrabajo(){
        $("[name='datos'] input, [name='datos'] select").each((i, input) => {
            let name = $(input).attr("name");
            if($(input).attr("type") === "date") return;
            if($(input).attr("type") === "file") return;

            if(name && this.trabajoActual[name] !== undefined){
                $(input).val(this.trabajoActual[name]);
            }
        });

        $("[name='datos'] [name='fecha']").val(fechas.parse2(this.trabajoActual.fecha, "USA_FECHA"));
        $("[name='datos'] [name='fechaEntrega']").val(fechas.parse2(this.trabajoActual.fechaEntrega, "USA_FECHA"));
        $("[name='datos'] [name='cliente.nombre']").val(this.trabajoActual.cliente.nombre);
        $("[name='datos'] [name='cliente.telefono']").val(this.trabajoActual.cliente.telefono);
        $("[name='datos'] [name='categoria']").val(this.trabajoActual.categoria);
        $("[name='datos'] [name='precioPorUnidad']").change();
        $("[name='datos'] [name='pesoFilamentoUnidad']").change();
        $("[name='datos'] [name='tiempoImpresionUnidad']").change();

        if(this?.trabajoActual.cerrado == true){
            $("[name='datos'] input, [name='datos'] select").prop("disabled", true);
            $("[name='datos'] [name='guardar']").prop("disabled", true);
        }
    }

    async modalRegistroHistorial(){
        let observacion = await modal.prompt({label: "Ingrese el detalle"});
        if(!observacion) return;
        if(observacion.trim().length < 3) return modal.message("Observación no válida");
        
        let resp = await $.post({
            url: `/trabajos/agregar-registro-historial/${this.trabajoActual._id}`,
            data: {observaciones: observacion},
        });
        console.log(resp);
        this.trabajoActual.historial = resp.historial;
        this.listarHistorial();
    }
    listarHistorial(){
        if(!this.trabajoActual) return;
        let tbody = "";
        this.trabajoActual.historial.forEach(registro => {
            tbody += `<tr>
                <td>${fechas.parse2(registro.fecha, "USA_FECHA_HORA")}</td>
                <td>${registro?.estado || "?"}</td>
                <td>${registro.observaciones}</td>
            </tr>`;
        });
        $("[name='tabla-historial'] tbody").html(tbody);
    }

    modalAgregarCobro(){
        let fox = $("#modal-cobro").html();
        modal.show({
            title: "Agregar Cobro",
            body: fox,
            size: "md",
            buttons: "back"
        });

        $("#modal [name='fecha']").val(fechas.getNow(false));
        let opt = "<option value=''>Seleccione un método</option>";
        this.configuracion.metodosDeCobro.forEach(metodo => {
            opt += `<option value="${metodo}">${metodo}</option>`;
        });
        $("#modal [name='metodo']").html(opt);

        let montoCobrado = this.trabajoActual.cobros?.reduce((acc, cobro) => acc + cobro.monto, 0) || 0;
        let montoTrabajo = (this.trabajoActual.precioPorUnidad * this.trabajoActual.cantidad);

        $("#modal [name='autocompletar']").on("click", ev=>{
            let ele = $(ev.currentTarget);
            let montoAdeudado = montoTrabajo - montoCobrado;
            $("#modal [name='monto']").val(montoAdeudado);
        });

        $("#modal [name='guardarCobro']").on("click", async ev=>{
            let ele = $(ev.currentTarget);
            try{
                
                let fecha = $("#modal [name='fecha']").val();
                let monto = parseFloat($("#modal [name='monto']").val());
                let metodo = $("#modal [name='metodo']").val();
    
                if(!fecha) return modal.addPopover({querySelector: ele, message: "Fecha no válida"});
                if(isNaN(monto) || monto <= 0) return modal.addPopover({querySelector: ele, message: "Monto no válido"});
                if(!metodo || metodo.trim().length < 3) return modal.addPopover({querySelector: ele, message: "Método no válido"});
    
                if(monto > (montoTrabajo - montoCobrado)) return modal.addPopover({querySelector: ele, message: "El monto no puede ser mayor al adeudado"});
                fecha = fecha + "T08:00";
                
                let resp = await $.post({
                    url: `/trabajos/agregar-cobro/${this.trabajoActual._id}`,
                    data: {fecha, monto, metodo},
                });
                console.log(resp);
                this.trabajoActual.cobros = resp.cobros;
                this.listarCobros();
                modal.hide();
            }catch(error){
                console.error("Error al agregar cobro:", error);
                modal.addPopover({querySelector: ele, message: (error?.responseText || error.toString())});
            }
        });
    }
    listarCobros(){
        if(!this.trabajoActual) return;

        let suma = 0;
        let tbody = "";
        this.trabajoActual.cobros.forEach(cobro => {
            tbody += `<tr _id="${cobro._id}">
                <td>${fechas.parse2(cobro.fecha, "USA_FECHA")}</td>
                <td>${cobro.metodo}</td>
                <td class="text-right">$${utils.formatNumber(cobro.monto)}</td>
            </tr>`;
            suma += parseFloat(cobro.monto);
        });
        $("[name='tabla-cobros'] tbody").html(tbody);
        $("[name='tabla-cobros'] tfoot td").html("Total: $" + utils.formatNumber(suma));
    }

    modalAgregarArchivo(){
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
            if(!archivo) return;
            $("#modal [name='detalle']").val(archivo.name);
        });

        $("#modal [name='guardarArchivo']").on("click", async ev=>{
            let ele = $(ev.currentTarget);
            let archivo = $("#modal [name='archivo']").prop("files")[0];
            let detalle = $("#modal [name='detalle']").val().trim();
            
            if(!archivo) return modal.addPopover({querySelector: ele, message: "Archivo no válido"});
            if(!detalle || detalle.length < 3) return modal.addPopover({querySelector: ele, message: "Detalle no válido"});

            /* let formData = new FormData();
            formData.append("archivo", archivo);
            formData.append("detalle", detalle); */

            utils.uploadFileWithProgress({
                url: `/trabajos/agregar-archivo/${this.trabajoActual._id}`,
                file: archivo,
                props: {detalle},
                onProgress: (progress) => {
                    modal.waiting2(true, "Subiendo archivo..." + parseInt(progress || 0) + "%");
                },
                onFinish: async (error, response) => {
                    modal.waiting2(false);
                    if(typeof response === "string") response = JSON.parse(response);
                    console.log(response);
                    this.trabajoActual.archivos = response.archivos;
                    this.listarArchivos();
                    modal.hide();
                }
            });
            /* let resp = await $.post({
                data: formData,
                processData: false,
                contentType: false
            });
            console.log(resp);
            this.trabajoActual.archivos = resp.archivos;
            this.listarArchivos();
            modal.hide(); */
        });
    }
    listarArchivos(){
        if(!this.trabajoActual) return;
        let tbody = "";
        this.trabajoActual.archivos.forEach(archivo => {
            tbody += `<tr _id="${archivo._id}">
                <td>${fechas.parse2(archivo.fecha, "USA_FECHA_HORA")}</td>
                <td>${archivo.detalle}</td>
                <td class='text-right'><a href="/uploads/${archivo.archivo}" target="_blank" class='btn btn-primary btn-sm'><i class="fas fa-download"></i></a></td>
            </tr>`;
        });
        $("[name='tabla-archivos'] tbody").html(tbody);
    }

    modalAgregarCosto(){
        let fox = $("#modal-agregar-costo").html();
        modal.show({
            title: "Agregar Costo",
            body: fox,
            size: "md",
            buttons: "back"
        });

        $("#modal [name='costoPorUnidad']").on("change", ev=>{
            let ele = $(ev.currentTarget);
            let costo = ele.val().trim();
            let cantidad = this.trabajoActual?.cantidad || 1;
            $("#modal [name='costoTotal']").val((parseFloat(costo) * cantidad).toFixed(2));
        });

        $("#modal [name='costoTotal']").on("change", ev=>{
            let ele = $(ev.currentTarget);
            let costoTotal = ele.val().trim();
            let cantidad = this.trabajoActual?.cantidad || 1;
            $("#modal [name='costoPorUnidad']").val((parseFloat(costoTotal) / cantidad).toFixed(2));
        });



        $("#modal [name='guardarRegistro']").on("click", async ev=>{
            let ele = $(ev.currentTarget);
            let detalle = $("#modal [name='detalle']").val().trim();
            let costoPorUnidad = $("#modal [name='costoPorUnidad']").val().trim();
            let costoTotal = $("#modal [name='costoTotal']").val().trim();

            if(!detalle || detalle.length < 3) return modal.addPopover({querySelector: ele, message: "Detalle no válido"});
            if(!costoPorUnidad || isNaN(costoPorUnidad)) return modal.addPopover({querySelector: ele, message: "Costo no válido"});

            let resp = await $.post({
                url: `/trabajos/agregar-costo/${this.trabajoActual._id}`,
                data: {detalle, costoPorUnidad, costoTotal},
            });
            console.log(resp);
            this.trabajoActual.costosVariables = resp.costosVariables;

            this.listarCostos();
            modal.hide();
        });
    }
    listarCostos(){
        if(!this.trabajoActual) return;
        
        let tbody = "";
        let consumoElectrico = this.obtenerConsumoElectrico(this.trabajoActual)
        //costos fijos
        tbody += `<tr>
            <td>[FIJO] ENERGÍA (${this.trabajoActual.costos.electricoKwh} $/Kwh)</td>
            <td class="text-right">${utils.formatNumber(consumoElectrico.unidad)}</td>
            <td class="text-right">${utils.formatNumber(consumoElectrico.total)}</td>
        </tr>`;

        let costoFilamentoPorUnidad = (this.trabajoActual.pesoFilamentoUnidad * this.trabajoActual.costos.filamentoKg / 1000);
        tbody += `<tr>
            <td>[FIJO] FILAMENTO (${utils.formatNumber(this.trabajoActual.costos.filamentoKg)} Kg)</td>
            <td class="text-right">${utils.formatNumber(costoFilamentoPorUnidad)}</td>
            <td class="text-right">${utils.formatNumber(costoFilamentoPorUnidad * this.trabajoActual.cantidad)}</td>
        </tr>`;

        let costoReinversionPorUnidad = (this.trabajoActual.precioPorUnidad * this.trabajoActual.costos.porcentajeReinversion / 100);
        tbody += `<tr>
            <td>[FIJO] REINVERSIÓN (${this.trabajoActual.costos.porcentajeReinversion} %)</td>
            <td class="text-right">${utils.formatNumber(costoReinversionPorUnidad)}</td>
            <td class="text-right">${utils.formatNumber(costoReinversionPorUnidad * this.trabajoActual.cantidad)}</td>
        </tr>`;

        //costos variables
        let sumaCostosVariables = 0;
        this.trabajoActual.costosVariables.forEach(costo => {
            tbody += `<tr>
                <td>${costo.detalle}</td>
                <td class="text-right">${utils.formatNumber(costo.costoPorUnidad)}</td>
                <td class="text-right">${utils.formatNumber(costo.costoPorUnidad * this.trabajoActual.cantidad)}</td>
            </tr>`;
            sumaCostosVariables += parseFloat(costo.costoPorUnidad || 0);
        });
        $("[name='tabla-costos'] tbody").html(tbody);
        let costoUnidad = consumoElectrico.unidad + costoReinversionPorUnidad + costoFilamentoPorUnidad + sumaCostosVariables;
        $("[name='tabla-costos'] tfoot [name='costo-unidad'] span").html("$" + utils.formatNumber(costoUnidad));
        $("[name='tabla-costos'] tfoot [name='costo-total'] span").html("$" + utils.formatNumber(costoUnidad * this.trabajoActual.cantidad));

        $("[name='tabla-costos'] tfoot [name='venta-unidad'] span").html("$" + utils.formatNumber(this.trabajoActual.precioPorUnidad));
        $("[name='tabla-costos'] tfoot [name='venta-total'] span").html("$" + utils.formatNumber(this.trabajoActual.precioPorUnidad * this.trabajoActual.cantidad));

        let gananciaUnidad = this.trabajoActual.precioPorUnidad - costoUnidad;
        $("[name='tabla-costos'] tfoot [name='ganancia-unidad'] span").html("$" + utils.formatNumber(gananciaUnidad));
        $("[name='tabla-costos'] tfoot [name='ganancia-total'] span").html("$" + utils.formatNumber(gananciaUnidad * this.trabajoActual.cantidad));

        let margenGanancia = (gananciaUnidad / costoUnidad * 100) || 0;
        $("[name='margen-ganancia']").html("Margen: " + margenGanancia.toFixed(2) + " %");
    }

    limpiarTodo(){
        this.accion = null;
        this.trabajoActual = null;
        $("[name='tabla-trabajos'] tbody tr").removeClass("table-info");
        $("[name='datos'] input, [name='datos'] select").prop("disabled", true).val(null);
        $("[name='datos'] [name='guardar']").prop("disabled", true);
        $("[name='nuevo']").removeClass("btn-primary").addClass("btn-light");
        $("[name='modificar']").removeClass("btn-primary").addClass("btn-light");

        $("[name='tabla-historial'] tbody").html("");
        $("[name='tabla-cobros'] tbody").html("");
        $("[name='tabla-cobros'] tfoot td").html("Total: $0");
        $("[name='tabla-archivos'] tbody").html("");
        $("[name='tabla-costos'] tbody").html("");
        $("[name='tabla-costos'] tfoot [name] span").html("$0");
    }
    async cerrarTrabajo(){
        try{
            let montoCobrado = this.trabajoActual.cobros?.reduce((acc, cobro) => acc + cobro.monto, 0) || 0;
            let montoAdeudado = (this.trabajoActual.precioPorUnidad * this.trabajoActual.cantidad) - montoCobrado;
            if(montoAdeudado > 0) return modal.message(`El trabajo no se puede cerrar porque aún hay un monto adeudado de $${montoAdeudado.toFixed(2)}. Por favor, complete el cobro antes de cerrar el trabajo.`);

            let confirm = await modal.yesno("Al cerrar un trabajo no se podrá volver a editar (exepto los archivos).<br>¿Confirma que desea cerrar el trabajo?");
            if(!confirm) return;

            let resp = await $.post({
                url: `/trabajos/cerrar-trabajo/${this.trabajoActual._id}`,
            });
            console.log(resp);
            this.trabajoActual.cerrado = resp.cerrado;
            this.listarTrabajos();
            modal.message("Trabajo cerrado correctamente");
        }catch(e){
            console.error(e);
        }
    }
    obtenerConsumoElectrico(trabajo){
        let consumoBambuA1 = 100; //Wh
        let minutosTotales = trabajo.tiempoImpresionUnidad * trabajo.cantidad;
        let costoElectrico = ((consumoBambuA1 * minutosTotales) / 60000) * trabajo.costos.electricoKwh; //costo por minuto
        return { unidad: costoElectrico / trabajo.cantidad, total: costoElectrico };
    }
    modalCalculadoraCostos(){
        let fox = $("#modal-calculadora-costos").html();
        modal.show({
            title: "Calculadora de Costos",
            body: fox,
            size: "md",
            buttons: "back"
        });

        let tabla = [
            {detalle: "Energia", unidad: 0, total: 0},
            {detalle: "Filamento", unidad: 0, total: 0},
            {detalle: "Reinversión", unidad: 0, total: 0},
            {detalle: "Otros1", unidad: 0, total: 0},
            {detalle: "Otros2", unidad: 0, total: 0},
            {detalle: "Otros3", unidad: 0, total: 0},
        ];

        tabla[0].detalle = "Energia (" + this.configuracion.costos.electricoKwh + " $/Kwh)";
        tabla[1].detalle = "Filamento (" + this.configuracion.costos.filamentoKg + " $/Kg)";
        tabla[2].detalle = "Reinversión (" + this.configuracion.costos.porcentajeReinversion + " %)";

        const calcular = (desdeUnidad=true) =>{
            let cantidad = parseFloat($("#modal [name='cantidad']").val() || 1);
            let precioPorUnidad = parseFloat($("#modal [name='precioPorUnidad']").val() || 0);
            let minutosPorUnidad = parseFloat($("#modal [name='minutosPorUnidad']").val() || 0);
            let pesoPorUnidad = parseFloat($("#modal [name='pesoPorUnidad']").val() || 0);

            let precioTotal = parseFloat($("#modal [name='precioTotal']").val() || 0);
            let minutosTotales = parseFloat($("#modal [name='minutosTotales']").val() || 0);
            let pesoTotal = parseFloat($("#modal [name='pesoTotal']").val() || 0);

            if(!cantidad) return;
            if(desdeUnidad){
                precioTotal = parseInt(precioPorUnidad * cantidad);
                minutosTotales = parseInt(minutosPorUnidad * cantidad);
                pesoTotal = parseInt(pesoPorUnidad * cantidad);

                $("#modal [name='precioTotal']").val(precioTotal);
                $("#modal [name='minutosTotales']").val(minutosTotales);
                $("#modal [name='pesoTotal']").val(pesoTotal);
            }else{
                precioPorUnidad = parseInt(precioTotal / cantidad);
                minutosPorUnidad = parseInt(minutosTotales / cantidad);
                pesoPorUnidad = parseInt(pesoTotal / cantidad);

                $("#modal [name='precioPorUnidad']").val(precioPorUnidad.toFixed(2));
                $("#modal [name='minutosPorUnidad']").val(minutosPorUnidad.toFixed(2));
                $("#modal [name='pesoPorUnidad']").val(pesoPorUnidad.toFixed(2));
            }

            actualizarTabla();
        }

        const actualizarTabla = () => {
            let cantidad = parseFloat($("#modal [name='cantidad']").val() || 1);
            let precioPorUnidad = parseFloat($("#modal [name='precioPorUnidad']").val() || 0);
            let minutosPorUnidad = parseFloat($("#modal [name='minutosPorUnidad']").val() || 0);
            let pesoPorUnidad = parseFloat($("#modal [name='pesoPorUnidad']").val() || 0);

            let costoEnergia = this.obtenerConsumoElectrico({
                cantidad: cantidad,
                tiempoImpresionUnidad: minutosPorUnidad,
                costos: {electricoKwh: this.configuracion.costos.electricoKwh}
            });

            tabla[0].unidad = parseInt(costoEnergia?.unidad || 0);
            tabla[0].total = parseInt(costoEnergia?.total || 0);

            tabla[1].unidad = parseInt(pesoPorUnidad * this.configuracion.costos.filamentoKg / 1000);
            tabla[1].total = parseInt(tabla[1].unidad * cantidad);

            tabla[2].unidad = parseInt(precioPorUnidad * this.configuracion.costos.porcentajeReinversion / 100);
            tabla[2].total = parseInt(tabla[2].unidad * cantidad);

            tabla[3].total = parseInt(tabla[3].unidad * cantidad);
            tabla[4].total = parseInt(tabla[4].unidad * cantidad);
            tabla[5].total = parseInt(tabla[5].unidad * cantidad);

            let tbody = "";
            tabla.forEach((fila, index) => {
                tbody += `
                    <tr index="${index}">
                        <td col="detalle" editable="${index > 2 ? "true" : "false"}">${fila.detalle}</td>
                        <td col="unidad" class="text-right" editable="${index > 2 ? "true" : "false"}">${fila.unidad}</td>
                        <td col="total" class="text-right" editable="${index > 2 ? "true" : "false"}">${fila.total}</td>
                    </tr>
                `;
            });
            $("#modal table tbody").html(tbody);

            let sumaCostos = tabla.reduce((acc, fila) => acc + fila.unidad, 0);
            let precioFinal = parseInt(precioPorUnidad * cantidad);
            $("#modal table tfoot tr:eq(0) td:eq(1)").html(utils.formatNumber(sumaCostos));
            $("#modal table tfoot tr:eq(0) td:eq(2)").html(utils.formatNumber(sumaCostos * cantidad));
            $("#modal table tfoot tr:eq(1) td:eq(1)").html(utils.formatNumber(precioPorUnidad));
            $("#modal table tfoot tr:eq(1) td:eq(2)").html(utils.formatNumber(precioFinal));
            $("#modal table tfoot tr:eq(2) td:eq(1)").html(utils.formatNumber(precioPorUnidad - sumaCostos));
            $("#modal table tfoot tr:eq(2) td:eq(2)").html(utils.formatNumber(precioFinal - (sumaCostos * cantidad)));

            $("#modal table tbody td[editable='true']").on("click", async (ev) => {
                let ele = $(ev.currentTarget);
                let tr = ele.closest("tr");
                let index = tr.attr("index");
                let col = ele.attr("col");
                let valorActual = ele.text().trim();
                let prompt = await modal.addPopover({
                    querySelector: ele, 
                    type: "input", 
                    inputType:"text", 
                    value: valorActual, 
                    label: "Ingrese el nuevo valor"
                });
                
                if(prompt === null) return;
                if(col === "unidad" || col === "total") prompt = parseInt(prompt) || 0;
                tabla[index][col] = prompt || "";

                if(col === "total") tabla[index].unidad = parseInt(parseFloat(tabla[index].total) / cantidad);
                if(col === "unidad") tabla[index].total = parseInt(parseFloat(tabla[index].unidad) * cantidad);
                actualizarTabla();
            });
        }

        $("#modal [name='cantidad']").on("change", ev=>{
            calcular(true);
        });

        $("#modal [name='precioPorUnidad'], #modal [name='minutosPorUnidad'], #modal [name='pesoPorUnidad']").on("change", ev=>{
            calcular(true);
        });

        $("#modal [name='precioTotal'], #modal [name='minutosTotales'], #modal [name='pesoTotal']").on("change", ev=>{
            calcular(false);
        });

        $("#modal [name='calcular-horas-a-minutos']").on("click", async ev=>{
            let ele = $(ev.currentTarget);
            let p = await modal.addPopover({
                querySelector: ele, 
                type: "input",
                inputType:"time", 
                label: "Tiempo en formato HH:MM", 
                value: "01:30"
            });
            console.log(p);
            if(!p) return;
            let [horas, minutos] = p.split(":").map(Number);
            let totalMinutos = (horas * 60) + minutos;
            $("#modal [name='minutosTotales']").val(totalMinutos);
            calcular(false);
        });

        actualizarTabla();
    }
}