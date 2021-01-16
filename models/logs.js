const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LogSchema = new Schema({
    idnumber: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    time_in: {
        type: String,
        required: true,
    },
    time_out: {
        type: String,
        required: true,
    },
    late: {
        type: String,
        required: true,
    },
    early_out: {
        type: String,
        required: true,
    },
    absent: {
        type: String,
        required: true,
    },
},  {timestamps: true});

const Log = mongoose.model("Log", LogSchema);

module.exports = Log;

