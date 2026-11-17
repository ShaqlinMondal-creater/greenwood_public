export const USER_INFO = "userInfo";
export const IS_LOGGED_IN = "isLoggedIn";
export const STUDENT_AADHAAR_WARN_LOGIN = "student_aadhaar_warn_login";
export const STUDENT_AADHAAR_WARN_PAYMENT = "student_aadhaar_warn_payment";

export const WEBSITE_NAME = "GREENWOOD PUBLIC SCHOOL";
export const BRAND_SHORT_NAME = "GREENWOOD";

export const DEFAULT_LIMIT = 10;

export const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100, 200];

export const ADMIN_SIDEBAR_ITEMS = [
  {
    _id: 1,
    displayName: "Dashboard",
    linkName: "/",
    iconName: "dashboard",
  },
  {
    _id: 21,
    displayName: "Students",
    linkName: "/students",
    iconName: "students",
    accessKey: "students",
  },
  {
    _id: 22,
    displayName: "New Admissions",
    linkName: "/new-admissions",
    iconName: "new_admissions",
    accessKey: "admissions",
  },

  {
    _id: 3,
    displayName: "Fees Management",
    iconName: "fee_management",
    accessKey: "fees",
    children: [
      {
        _id: 31,
        displayName: "Fees",
        linkName: "/fees-management/fees",
      },
      {
        _id: 32,
        displayName: "Payment Attempts",
        linkName: "/fees-management/payment-attempts",
      },
      {
        _id: 33,
        displayName: "Transactions",
        linkName: "/fees-management/transactions",
      },
      {
        _id: 36,
        displayName: "Fees Structure",
        linkName: "/fees-management/fees-structure",
      },
      {
        _id: 35,
        displayName: "Collection Report",
        linkName: "/fees-management/collection-report",
      },
    ],
  },
  {
    _id: 4,
    displayName: "Report Card",
    iconName: "report_card_module",
    accessKey: "report",
    children: [
      {
        _id: 41,
        displayName: "Dashboard",
        linkName: "/report-card-module/dashboard",
      },
      // {
      //   _id: 42,
      //   displayName: "Marks/Grade Entry",
      //   linkName: "/report-card-module/marks-grade-entry",
      // },
      // {
      //   _id: 43,
      //   displayName: "Attendance",
      //   linkName: "/report-card-module/attendance",
      // },
      {
        _id: 44,
        displayName: "Transfer Certificate",
        linkName: "/report-card-module/transfer-certificate",
      },
      {
        _id: 45,
        displayName: "Character Certificate",
        linkName: "/report-card-module/character-certificate",
      },
      {
        _id: 47,
        displayName: "Admit Card",
        linkName: "/report-card-module/admit-card",
      },
      {
        _id: 48,
        displayName: "Subjects",
        linkName: "/report-card-module/subjects",
      },
      {
        _id: 49,
        displayName: "Remarks",
        linkName: "/report-card-module/remarks",
      },
      // {
      //   _id: 46,
      //   displayName: "Bulk Character Certificate",
      //   linkName: "/report-card-module/bulk-character-certificate",
      // },
    ],
  },
  {
    _id: 5,
    displayName: "Teachers",
    iconName: "teachers",
    accessKey: "teachers",
    children: [
      {
        _id: 51,
        displayName: "All Teachers",
        linkName: "/teachers/all-teachers",
      },
      {
        _id: 52,
        displayName: "Class Timetable",
        linkName: "/teachers/class-timetable",
      },
      {
        _id: 53,
        displayName: "Attendance",
        linkName: "/teachers/attendance",
      },
    ],
  },
  {
    _id: 6,
    displayName: "Accounts",
    iconName: "accounts",
    accessKey: "accounts",
    children: [
      {
        _id: 61,
        displayName: "Cash Received",
        linkName: "/accounts/cash-received",
      },
      {
        _id: 62,
        displayName: "Debit Voucher",
        linkName: "/accounts/debit-voucher",
      },
      {
        _id: 63,
        displayName: "Credit Voucher",
        linkName: "/accounts/credit-voucher",
      },
      {
        _id: 64,
        displayName: "Bank Transactions",
        linkName: "/accounts/banks",
      },
      {
        _id: 64,
        displayName: "Daily Statements",
        linkName: "/accounts/daily-statements",
      },
    ],
  },
  {
    _id: 7,
    displayName: "Academic Year",
    linkName: "/academic-year",
    iconName: "academic-year",
    accessKey: "academics",
  },
  {
    _id: 8,
    displayName: "Users",
    linkName: "/users",
    iconName: "users",
    accessKey: "users",
  },
  {
    _id: 9,
    displayName: "UDISE",
    linkName: "/udise",
    iconName: "udise",
    accessKey: "students",
  },
  {
    _id: 91,
    displayName: "Scholarship",
    linkName: "/scholarship",
    iconName: "scholarship",
    accessKey: "students",
  },
  {
    _id: 10,
    displayName: "Actions",
    iconName: "actions",
    accessKey: "students",
    children: [
      {
        _id: 101,
        displayName: "Logs",
        linkName: "/logs",
      },
      {
        _id: 102,
        displayName: "All TXN",
        linkName: "/all-txn",
      },
      {
        _id: 103,
        displayName: "Credit Reports",
        linkName: "/credit-reports",
      },
      {
        _id: 104,
        displayName: "Bank Payouts",
        linkName: "/bank-payouts",
      },
      {
        _id: 105,
        displayName: "Concession Students",
        linkName: "/concession-students",
      },
    ],
  },
];

export const STUDENT_SIDEBAR_ITEMS = [
  {
    _id: 1,
    displayName: "Dashboard",
    linkName: "/",
    iconName: "dashboard",
  },
  {
    _id: 2,
    displayName: "My Profile",
    linkName: "/my-profile",
    iconName: "profile",
  },
  {
    _id: 3,
    displayName: "Parent Details",
    linkName: "/parent-details",
    iconName: "parent_details",
  },
  {
    _id: 4,
    displayName: "Fees",
    iconName: "fee_management",
    children: [
      {
        _id: 21,
        displayName: "Pending Fees",
        linkName: "/fees/pending-fees",
      },
      {
        _id: 22,
        displayName: "Paid Fees",
        linkName: "/fees/paid-fees",
      },
      {
        _id: 23,
        displayName: "Transactions",
        linkName: "/fees/transactions",
      },
    ],
  },
];

export const TEACHER_SIDEBAR_ITEMS = [
  {
    _id: 1,
    displayName: "Dashboard",
    linkName: "/",
    iconName: "dashboard",
  },
];
export const PROCUREMENT_SIDEBAR_ITEMS = [
  {
    _id: 1,
    displayName: "Dashboard",
    linkName: "/",
    iconName: "dashboard",
  },
  {
    _id: 2,
    displayName: "Products",
    linkName: "/products",
    iconName: "procurement_products",
  },
  {
    _id: 3,
    displayName: "Suppliers",
    linkName: "/suppliers",
    iconName: "procurement_suppliers",
  },
  {
    _id: 3,
    displayName: "Purchase Invoice",
    linkName: "/purchase-invoice",
    iconName: "procurement_purchase_invoice",
  },
];

export const TYPE_LIST = [
  { label: "Admission Fee", value: "admission" },
  { label: "Monthly Fee", value: "monthly" },
  { label: "One Time Fee", value: "one_time" },
  { label: "Recurring Fee", value: "recurring" },
];

// Default fee plan names for bulk create (by fee type)
export const DEFAULT_BULK_FEE_PLAN_NAMES = {
  admission: [
    "Admission fees Class Nur to III",
    "Admission fee Class IX & XI",
    "Admission fees Class IV to VIII",
    "Re Admission Fee",
    "Admission Fee Class XI (SGJEPS)/MSB",
  ],
  monthly: [""],
  one_time: [""],
  recurring: [""],
};

export const NAV_OPTIONS = [
  { _id: "1", label: "Home", link: "/" },
  {
    _id: "2",
    label: "About Us",
    link: "#",
    redirect: true,
  },
  {
    _id: "3",
    label: "Contact Us",
    link: "#",
    redirect: true,
  },
  { _id: "4", label: "New Admission", link: "/admissions" },
];

export const CLASS_LIST = [
  { cg_id: "nursery", cg_name: "Nursery" },
  { cg_id: "lkg", cg_name: "LKG" },
  { cg_id: "ukg", cg_name: "UKG" },
  { cg_id: "class_1", cg_name: "1st" },
  { cg_id: "class_2", cg_name: "2nd" },
  { cg_id: "class_3", cg_name: "3rd" },
  { cg_id: "class_4", cg_name: "4th" },
  { cg_id: "class_5", cg_name: "5th" },
  { cg_id: "class_6", cg_name: "6th" },
  { cg_id: "class_7", cg_name: "7th" },
  { cg_id: "class_8", cg_name: "8th" },
  { cg_id: "class_9", cg_name: "9th" },
  { cg_id: "class_11", cg_name: "11th" },
];

export const BANK_LIST = [
  "State Bank of India",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "Bank of India",
  "Indian Bank",
  "Central Bank of India",
  "Indian Overseas Bank",
  "UCO Bank",
  "Bank of Maharashtra",
  "Punjab & Sind Bank",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "IndusInd Bank",
  "Yes Bank",
  "IDFC First Bank",
  "Federal Bank",
  "IDBI Bank",
  "RBL Bank",
  "Bandhan Bank",
  "South Indian Bank",
  "Karur Vysya Bank",
  "City Union Bank",
  "CSB Bank",
  "DCB Bank",
  "Jammu & Kashmir Bank",
  "Karnataka Bank",
  "Tamilnad Mercantile Bank",
  "Nainital Bank",
  "AU Small Finance Bank",
  "Equitas Small Finance Bank",
  "Ujjivan Small Finance Bank",
];

export const CAPITALIZE = (text) => {
  return text
    ?.split(/[-\s]/)
    ?.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    ?.join(" ");
};

export const REMOVE_UNDERSCORE = (text) => {
  return text
    ?.split(/[_\s]/)
    ?.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    ?.join(" ");
};

export const FORMAT_INDIAN_CURRENCY = (amount) => {
  const num = Number(amount);
  if (isNaN(num) || num === 0) return "";
  return new Intl.NumberFormat("en-IN").format(num);
};

export function emptyRows(page, rowsPerPage, arrayLength) {
  if (rowsPerPage > 25) return 0;
  return page ? Math.max(0, (1 + page) * rowsPerPage - arrayLength) : 0;
}

/**
 * Handles numeric input for form fields
 * Ensures only positive numbers are allowed, defaults to 0 for invalid inputs
 * @param {string} value - The input value to process
 * @returns {number} - The processed numeric value
 */
export const handleNumericInput = (value) => {
  // Handle empty string or invalid input
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  // Remove any non-numeric characters except decimal point
  const cleanValue = value.replace(/[^0-9.]/g, "");

  // Convert to number
  const numericValue = parseFloat(cleanValue);

  // Check if it's a valid number and not negative
  if (isNaN(numericValue) || numericValue < 0) {
    return 0;
  }

  // Return the numeric value
  return numericValue;
};

export const splitNameToFirstAndLast = (fullName) => {
  if (!fullName || typeof fullName !== "string") {
    return { firstName: "", lastName: "." }; // handle invalid input safely
  }

  const nameParts = fullName.trim().split(/\s+/); // splits on 1+ spaces

  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: "." };
  }

  const lastName = nameParts.pop();
  const firstName = nameParts.join(" ");
  return { firstName, lastName };
};

const CREATE_ERROR_RESPONSE = (code, message) => ({
  code,
  data: null,
  status: false,
  message,
});

export const GET_ERROR = (error) => {
  const message = error?.response?.data?.message || error?.message;

  if (!error?.response) {
    if (error?.code === "ERR_NETWORK") {
      if (!navigator.onLine) {
        return CREATE_ERROR_RESPONSE(
          1000,
          "You are offline. Please check your internet connection."
        );
      } else {
        return CREATE_ERROR_RESPONSE(1001, "Some error occurred.");
      }
    }
  }

  return CREATE_ERROR_RESPONSE(error?.response?.status, message);
};
