const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// LOGS SCHEMA IN MONGO DB
const LeaveSchema = new Schema({
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
    leave: {
        type: String,
    },
    special_leave: {
        type: Number,
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

const Leave = mongoose.model("Leave", LeaveSchema);

module.exports = Leave;
