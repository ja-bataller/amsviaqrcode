const {
    Router
} = require("express");
// authController.js 
const authController = require("../controllers/authController");
const router = Router();

const {
    requireAuth,
    checkAccount
} = require("../middleware/authMiddleware")

router.get("*", checkAccount);

// Open pages
router.get("/", authController.login_get);
router.get("/register", requireAuth, authController.register_get);
router.get("/logout", requireAuth, authController.logout_get);
router.get("/qrcode/:id", requireAuth, authController.qrcode_get);

// get data
router.post("/login-admin", authController.loginadmin_post);
router.post("/login-user", authController.loginuser_post);
router.post("/register-qrcode", authController.register_post);

// put
router.put("/change-password/:id", authController.changePassword_put);

module.exports = router;