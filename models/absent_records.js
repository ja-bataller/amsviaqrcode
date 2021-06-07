const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// LOGS SCHEMA IN MONGO DB
const AbsentSchema = new Schema({
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
    month: {
        type: String,
    },
    
}, {
    timestamps: true
});

const Absent = mongoose.model("Absent", AbsentSchema);

module.exports = Absent;
