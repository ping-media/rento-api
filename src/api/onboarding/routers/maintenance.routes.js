const router = require("express").Router();
const {
  createMechanic,
  listMechanics,
  updateMechanic,
} = require("../models/mechanic.model");
const {
  createMaintenanceRequest,
  updateMaintenanceRequest,
  listMaintenanceRequests,
  getMaintenanceRequest,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
  cancelMaintenanceRequest,
  addExpenseAdjustment,
  getVehicleServiceHistory,
  searchOngoingBookingVehicles,
  sendBookingVehicleForService,
} = require("../models/maintenanceRequest.model");
const {
  vehicleMonthlyReport,
  vehicleLifetimeReport,
  fleetSummaryReport,
  expenseExport,
} = require("../models/maintenanceReport.model");

const multer = require("multer");
const Authentication = require("../../../middlewares/Authentication");
const {
  uploadMaintenanceImage,
} = require("../models/uploadAndDeleteImage.modal");
const { adminOnly } = require("../../../middlewares/AdminCheck");

const MAX_IMAGE_MB = 4;

const singleUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_MB * 1024 * 1024, files: 1 },
});

// mechanics
router.post("/mechanic/create", Authentication, createMechanic);
router.get("/mechanic/list", Authentication, listMechanics);
router.post("/mechanic/update", Authentication, updateMechanic);

router.post(
  "/maintenance-request/upload-image",
  Authentication,
  singleUpload.single("image"),
  uploadMaintenanceImage,
);
router.get(
  "/maintenance-request/ongoing-vehicles",
  Authentication,
  searchOngoingBookingVehicles,
);
router.post(
  "/maintenance-request/send-booking-for-service",
  Authentication,
  sendBookingVehicleForService,
);

router.post(
  "/maintenance-request/create",
  Authentication,
  createMaintenanceRequest,
);
router.post(
  "/maintenance-request/update",
  Authentication,
  updateMaintenanceRequest,
);
router.get(
  "/maintenance-request/list",
  Authentication,
  listMaintenanceRequests,
);
router.get(
  "/maintenance-request/:requestId",
  Authentication,
  getMaintenanceRequest,
);

router.post(
  "/maintenance-request/approve",
  Authentication,
  approveMaintenanceRequest,
);
router.post(
  "/maintenance-request/reject",
  Authentication,
  rejectMaintenanceRequest,
);
router.post(
  "/maintenance-request/cancel",
  Authentication,
  cancelMaintenanceRequest,
);
router.post(
  "/maintenance-request/adjustment",
  Authentication,
  addExpenseAdjustment,
);
router.get(
  "/maintenance-request/history/:vehicleTableId",
  Authentication,
  getVehicleServiceHistory,
);

router.get(
  "/maintenance-report/vehicle-monthly",
  Authentication,
  adminOnly,
  vehicleMonthlyReport,
);
router.get(
  "/maintenance-report/vehicle-lifetime/:vehicleTableId",
  Authentication,
  adminOnly,
  vehicleLifetimeReport,
);
router.get(
  "/maintenance-report/fleet-summary",
  Authentication,
  adminOnly,
  fleetSummaryReport,
);

router.get(
  "/maintenance-report/export",
  Authentication,
  adminOnly,
  expenseExport,
);

module.exports = router;
