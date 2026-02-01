import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser'; 

// Import Routes
import authRoutes from './routes/auth.route';
import settingRoutes from './routes/setting.route';
import companyRoutes from './routes/company.route'; 
import employeeRoutes from "./routes/employee.route"; 
import departmentRoutes from "./routes/department.route";
import attendanceRoute from "./routes/attendance.route";
import calendarRoute from "./routes/calendar.route";
import shiftRoute from "./routes/shift.route"; 
import leaveRoutes from "./routes/leave.route";
import letterRoutes from "./routes/letter.route";
import salaryRoutes from "./routes/salary.route";
import payrollRoutes from "./routes/payroll.route";
import dashboardRoutes from "./routes/dashboard.route";
import categoryRoutes from "./routes/category.route";
import superadminRoutes from "./routes/superadmin.route";
import billingRoutes from "./routes/billing.route";
import transactionRoutes from "./routes/transaction.route";

// 👇 1. IMPORT UTILS CRON
import './utils/cron'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(cors());

// ==============================
// DAFTAR ROUTES API
// ==============================
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/companies', companyRoutes); 
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/attendance", attendanceRoute);
app.use("/api/calendar", calendarRoute);
app.use("/api/leaves", leaveRoutes);
app.use("/api/letters", letterRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/payroll", payrollRoutes); // Duplikasi dihapus
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/superadmin", superadminRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/api/shifts", shiftRoute);

// Test Route
app.get('/', (req, res) => {
  res.send('Server HRIS Workify Berjalan! 🚀');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Cron Job Automatic Billing: Active ✅`);
});