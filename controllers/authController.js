const User = require("../models/users");
const Account = require("../models/accounts")
const jwt = require("jsonwebtoken");

// handle errors
const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = { username: '', password: '' };
  
    // incorrect username
    if (err.message === "Incorrect username") {
        errors.username = "That username is not registered";
    }

    // incorrect password
    if (err.message === "Incorrect password") {
        errors.password = "That password is incorrect";
    }

    // duplicate username error
    if (err.code === 11000) {
      errors.username = 'that username is already registered';
      return errors;
    }
  
    // validation errors
    if (err.message.includes('account validation failed')) {
      // console.log(err);
      Object.values(err.errors).forEach(({ properties }) => {
        // console.log(val);
        // console.log(properties);
        errors[properties.path] = properties.message;
      });
    }
  
    return errors;
}

// create json web token
const expiry_age = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, 'ams-qrcode', {
    expiresIn: expiry_age
  });
};

module.exports.login_get = (req,res) => {res.render("index");}
module.exports.register_get = (req,res) => {res.render("registeruser");}
module.exports.qrcodegenerator_get = (req,res) => {res.render("qrcodegenerator");}

// Logging out Administrator Account
module.exports.logout_get = (req, res) => {
    console.log("Logged out");
    res.cookie("jwt", "", {expiry_age: 1})
    res.redirect("/");
}

// Logging in Administrator Account
module.exports.loginadmin_post = async (req,res) => {
    const {username, password} = req.body;
    
    try {
        const account = await Account.login(username, password);
        const token = createToken(account._id);
        res.cookie('jwt', token, { httpOnly: true, expiry_age: expiry_age * 1000 });
        res.status(200).json({account: account._id})
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({errors});
    }
}

// Logging in User Account
module.exports.loginuser_post = async (req,res) => {
  const {idnumber} = req.body;
  console.log(idnumber);

  try {
      const user = await User.findOne({idnumber});
      console.log(user);

      const user_logs= {
        fullname: `${user.firstname} ${user.lastname}` ,
        message: 'success',
        idnumber: user.idnumber
      };

      res.status(200).json({user : user_logs})
  }
  catch (err) {
      console.log(err);
      res.status(400).json({errors: 'User not registered'});
  }
}

module.exports.register_post = (req,res) => {
    const user = new User(req.body);
    console.log(req.body);

    user.save()
    .then((result) => {
        res.render("qrcodegenerator",{user});
    })
    .catch((err) =>{
        console.log(err);
    })
}

// module.exports.qrcodegenerator_post = (req,res) => {
//     User.find()
//     .then((result) => {
//         res.render("qrcodegenerator", {users: result})
//     })
//     .catch((err) => {
//         console.log(err);
//     })
// }