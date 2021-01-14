const {Router} = require ("express");
// authController.js 
const authController = require("../controllers/authController");
const router = Router();

// Open pages
router.get("/", authController.login_get);
router.get("/register", authController.register_get);
router.get("/qrcode", authController.qrcodegenerator_get);

// get data
router.post("/", authController.login_post);
router.post("/register", authController.register_post);
router.post("/qrcode", authController.qrcodegenerator_post);

module.exports = router;