const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '../../')));

const conexion = mysql.createConnection({
    host: "localhost",
    database: "aeropuerto",
    user: "root",
    password: "porQsoy.batm4n",
    dateStrings: true
});

conexion.connect((err) => {
    if (err) throw err;
    
    conexion.query('SET GLOBAL event_scheduler = ON', (err) => {
        if (err) console.error('Error al activar event_scheduler:', err);
    });
});

conexion.connect(err => {
    if (err) throw err;
    console.log("Conectado a MySQL (aeropuerto)");
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});



// LoOGIN
app.post("/login", (req, res) => {
    const { usuario, password } = req.body;
    const conexionUsuario = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: 'porQsoy.batm4n',
        database: "aeropuerto"
    });

    conexionUsuario.connect((err) => {
        if(err){
            return res.status(401).json({ message: "Credenciales incorrectas"});
        }

        let redirect = "";
        if(usuario === "admin_aerolinea"){
            redirect = "../views/admin/admin.html";
        }
        else if(usuario === "empleado_checkin"){
            redirect = "../views/empleado/empleado.html";
        }
        else if(usuario === "consulta_publica"){
            redirect = "../views/usuario/usuario.html";
        }

        conexionUsuario.end();
        res.json({success: true, redirect});
    });
});

// USUARIO NORMAL
app.get('/viewVuelos', (req, res) => {
    conexion.query('SELECT * FROM vuelos_al_dia', (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});


// EMPLEADO
app.get('/pasajerosRegis', (req, res) => {
    conexion.query('SELECT COUNT(DISTINCT pasaporte) as cantidad FROM pasajeros WHERE activo = 1;', (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/reservacionesActivas', (req, res) => {
    conexion.query('SELECT COUNT(DISTINCT reservacion_id) as cantidad FROM reservaciones r JOIN vuelos v USING(vuelo_id) JOIN aeronaves a USING(aeronave_id) JOIN rutas ru USING(ruta_id) WHERE r.activo = 1 AND v.activo = 1 AND a.activo = 1 AND ru.activo = 1;', (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/reservacionesHoy', (req, res) => {
    conexion.query('SELECT COUNT(DISTINCT reservacion_id) as cantidad FROM reservaciones r JOIN vuelos v USING(vuelo_id) JOIN aeronaves a USING(aeronave_id) JOIN rutas ru USING(ruta_id) WHERE DATE(fecha_reservacion) = CURDATE() AND  r.activo = 1 AND v.activo = 1 AND a.activo = 1 AND ru.activo = 1;', (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/checkInPendientes', (req, res) => {
    conexion.query("SELECT COUNT(DISTINCT reservacion_id) as cantidad FROM reservaciones r JOIN vuelos v USING(vuelo_id) JOIN aeronaves a USING(aeronave_id) JOIN rutas ru USING(ruta_id) WHERE r.estado = 'Pendiente' AND r.activo = 1 AND v.activo = 1 AND a.activo = 1 AND ru.activo = 1;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});


app.get('/cantClientesVIP', (req, res) => {
    conexion.query("SELECT COUNT(*) as cantidad FROM pasajeros_frequentes;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/cantGanancias', (req, res) => {
    conexion.query("SELECT SUM(precio) AS ganancias FROM reservaciones WHERE estado = 'Confirmada' AND DATE(fecha_reservacion) = CURDATE() AND activo=1", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/nacionalidades', (req, res) => {
    conexion.query("SELECT COUNT(DISTINCT nacionalidad) as nacionalidades FROM pasajeros WHERE activo = 1;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});

app.get('/viewPasajeros', (req, res) => {
    conexion.query("SELECT * FROM pasajeros WHERE vuelos_acumulados <11 AND activo = 1;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/viewPasajerosAll', (req, res) => {
    conexion.query("SELECT * FROM pasajeros WHERE activo = 1;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});


app.post('/nuevoPasajero', (req, res) => {
    const { nombre, apellido, fechaNacimiento, nacionalidad, pasaporte, email, telefono, vuelosAcumulados } = req.body;
    const q = `CALL Add_New_Pasajero(?, ?, ?, ?, ?, ?, ?, ?)`;
    conexion.query(q, [nombre, apellido, fechaNacimiento, nacionalidad, pasaporte, email, telefono, vuelosAcumulados], (err, rows) => {
        if (err) {
            console.error(err);
    return res.status(500).json({
        message: err.sqlMessage
    });
        }
        res.json({ message: 'Pasajero agregado exitosamente' });
    });
});
app.post('/editarPasajero', (req, res) => {
    const { pasaporte, nombre, apellido, nacionalidad, telefono, email, vuelosAcumulados } = req.body;
    const q = `CALL Update_Pasajero(?, ?, ?, ?, ?, ?, ?)`;
    conexion.query(q, [pasaporte, nombre, apellido, nacionalidad, telefono, email, vuelosAcumulados], (err, rows) => {
        if (err) {
            console.error(err);
    return res.status(500).json({
        message: err.sqlMessage
    });
        }
        res.json({ message: 'Pasajero modificado exitosamente' });
    });
});

app.get('/clientesVIP', (req, res) => {
    conexion.query("SELECT * FROM pasajeros_frequentes;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});


// ADMIN
app.get('/vuelosHoy', (req, res) => {
    conexion.query('SELECT COUNT(*) as cantidad FROM vuelos_al_dia;', (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/VS', (req, res) => {
    conexion.query(
        `CALL estadisticas_puntualidad();`,
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error' });
            }
            res.json(results[0]);
        }
    );
});
app.get('/tripulacion', (req, res) => {
    conexion.query("SELECT licencia, a.nombre as Aerolinea, t.nombre, t.apellido, t.puesto, fecha_contratacion, horas_vuelo FROM tripulacion t LEFT JOIN aerolineas a USING(aerolinea_id) WHERE t.activo = 1 AND a.activo=1;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
/*
app.get('/aeronavesActivas', (req, res) => {
    conexion.query("SELECT COUNT(*) as cantidad FROM aeronaves WHERE estado = 'Activo';", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});*/
app.get('/enMantenimiento', (req, res) => {
    conexion.query("SELECT * FROM aeronaves_en_mantenimiento;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});



app.get('/cantAerolineas', (req, res) => {
    conexion.query("SELECT COUNT(DISTINCT nombre) as cantidad FROM aerolineas WHERE activo = 1;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/cantPaises', (req, res) => {
    conexion.query("SELECT COUNT(DISTINCT pais_origen) as cantidad FROM aerolineas WHERE activo=1;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/cantAeronaves', (req, res) => {
    conexion.query("SELECT COUNT(*) as cantidad FROM aeronaves a JOIN aerolineas ae USING (aerolinea_id) WHERE a.activo=1 AND ae.activo=1;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});

app.get('/aerolineas', (req, res) => {
    conexion.query("SELECT * FROM aerolineas WHERE activo = 1;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.post('/eliminarAerolinea', (req, res) => {
    const { aerolinea_id } = req.body;
    const q = `UPDATE aerolineas SET activo = 0 WHERE aerolinea_id = ?`;
    conexion.query(q, [ aerolinea_id ], (err, rows) => {
        if (err) {
            console.error(err);
    return res.status(500).json({
        message: err.sqlMessage
    });
        }
        res.json({ message: 'Aerolínea eliminada exitosamente' });
    });
});
app.post('/eliminarAeronave', (req, res) => {
    const { aeronave_id } = req.body;
    const q = `UPDATE aeronaves SET activo = 0 WHERE aeronave_id = ?`;
    conexion.query(q, [ aeronave_id ], (err, rows) => {
        if (err) {
            console.error(err);
    return res.status(500).json({
        message: err.sqlMessage
    });
        }
        res.json({ message: 'Aerolínea eliminada exitosamente' });
    });
});
app.post('/eliminarRuta', (req, res) => {
    const { ruta_id } = req.body;
    const q = `UPDATE rutas SET activo = 0 WHERE ruta_id = ?`;
    conexion.query(q, [ ruta_id ], (err, rows) => {
        if (err) {
            console.error(err);
    return res.status(500).json({
        message: err.sqlMessage
    });
        }
        res.json({ message: 'Aerolínea eliminada exitosamente' });
    });
});
app.post('/eliminarReservacion', (req, res) => {
    const { reservacion_id } = req.body;
    const q = `UPDATE reservaciones SET activo = 0 WHERE reservacion_id = ?`;
    conexion.query(q, [ reservacion_id ], (err, rows) => {
        if (err) {
            console.error(err);
    return res.status(500).json({
        message: err.sqlMessage
    });
        }
        res.json({ message: 'Reserva eliminada exitosamente' });
    });
});
app.post('/eliminarPasajero', (req, res) => {
    const { pasaporte } = req.body;
    const q = `UPDATE pasajeros SET activo = 0 WHERE pasaporte = ?`;
    conexion.query(q, [ pasaporte ], (err, rows) => {
        if (err) {
            console.error(err);
    return res.status(500).json({
        message: err.sqlMessage
    });
        }
        res.json({ message: 'pasajero eliminado exitosamente' });
    });
});
/*
app.delete('/aerolineas/:id', (req, res) => {
    const id = req.params.id;
    conexion.query('DELETE FROM aerolineas WHERE aerolinea_id = ?', [id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json({ message: 'Aerolínea eliminada exitosamente' });
    });
});
*/
app.post('/editarAerolinea', (req, res) => {
    const { id, nombre, codigo_IATA, pais_origen, fecha_fundacion, sitio_web } = req.body;
    const q = `CALL update_aerolineas(?, ?, ?, ?, ?, ?)`;
    conexion.query(q, [id, nombre, codigo_IATA, pais_origen, fecha_fundacion, sitio_web], (err, rows) => {
        if (err) {
            console.error(err);
    return res.status(500).json({
        message: err.sqlMessage
    });
        }
        res.json({ message: 'Aerolínea modificada exitosamente' });
    });
});
app.post('/nuevaAerolinea', (req, res) => {
    const { nombre, codigo_IATA, pais_origen, fecha_fundacion, sitio_web } = req.body;
    const q = `CALL add_new_aerolinea( ?, ?, ?, ?, ?)`;
    conexion.query(q, [nombre, codigo_IATA, pais_origen, fecha_fundacion, sitio_web], (err, rows) => {
        if (err) {
            console.error(err);
    return res.status(500).json({
        message: err.sqlMessage
    });
        }
        res.json({ message: 'Aerolínea creada exitosamente' });
    });
});

app.get('/aeronavesActivas', (req, res) => {
    conexion.query("SELECT * FROM aeronaves_activas;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});

app.get('/aeronavesNoActivas', (req, res) => {
    conexion.query("SELECT * FROM aeronaves_no_activas;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.post('/editarAeronave', (req, res) => {
    const { aeronave_id, modelo, cap_pasajeros, cap_carga, fabrication, ult_mant, estado } = req.body;
    const q = `CALL update_aeronave(?, ?, ?, ?, ?, ?, ?)`;
    conexion.query(q, [aeronave_id, modelo, cap_pasajeros, cap_carga, fabrication, ult_mant, estado], (err, rows) => {
        if (err) {
            console.error(err);
    return res.status(500).json({
        message: err.sqlMessage
    });
        }
        res.json({ message: 'Aerolínea modificada exitosamente' });
    });
});
app.post('/nuevaPlane', (req, res) => {
    console.log('req.body');
    const { aerolinea_id, modelo, cap_carga, cap_pasajeros, fabrication, estado, ult_mant } = req.body;
    const q = `CALL add_new_aeronave( ?, ?, ?, ?, ?, ?, ?)`;
    conexion.query(q, [aerolinea_id, modelo, cap_carga, cap_pasajeros, fabrication, estado, ult_mant], (err, rows) => {
        if (err) {
            console.error(err);
    return res.status(500).json({
        message: err.sqlMessage
    });
        }
        res.json({ message: 'Aerolínea creada exitosamente' });
    });
});


app.get('/rutas', (req, res) => {
    conexion.query("SELECT * FROM rutas WHERE activo=1;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.post('/editarRutas', (req, res) => {
    const { ruta_id, aeropuerto_origen, aeropuerto_destino, distancia_km, tiempo_estimado_min } = req.body;
    const q = `CALL update_rutas(?, ?, ?, ?, ?)`;
    conexion.query(q, [ruta_id, aeropuerto_origen, aeropuerto_destino, distancia_km, tiempo_estimado_min ], (err, rows) => {
        if (err) {
            console.error(err);
    return res.status(500).json({
        message: err.sqlMessage
    });
        }
        res.json({ message: 'Ruta modificada exitosamente' });
    });
});
app.post('/nuevaRuta', (req, res) => {
    const { origen, destino, distancia, tiempo } = req.body;
    const q = `CALL create_ruta(?, ?, ?, ?)`;
    conexion.query(q, [origen, destino, distancia, tiempo ], (err, rows) => {
        if (err) {
            console.error(err);
    return res.status(500).json({
        message: err.sqlMessage
    });
        }
        res.json({ message: 'Ruta creada exitosamente' });
    });
});

app.post('/editarTripulante', (req, res) => {
    const { licencia, nombre, apellido, puesto, fecha_contratacion, horas_vuelo } = req.body;
    const q = `CALL update_tripulante(?, ?, ?, ?, ?, ?)`;
    conexion.query(q, [ licencia, nombre, apellido, puesto, fecha_contratacion, horas_vuelo ], (err, rows) => {
        if (err) {
            console.error(err);
    return res.status(500).json({
        message: err.sqlMessage
    });
        }
        res.json({ message: 'Tripulante modificada exitosamente' });
    });
});




// IOSH
app.get('/Vuelos_info', (req, res) =>{
    conexion.query('SELECT * FROM vuelo_linea', (err, rows) =>{
        if(err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/Vuelos_info_hoy', (req, res)=>{
    conexion.query('SELECT * FROM vuelo_linea_hoy', (err, rows)=>{
        if(err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    })
})
app.get('/VuelosRetrasados', (req, res) => {
    conexion.query('SELECT COUNT(*) as vuelos FROM vuelos WHERE estado = "Retrasado" AND activo =1 AND fecha_salida >= CURRENT_TIMESTAMP()', (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/VuelosProgramados', (req, res) => {
    conexion.query('SELECT COUNT(*) as vuelos FROM vuelos WHERE estado = "Programado" AND activo =1 AND fecha_salida >= CURRENT_TIMESTAMP()', (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/VuelosCancelados', (req, res) => {
    conexion.query('SELECT COUNT(*) as vuelos FROM vuelos WHERE estado = "Cancelado" AND fecha_salida >= CURRENT_TIMESTAMP() AND activo =1', (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/VuelosCompletados', (req, res) => {
    conexion.query('SELECT COUNT(*) as vuelos FROM vuelos WHERE estado = "Completado" AND fecha_llegada_real <= CURRENT_TIMESTAMP AND activo=1', (err, rows) => {
        if (err) return err.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});

// app.get('/VuelosHoy', (req, res)=>{
//     conexion.query('SELECT COUNT(*) as vuelos FROM vuelos WHERE DATE(fecha_salida) = CURDATE()', (err, rows) =>{
//         if(err) return err.status(500).json({ message: 'Error' });
//         res.json(rows);
//     });
// });


// EMPLEADO
app.get('/viewReservacion', (req, res) => {
    conexion.query("SELECT * FROM reservacion_ruta;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/reservacionesTotales', (req, res) => {
    conexion.query("SELECT COUNT(DISTINCT reservacion_id) as cantidad FROM reservaciones r JOIN vuelos v USING(vuelo_id) JOIN aeronaves a USING(aeronave_id) JOIN rutas ru USING(ruta_id) WHERE r.activo = 1 AND v.activo = 1 AND a.activo = 1 AND ru.activo = 1;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/reservacionesPagadas', (req, res) => {
    conexion.query("SELECT COUNT(DISTINCT reservacion_id) as cantidad FROM reservaciones r JOIN vuelos v USING(vuelo_id) JOIN aeronaves a USING(aeronave_id) JOIN rutas ru USING(ruta_id) WHERE r.estado = 'Confirmada' AND r.activo = 1 AND v.activo = 1 AND a.activo = 1 AND ru.activo = 1;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/reservacionesPendientes', (req, res) => {
    conexion.query("SELECT COUNT(DISTINCT reservacion_id) as cantidad FROM reservaciones r JOIN vuelos v USING(vuelo_id) JOIN aeronaves a USING(aeronave_id) JOIN rutas ru USING(ruta_id) WHERE r.estado = 'Pendiente' AND r.activo = 1 AND v.activo = 1 AND a.activo = 1 AND ru.activo = 1;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/reservacionesCanceladas', (req, res) => {
    conexion.query("SELECT COUNT(DISTINCT reservacion_id) as cantidad FROM reservaciones r JOIN vuelos v USING(vuelo_id) JOIN aeronaves a USING(aeronave_id) JOIN rutas ru USING(ruta_id) WHERE r.estado = 'Cancelada' AND r.activo = 1 AND v.activo = 1 AND a.activo = 1 AND ru.activo = 1;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.post('/nuevaReservacion', (req, res) => {
    const { pasajero_id, vuelo_id, clase, asiento, metodo_pago, total } = req.body;

    if (!pasajero_id || !vuelo_id || !asiento || !total) {
        return res.status(400).json({ message: 'Faltan campos requeridos' });
    }
    // Verificacion de asiento
    conexion.query("SELECT * FROM reservaciones WHERE vuelo_id = ? AND asiento = ?", [vuelo_id, asiento], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error al verificar asiento' });
        }
        if (rows.length > 0) {
            return res.status(400).json({ message: 'Asiento ya reservado para este vuelo' });
        }
        
        // Si no está reservado, insertar la reservación
        const q = `CALL ingresar_reservacion(?, ?, ?, ?, ?, ?)`;
        conexion.query(q, [pasajero_id, vuelo_id, clase, asiento, total, metodo_pago], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: err.sqlMessage });
            }
            //Insercion para evento 
            conexion.query(
                `SELECT DATE_FORMAT(DATE_SUB(fecha_salida, INTERVAL 1 DAY), '%Y-%m-%d %H:%i:00') AS fecha_checkin 
                FROM vuelos WHERE vuelo_id = ?`, 
            [vuelo_id], (err, rows) => {
                console.log('vuelo_id para check_in:', vuelo_id); 
                console.log('fecha_checkin:', rows?.[0]?.fecha_checkin); 
                if (err || rows.length === 0) return res.json({ message: 'Reservación creada exitosamente' });
                
                const fecha = rows[0].fecha_checkin; // ya viene como "2026-07-14 10:00:00"
                const eventoSQL = `CREATE EVENT IF NOT EXISTS check_in_${vuelo_id}
                    ON SCHEDULE AT '${fecha}'
                    DO UPDATE reservaciones SET estado = 'Confirmada' WHERE vuelo_id = ${vuelo_id}`;
                
                conexion.query(eventoSQL, (err2) => {
                    if (err2) console.error('Error al crear evento:', err2);
                    res.json({ message: 'Reservación creada exitosamente' });
                });
            });
        });
    });
});

app.post('/editarReservacion', (req, res) => {

    const { reservacion_id, pasajero_id, vuelo_id, clase, asiento, total, estado } = req.body;

    conexion.query("SELECT * FROM reservaciones WHERE vuelo_id = ? AND asiento = ? AND reservacion_id != ?", [vuelo_id, asiento, reservacion_id], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error al verificar asiento' });
        }
        if (rows.length > 0) {
            return res.status(400).json({ message: 'Asiento ya reservado para este vuelo' });
        }

        const q = `CALL Check_in_reservacion(?, ?, ?, ?, ?, ?, ?)`;
        conexion.query(q, [reservacion_id, pasajero_id, vuelo_id, clase, asiento, total, estado], (err) => {
            if (err) return res.status(500).json({ message: err.sqlMessage });
            res.json({ message: 'Reservación actualizada exitosamente' }); 
        });
    });
});
app.get('/obtenerPasajeros', (req, res) => {
    conexion.query("SELECT pasajero_id, nombre, apellido FROM pasajeros WHERE activo=1 ORDER BY nombre ASC;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});

app.get('/obtenerVuelos', (req, res) => {
    const q = `SELECT v.vuelo_id, a.codigo_IATA, r.aeropuerto_origen, r.aeropuerto_destino, v.fecha_salida
    FROM vuelos AS v
    JOIN aerolineas AS a ON v.aerolinea_id = a.aerolinea_id
    JOIN rutas AS r ON v.ruta_id = r.ruta_id
    JOIN aeronaves AS ae USING (aeronave_id)
    WHERE v.fecha_salida >= NOW() AND v.activo = 1 AND a.activo=1 AND r.activo=1 AND ae.activo=1
    ORDER BY v.fecha_salida ASC`;
    conexion.query(q, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});



app.get('/Vuelos_info', (req, res) =>{
    conexion.query('SELECT * FROM vuelo_linea', (err, rows) =>{
        if(err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/VuelosRetrasados', (req, res) => {
    conexion.query('SELECT COUNT(*) as vuelos FROM vuelos WHERE estado = "Retrasado"', (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/VuelosProgramados', (req, res) => {
    conexion.query('SELECT COUNT(*) as vuelos FROM vuelos WHERE estado = "Programado"', (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/VuelosCancelados', (req, res) => {
    conexion.query('SELECT COUNT(*) as vuelos FROM vuelos WHERE estado = "Cancelado"', (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});
app.get('/VuelosCompletados', (req, res) => {
    conexion.query('SELECT COUNT(*) as vuelos FROM vuelos WHERE estado = "Completado"', (err, rows) => {
        if (err) return err.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});/*
app.get('/VuelosHoy', (req, res)=>{
    conexion.query('SELECT COUNT(*) as vuelos FROM vuelos WHERE DATE(fecha_salida) = CURDATE()', (err, rows) =>{
        if(err) return err.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});*/


app.post('/nuevoVuelo', (req, res) => {
    const { aerolinea_id, ruta_id, aeronave_id, fecha_salida, puerta_embarque, asientos_disponibles } = req.body;
    if (!aerolinea_id || !ruta_id || !aeronave_id || !fecha_salida  || !puerta_embarque || !asientos_disponibles) {
        return res.status(400).json({ message: 'Faltan datos para crear el vuelo' });
    }

    const q = `CALL insertar_vuelo(?, ?, ?, ?, ?, ?, @msg)`;
    conexion.query(q, [aerolinea_id, ruta_id, aeronave_id, fecha_salida, puerta_embarque, asientos_disponibles], (err) => {
        if (err) return res.status(500).json({ message: err.sqlMessage || 'Error al crear el vuelo' });

        conexion.query('SELECT @msg AS message', (err2, rows) => {
            if (err2) return res.status(500).json({ message: 'Error al leer resultado' });

            const msg = rows[0].message;
            if (msg === 'Cancelado') {
                return res.status(400).json({ message: 'Fechas inválidas, el vuelo no fue creado' });
            }

            const qu = `CALL asignar_tripulacion(?, ?)`;
            conexion.query(qu, [fecha_salida, ruta_id], (err3) => {
                if (err3) {
                    console.error('Error al asignar tripulación:', err3);
                    return res.json({ message: 'Vuelo creado pero sin tripulación asignada' });
                }
                res.json({ message: 'Vuelo creado exitosamente' });
            });
        });
    });
});

app.get('/tripulacion_dentro/:vuelo_id', (req, res)=>{
    const { vuelo_id } = req.params;
    console.log(vuelo_id);
    const q =`SELECT t.empleado_id, t.nombre, t.apellido, t.puesto, tv.rol FROM tripulacion_vuelo AS tv
              JOIN tripulacion AS t ON t.empleado_id = tv.empleado_id
              WHERE tv.vuelo_id = ?`;
    conexion.query(q, [vuelo_id], (err, result)=>{
        if(err) return res.status(500).json({ message: err.sqlMessage});
        res.json(result);
    })
})
app.post('/editarVuelo', (req, res) =>{
    console.log('editarVuelo body:', req.body);
    const { vuelo_id, aerolinea_id, ruta_id, aeronave_id, fecha_salida, fecha_llegada, puerta_embarque, asientos_disponibles } = req.body;
    if(!vuelo_id || !aerolinea_id || !ruta_id || !aeronave_id || !fecha_salida || !fecha_llegada || !puerta_embarque || !asientos_disponibles){
        return res.status(400).json({ message: 'Faltan datos para modificar el vuelo'});
    }
    const q = 'CALL editar_vuelos(?, ?, ?, ?, ?, ?, ?, ?);';
    conexion.query(q, [vuelo_id, aerolinea_id, ruta_id, aeronave_id, fecha_salida, fecha_llegada, puerta_embarque, asientos_disponibles], (err, result) =>{
        if(err) return res.status(500).json({ message: err.sqlMessage || 'Error al editar vuelo'});
        res.json({ message: 'Vuelo editado correctamente', vuelo_id });
    });
});
app.post('/borrarVuelo', (req, res) =>{
    const { vuelo_id } = req.body;
    if(!vuelo_id){
        return res.status(400).json({ message: 'Faltan datos para elimina el vuelo lol'});
    }
    const q = `UPDATE vuelos SET activo = 0 WHERE vuelo_id = ?;`;
    conexion.query(q, [vuelo_id], (err, result) =>{
        if(err) return res.status(500).json({ message: err.sqlMessage || 'Error al editar vuelo'});
        res.json({ message: 'Vuelo eliminado correctamente', vuelo_id });
    });
});
app.get('/obtenerAerolineas', (req, res) => {
    conexion.query("SELECT aerolinea_id, nombre FROM aerolineas WHERE activo = 1 ORDER BY nombre ASC ;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});

app.get('/obtenerRutas', (req, res) => {
    conexion.query("SELECT ruta_id, aeropuerto_origen, aeropuerto_destino FROM rutas WHERE activo = 1 ORDER BY aeropuerto_origen ASC;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});

app.get('/obtenerAeronaves', (req, res) => {
    conexion.query("SELECT aeronave_id, modelo FROM aeronaves WHERE activo = 1 ORDER BY modelo ASC;", (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(rows);
    });
});