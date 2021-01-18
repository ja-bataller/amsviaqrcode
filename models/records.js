const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RecordSchema = new Schema({
    user_id: {
        type: String,
    },
    idnumber: {
        type: String,
    },
    name: {
        type: String,
    },
    shift: {
        type: String,
    },
    status: {
        type: String,
    },
    date: {
        type: String,
    },
    time_in: {
        type: String,
    },
    time_out: {
        type: String,
    },
    late: {
        type: String,
    },
    early_out: {
        type: String,
    },
    absent: {
        type: String,
    },
}, {
    timestamps: true
});

const Record = mongoose.model("Record", RecordSchema);

module.exports = Record;
