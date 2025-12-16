const router = require("express").Router();
const adminRoute = require("./adminRoute");
const userRoute = require("./userRoute");
const leadRoute = require("./leadRoute");

router.use("/admins", adminRoute);
router.use("/users", userRoute);
router.use("/leads", leadRoute);
module.exports = router;
