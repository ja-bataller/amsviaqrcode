const User = require("../models/users");
const Log = require("../models/logs");
const Record = require("../models/records");
const Account = require("../models/accounts")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const faker = require("faker");
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
    const {currentPassword, newPassword} = req.body;
    const id = req.params.id;

    console.log(id)
    console.log(currentPassword);
    console.log(newPassword);

    const account = await Account.findOne({_id: id});

    if (account) {
        const auth = await bcrypt.compare(currentPassword, account.password)
        if (auth) {

            const salt = await bcrypt.genSalt();
            encryptedPassword = await bcrypt.hash(newPassword, salt)

            await Account.findByIdAndUpdate(id, {password: encryptedPassword});

            console.log("Updated Account Password");
            return res.status(200).json({success: "Your Password has been updated sucessfully. Please log in again."});

        } else{
             return res.status(404).json({error: "The current password you enter is incorrect"});
        }
    } else {
        return res.status(404).json({error: "404"});
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
    const {idnumber,time, date} = req.body;
    console.log(`Scanned user ID number: ${idnumber}`);
    console.log(`Time today: ${time}`);
    console.log(`Date today: ${date}`);

    let hour = parseInt(time.substring(0, 2));
    let min = parseInt(time.substring(3, 5));
    let ampm = time.substr(time.length - 2);

    try {
        const userCheck = await User.findOne({idnumber})
        const logCheck = await Log.findOne({idnumber})
        
        // If USER is NOT registered
        if(userCheck == null)
        {
            return res.status(404).json({error: "This user is not registered"})
        }

        // If USER is registered and USER did not logged out last session then USER cannot enter again
        if (userCheck && logCheck && logCheck.date != date && logCheck.time_in != "" && logCheck.time_out == ""){
            return res.status(400).json({warning: "You did not logout last session. Please contact your Administrator."})
        }

        // If USER is registered and USER has logged out today's date then USER cannot enter again
        if (userCheck && logCheck && logCheck.date == date && logCheck.status == "logged out" && logCheck.time_in != "" && logCheck.time_out != ""){
            return res.status(400).json({warning: "You cannot login twice a day. Please contact your Administrator."})
        }

        // If USER is registered and USER has logged in then update log status to logged out and time out
        if (userCheck && logCheck && logCheck.date == date && logCheck.time_in != "" && logCheck.time_out == ""){
            const id = logCheck._id;
            console.log(id);

            const log =  await Log.findByIdAndUpdate(id, {status: "logged out", time_out: time}, {new: true});

            // const log = await Log.findOneAndUpdate({user_id: userCheck._id }, { status: "done", time_out: time }, {new: true});

            console.log("Uses log is now logged out")

            const record =  new Record({user_id: log.user_id, idnumber: log.idnumber, name: log.name, shift: log.shift, status: "done", date: log.date, time_in: log.time_in, time_out: log.time_out, late: log.late});
            record.save();
            console.log("User done log has been put to Record")

            await Log.findByIdAndUpdate(id, {time_in: log.time_in, time_out: log.time_out, late: ""});
            console.log("User log time in and time out has been updated to blank")

            const timeOutLog = {
                userName: `${userCheck.firstname} ${userCheck.lastname}`,
                time_out: log.time_out,
            }
            return res.status(200).json({userOut: timeOutLog})
        }

        // If USER is registered and USER doesn't have logs yet
        if (userCheck && logCheck == null){
            // NEW USER DAY SHIFT
            if (userCheck.shift == "day"){
                if(ampm == 'PM'){
                    if(hour >= 0 && hour < 2){
                        console.log("Late")
                        const log = new Log({user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "yes"});
                        log.save();
            
                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }
                        return res.status(200).json({late: timeInLog})
                    } 
                    else if (hour == 12){
                        console.log("Late")
                        const log = new Log({user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "yes"});
                        log.save();
            
                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }
                        return res.status(200).json({late: timeInLog})
                    }
                    
                    else{
                        return res.status(400).json({warning: "You cannot enter the building your shift is already done. Please contact your Administrator."})
                    }
                }

                else if(ampm == 'AM'){

                    if(hour > 6){
                        console.log("Late")
                        const log = new Log({user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "yes"});
                        log.save();
            
                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }
                        return res.status(200).json({late: timeInLog})
                    }

                    else if(hour == 6 && min > 0){
                        console.log("Late")
                        const log = new Log({user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "yes"});
                        log.save();
            
                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }
                        return res.status(200).json({late: timeInLog})
                    }

                    else{
                        console.log("On-time")
                        const log = new Log({user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "no"});
                        log.save();
        
                        const timeInLog = {
                        userName: `${userCheck.firstname} ${userCheck.lastname}`,
                        time_in: time,
                        }
                        return res.status(200).json({userFoundandRecord: timeInLog})
                    }
                }
            }

            // NEW USER NIGHT SHIFT
            if (userCheck.shift == "night"){
                if(ampm == 'PM'){
                    if(hour > 1 && hour < 9){
                        console.log("Late")
                        const log = new Log({user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "yes"});
                        log.save();
            
                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }
                        return res.status(200).json({late: timeInLog})
                    }

                    else if(hour == 1 && min > 0){
                        console.log("Late")
                        const log = new Log({user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "yes"});
                        log.save();
            
                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }
                        return res.status(200).json({late: timeInLog})
                    }

                    else if((hour == 9 && min > 0) || (hour == 9 && min == 0) || (hour > 9 && hour < 12)){
                        return res.status(400).json({warning: "You cannot enter the building your shift is already done. Please contact your Administrator."})
                    }

                    else if(hour == 1 && min == 0 || hour == 12){
                        console.log("On-time")
                        const log = new Log({user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "no"});
                        log.save();
        
                        const timeInLog = {
                        userName: `${userCheck.firstname} ${userCheck.lastname}`,
                        time_in: time,
                        }
                        return res.status(200).json({userFoundandRecord: timeInLog})
                    }

                    else{
                        console.log("On-time")
                        const log = new Log({user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "no"});
                        log.save();
        
                        const timeInLog = {
                        userName: `${userCheck.firstname} ${userCheck.lastname}`,
                        time_in: time,
                        }
                        return res.status(200).json({userFoundandRecord: timeInLog})
                    }
                }
                
                if(ampm == 'AM'){
                    console.log("On-time")
                    const log = new Log({user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: "", late: "no"});
                    log.save();
    
                    const timeInLog = {
                    userName: `${userCheck.firstname} ${userCheck.lastname}`,
                    time_in: time,
                    }
                    return res.status(200).json({userFoundandRecord: timeInLog})
                }  
            }

        }

        // If USER is registered and USER has logs and then create another log (different date)
        if (userCheck && logCheck &&  logCheck.date != date && logCheck.time_in != "" && logCheck.time_out != ""){
            //EXISTING USER DAY SHIFT
            if(userCheck.shift == "day"){
                if(ampm == 'PM'){
                    if(hour >= 0 && hour < 2){
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, {status: "active", date: date, time_in: time, time_out: "", late:"yes"});

                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }

                        return res.status(200).json({late: timeInLog})
                    }

                    else if (hour == 12){
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, {status: "active", date: date, time_in: time, time_out: "", late:"yes"});

                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }

                        return res.status(200).json({late: timeInLog})
                    }

                    else{
                        return res.status(400).json({warning: "You cannot enter the building your shift is already done. Please contact your Administrator."})
                    }
                }

                else if(ampm == 'AM'){
                    if(hour > 6){
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, {status: "active", date: date, time_in: time, time_out: "", late:"yes"});

                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }

                        return res.status(200).json({late: timeInLog})
                    }

                    else if(hour == 6 && min > 0){
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, {status: "active", date: date, time_in: time, time_out: "", late:"yes"});

                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }

                        return res.status(200).json({late: timeInLog})
                    }

                    else{
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, {status: "active", date: date, time_in: time, time_out: "", late:"no"});

                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }

                        return res.status(200).json({userFoundandRecord: timeInLog})
                    }
                }
            }

            //EXISTING USER NIGHT SHIFT
            if(userCheck.shift == "night"){
                if(ampm == 'PM'){
                    if(hour > 1 && hour < 9){
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, {status: "active", date: date, time_in: time, time_out: "", late:"yes"});

                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }

                        return res.status(200).json({late: timeInLog})
                    }

                    else if(hour == 1 && min > 0){
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, {status: "active", date: date, time_in: time, time_out: "", late:"yes"});

                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                            userName: `${userCheck.firstname} ${userCheck.lastname}`,
                            time_in: time,
                        }

                        return res.status(200).json({late: timeInLog})
                    }

                    else if((hour == 9 && min > 0) || (hour == 9 && min == 0) || (hour > 9 && hour < 12)){
                        return res.status(400).json({warning: "You cannot enter the building your shift is already done. Please contact your Administrator."})
                    }
                    
                    else if(hour == 1 && min == 0 || hour == 12){
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, {status: "active", date: date, time_in: time, time_out: "", late:"no"});

                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                        userName: `${userCheck.firstname} ${userCheck.lastname}`,
                        time_in: time,
                        }

                        return res.status(200).json({userFoundandRecord: timeInLog})
                    }
                    
                    else{
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, {status: "active", date: date, time_in: time, time_out: "", late:"no"});

                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                        userName: `${userCheck.firstname} ${userCheck.lastname}`,
                        time_in: time,
                        }

                        return res.status(200).json({userFoundandRecord: timeInLog})
                    }
                }
                    
                    if(ampm == 'AM'){
                        const id = logCheck._id;
                        await Log.findByIdAndUpdate(id, {status: "active", date: date, time_in: time, time_out: "", late:"no"});

                        console.log("Old User log has been updated and now active")

                        const timeInLog = {
                        userName: `${userCheck.firstname} ${userCheck.lastname}`,
                        time_in: time,
                        }

                        return res.status(200).json({userFoundandRecord: timeInLog})
                    }
            }

        }

    } catch (err) {
        console.log(err);
        res.status(400).json({error: '400'});
    }
}

// REGISTER NEW USER / EMPLOYEE
module.exports.register_post = async (req, res) => {
    const newUser = req.body;
    console.log(newUser);

    const newUserID = newUser.idnumber;
    console.log(newUserID);

    const findID = await User.findOne({idnumber: newUserID})

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
    gender: ['male','female'],
    shift: ['day', 'night'],
    bday: ['1987-05-14', '1999-06-21','1995-12-08', '1991-03-17']
  };

function generateRandom (choices) {
    const random = Math.floor(Math.random() * choices.length);
    return choices[random];
}

// SEED FAKE USER / EMPLOYEE
module.exports.seedusers_get = async (req, res) => {
 
      let count = req.params.count;
        
      for(let i=0; i<count; i++){  
      
          let formParams = {  
              firstname: faker.name.firstName(),  
              middlename: faker.name.lastName(),  
              lastname: faker.name.lastName(),  
              gender: generateRandom(random['gender']),  
              age: faker.random.number({'min': 18,'max': 60 }),  
              birthdate: generateRandom(random['bday']), 
              contact_number: "09" + faker.random.number({'max': 10000000}),
              email_address: faker.internet.email(), 
              home_address: faker.address.streetAddress(), 
              department: generateRandom(random['dept']),
              shift: generateRandom(random['shift']),
              idnumber: faker.unique(faker.random.number),
          };
      
          let users = new User(formParams);  
          await users.save();
      }

    let data = {
        message: `Seeded Users total of ${count}`,
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
        message: "DELETED SUCCESSFULLY",
        status: 'success'
    }
    res.send(data);
}