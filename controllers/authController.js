const User = require("../models/users");
const Log = require("../models/logs");
const Record = require("../models/records");
const Account = require("../models/accounts")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const faker = require("faker");

const Late = require('../models/late_records');
const Absent = require('../models/absent_records');
const Leave = require('../models/leave_records');

require('dotenv').config();

// ERROR HANDLING / VALIDATION
const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = {
        username: '',
        password: ''
    };

    // incorrect username
    if (err.message === "Incorrect username") {
        errors.username = "The username is not registered.";
    }

    // incorrect password
    if (err.message === "Incorrect password") {
        errors.password = "The password is incorrect.";
    }

    // duplicate username error
    if (err.code === 11000) {
        errors.username = 'The username is already registered.';
        return errors;
    }

    // validation errors
    if (err.message.includes('account validation failed')) {
        // console.log(err);
        Object.values(err.errors).forEach(({
            properties
        }) => {
            // console.log(val);
            // console.log(properties);
            errors[properties.path] = properties.message;
        });
    }

    return errors;
}

// CREATE JSON WEB TOKEN (JWT)
const expiry_age = 3 * 24 * 60 * 60;
const createToken = (id) => {
    return jwt.sign({
        id
    }, 'ams-qrcode', {
        expiresIn: expiry_age
    });
};

// OPEN INDEX / MAIN PAGE
module.exports.login_get = (req, res) => {
    res.render("index");
}

// OPEN REGISTER NEW USER PAGE
module.exports.register_get = (req, res) => {
    res.render("registeruser");
}

// OPEN QR CODE GENERATOR PAGE
module.exports.qrcodegenerator_get = (req, res) => {
    res.render("qrcodegenerator");
}

// LOGGING IN ADMINISTRATOR ACCOUNT
module.exports.loginadmin_post = async (req, res) => {
    const {
        username,
        password
    } = req.body;

    try {
        console.log("Logged-in");
        const account = await Account.login(username, password);
        const token = createToken(account._id);
        res.cookie('jwt', token, {
            httpOnly: true,
            expiry_age: expiry_age * 1000
        });
        res.status(200).json({
            account: account._id
        })
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({
            errors
        });
    }
}

// LOGGING OUT ADMINISTRATOR ACCOUNT
module.exports.logout_get = (req, res) => {
    console.log("Logged out");
    res.cookie("jwt", "", {
        expiry_age: 1
    })
    res.redirect("/");
}

// CHANGING PASSWORD OF ADMINISTRATOR ACCOUNT
module.exports.changePassword_put = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const id = req.params.id;


    const account = await Account.findOne({ _id: id });

    if (account) {
        const auth = await bcrypt.compare(currentPassword, account.password)
        if (auth) {

            const salt = await bcrypt.genSalt();
            encryptedPassword = await bcrypt.hash(newPassword, salt)

            await Account.findByIdAndUpdate(id, { password: encryptedPassword });

            console.log("Updated Account Password");
            return res.status(200).json({ success: "Your Password has been updated sucessfully. Please log in again." });

        } else {
            return res.status(404).json({ error: "The current password you enter is incorrect" });
        }
    } else {
        return res.status(404).json({ error: "404" });
    }
    // if (findUsername) {
    //     res.status(400).json({
    //         error: "The ID number is already taken"
    //     });
    // } else {
    //     const user = new User(req.body);
    //     user.save();
    //     res.status(200).json({
    //         user
    //     });
    // }
}

// LOGGING IN AND LOGGING OUT OF USERS / EMPLOYEE
module.exports.loginuser_post = async (req, res) => {
    const { idnumber, time, date } = req.body;
    console.log(`Scanned user ID number: ${idnumber}`);
    console.log(`Time today: ${time}`);
    console.log(`Date today: ${date}`);

    let hour = parseInt(time.substring(0, 2));
    let min = parseInt(time.substring(3, 5));
    let ampm = time.substr(time.length - 2);

    try {
        const userCheck = await User.findOne({ idnumber })
        const logCheck = await Log.findOne({ idnumber })

        // If USER is NOT registered
        if (userCheck == null) {
            return res.status(404).json({ error: "This user is not registered" })
        }

        // If USER is registered and USER did not logged out last session then USER cannot enter again
        if (userCheck && logCheck && logCheck.date != date && logCheck.time_in != "" && logCheck.time_out == "") {
            return res.status(400).json({ warning: "You did not logout last session. Please contact your Administrator." })
        }

        // If USER is registered and USER has logged out today's date then USER cannot enter again
        if (userCheck && logCheck && logCheck.date == date && logCheck.status == "present" && logCheck.time_in != "" && logCheck.time_out != "") {
            return res.status(400).json({ warning: "You cannot login twice a day. Please contact your Administrator." })
        }

        if (userCheck && logCheck && logCheck.date == date && logCheck.status == "absent" && logCheck.time_in != "" && logCheck.time_out != "") {
            return res.status(400).json({ warning: "You cannot login twice a day. Please contact your Administrator." })
        }

        // If USER is registered and USER has logged in then update log status to logged out and time out
        if (userCheck && logCheck && logCheck.date == date && logCheck.time_in != "" && logCheck.time_out == "") {
            const id = logCheck._id;
            console.log(id);

            const log = await Log.findByIdAndUpdate(id, { status: "present", time_out: time }, { new: true });

            let presentCount = log.total_days_present + 1;

            console.log("Uses log is now logged out")

            const record = new Record({ user_id: log.user_id, idnumber: log.idnumber, name: log.name, shift: log.shift, status: "present", date: log.date, time_in: log.time_in, time_out: log.time_out, late: log.late, late_reason: log.late_reason, total_days_present: presentCount });
            record.save();
            console.log("User done log has been put to Record")

            await Log.findByIdAndUpdate(id, { time_in: "null", time_out: "null", late: "null", late_reason: "null", total_days_present: presentCount });
            console.log("User log time in and time out has been updated to blank")

            const timeOutLog = {
                userName: `${userCheck.firstname} ${userCheck.lastname}`,
                time_out: log.time_out,
            }

            return res.status(200).json({ userOut: timeOutLog })
        }

        // If USER is registered and USER doesn't have logs yet
        if (userCheck && logCheck == null) {
            // NEW USER DAY SHIFT
            if (userCheck.shift == "day") {
                if (ampm == 'PM') {
                    if (hour >= 0 && hour < 2) {
                        console.log("Late")
                        const log = new Log({ user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "yes", late_reason: "null", total_days_present: "", leave: 15, special_leave: 3 });
                        log.save();


                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                            idnumber: userCheck.idnumber,
                            date: date,
                        }
                        return res.status(200).json({ late: timeInLog })
                    }
                    else if (hour == 12) {
                        console.log("Late")
                        const log = new Log({ user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "yes", late_reason: "null", total_days_present: "", leave: 15, special_leave: 3 });
                        log.save();


                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                            idnumber: userCheck.idnumber,
                            date: date,
                        }
                        return res.status(200).json({ late: timeInLog })
                    }

                    else {
                        return res.status(400).json({ warning: "You cannot enter the building your shift is already done. Please contact your Administrator." })
                    }
                }

                else if (ampm == 'AM') {

                    if (hour > 6) {
                        console.log("Late")
                        const log = new Log({ user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "yes", late_reason: "null", total_days_present: "", leave: 15, special_leave: 3 });
                        log.save();


                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                            idnumber: userCheck.idnumber,
                            date: date,
                        }
                        return res.status(200).json({ late: timeInLog })
                    }

                    else if (hour == 6 && min > 0) {
                        console.log("Late")
                        const log = new Log({ user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "yes", late_reason: "null", total_days_present: "", leave: 15, special_leave: 3 });
                        log.save();


                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                            idnumber: userCheck.idnumber,
                            date: date,
                        }
                        return res.status(200).json({ late: timeInLog })
                    }

                    else {
                        console.log("On-time")
                        const log = new Log({ user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "no", late_reason: "null", total_days_present: "", leave: 15, special_leave: 3 });
                        log.save();

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }
                        return res.status(200).json({ userFoundandRecord: timeInLog })
                    }
                }
            }

            // NEW USER NIGHT SHIFT
            if (userCheck.shift == "night") {
                if (ampm == 'PM') {
                    if (hour > 1 && hour < 9) {
                        console.log("Late")
                        const log = new Log({ user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "yes", late_reason: "null", total_days_present: "", leave: 15, special_leave: 3 });
                        log.save();


                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                            idnumber: userCheck.idnumber,
                            date: date,
                        }
                        return res.status(200).json({ late: timeInLog })
                    }

                    else if (hour == 1 && min > 0) {
                        console.log("Late")
                        const log = new Log({ user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "yes", late_reason: "null", total_days_present: "", leave: 15, special_leave: 3 });
                        log.save();


                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                            idnumber: userCheck.idnumber,
                            date: date,
                        }
                        return res.status(200).json({ late: timeInLog })
                    }

                    else if ((hour == 9 && min > 0) || (hour == 9 && min == 0) || (hour > 9 && hour < 12)) {
                        return res.status(400).json({ warning: "You cannot enter the building your shift is already done. Please contact your Administrator." })
                    }

                    else if (hour == 1 && min == 0 || hour == 12) {
                        console.log("On-time")
                        const log = new Log({ user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "no", late_reason: "null", total_days_present: "", leave: 15, special_leave: 3 });
                        log.save();

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }
                        return res.status(200).json({ userFoundandRecord: timeInLog })
                    }

                    else {
                        console.log("On-time")
                        const log = new Log({ user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "no", late_reason: "null", total_days_present: "", leave: 15, special_leave: 3 });
                        log.save();

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }
                        return res.status(200).json({ userFoundandRecord: timeInLog })
                    }
                }

                if (ampm == 'AM') {
                    console.log("On-time")
                    const log = new Log({ user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "no", late_reason: "null", total_days_present: "", leave: 15, special_leave: 3 });
                    log.save();

                    const timeInLog = {
                        userName: `${userCheck.firstname} ${userCheck.lastname}`,
                        time_in: time,
                    }
                    return res.status(200).json({ userFoundandRecord: timeInLog })
                }
            }

        }

        // If USER is registered and USER has logs and then create another log (different date)
        if (userCheck && logCheck && logCheck.date != date && logCheck.time_in != "" && logCheck.time_out != "") {
            //EXISTING USER DAY SHIFT
            if (userCheck.shift == "day") {
                if (ampm == 'PM') {
                    if (hour >= 0 && hour < 2) {
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, { status: "active", date: date, time_in: time, time_out: "", late: "yes", late_reason: "null" });


                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                            idnumber: userCheck.idnumber,
                            date: date,
                        }

                        return res.status(200).json({ late: timeInLog })
                    }

                    else if (hour == 12) {
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, { status: "active", date: date, time_in: time, time_out: "", late: "yes", late_reason: "null" });


                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                            idnumber: userCheck.idnumber,
                            date: date,
                        }

                        return res.status(200).json({ late: timeInLog })
                    }

                    else {
                        return res.status(400).json({ warning: "You cannot enter the building your shift is already done. Please contact your Administrator." })
                    }
                }

                else if (ampm == 'AM') {
                    if (hour > 6) {
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, { status: "active", date: date, time_in: time, time_out: "", late: "yes", late_reason: "null" });


                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                            idnumber: userCheck.idnumber,
                            date: date,
                        }

                        return res.status(200).json({ late: timeInLog })
                    }

                    else if (hour == 6 && min > 0) {
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, { status: "active", date: date, time_in: time, time_out: "", late: "yes", late_reason: "null" });

                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                            idnumber: userCheck.idnumber,
                            date: date,
                        }

                        return res.status(200).json({ late: timeInLog })
                    }

                    else {
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, { status: "active", date: date, time_in: time, time_out: "", late: "no", late_reason: "null" });

                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }

                        return res.status(200).json({ userFoundandRecord: timeInLog })
                    }
                }
            }

            //EXISTING USER NIGHT SHIFT
            if (userCheck.shift == "night") {
                if (ampm == 'PM') {
                    if (hour > 1 && hour < 9) {
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, { status: "active", date: date, time_in: time, time_out: "", late: "yes", late_reason: "null" });


                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                            idnumber: userCheck.idnumber,
                            date: date,
                        }

                        return res.status(200).json({ late: timeInLog })
                    }

                    else if (hour == 1 && min > 0) {
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, { status: "active", date: date, time_in: time, time_out: "", late: "yes", late_reason: "null" });


                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                            idnumber: userCheck.idnumber,
                            date: date,
                        }

                        return res.status(200).json({ late: timeInLog })
                    }

                    else if ((hour == 9 && min > 0) || (hour == 9 && min == 0) || (hour > 9 && hour < 12)) {
                        return res.status(400).json({ warning: "You cannot enter the building your shift is already done. Please contact your Administrator." })
                    }

                    else if (hour == 1 && min == 0 || hour == 12) {
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, { status: "active", date: date, time_in: time, time_out: "", late: "no", late_reason: "null" });

                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }

                        return res.status(200).json({ userFoundandRecord: timeInLog })
                    }

                    else {
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, { status: "active", date: date, time_in: time, time_out: "", late: "no", late_reason: "null" });

                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }

                        return res.status(200).json({ userFoundandRecord: timeInLog })
                    }
                }

                if (ampm == 'AM') {
                    const id = logCheck._id;
                    await Log.findByIdAndUpdate(id, { status: "active", date: date, time_in: time, time_out: "", late: "no", late_reason: "null" });

                    console.log("Old User log has been updated and now active")

                    const timeInLog = {
                        userName: `${userCheck.firstname} ${userCheck.lastname}`,
                        time_in: time,
                    }

                    return res.status(200).json({ userFoundandRecord: timeInLog })
                }
            }
        }

    } catch (err) {
        console.log(err);
        res.status(400).json({ error: '400' });
    }
}

// LEAVE
module.exports.leave_post = async (req, res) => {
    const { leave, idNum, date } = req.body;

    let dateToday = new Date();
    let month = dateToday.getMonth();

    const logCheck = await Log.findOne({ idnumber: idNum })
    const recordIdCheck = await Record.findOne({ idnumber: idNum, date: date })
    const leaveReason = leave;

    const id = logCheck._id;

    if (!recordIdCheck) {
        if (leave == "Sick Leave") {
            const leaveRemaining = logCheck.leave;

            if (leaveRemaining != 0 || leaveRemaining > 0) {
                const leaveNewRemaining = leaveRemaining - 1;

                await Log.findByIdAndUpdate(id, { status: leaveReason, leave: leaveNewRemaining, date: date }, { new: true });
                const record = new Record({ user_id: logCheck.user_id, idnumber: logCheck.idnumber, name: logCheck.name, shift: logCheck.shift, status: leaveReason, date: date, time_in: logCheck.time_in, time_out: logCheck.time_out, late: logCheck.late, late_reason: logCheck.late_reason, total_days_present: logCheck.total_days_present, leave: leaveNewRemaining, special_leave: logCheck.special_leave });
                record.save();

                const leave = new Leave({ user_id: logCheck.user_id, idnumber: logCheck.idnumber, name: logCheck.name, shift: logCheck.shift, status: leaveReason, date: date, leave: leaveNewRemaining, special_leave: logCheck.special_leave, month: month });
                leave.save();

                return res.status(200).json({ success: "Employee Sick leave has been recorded" });
            } else {
                return res.status(400).json({ error: "This Employee has reached the maximum limit of Leave." });
            }
        }

        if (leave == "Special Leave") {
            const specialLeaveRemaining = logCheck.special_leave;

            if (specialLeaveRemaining != 0 || specialLeaveRemaining > 0) {
                const specialLeaveNewRemaining = specialLeaveRemaining - 1;

                await Log.findByIdAndUpdate(id, { status: leaveReason, special_leave: specialLeaveNewRemaining, date: date }, { new: true });
                const record = new Record({ user_id: logCheck.user_id, idnumber: logCheck.idnumber, name: logCheck.name, shift: logCheck.shift, status: leaveReason, date: date, time_in: logCheck.time_in, time_out: logCheck.time_out, late: logCheck.late, late_reason: logCheck.late_reason, total_days_present: logCheck.total_days_present, leave: logCheck.leave, special_leave: specialLeaveNewRemaining });
                record.save();

                const leave = new Leave({ user_id: logCheck.user_id, idnumber: logCheck.idnumber, name: logCheck.name, shift: logCheck.shift, status: leaveReason, date: date, leave: logCheck.leave, special_leave: specialLeaveNewRemaining, month: month });
                leave.save();

                return res.status(200).json({ success: "Employee Special leave has been recorded" });
            } else {
                return res.status(400).json({ error: "This Employee has reached the maximum limit of Special Leave." });
            }
        }
    }

    else {
        return res.status(400).json({ error: "This Employee has already been recorded today." });
    }
}

//  LATE REASON
module.exports.late_post = async (req, res) => {
    const { otherReason, reason, idnumber, date } = req.body;

    const logCheck = await Log.findOne({ idnumber })

    const id = logCheck._id;

    await Log.findByIdAndUpdate(id, { late_reason: reason, late: otherReason }, { new: true });

    const late = new Late({ user_id: logCheck.user_id, idnumber: logCheck.idnumber, name: logCheck.name, shift: logCheck.shift, late_reason: reason, late: otherReason, date: date });
    late.save();

    console.log("Late Reason recorded")

    return res.status(200).json({ success: "Late reason has been submitted successfully." });
}

// GETTING ABSENT EMPLOYEES
module.exports.absents_post = async (req, res) => {
    const { date } = req.body;

    let dateToday = new Date();
    let month = dateToday.getMonth();

    const log = await Log.find({ status: 'absent' })
    const recordCheck = await Record.findOne({ date: date})

    try {

        if (!recordCheck) {

            if (log.length == 0) {
                console.log("no logs")

                await Log.updateMany({ time_in: "null", time_out: "null", late: "", status: "absent" });

                return res.status(400).json({ success: "Great! No Absent for Today." });
            }

            else {

                for (var i = 0; i < log.length; ++i) {

                    console.log(i)
                    const record = new Record({ user_id: log[i].user_id, idnumber: log[i].idnumber, name: log[i].name, shift: log[i].shift, status: "absent", date: date, time_in: log[i].time_in, time_out: log[i].time_out, late: log[i].late });
                    record.save();

                    const absent = new Absent({ user_id: log[i].user_id, idnumber: log[i].idnumber, name: log[i].name, shift: log[i].shift, status: "absent", date: date, month: month });
                    absent.save();

                }

                await Log.updateMany({ time_in: "null", time_out: "null", late: "", status: "absent" });

                return res.status(200).json({ success: "The Absent employees has been recorded." });
            }

        }

        else {
            return res.status(400).json({ error: "All Employees has already been recorded today." });
        }

    } catch (err) {
        console.log(err);
        res.status(400).json({ error: '400' });
    }
}

// REGISTER NEW USER / EMPLOYEE
module.exports.register_post = async (req, res) => {
    const newUser = req.body;
    console.log(newUser);

    const newUserID = newUser.idnumber;
    console.log(newUserID);

    const findID = await User.findOne({ idnumber: newUserID })

    if (findID) {
        res.status(400).json({
            errors: "The ID number is already taken"
        });
    } else {
        const user = new User(req.body);
        user.save();
        res.status(200).json({
            user
        });
    }
}

// QR CODE GENERATOR
module.exports.qrcode_get = async (req, res) => {
    const id = req.params.id;
    console.log(id)

    User.findById(id)
        .then(result => {
            res.render("qrcodegenerator", {
                user: result
            })
        })
        .catch(err => {
            console.log(err);
        })
}

// SEED FAKE USER / EMPLOYEE
const random = {
    dept: [
        "Industrial Technology",
        "Industrial Education",
        "Electrical Engineering Technolgy",
        "Civil Engineering Technology",
        "Computer Science"
    ],
    gender: ['male', 'female'],
    shift: ['day', 'night'],
    bday: ['1987-05-14', '1999-06-21', '1995-12-08', '1991-03-17', '1996-06-26']
};

function generateRandom(choices) {
    const random = Math.floor(Math.random() * choices.length);
    return choices[random];
}

// SEED FAKE USER / EMPLOYEE
module.exports.seedusers_get = async (req, res) => {

    let count = req.params.count;

    for (let i = 0; i < count; i++) {

        let randomNum = faker.datatype.number({ 'min': 1000000000 });

        let formParams = {
            firstname: faker.name.firstName(),
            middlename: faker.name.lastName(),
            lastname: faker.name.lastName(),
            gender: generateRandom(random['gender']),
            age: faker.datatype.number({ 'min': 18, 'max': 60 }),
            birthdate: generateRandom(random['bday']),
            contact_number: `09${randomNum}`,
            email_address: faker.internet.email(),
            home_address: faker.address.streetAddress(),
            department: generateRandom(random['dept']),
            shift: generateRandom(random['shift']),
            idnumber: faker.unique(faker.datatype.number),
        };

        let users = new User(formParams);
        await users.save();
    }

    let data = {
        message: `Seeded Employees total of ${count}`,
        status: 'success'
    }
    res.send(data);
}

// DELETE / DROP USERS AND LOGS COLLECTION IN MONGO DB
module.exports.seeddrop_get = async (req, res) => {
    await User.deleteMany({})
    await Log.deleteMany({})
    await Record.deleteMany({})

    let data = {
        message: "Users, Logs, and Records has been deleted successfully.",
        status: 'Success'
    }
    res.send(data);
}

module.exports.late_chart_post = async (req, res) => {

    const late_traffic = await Late.find({ late_reason: 'Traffic' })
    const late_delayedMassTransit = await Late.find({ late_reason: 'Delayed Mass Transit' })
    const late_badWeather = await Late.find({ late_reason: 'Bad Weather' })
    const late_familyIllness = await Late.find({ late_reason: 'Family Illness' })
    const late_overslept = await Late.find({ late_reason: 'Overslept' })
    const late_others = await Late.find({ late_reason: 'Others' })

    try {

        let traffic = late_traffic.length
        let delayedMassTransit = late_delayedMassTransit.length
        let badWeather = late_badWeather.length
        let familyIllness = late_familyIllness.length
        let overslept = late_overslept.length
        let others = late_others.length

        console.log("TRAFFIC RECORDS")
        console.log(`traffic: ${traffic}`)
        console.log(`delayedMassTransit: ${delayedMassTransit}`)
        console.log(`badWeather: ${badWeather}`)
        console.log(`familyIllness: ${familyIllness}`)
        console.log(`overslept: ${overslept}`)
        console.log(`others: ${others}`)

        return res.status(200).json({ success: { traffic, delayedMassTransit, badWeather, familyIllness, overslept, others } });


    } catch (err) {
        console.log(err);
        res.status(400).json({ error: '400' });
    }
}

module.exports.absent_chart_post = async (req, res) => {

    const january = await Absent.find({ month: '0' })
    const february = await Absent.find({ month: '1' })
    const march = await Absent.find({ month: '2' })
    const april = await Absent.find({ month: '3' })
    const may = await Absent.find({ month: '4' })
    const june = await Absent.find({ month: '5' })
    const july = await Absent.find({ month: '6' })
    const august = await Absent.find({ month: '7' })
    const september = await Absent.find({ month: '8' })
    const october = await Absent.find({ month: '9' })
    const november = await Absent.find({ month: '10' })
    const december = await Absent.find({ month: '11' })


    try {

        let jan = january.length
        let feb = february.length
        let mar = march.length
        let apr = april.length
        let ma = may.length
        let jun = june.length
        let jul = july.length
        let aug = august.length
        let sep = september.length
        let oct = october.length
        let nov = november.length
        let dec = december.length

        console.log("ABSENT RECORDS")
        console.log(`january: ${jan}`)
        console.log(`february: ${feb}`)
        console.log(`march: ${mar}`)
        console.log(`april: ${apr}`)
        console.log(`may: ${ma}`)
        console.log(`june: ${jun}`)
        console.log(`july: ${jul}`)
        console.log(`august: ${aug}`)
        console.log(`september: ${sep}`)
        console.log(`october: ${oct}`)
        console.log(`november: ${nov}`)
        console.log(`december: ${dec}`)

        return res.status(200).json({ success: { jan, feb, mar, apr, ma, jun, jul, aug, sep, oct, nov, dec } });

    } catch (err) {
        console.log(err);
        res.status(400).json({ error: '400' });
    }
}

module.exports.leave_chart_post = async (req, res) => {

    const january = await Leave.find({ month: '0' })
    const february = await Leave.find({ month: '1' })
    const march = await Leave.find({ month: '2' })
    const april = await Leave.find({ month: '3' })
    const may = await Leave.find({ month: '4' })
    const june = await Leave.find({ month: '5' })
    const july = await Leave.find({ month: '6' })
    const august = await Leave.find({ month: '7' })
    const september = await Leave.find({ month: '8' })
    const october = await Leave.find({ month: '9' })
    const november = await Leave.find({ month: '10' })
    const december = await Leave.find({ month: '11' })


    try {

        let jan = january.length
        let feb = february.length
        let mar = march.length
        let apr = april.length
        let ma = may.length
        let jun = june.length
        let jul = july.length
        let aug = august.length
        let sep = september.length
        let oct = october.length
        let nov = november.length
        let dec = december.length

        console.log("LEAVE RECORDS")
        console.log(`january: ${jan}`)
        console.log(`february: ${feb}`)
        console.log(`march: ${mar}`)
        console.log(`april: ${apr}`)
        console.log(`may: ${ma}`)
        console.log(`june: ${jun}`)
        console.log(`july: ${jul}`)
        console.log(`august: ${aug}`)
        console.log(`september: ${sep}`)
        console.log(`october: ${oct}`)
        console.log(`november: ${nov}`)
        console.log(`december: ${dec}`)

        return res.status(200).json({ success: { jan, feb, mar, apr, ma, jun, jul, aug, sep, oct, nov, dec } });

    } catch (err) {
        console.log(err);
        res.status(400).json({ error: '400' });
    }
}
