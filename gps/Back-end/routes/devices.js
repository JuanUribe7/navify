const express = require('express');
const router = express.Router();
const { Device, DeviceStatus } = require('../models/Device'); // Asegúrate de importar DeviceStatus

// Endpoint para actualizar la ubicación del dispositivo desde el GPS
router.post('/update-from-gps', async (req, res) => {
    try {
        const { imei, Lat, Lon, speed, course, time } = req.body;

        // Verificar que todos los datos requeridos estén presentes
        if (!imei || Lat === undefined || Lon === undefined) {
            return res.status(400).json({ error: 'IMEI, latitud y longitud son obligatorios.' });
        }

        // Encontrar el dispositivo por IMEI
        const dispositivo = await Device.findOne({ imei });
        if (!dispositivo) {
            return res.status(404).json({ message: 'Dispositivo no encontrado' });
        }

        // Crear o actualizar el estado del dispositivo
        await DeviceStatus.findOneAndUpdate(
            { imei },
            {
                imei,
                fixTime: time,
                lat: Lat,
                lon: Lon,
                speed,
                course,
                event: { string: 'location' }
            },
            { upsert: true, new: true }
        );

        console.log(`Ubicación actualizada para IMEI: ${imei} - Latitud: ${Lat}, Longitud: ${Lon}`);
        res.json({ message: 'Ubicación actualizada exitosamente' });
    } catch (error) {
        console.error('Error al actualizar la ubicación:', error.message);
        res.status(500).json({ error: 'Error al actualizar la ubicación: ' + error.message });
    }
});

module.exports = router;