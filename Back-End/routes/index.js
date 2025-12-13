const router = require("express").Router();
const adminRoute = require("./adminRoute");
const userRoute = require("./userRoute");

router.use("/admins", adminRoute);
router.use("/users", userRoute);
module.exports = router;
