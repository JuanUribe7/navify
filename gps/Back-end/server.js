const net = require('net');
const axios = require('axios'); // Asegúrate de tener axios instalado e importado
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const path = require('path'); 
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const Gt06 = require('./gt06'); // Asegúrate de tener el módulo Gt06
const mqtt = require('mqtt');

const PORT = process.env.GT06_SERVER_PORT || 4000;
const HTTP_PORT = process.env.HTTP_PORT || 80;
const rootTopic = process.env.MQTT_ROOT_TOPIC || 'gt06';
const brokerUrl = process.env.MQTT_BROKER_URL || '11ec3ffa829840c785105a23a3994db1.s1.eu.hivemq.cloud';
const brokerPort = process.env.MQTT_BROKER_PORT || 1883;
const mqttProtocol = process.env.MQTT_BROKER_PROTO || 'mqtt';
const brokerUser = process.env.MQTT_BROKER_USER || 'DiegoGPS';
const brokerPasswd = process.env.MQTT_BROKER_PASSWD || 'Dl1042248136!';

// Configuración del cliente MQTT
const mqttClient = mqtt.connect({
    protocol: mqttProtocol,
    host: brokerUrl,
    port: brokerPort,
    username: brokerUser,
    password: brokerPasswd
});
app.use(express.static(path.join(__dirname, 'dist' )));
// Servidor TCP
var tcpServer = net.createServer((client) => {
    var gt06 = new Gt06();
    console.log('client connected');

    client.on('error', (err) => {
        console.error('client error', err);
    });

    client.on('close', () => {
        console.log('client disconnected');
    });

    client.on('data', async (data) => {
        try {
            gt06.parse(data);
        } catch (e) {
            console.log('err', e);
            return;
        }
        console.log(gt06);
        if (gt06.expectsResponse) {
            client.write(gt06.responseMsg);
        }
        gt06.msgBuffer.forEach(async (msg) => {
            mqttClient.publish(rootTopic + '/' + gt06.imei + '/pos', JSON.stringify(msg));
    
            // Preparar los datos para enviar a la ruta /update-from-gps
            if (gt06.event.string === 'location') {
                const deviceData = {
                    imei: gt06.imei,
                    Lat: gt06.lat,
                    Lon: gt06.lon,
                    speed: gt06.speed,
                    course: gt06.course,
                    time: gt06.fixTime
                };
                console.log('Latitude:', gt06.lat);
                console.log('Longitude:', gt06.lon);
                console.log('Hora:', gt06.fixTime);
                console.log('Rumbo:', gt06.course);
                console.log('velocidad:', gt06.speed);
         
                // Enviar los datos a la ruta /update-from-gps
                try {
                    await axios.post(`http://3.12.147.103/devices/update-from-gps`, deviceData);
                    console.log(`Datos enviados a /update-from-gps para IMEI: ${gt06.imei}`);
                } catch (error) {
                    console.error('Error al enviar los datos a /update-from-gps:', error.message);
                    console.error('Configuración de la solicitud:', error.config);
                }
            }
        });
        gt06.clearMsgBuffer();
    });
}); 

// Inicia el servidor TCP en el puerto especificado
tcpServer.listen(PORT, () => {
    console.log(`Servidor TCP corriendo en el puerto ${PORT}`);
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conexión a MongoDB
mongoose.connect('mongodb+srv://lospopulare:gps1234@gps.zgbl7.mongodb.net/proyecto?retryWrites=true&w=majority&appName=gps', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error de conexión a MongoDB:', err));

// Rutas
app.use('/auth', authRoutes);
app.use('/devices', deviceRoutes);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Inicia el servidor HTTP en el puerto especificado
app.listen(HTTP_PORT, () => {
    console.log(`Servidor HTTP corriendo en http://localhost:${HTTP_PORT}`);
});