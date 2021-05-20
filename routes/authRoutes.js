const {Router} = require("express");
const authController = require("../controllers/authController");
const router = Router();
const {requireAuth, checkAccount} = require("../middleware/authMiddleware")

router.get("*", checkAccount);



// OPEN PAGES
router.get("/", authController.login_get);
router.get("/register", requireAuth, authController.register_get);
router.get("/logout", requireAuth, authController.logout_get);
router.get("/qrcode/:id", requireAuth, authController.qrcode_get);

// GET DATA
router.post("/login-admin", authController.loginadmin_post);
router.post("/chart", authController.chart_post);
router.post("/login-user", authController.loginuser_post);
router.post("/register-qrcode", authController.register_post);
router.post("/absents", requireAuth, authController.absents_post);
router.post("/leave", requireAuth, authController.leave_post);
router.post("/late", authController.late_post);

// CHANGE ADMINISTRATOR ACCOUNT PASSWORD
router.put("/change-password/:id", authController.changePassword_put);

// CREATE FAKER USERS / EMPLOYEES
router.get("/seed/:count", requireAuth, authController.seedusers_get);

// DELETE USERS, LOGS, RECORDS DATA IN MONGO DB
router.get("/drop/collection", requireAuth, authController.seeddrop_get);

module.exports = router;