import { useEffect, Suspense, lazy } from "react";
import { Navigate, Outlet, useRoutes } from "react-router-dom";
import { toast } from "react-toastify";

import useAuth from "../hooks/useAuth";
import MainLayout from "../layouts/main-layout";
import AdminStudentProvider from "../contexts/admin-student-context";

import { IS_LOGGED_IN, USER_INFO, WEBSITE_NAME } from "../utils/constants";
import { Box, Typography } from "@mui/material";
const BRAND_LOGO = "/green_wood_.png";

// Error Pages
const Page404 = lazy(() => import("../pages/Page404"));
const Login = lazy(() => import("../pages/login"));
const ChangePassword = lazy(() => import("../pages/change-password"));

// Dashboards
const AdminDashboard = lazy(() => import("../pages/admin-dashboard"));
const StudentDashboard = lazy(() => import("../pages/student-dashboard"));
const TeacherDashboard = lazy(() => import("../pages/teacher-dashboard"));
const ProcurementDashboard = lazy(() =>
  import("../sections/admin/procurement/dashboard/procurement-dashboard")
);

// Student Management
const Students = lazy(() =>
  import("../sections/admin/student-management/students/students")
);
const StudentDetail = lazy(() =>
  import("../sections/admin/student-management/students/student-detail")
);
const CreateEditStudent = lazy(() =>
  import("../sections/admin/student-management/students/create-edit-student")
);
const AddExternalStudent = lazy(() =>
  import("../sections/admin/student-management/students/add-external-student")
);
const NewAdmissions = lazy(() =>
  import("../sections/admin/student-management/new-admissions/new-admissions")
);
const NewAdmissionsDetail = lazy(() =>
  import(
    "../sections/admin/student-management/new-admissions/new-admissions-detail"
  )
);
const NewAdmission = lazy(() => import("../pages/new-admission"));

// Fee Management - Admin
const Fees = lazy(() => import("../sections/admin/fee-management/fees/fees"));
const PaymentAttempts = lazy(() =>
  import("../sections/admin/fee-management/payment-attempts/payment-attempts")
);
const Transactions = lazy(() =>
  import("../sections/admin/fee-management/transactions/transactions")
);
const FeesStructure = lazy(() =>
  import("../sections/admin/fee-management/fees-structure/fees-structure")
);
const CollectionReport = lazy(() =>
  import("../sections/admin/fee-management/collection-report/collection-report")
);
const NewAdmissionPayment = lazy(() =>
  import("../pages/new-admission-payment")
);
const FinalForm = lazy(() => import("../pages/final-form"));

// Fee Management - Student
const PendingFees = lazy(() => import("../sections/student/fees/pending-fees"));
const PaidFees = lazy(() => import("../sections/student/fees/paid-fees"));
const TransactionFees = lazy(() =>
  import("../sections/student/fees/transaction-fees")
);
const PaymentStatus = lazy(() =>
  import("../sections/student/fees/payment-status")
);
const MyProfile = lazy(() => import("../sections/student/my-profile"));
const ParentDetails = lazy(() => import("../sections/student/parent-details"));

// Report Card Module
const ReportCardDashboard = lazy(() =>
  import("../sections/admin/report-card-module/dashboard/report-card-dashboard")
);
const MarksGradeEntry = lazy(() =>
  import(
    "../sections/admin/report-card-module/marks-grade-entry/marks-grade-entry"
  )
);
const TransferCertificate = lazy(() =>
  import(
    "../sections/admin/report-card-module/transfer-certificate/transfer-certificate"
  )
);
const CharacterCertificate = lazy(() =>
  import(
    "../sections/admin/report-card-module/character-certificate/character-certificate"
  )
);
const AdmitCard = lazy(() =>
  import("../sections/admin/report-card-module/admit-card/admit-card")
);
const Subjects = lazy(() =>
  import("../sections/admin/report-card-module/subjects/subjects")
);
const DistinctSubjects = lazy(() =>
  import("../sections/admin/report-card-module/subjects/distinct-subjects")
);
const Remarks = lazy(() =>
  import("../sections/admin/report-card-module/remarks/remarks")
);
const RemarksAudit = lazy(() =>
  import("../sections/admin/report-card-module/remarks/remarks-audit")
);

// Teachers
const AllTeachers = lazy(() =>
  import("../sections/admin/teachers/all-teachers/all-teachers")
);
const TeachersAttendance = lazy(() =>
  import("../sections/admin/teachers/attendance/teachers-attendance")
);

// Accounts
const CashReceived = lazy(() =>
  import("../sections/admin/accounts/cash-received/cash-received")
);
const DebitVoucher = lazy(() =>
  import("../sections/admin/accounts/debit-voucher/debit-voucher")
);
const CreditVoucher = lazy(() =>
  import("../sections/admin/accounts/credit-voucher/credit-voucher")
);
const Banks = lazy(() => import("../sections/admin/accounts/banks/banks"));
const DailyStatements = lazy(() =>
  import("../sections/admin/accounts/daily-statements/daily-statements")
);

// Procurement
const Products = lazy(() =>
  import("../sections/admin/procurement/products/products")
);
const Suppliers = lazy(() =>
  import("../sections/admin/procurement/suppliers/suppliers")
);
const PurchaseInvoice = lazy(() =>
  import("../sections/admin/procurement/purchase-invoice/purchase-invoice")
);

// Settings
const AcademicYear = lazy(() =>
  import("../sections/admin/settings/academic-year/academic-year")
);
const Users = lazy(() => import("../sections/admin/settings/users/users"));
const Udise = lazy(() => import("../sections/admin/udise/udise"));
const Scholarship = lazy(() =>
  import("../sections/admin/scholarship/scholarship")
);
const ActionLogs = lazy(() =>
  import("../sections/admin/action-logs/action-logs")
);
const AllTxn = lazy(() => import("../sections/admin/all-txn/all-txn"));
const CreditReports = lazy(() =>
  import("../sections/admin/credit-reports/credit-reports")
);
const BankPayouts = lazy(() =>
  import("../sections/admin/bank-payouts/bank-payouts")
);
const ConcessionStudents = lazy(() =>
  import("../sections/admin/concession-students/concession-students")
);

function withAccess(accessTo = [], routeKey, route) {
  if (accessTo?.[0] === "all") {
    return [route]; // ✅ allow all routes
  }
  return accessTo?.includes(routeKey) ? [route] : [];
}

export default function Router() {
  const { isLoggedIn, logout, userInfo, accessTo } = useAuth();

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (
        event.key === IS_LOGGED_IN ||
        event.key === USER_INFO ||
        event.newValue === null
      ) {
        logout();
        toast.error("Session storage changed.");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const ADMIN_ROUTES = [
    { index: true, element: <AdminDashboard /> },
    ...withAccess(accessTo, "students", {
      path: "students",
      element: (
        <AdminStudentProvider>
          <Outlet />
        </AdminStudentProvider>
      ),
      children: [
        { index: true, element: <Students /> },
        { path: "student-detail", element: <StudentDetail /> },
        { path: "add-student", element: <CreateEditStudent /> },
        { path: "add-external-student", element: <AddExternalStudent /> },
        { path: "edit-student", element: <CreateEditStudent isEdit={true} /> },
      ],
    }),
    ...withAccess(accessTo, "admissions", {
      path: "new-admissions",
      children: [
        { index: true, element: <NewAdmissions /> },
        { path: "new-admission-detail", element: <NewAdmissionsDetail /> },
      ],
    }),
    ...withAccess(accessTo, "fees", {
      path: "fees-management",
      children: [
        { index: true, element: <Navigate to="fees" /> },
        { path: "fees", element: <Fees /> },
        { path: "payment-attempts", element: <PaymentAttempts /> },
        { path: "transactions", element: <Transactions /> },
        { path: "fees-structure", element: <FeesStructure /> },
        { path: "collection-report", element: <CollectionReport /> },
      ],
    }),
    ...withAccess(accessTo, "report", {
      path: "report-card-module",
      children: [
        { index: true, element: <Navigate to="dashboard" /> },
        { path: "dashboard", element: <ReportCardDashboard /> },
        { path: "marks-grade-entry", element: <MarksGradeEntry /> },
        { path: "transfer-certificate", element: <TransferCertificate /> },
        { path: "character-certificate", element: <CharacterCertificate /> },
        { path: "admit-card", element: <AdmitCard /> },
        { path: "subjects", element: <Subjects /> },
        { path: "subjects/distinct", element: <DistinctSubjects /> },
        { path: "remarks", element: <Remarks /> },
        { path: "remarks-audit", element: <RemarksAudit /> },
      ],
    }),
    ...withAccess(accessTo, "teachers", {
      path: "teachers",
      children: [
        { index: true, element: <Navigate to="all-teachers" /> },
        { path: "all-teachers", element: <AllTeachers /> },
        { path: "attendance", element: <TeachersAttendance /> },
      ],
    }),
    ...withAccess(accessTo, "accounts", {
      path: "accounts",
      children: [
        { index: true, element: <Navigate to="debit-voucher" /> },
        { path: "cash-received", element: <CashReceived /> },
        { path: "debit-voucher", element: <DebitVoucher /> },
        { path: "credit-voucher", element: <CreditVoucher /> },
        { path: "banks", element: <Banks /> },
        { path: "daily-statements", element: <DailyStatements /> },
      ],
    }),
    ...withAccess(accessTo, "academics", {
      path: "academic-year",
      element: <AcademicYear />,
    }),
    ...withAccess(accessTo, "users", {
      path: "users",
      element: <Users />,
    }),
    ...withAccess(accessTo, "students", {
      path: "udise",
      element: <Udise />,
    }),
    ...withAccess(accessTo, "students", {
      path: "scholarship",
      element: <Scholarship />,
    }),
    ...withAccess(accessTo, "students", {
      path: "logs",
      element: <ActionLogs />,
    }),
    ...withAccess(accessTo, "students", {
      path: "all-txn",
      element: <AllTxn />,
    }),
    ...withAccess(accessTo, "students", {
      path: "credit-reports",
      element: <CreditReports />,
    }),
    ...withAccess(accessTo, "students", {
      path: "bank-payouts",
      element: <BankPayouts />,
    }),
    ...withAccess(accessTo, "students", {
      path: "concession-students",
      element: <ConcessionStudents />,
    }),
    { path: "change-password", element: <ChangePassword /> },
  ].filter(Boolean);

  const STUDENT_ROUTES = [
    { index: true, element: <StudentDashboard /> },
    { path: "my-profile", element: <MyProfile /> },
    { path: "parent-details", element: <ParentDetails /> },
    {
      path: "fees",
      children: [
        { index: true, element: <Navigate to="pending-fees" /> },
        {
          path: "pending-fees",
          children: [
            { index: true, element: <PendingFees /> },
            { path: "payment-status", element: <PaymentStatus /> },
          ],
        },
        { path: "paid-fees", element: <PaidFees /> },
        { path: "transactions", element: <TransactionFees /> },
      ],
    },
    { path: "change-password", element: <ChangePassword /> },
  ];

  const TEACHER_ROUTES = [
    { index: true, element: <TeacherDashboard /> },
    { path: "change-password", element: <ChangePassword /> },
  ];

  const PROCUREMENT_ROUTES = [
    { index: true, element: <ProcurementDashboard /> },
    { path: "products", element: <Products /> },
    { path: "suppliers", element: <Suppliers /> },
    { path: "purchase-invoice", element: <PurchaseInvoice /> },
    { path: "change-password", element: <ChangePassword /> },
  ];

  const routes = useRoutes([
    {
      path: "/",
      element: isLoggedIn ? <MainLayout /> : <Navigate to="/login" replace />,
      children:
        userInfo?.role === "admin"
          ? ADMIN_ROUTES
          : userInfo?.role === "student"
          ? STUDENT_ROUTES
          : userInfo?.role === "teacher"
          ? TEACHER_ROUTES
          : userInfo?.role === "procurement"
          ? PROCUREMENT_ROUTES
          : [{ path: "*", element: <Navigate to="/404" replace /> }],
    },
    {
      path: "/login",
      element: isLoggedIn ? <Navigate to="/" replace /> : <Login />,
    },
    {
      path: "/admissions",
      children: [
        { index: true, element: <NewAdmission /> },
        { path: "final_form", element: <FinalForm /> },
      ],
    },
    {
      path: "/payment",
      element: <NewAdmissionPayment />,
    },
    {
      path: "/payment-status",
      element: <PaymentStatus isPublic={true} />,
    },
    { path: "404", element: <Page404 /> },
    { path: "*", element: <Navigate to="/404" replace /> },
  ]);

  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            flexDirection: "column",
            gap: 1,
            textAlign: "center",
          }}
        >
          {/* Background */}
          <Box
            component="img"
            src={BRAND_LOGO}
            sx={{
              width: { xs: "80vw" },
              maxWidth: "250px",
              objectFit: "cover",
            }}
          ></Box>
          <Typography variant="h3">{WEBSITE_NAME}</Typography>
        </Box>
      }
    >
      {routes}
    </Suspense>
  );
}
