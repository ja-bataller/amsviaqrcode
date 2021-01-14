const {Router} = require ("express");
// adminController.js 
const adminController = require("../controllers/adminController");
const router = Router();

// Open pages
router.get("/admin", adminController.admin_get);
router.get("/logs", adminController.logs_get);
router.get("/users", adminController.users_get);
router.get("/qrcode-tester", adminController.qrcodetester_get);
router.get("/about", adminController.about_get);

module.exports = router;