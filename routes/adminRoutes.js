const {
    Router
} = require("express");
// adminController.js 
const adminController = require("../controllers/adminController");
const router = Router();

const {
    requireAuth,
    checkAccount
} = require("../middleware/authMiddleware")

router.get("*", checkAccount);

// Open pages
router.get("/admin", requireAuth, adminController.admin_get);
router.get("/logs", requireAuth, adminController.logs_get);
router.get("/users", requireAuth, adminController.users_get);
router.get("/about", requireAuth, adminController.about_get);
router.get("/qrcode-tester", requireAuth, adminController.qrcodetester_get);
router.get("/users/:id", requireAuth, adminController.userview_get);


// Get Data
router.post("/update/:id", requireAuth, adminController.update_post);

// Delete Users
router.delete("/users/:id", requireAuth, adminController.users_delete);

module.exports = router;