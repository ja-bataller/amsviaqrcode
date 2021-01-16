const jwt = require("jsonwebtoken");
const Account = require("../models/accounts")

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    // check json web token exists & verified
    if (token) {
        jwt.verify(token, "ams-qrcode", (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.redirect("/");
            } else {
                console.log(decodedToken);
                next();
            }
        })
    }
    else {
        res.redirect("/");
    }
}

// check current user
const checkAccount = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, "ams-qrcode", async (err, decodedToken) => {
      if (err) {
        res.locals.account = null;
        next();
      } else {
        let account = await Account.findById(decodedToken.id);
        res.locals.account = account;
        next();
      }
    });
  } else {
    res.locals.account = null;
    next();
  }
};

module.exports = {requireAuth, checkAccount};