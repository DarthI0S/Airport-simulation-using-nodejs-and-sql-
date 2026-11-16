const viewVuelos = document.getElementById("vuelos");
const vuelosHoy = document.getElementById("vuelosHoy");
const vuelosRetrasados = document.getElementById("vuelosRetrasados");
const vuelosProgramados = document.getElementById("vuelosProgramados");
const vuelosCompletados = document.getElementById("vuelosCompletados");
const formEditarVuelo = document.getElementById("editarVuelo");
const selectAerolinea = document.getElementById("selectAerolinea");
const selectRuta = document.getElementById("selectRuta");
const selectAeronave = document.getElementById("selectAeronave");
const selectPuerta = document.getElementById("selectPuerta");
const fechaSalida = document.getElementById("fechaSalida");
const horaSalida = document.getElementById("horaSalida");
const fechaLlegada = document.getElementById("fechaLlegada");
const horaLlegada = document.getElementById("horaLlegada");

let vuelos = [];


function getVuelosRetrasados() {
    fetch('/VuelosRetrasados')
    .then(res => {
        if (!res.ok) throw new Error("Error al obtener vuelos retrasados");
        return res.json();
    })
    .then(data => {
        vuelosRetrasados.textContent = data[0].vuelos;
    })
    .catch(console.error);
}
function getVuelosHoy(){
    fetch('/VuelosHoy')
    .then(res =>{
        if(!res.ok) throw new Error("Error al obtener los vuelos de hoy");
        return res.json();
    })
    .then(data =>{
        vuelosHoy.textContent = data[0].cantidad;
    })
}
function getVuelosProgramados() {
    fetch('/VuelosProgramados')
    .then(res => {
        if (!res.ok) throw new Error("Error al obtener vuelos programados");
        return res.json();
    })
    .then(data => {
        console.log(data);
        vuelosProgramados.textContent = data[0].vuelos;
    })
    .catch(console.error);
}
function getVuelosCompletados(){
    fetch('/VuelosCompletados')
    .then(res => {
        if(!res.ok) throw new Error("Error al obtener vuelos completados");
        return res.json();
    })
    .then(data =>{
        vuelosCompletados.textContent = data[0].vuelos;
    })
    .catch(console.error);
}

function eliminarVuelo(vuelo_id){
    fetch('/borrarVuelo',{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            vuelo_id: vuelo_id
        })
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(errData => {
                throw new Error(errData.message || 'Error desconocido');
            }).catch(() => {
                throw new Error('Error en el servidor (500) - respuesta no es JSON');
            });
        }
        return res.json();
    })
    .then(data => {
        alert(data.message || 'Vuelo eliminado correctamente');
        getViewVuelos();
    })
    .catch(err => {
        alert('Error: ' + err.message); 
        console.error("Error capturado:", err);
    });
    getVuelosRetrasados();
    getVuelosProgramados(); 
    getVuelosCompletados();
}


function cargarAerolineas(){
    fetch('/obtenerAerolineas')
    .then(res =>{
        if (!res.ok) throw new Error('Error al obtener aerolíneas');
        return res.json();
    })
    .then(data => {
        selectAerolinea.innerHTML = '<option value="">Seleccionar Aerolínea</option>';
        data.forEach(aerolinea => {
            const option = document.createElement('option');
            option.value = aerolinea.aerolinea_id;
            option.textContent = aerolinea.nombre;
            selectAerolinea.appendChild(option);
        });
    })
    .catch(err => console.error('Error:', err));
}

function cargarRutas(){
    fetch('/obtenerRutas')
    .then(res => {
        if (!res.ok) throw new Error('Error al obtener rutas');
        return res.json();
    })
    .then(data => {
        selectRuta.innerHTML = '<option value="">Seleccionar Ruta</option>';
        data.forEach(ruta => {
            const option = document.createElement('option');
            option.value = ruta.ruta_id;
            option.textContent = `${ruta.aeropuerto_origen} → ${ruta.aeropuerto_destino}`;
            option.dataset.origen = ruta.aeropuerto_origen;
            option.dataset.destino = ruta.aeropuerto_destino;
            selectRuta.appendChild(option);
        });
    })
    .catch(err => console.error('Error:', err));
}

function cargarAeronaves() {
    fetch('/obtenerAeronaves')
    .then(res => {
        if (!res.ok) throw new Error('Error al obtener aeronaves');
        return res.json();
    })
    .then(data => {
        selectAeronave.innerHTML = '<option value="">Seleccionar Aeronave</option>';
        data.forEach(aeronave => {
            const option = document.createElement('option');
            option.value = aeronave.aeronave_id;
            option.textContent = aeronave.modelo;
            selectAeronave.appendChild(option);
        });
    })
    .catch(err => console.error('Error:', err));
}

function cargarPuertas() {
    const puertas = ['A1','A2','A3','B1', 'B2'];
    selectPuerta.innerHTML = '<option value="">Seleccionar Puerta</option>';
    puertas.forEach(puerta => {
        const option = document.createElement('option');
        option.value = puerta;
        option.textContent = puerta;
        selectPuerta.appendChild(option);
    });
}

function parseDateTimeValue(value) {
    if (!value) return { date: '', time: '' };
    let normalized = value.toString().trim();
    normalized = normalized.replace('T', ' ').replace('Z', '');
    const [date, time] = normalized.split(' ');
    return {
        date: date || '',
        time: time ? time.slice(0, 5) : ''
    };
}


function renderVuelos(datos, soloHora = false) {
    viewVuelos.innerHTML = "";
    if (!datos || datos.length === 0) {
        viewVuelos.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; height:100%;">
            <p>No hay vuelos disponibles.</p>
        </div>`;
        return;
    }
    datos.forEach(vuelo => {
        const db = new Date(vuelo.fecha_salida.replace('Z', '').replace('T', ' ')); //date begin
        const de = new Date(vuelo.fecha_llegada.replace('Z', '').replace('T', ' ')); //date end


        const opcionesFecha = soloHora 
            ? { hour: "2-digit", minute: "2-digit" }
            : { day: '2-digit', month: '2-digit', year: 'numeric', hour: "2-digit", minute: "2-digit" };

        const salida = isNaN(db) ? '' : db.toLocaleDateString('es-MX', opcionesFecha);
        const llegada = isNaN(de) ? '' : de.toLocaleDateString('es-MX', opcionesFecha);
       
        // const salida = new Date(vuelo.fecha_salida).toLocaleTimeString("es-MX", {hour: "2-digit", minute: "2-digit"});
        // const llegada = new Date(vuelo.fecha_llegada).toLocaleTimeString("es-MX", {hour: "2-digit", minute: "2-digit"});
        const nombre = vuelo.nombre;
        const vuelo_id = vuelo.vuelo_id;
        const asientos = vuelo.asientos_disponibles;
        const puerta = vuelo.puerta || '';
        const llegadaRaw = vuelo.fecha_llegada || '';
        

        console.log(vuelo.modelo);

        viewVuelos.innerHTML += `
        <tr>
            <td>${nombre}</td>
            <td>${vuelo.origen} -> ${vuelo.destino}</td>
            <td>${vuelo.aeronave}</td>  
            <td>${salida}</td>
            <td>${llegada}</td>
            <td>${asientos}</td>
            <td>${puerta}</td>
            <td>
                <span class="status ${vuelo.estado === "Aterrizado" ? "aterrizado" : vuelo.estado === "Cancelado" ? "cancelado" : vuelo.estado === "Retrasado" ? "retrasado" : "programado"}">
                    ${vuelo.estado}
                </span>
            </td>
                <td>
                <button class="btn-edit" onclick="abrirEditor(
                '${vuelo.vuelo_id}',
                '${vuelo.aerolinea_id}',
                '${vuelo.ruta_id}',
                '${vuelo.aeronave_id}',
                '${vuelo.fecha_salida}',
                '${vuelo.fecha_llegada_real || vuelo.fecha_llegada || ''}',
                '${puerta}',
                '${asientos}'
                )">
                    <i class="fa-solid fa-pen"></i>
                </button>
            
                <button class="btn-delete" onclick="eliminarVuelo(
                '${vuelo.vuelo_id}')">
                    <i class="fa-solid fa-trash"></i>
                </button> 
                <button class="btn-maintenance" onclick="abrirTripulacion('${vuelo.vuelo_id}')">
                    <i class="fa-solid fa-user"></i>
                </button>
            </td>
        </tr>
        `;
    });
}


function getViewVuelos() {
    fetch(`/Vuelos_info`)
    .then(res => {
        if (!res.ok) throw new Error("Error al obtener vuelos");
        return res.json();
    })
    .then(data => {
        renderVuelos(data, false);
    })
    .catch(console.error);
}
function getViewVuelosHoy() {
    fetch(`/Vuelos_info_hoy`)
    .then(res => {
        if (!res.ok) throw new Error("Error al obtener vuelos");
        return res.json();
    })
    .then(data => {
        renderVuelos(data, true);
    })
    .catch(console.error);
}


// getViewVuelos();
getViewVuelosHoy();
getVuelosHoy();
getVuelosRetrasados();
getVuelosProgramados(); 
getVuelosCompletados();

cargarAerolineas();
cargarRutas();
cargarAeronaves();
cargarPuertas();

function abrirTripulacion(vuelo_id){
    document.getElementById("panelTripulacion").classList.add('active');
    fetch(`/tripulacion_dentro/${vuelo_id}`)
 .then(res => res.json())
    .then(data => {

        ['Piloto', 'Copiloto', 'Azafata1', 'Azafata2', 'Azafata3'].forEach(id => {
            document.getElementById(id).innerHTML = '<option value="">Sin asignar</option>';
        });

        let sobrecargos = 0;
        data.forEach(miembro => {
            const option = `<option value="${miembro.empleado_id}" selected>
                ${miembro.nombre} ${miembro.apellido}
            </option>`;

            if (miembro.puesto === 'Piloto') {
                document.getElementById('Piloto').innerHTML += option;
            } else if (miembro.puesto === 'Copiloto') {
                document.getElementById('Copiloto').innerHTML += option;
            } else if (miembro.puesto === 'Sobrecargo') {
                sobrecargos++;
                document.getElementById(`Azafata${sobrecargos}`).innerHTML += option;
            }
        });
    })
    .catch(err => console.error(err));
}

function abrirEditor(vuelo_id, alinea_id, ruta_id, anave_id, fecha_salida, fecha_llegada, puerta, asientos){
    document.getElementById('panelVuelo').classList.add('active');

    console.log("id:", vuelo_id);
    console.log("alinea:", alinea_id);  
    console.log("ruta_id:", ruta_id);
    console.log("nave:", anave_id);
    console.log("fecha_salida:", fecha_salida);
    console.log("fecha_llegada:", fecha_llegada);
    console.log("puerta:", puerta);
    console.log("asientos:", asientos);

    document.getElementById('vuelo_id').value = vuelo_id || '';
    document.getElementById('aerolinea_id').value = alinea_id || '';
    document.getElementById('ruta_id').value = ruta_id || '';
    document.getElementById('aeronave_id').value = anave_id || '';
    selectAerolinea.value = alinea_id || '';
    selectRuta.value = ruta_id || '';
    selectAeronave.value = anave_id || '';
    selectPuerta.value = puerta || '';

    const salidaValues = parseDateTimeValue(fecha_salida);
    fechaSalida.value = salidaValues.date;
    horaSalida.value = salidaValues.time;

    const llegadaValues = parseDateTimeValue(fecha_llegada);
    fechaLlegada.value = llegadaValues.date;
    horaLlegada.value = llegadaValues.time;

    document.getElementById('asientos').value = asientos || '';
}

formEditarVuelo.addEventListener('submit', (e) =>{
    e.preventDefault();

    const vuelo_id = document.getElementById("vuelo_id").value;
    
    const selectedAerolinea = selectAerolinea.value;
    const selectedRuta = selectRuta.value;
    const selectedAeronave = selectAeronave.value;
    const selectedPuerta = selectPuerta.value;
    const asientos = document.getElementById("asientos").value;

    const salidaFecha = fechaSalida.value;
    const salidaHora = horaSalida.value;
    const llegadaFecha = fechaLlegada.value;
    const llegadaHora = horaLlegada.value;

    const fecha_salida = salidaFecha && salidaHora ? `${salidaFecha} ${salidaHora}:00` : null;
    const fecha_llegada = llegadaFecha && llegadaHora ? `${llegadaFecha} ${llegadaHora}:00` : null;

    if (!vuelo_id || !selectedAerolinea || !selectedRuta || !selectedAeronave || !fecha_salida || !fecha_llegada || !selectedPuerta || !asientos) {
        alert('Por favor completa todos los campos requeridos para editar el vuelo');
        return;
    }

    fetch('/editarVuelo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            vuelo_id: vuelo_id,
            aerolinea_id: selectedAerolinea,
            ruta_id: selectedRuta,
            aeronave_id: selectedAeronave,
            fecha_salida: fecha_salida,
            fecha_llegada: fecha_llegada,
            puerta_embarque: selectedPuerta,
            asientos_disponibles: Number(asientos)
        })
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(errData => {
                throw new Error(errData.message || 'Error desconocido');
            }).catch(() => {
                throw new Error('Error en el servidor (500) - respuesta no es JSON');
            });
        }
        return res.json();
    })
    .then(data => {
        alert(data.message || 'Vuelo editado correctamente');
        getViewVuelos();
        document.getElementById('panelVuelo').classList.remove('active'); 
    })
    .catch(err => {
        alert('Error: ' + err.message); 
        console.error("Error capturado:", err);
    });
    getVuelosRetrasados();
    getVuelosProgramados(); 
    getVuelosCompletados();
});