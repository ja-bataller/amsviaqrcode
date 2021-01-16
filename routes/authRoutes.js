const {Router} = require ("express");
// authController.js 
const authController = require("../controllers/authController");
const router = Router();

const {requireAuth, checkAccount} = require ("../middleware/authMiddleware")

router.get("*", checkAccount);

// Open pages
router.get("/", authController.login_get);
router.get("/register", requireAuth, authController.register_get);
// router.get("/qrcode", requireAuth, authController.qrcodegenerator_get);
router.get("/logout", requireAuth, authController.logout_get);

// get data
router.post("/login-admin", authController.loginadmin_post);
router.post("/login-user", authController.loginuser_post);
router.post("/register", authController.register_post);
// router.post("/qrcode", authController.qrcodegenerator_post);

module.exports = router;