const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    imei: { type: String, required: true, unique: true },
    deviceName: { type: String, required: false },
    responsible: { type: String, required: false },
    phoneNumber: { type: String, required: false },
}, { minimize: false });

const deviceStatusSchema = new mongoose.Schema({
    imei: { type: String, required: true, unique: true },
    event: {
        number: { type: Number, required: false },
        string: { type: String, required: false }
    },
    fixTime: { type: Date, required: false },
    lat: { type: Number, required: false },
    lon: { type: Number, required: false },
    speed: { type: Number, required: false },
    course: { type: Number, required: false },
    mcc: { type: Number, required: false },
    mnc: { type: Number, required: false },
    lac: { type: Number, required: false },
    cellId: { type: Number, required: false },
    serialNr: { type: Number, required: false },
}, { minimize: false });

module.exports = {
    Device: mongoose.model('Device', deviceSchema),
    DeviceStatus: mongoose.model('DeviceStatus', deviceStatusSchema)
};