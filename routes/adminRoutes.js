const {Router} = require("express");
const adminController = require("../controllers/adminController");
const router = Router();
const {requireAuth, checkAccount} = require("../middleware/authMiddleware")

router.get("*", checkAccount);

// OPEN PAGES
router.get("/admin", requireAuth, adminController.admin_get);
router.get("/logs", requireAuth, adminController.logs_get);
router.get("/records", requireAuth, adminController.records_get);
router.get("/records/export", requireAuth, adminController.recordsexport_get);
router.get("/users", requireAuth, adminController.users_get);
router.get("/about", requireAuth, adminController.about_get);
router.get("/qrcode-tester", requireAuth, adminController.qrcodetester_get);
router.get("/users/:id", requireAuth, adminController.userview_get);
router.get("/user-records/:id", requireAuth, adminController.userrecords_get);


// UPDATE USER / EMPLOYEE DATA
router.post("/update/:id", requireAuth, adminController.update_post);

// DELETE USER / EMPLOYEE DATA
router.delete("/users/:id", requireAuth, adminController.users_delete);

module.exports = router;