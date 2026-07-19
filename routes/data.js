import express from "express";
import {
  getSales,
  getSalesLapse,
  getSalesPlan,
  saveCompany,
  updateCompany,
  deleteCompany,
  getCompanies,
  companyVerify,
  getStatistics,
  updateSales,
  deleteSales,
  addCompanion,
  deleteCompanion,
  addGroup,
  deleteGroup,
  createReport,
  uploadCompanies,
  getMainUsers,
  getAllUsers,
  updateApproval,
  updateSuspended
} from "../controllers/data.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();


/* READ */
router.post("/saveCompany", verifyToken, saveCompany);
router.post("/searchCompany", verifyToken, getCompanies);
router.post("/updateCompany", verifyToken, updateCompany);
router.post("/deleteCompany", verifyToken, deleteCompany);

router.post("/searchSalesNormal", verifyToken, getSales);
router.post("/searchSalesLapse", verifyToken, getSalesLapse);
router.post("/deleteSales", verifyToken, deleteSales);

router.post("/companyVerify", verifyToken, companyVerify);
router.post("/statistics", verifyToken, getStatistics);

router.post("/getMainUsers", verifyToken, getMainUsers);
router.post("/addCompanion", verifyToken, addCompanion);
router.post("/deleteCompanion", verifyToken, deleteCompanion);
router.post("/addGroup", verifyToken, addGroup);
router.post("/deleteGroup", verifyToken, deleteGroup);

router.post("/uploadCompanies", verifyToken, uploadCompanies);
router.post("/createReport", verifyToken, createReport);
router.post("/getAllUsers", verifyToken, getAllUsers);
router.post("/updateApproval", verifyToken, updateApproval);
router.post("/updateSuspended", verifyToken, updateSuspended);




export default router;
