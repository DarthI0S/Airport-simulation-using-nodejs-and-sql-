USE aeropuerto;

SET SQL_SAFE_UPDATES = 0;

SHOW GRANTS FOR 'admin_aerolinea'@'localhost';
SHOW GRANTS FOR 'empleado_checkin'@'localhost';
SHOW GRANTS FOR 'consulta_publica'@'localhost';

SELECT * FROM mysql.user;
SELECT * FROM pasajeros;
SELECT * FROM aerolineas;
SELECT * FROM tripulacion;
SELECT * FROM reservaciones;
SELECT * FROM vuelos;
SELECT * FROM rutas;
SELECT * FROM aeronaves;

SELECT * FROM vuelos_al_dia;
SELECT * FROM aeronaves_en_mantenimiento;
SELECT * FROM aeronaves_activas;
SELECT * FROM aeronaves_no_activas;
DROP VIEW aeronaves_no_activas;



DELIMITER $$
CREATE PROCEDURE update_tripulante(
	IN p_licencia INT, 
	IN p_nombre VARCHAR(50), 
    IN p_apellido VARCHAR(50), 
    IN p_puesto VARCHAR(50),
    IN p_fecha_contratacion DATE,
    IN p_horas_vuelo INT    
)
BEGIN
	IF p_licencia IS NULL OR p_licencia = '' OR p_nombre IS NULL OR p_nombre = '' OR p_apellido IS NULL OR p_puesto IS NULL OR p_fecha_contratacion IS NULL OR p_horas_vuelo IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Todos los campos obligatorios deben ser proporcionados';
    END IF;
	
    IF (SELECT COUNT(*) FROM tripulacion WHERE 
		licencia = p_licencia
		AND nombre = p_nombre
		AND apellido = p_apellido
		AND activo = 1) > 0 THEN
			SIGNAL SQLSTATE '45000'
			SET MESSAGE_TEXT = 'Ya existe un tripulante con los mismos datos';
	END IF;
    
    IF horas_vuelo <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Las horas de vuelo deben ser mayor que cero';
    END IF;

    IF fecha_contratacion > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La fecha de contratacion no puede ser mayor a hoy';
    END IF;
    
	UPDATE tripulacion SET 
	aeropuerto_origen = p_nombre, 
	aeropuerto_destino = p_apellido, 
	distancia_km = p_distancia_km, 
	tiempo_estimado_min = p_puesto,
	fecha_contratacion = p_fecha_contratacion,
	horas_vuelo = p_horas_vuelo
	WHERE licencia = p_licencia;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE create_tripulante(
	IN p_licencia INT, 
    IN p_aerolinea_id INT, 
	IN p_nombre VARCHAR(50), 
    IN p_apellido VARCHAR(50), 
    IN p_puesto VARCHAR(50),
    IN p_fecha_contratacion DATE,
    IN p_horas_vuelo INT    
)
BEGIN
	IF p_licencia IS NULL OR p_licencia = '' OR p_nombre IS NULL OR p_nombre = '' OR p_apellido IS NULL OR p_puesto IS NULL OR p_fecha_contratacion IS NULL OR p_horas_vuelo IS NULL OR p_aerolinea_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Todos los campos obligatorios deben ser proporcionados';
    END IF;
	
    IF (SELECT COUNT(*) FROM tripulacion WHERE 
		licencia = p_licencia
		AND nombre = p_nombre
		AND apellido = p_apellido
		AND activo = 1) > 0 THEN
			SIGNAL SQLSTATE '45000'
			SET MESSAGE_TEXT = 'Ya existe un tripulante con los mismos datos';
	END IF;
    
    IF (SELECT COUNT(*) FROM aerolineas WHERE aerolinea_id = p_aerolinea_id AND activo = 0) > 0 THEN
		SIGNAL SQLSTATE '45000'
		SET MESSAGE_TEXT = 'La aerolínea no existe';
	END IF;
    
    IF horas_vuelo <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Las horas de vuelo deben ser mayor que cero';
    END IF;

    IF fecha_contratacion > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La fecha de contratacion no puede ser mayor a hoy';
    END IF;
    
	INSERT INTO tripulacion (aerolinea_id, licencia, nombre, apellido, puesto, fecha_contratacion, horas_vuelo) VALUES
	(p_aerolinea_id, p_licencia, p_nombre, p_apellido, p_puesto, p_fecha_contratacion, p_horas_vuelo);
END$$
DELIMITER ;








DELIMITER $$
CREATE PROCEDURE asignar_tripulacion (IN in_fecha_vuelo TIMESTAMP, IN in_ruta_id INT) 
BEGIN
    DECLARE v INT;
    DECLARE fecha_s TIMESTAMP;
    DECLARE fecha_l TIMESTAMP;
    DECLARE aerolinea INT;
    
    DECLARE piloto_id INT DEFAULT NULL;
    DECLARE copiloto_id INT DEFAULT NULL;
    DECLARE azafata1_id INT DEFAULT NULL;
    DECLARE azafata2_id INT DEFAULT NULL;
    DECLARE azafata3_id INT DEFAULT NULL;
    
    SELECT vuelo_id INTO v
    FROM vuelos
    WHERE ruta_id = in_ruta_id 
    AND fecha_salida = in_fecha_vuelo
    LIMIT 1;
    
    SELECT fecha_salida INTO fecha_s FROM vuelos WHERE vuelo_id = v;
    SELECT fecha_llegada_estimada INTO fecha_l FROM vuelos WHERE vuelo_id = v;
    SELECT aerolinea_id INTO aerolinea FROM vuelos WHERE vuelo_id = v;

    CREATE TEMPORARY TABLE disponibles AS
    SELECT t.empleado_id, t.puesto, t.aerolinea_id
    FROM tripulacion t
    JOIN tripulacion_vuelo tp ON t.empleado_id = tp.empleado_id
    JOIN vuelos v ON tp.vuelo_id = v.vuelo_id
    WHERE aerolinea_id = aerolinea
    AND NOT(
		(v.fecha_salida <= fecha_s AND fecha_s <= v.fecha_llegada_estimada)
        OR
		(v.fecha_salida <= fecha_l AND fecha_l <= v.fecha_llegada_estimada)
    )
    ORDER BY t.horas_vuelo;
    
    -- piloto
    SELECT empleado_id INTO piloto_id
    FROM disponibles
    WHERE aerolinea_id = aerolinea
      AND puesto = 'Piloto'
    LIMIT 1;
 
    -- copiloto
    SELECT empleado_id INTO copiloto_id
    FROM disponibles
    WHERE aerolinea_id = aerolinea
      AND puesto = 'Copiloto'
    LIMIT 1;
    
    -- azafata 1
    SELECT empleado_id INTO azafata1_id
    FROM disponibles
    WHERE aerolinea_id = aerolinea
      AND puesto = 'Azafata'
    LIMIT 1;
 
    -- azafata 2
    SELECT empleado_id INTO azafata2_id
    FROM disponibles
    WHERE aerolinea_id = aerolinea
      AND puesto = 'Azafata'
    LIMIT 1 OFFSET 1;
 
    -- azafata 3
    SELECT empleado_id INTO azafata3_id
    FROM disponibles
    WHERE aerolinea_id = aerolinea
      AND puesto = 'Azafata'
    LIMIT 1 OFFSET 2;

    IF piloto_id IS NOT NULL THEN
        INSERT INTO tripulacion_vuelo (vuelo_id, empleado_id, rol)
        VALUES (v, piloto_id, 'Piloto principal');
    END IF;

    IF copiloto_id IS NOT NULL THEN
        INSERT INTO tripulacion_vuelo (vuelo_id, empleado_id, rol)
        VALUES (v, copiloto_id, 'Copiloto');
    END IF;

    IF azafata1_id IS NOT NULL THEN
        INSERT INTO tripulacion_vuelo (vuelo_id, empleado_id, rol)
        VALUES (v, azafata1_id, 'Azafata principal');
    END IF;

    IF azafata2_id IS NOT NULL THEN
        INSERT INTO tripulacion_vuelo (vuelo_id, empleado_id, rol)
        VALUES (v, azafata2_id, 'Azafata de apoyo');
    END IF;

    IF azafata3_id IS NOT NULL THEN
        INSERT INTO tripulacion_vuelo (vuelo_id, empleado_id, rol)
        VALUES (v, azafata3_id, 'Azafata de apoyo');
    END IF;
END$$
DELIMITER ;


DELIMITER $$
CREATE PROCEDURE check_in(IN in_vuelo_id INT)
BEGIN
	DECLARE fecha TIMESTAMP DEFAULT NULL;
    SELECT DATE_SUB(fecha_salida, INTERVAL 1 DAY) INTO fecha
    FROM vuelos
    WHERE vuelo_id = in_vuelo_id;
    
    DELIMITER //
    CREATE EVENT check_in_all
    ON SCHEDULE AT fecha
    DO BEGIN
		UPDATE reservaciones
		SET estado = "Confirmada"
		WHERE vuelo_id = in_vuelo_id;
    END //
    
END $$
DELIMITER ;








SELECT COUNT(DISTINCT reservacion_id) as cantidad FROM reservaciones r JOIN vuelos v USING(vuelo_id) JOIN aeronaves a USING(aeronave_id) JOIN rutas ru USING(ruta_id) 
WHERE r.activo = 1 AND v.activo = 1 AND a.activo = 1 AND ru.activo = 1;


DELIMITER $$
CREATE EVENT actualizar_estado_vuelos
ON SCHEDULE EVERY 10 MINUTE
DO BEGIN
	UPDATE vuelos SET estado = 'En vuelo' WHERE estado = 'Programado' AND fecha_salida <= NOW() AND fecha_llegada_real > NOW();
    UPDATE vuelos SET estado = 'Completado' WHERE estado = 'En vuelo' AND fecha_llegada_real <= NOW();
END
DELIMITER ;

DELIMITER $$
CREATE EVENT actualizar_estado_aeronaves
ON SCHEDULE EVERY 10 MINUTE
DO BEGIN
	UPDATE vuelos SET estado = 'En vuelo' WHERE estado = 'Programado' AND estado != 'Retrasado' AND fecha_salida <= NOW() AND fecha_llegada_real > NOW();
    UPDATE vuelos SET estado = 'Completado' WHERE estado = 'En vuelo' AND fecha_llegada_real <= NOW();
END
DELIMITER ;
