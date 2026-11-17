import { useState, Fragment } from "react";
import { Helmet } from "react-helmet-async";
import dayjs from "dayjs";
import { toast } from "react-toastify";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import Typography from "@mui/material/Typography";
import TableContainer from "@mui/material/TableContainer";
import TablePagination from "@mui/material/TablePagination";
import CircularProgress from "@mui/material/CircularProgress";
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  Collapse,
  IconButton,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import {
  CheckBox,
  CheckBoxOutlineBlank,
  ExpandLessRounded,
  ExpandMoreRounded,
  KeyboardArrowDownRounded,
  KeyboardArrowRightRounded,
  RefreshRounded,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";

import Loader from "../../../../components/loader/loader";
import MessageBox from "../../../../components/error/message-box";
import TableNoData from "../../../../components/table/table-no-data";
import Iconify from "../../../../components/iconify/iconify";
import { useGetApi } from "../../../../hooks/useGetApi";
import useAuth from "../../../../hooks/useAuth";
import {
  getAllAcademicYears,
  getClasses,
} from "../../../../services/admin/students-management.service";
import {
  getCollectionReport,
  generateCollectionReportPdf,
} from "../../../../services/admin/collection-report.service";
import {
  DEFAULT_LIMIT,
  FORMAT_INDIAN_CURRENCY,
  ROWS_PER_PAGE_OPTIONS,
} from "../../../../utils/constants";

const FEE_STATUS_OPTIONS = [
  { label: "Paid", value: "paid" },
  { label: "Unpaid", value: "unpaid" },
  { label: "Both", value: "both" },
];

const HEAD_LABEL = [
  { id: "class_name", label: "Class / Section", width: "26%" },
  { id: "fee_count", label: "Count", align: "center" },
  { id: "admission_fees", label: "Admission Fees", align: "right" },
  { id: "annual_charges", label: "Annual Charges", align: "right" },
  { id: "tuition_fees", label: "Tuition Fees", align: "right" },
  { id: "late_fees", label: "Late Fees", align: "right" },
  { id: "others_fees", label: "One Time Fees", align: "right" },
  {
    id: "total_collected",
    label: "Total Collected",
    align: "right",
    emphasize: true,
  },
];

const SUMMARY_CARDS = [
  {
    key: "total_collection",
    countKey: "total_fee_count",
    label: "Total Collection",
    color: "#1565c0",
  },
  {
    key: "total_admission_fees",
    countKey: "admission_fee_count",
    label: "Admission Fees",
    color: "#6a1b9a",
  },
  {
    key: "total_annual_charges",
    countKey: "annual_fee_count",
    label: "Annual Charges",
    color: "#00838f",
  },
  {
    key: "total_tuition_fees",
    countKey: "tuition_fee_count",
    label: "Tuition Fees",
    color: "#2e7d32",
  },
  {
    key: "late_fees",
    countKey: "late_fee_count",
    label: "Late Fees",
    color: "#c62828",
  },
  {
    key: "others_fees",
    countKey: "others_fee_count",
    label: "One Time Fees",
    color: "#ef6c00",
  },
];

const formatAmount = (amount) => FORMAT_INDIAN_CURRENCY(amount) || "0";

const emptySummary = {
  total_collection: 0,
  total_admission_fees: 0,
  total_annual_charges: 0,
  total_tuition_fees: 0,
  late_fees: 0,
  others_fees: 0,
  total_fee_count: 0,
  admission_fee_count: 0,
  annual_fee_count: 0,
  tuition_fee_count: 0,
  late_fee_count: 0,
  others_fee_count: 0,
  payment_modes: [],
};

const AmountCell = ({
  amount,
  align = "right",
  bold = false,
  muted = false,
  color,
  emphasize = false,
}) => (
  <TableCell
    align={align}
    sx={{
      fontWeight: emphasize ? 800 : bold ? 700 : 400,
      fontSize: emphasize ? "0.95rem" : undefined,
      color: color || (emphasize ? "#1565c0" : muted ? "text.secondary" : "inherit"),
      whiteSpace: "nowrap",
    }}
  >
    {formatAmount(amount)}
  </TableCell>
);

const OthersExpandCell = ({
  amount,
  open,
  onToggle,
  disabled,
}) => (
  <TableCell align="right">
    {!disabled ? (
      <Box
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 0.5,
          cursor: "pointer",
          color: "warning.dark",
          fontWeight: 600,
          userSelect: "none",
          "&:hover": { textDecoration: "underline" },
        }}
      >
        {formatAmount(amount)}
        <IconButton size="small" sx={{ p: 0.25 }}>
          {open ? (
            <ExpandLessRounded fontSize="small" />
          ) : (
            <ExpandMoreRounded fontSize="small" />
          )}
        </IconButton>
      </Box>
    ) : (
      formatAmount(amount)
    )}
  </TableCell>
);

const TuitionExpandCell = ({
  amount,
  open,
  onToggle,
  disabled,
  bold = false,
}) => (
  <TableCell
    align="right"
    sx={{ fontWeight: bold ? 700 : 400, whiteSpace: "nowrap" }}
  >
    {!disabled ? (
      <Box
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 0.5,
          cursor: "pointer",
          color: "#2e7d32",
          fontWeight: bold ? 700 : 600,
          userSelect: "none",
          "&:hover": { textDecoration: "underline" },
        }}
      >
        {formatAmount(amount)}
        <IconButton size="small" sx={{ p: 0.25 }}>
          {open ? (
            <ExpandLessRounded fontSize="small" />
          ) : (
            <ExpandMoreRounded fontSize="small" />
          )}
        </IconButton>
      </Box>
    ) : (
      formatAmount(amount)
    )}
  </TableCell>
);

const FeeDetailBlock = ({
  open,
  title,
  detail,
  colSpan,
  rowKey,
  heading,
  bgcolor = "#fffaf3",
}) => {
  if (!detail?.length) return null;

  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        sx={{ py: 0, borderBottom: open ? undefined : 0, bgcolor }}
      >
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box sx={{ py: 1.5, px: 2 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: "text.secondary",
                display: "block",
                mb: 1,
              }}
            >
              {heading} — {title}
            </Typography>
            <Table size="small" sx={{ maxWidth: 560 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Fee Name</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Count
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Amount
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detail.map((item, i) => (
                  <TableRow key={`${rowKey}-d-${item.fee_name}-${i}`}>
                    <TableCell>{item.fee_name}</TableCell>
                    <TableCell align="center">{item.fee_count ?? 0}</TableCell>
                    <TableCell align="right">
                      {formatAmount(item.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Collapse>
      </TableCell>
    </TableRow>
  );
};

export default function CollectionReport() {
  const { userInfo, logout } = useAuth();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_LIMIT);
  const [academicYear, setAcademicYear] = useState({
    ay_id: userInfo?.ay_id,
    ay_name: userInfo?.ay_name,
  });
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [feeStatus, setFeeStatus] = useState(FEE_STATUS_OPTIONS[0]);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedOthers, setExpandedOthers] = useState({});
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const selectedCgIds = (selectedClasses || [])
    .map((c) => c?.id || c?.cg_id)
    .filter(Boolean);

  const {
    dataList: reportRows,
    dataCount: reportCount,
    allResponse,
    isLoading,
    isError,
    errorMessage,
    refetch,
  } = useGetApi({
    apiFunction: getCollectionReport,
    body: {
      ay_id: academicYear?.ay_id || academicYear?.id || undefined,
      ...(selectedCgIds.length
        ? { cg_ids: selectedCgIds, cg_id: selectedCgIds.join(",") }
        : {}),
      fee_status: feeStatus?.value || "paid",
      date_from: dateFrom ? dayjs(dateFrom).format("YYYY-MM-DD") : "",
      date_to: dateTo ? dayjs(dateTo).format("YYYY-MM-DD") : "",
      offset: page * rowsPerPage,
      limit: rowsPerPage,
    },
    dependencies: [
      academicYear,
      page,
      rowsPerPage,
      selectedClasses,
      feeStatus,
      dateFrom,
      dateTo,
    ],
  });

  const { dataList: classList } = useGetApi({
    apiFunction: getClasses,
    body: {
      ay_id: academicYear?.ay_id || academicYear?.id || userInfo?.ay_id,
    },
    dependencies: [academicYear],
  });

  const { dataList: academicYearList } = useGetApi({
    apiFunction: getAllAcademicYears,
  });

  const groups = Array.isArray(reportRows) ? reportRows : [];
  const summary = {
    ...emptySummary,
    ...(allResponse?.summary || {}),
  };
  const oneTimeBreakups = Array.isArray(summary?.others_detail)
    ? summary.others_detail.filter((item) => (item?.amount || 0) > 0)
    : [];

  const monthlyBreakups = Array.isArray(summary?.monthly_detail)
    ? summary.monthly_detail.filter((item) => (item?.amount || 0) > 0)
    : [];
  const paymentModes = Array.isArray(summary?.payment_modes)
    ? summary.payment_modes.filter((item) => (item?.amount || 0) > 0)
    : [];
  const tableHeads = [
    ...HEAD_LABEL,
    ...paymentModes.map((item) => ({
      id: `pm_${item.mode}`,
      label: item.label,
      align: "right",
      mode: item.mode,
      payment: true,
    })),
  ];
  const notFound = !isLoading && !groups.length;

  const paymentModeAmount = (row, mode) => {
    const hit = (row?.payment_modes || []).find((item) => item.mode === mode);
    return hit?.amount || 0;
  };

  const handleChangePage = (_event, newPage) => {
    if (!isLoading) setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const resetExpands = () => {
    setExpandedGroups({});
    setExpandedOthers({});
  };

  const toggleGroup = (groupKey) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const toggleOthers = (key) => {
    setExpandedOthers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const buildFilterBody = () => ({
    ay_id: academicYear?.ay_id || academicYear?.id || undefined,
    ...(selectedCgIds.length
      ? { cg_ids: selectedCgIds, cg_id: selectedCgIds.join(",") }
      : {}),
    fee_status: feeStatus?.value || "paid",
    date_from: dateFrom ? dayjs(dateFrom).format("YYYY-MM-DD") : "",
    date_to: dateTo ? dayjs(dateTo).format("YYYY-MM-DD") : "",
  });

  const handleGenerateReport = async () => {
    if ((dateFrom && !dateTo) || (!dateFrom && dateTo)) {
      toast.error("Please select both Date From and Date To.");
      return;
    }

    setIsPdfLoading(true);
    const response = await generateCollectionReportPdf(buildFilterBody());
    setIsPdfLoading(false);

    if (response?.code === 200) {
      const link = document.createElement("a");
      link.href = response?.data?.file_url || "";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(response?.message || "Report generated successfully!");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Failed to generate report.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Collection Report | GREENWOOD</title>
      </Helmet>

      <Card sx={{ p: 2, width: "100%" }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Collection Report
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(6, 1fr)",
            },
            gap: 1.5,
            mb: 2,
          }}
        >
          {SUMMARY_CARDS.map((card) => (
            <Box
              key={card.key}
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                minHeight: 72,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
              >
                {card.label}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: card.color, lineHeight: 1.2 }}
              >
                ₹ {formatAmount(summary[card.key])}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block", mt: 0.5 }}
              >
                Count: {Number(summary[card.countKey] || 0).toLocaleString("en-IN")}
              </Typography>
            </Box>
          ))}
        </Box>

        {paymentModes.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 0.5, fontWeight: 700, color: "text.primary" }}
            >
              Payment Method
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              PG / Draft / NEFT here is incoming money for this date range —
              same as Credit Reports. Compare PG with the bank. This is not a
              split of Total Collection (most fees are later posted from wallet).
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 1.25,
                width: "100%",
              }}
            >
              {paymentModes.map((item) => (
                <Box
                  key={item.mode}
                  sx={{
                    p: 1.25,
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor:
                      item.mode === "pg" ? "primary.light" : "divider",
                    bgcolor: item.mode === "pg" ? "#e3f2fd" : "background.paper",
                    minHeight: 72,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      color: item.mode === "pg" ? "#1565c0" : "text.primary",
                      lineHeight: 1.2,
                    }}
                  >
                    ₹ {formatAmount(item.amount)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block", mt: 0.5 }}
                  >
                    Credits:{" "}
                    {Number(item.fee_count || 0).toLocaleString("en-IN")}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {oneTimeBreakups.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: 700, color: "text.primary" }}
            >
              One Time Fees — Groupwise Breakup
            </Typography>
            <Box
              sx={{
                display: "grid",
                // Wrap to next row by available width (not a fixed column count)
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 1.25,
                width: "100%",
              }}
            >
              {oneTimeBreakups.map((item) => (
                <Box
                  key={item.fee_name}
                  sx={{
                    p: 1.25,
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: "warning.light",
                    bgcolor: "#fffaf3",
                    minHeight: 72,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      mb: 0.5,
                      lineHeight: 1.3,
                      fontWeight: 600,
                      wordBreak: "break-word",
                    }}
                    title={item.fee_name}
                  >
                    {item.fee_name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: "#ef6c00", lineHeight: 1.2 }}
                  >
                    ₹ {formatAmount(item.amount)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block", mt: 0.35 }}
                  >
                    Count:{" "}
                    {Number(item.fee_count || 0).toLocaleString("en-IN")}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {monthlyBreakups.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 0.5, fontWeight: 700, color: "text.primary" }}
            >
              Monthly Fees — Groupwise Breakup
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: "block", mb: 1, color: "text.secondary" }}
            >
              Subset of Tuition Fees (already included in Tuition Fees / Total)
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 1.25,
                width: "100%",
              }}
            >
              {monthlyBreakups.map((item) => (
                <Box
                  key={item.fee_name}
                  sx={{
                    p: 1.25,
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: "#a5d6a7",
                    bgcolor: "#f1f8f2",
                    minHeight: 72,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      mb: 0.5,
                      lineHeight: 1.3,
                      fontWeight: 600,
                      wordBreak: "break-word",
                    }}
                    title={item.fee_name}
                  >
                    {item.fee_name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: "#2e7d32", lineHeight: 1.2 }}
                  >
                    ₹ {formatAmount(item.amount)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block", mt: 0.35 }}
                  >
                    Count:{" "}
                    {Number(item.fee_count || 0).toLocaleString("en-IN")}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 2,
            mb: 2,
          }}
        >
          <Autocomplete
            options={academicYearList || []}
            getOptionLabel={(option) => option?.ay_name || ""}
            value={academicYear}
            onChange={(_e, newValue) => {
              setAcademicYear(newValue);
              setSelectedClasses([]);
              setPage(0);
              resetExpands();
            }}
            sx={{ width: { xs: "100%", sm: 180 } }}
            renderInput={(params) => (
              <TextField {...params} label="Academic Year" size="small" />
            )}
          />

          <Autocomplete
            multiple
            disableCloseOnSelect
            limitTags={2}
            options={classList || []}
            getOptionLabel={(option) => option?.cg_name || ""}
            value={selectedClasses}
            onChange={(_e, newValue) => {
              setSelectedClasses(newValue || []);
              setPage(0);
              resetExpands();
            }}
            sx={{ minWidth: { xs: "100%", sm: 260 }, maxWidth: 420 }}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option?.id || option?.cg_id}>
                <Checkbox
                  size="small"
                  icon={<CheckBoxOutlineBlank fontSize="small" />}
                  checkedIcon={<CheckBox fontSize="small" />}
                  checked={selected}
                  sx={{ mr: 1 }}
                />
                {option?.cg_name || ""}
              </li>
            )}
            renderTags={(selected, getTagProps) =>
              selected.map((option, index) => (
                <Chip
                  label={option?.cg_name}
                  size="small"
                  {...getTagProps({ index })}
                  key={option?.id || option?.cg_id || index}
                />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label="Class Name" size="small" />
            )}
          />

          <Autocomplete
            options={FEE_STATUS_OPTIONS}
            getOptionLabel={(option) => option?.label || ""}
            value={feeStatus}
            disableClearable
            onChange={(_e, newValue) => {
              setFeeStatus(newValue || FEE_STATUS_OPTIONS[0]);
              setPage(0);
              resetExpands();
            }}
            sx={{ width: { xs: "100%", sm: 150 } }}
            renderInput={(params) => (
              <TextField {...params} label="Fees Status" size="small" />
            )}
          />

          <DatePicker
            label="Date From"
            value={dateFrom}
            onChange={(newDate) => {
              setDateFrom(newDate);
              setPage(0);
            }}
            slotProps={{
              textField: {
                size: "small",
                sx: { width: { xs: "100%", sm: 160 } },
              },
            }}
          />

          <DatePicker
            label="Date To"
            value={dateTo}
            minDate={dateFrom || undefined}
            onChange={(newDate) => {
              setDateTo(newDate);
              setPage(0);
            }}
            slotProps={{
              textField: {
                size: "small",
                sx: { width: { xs: "100%", sm: 160 } },
              },
            }}
          />

          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "block" } }} />

          <Box
            sx={{
              display: "flex",
              gap: 1,
              ml: { xs: 0, md: "auto" },
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshRounded />}
              onClick={() => refetch?.()}
              disabled={isLoading || isPdfLoading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateReport}
              disabled={isPdfLoading || isLoading}
              startIcon={
                isPdfLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Iconify icon="uiw:file-pdf" />
                )
              }
              sx={{ whiteSpace: "nowrap" }}
            >
              {isPdfLoading ? "Generating..." : "Generate Report"}
            </Button>
          </Box>
        </Box>

        {isLoading ? (
          <Loader />
        ) : isError ? (
          <MessageBox errorMessage={errorMessage} />
        ) : (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, color: "text.secondary" }}
            >
              Class-group Collection Detail (click a group to see sections).
              PG / Draft / NEFT columns are incoming money for that class in
              this period.
            </Typography>

            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 980 + paymentModes.length * 130 }}>
                <TableHead>
                  <TableRow>
                    {tableHeads.map((head) => (
                      <TableCell
                        key={head.id}
                        align={head.align || "left"}
                        sx={{
                          bgcolor: head.emphasize
                            ? "primary.light"
                            : head.payment
                              ? "#e3f2fd"
                              : "primary.lighter",
                          fontWeight: head.emphasize ? 800 : 700,
                          fontSize: head.emphasize ? "0.875rem" : undefined,
                          whiteSpace: "nowrap",
                          width: head.width,
                          color: head.emphasize
                            ? "primary.darker"
                            : head.payment
                              ? "#1565c0"
                              : undefined,
                        }}
                      >
                        {head.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {groups.map((group) => {
                    const groupKey = group?.group_key || group?.group_name;
                    const isGroupOpen = !!expandedGroups[groupKey];
                    const othersKey = `g-${groupKey}`;
                    const monthlyKey = `gm-${groupKey}`;
                    const isOthersOpen = !!expandedOthers[othersKey];
                    const isMonthlyOpen = !!expandedOthers[monthlyKey];
                    const othersDetail = Array.isArray(group?.others_detail)
                      ? group.others_detail
                      : [];
                    const monthlyDetail = Array.isArray(group?.monthly_detail)
                      ? group.monthly_detail
                      : [];
                    const hasOthers =
                      (group?.others_fees || 0) > 0 && othersDetail.length > 0;
                    const hasMonthly =
                      (group?.monthly_fees || 0) > 0 && monthlyDetail.length > 0;
                    const sections = Array.isArray(group?.sections)
                      ? group.sections
                      : [];

                    return (
                      <Fragment key={groupKey}>
                        <TableRow
                          hover
                          onClick={() => toggleGroup(groupKey)}
                          sx={{
                            cursor: "pointer",
                            bgcolor: "#e8f1fb",
                            "&:hover": { bgcolor: "#dceaf8" },
                            "& td": { fontWeight: 700 },
                          }}
                        >
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                                minHeight: 24,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 22,
                                  height: 22,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {isGroupOpen ? (
                                  <KeyboardArrowDownRounded fontSize="small" />
                                ) : (
                                  <KeyboardArrowRightRounded fontSize="small" />
                                )}
                              </Box>
                              <Box
                                component="span"
                                sx={{ lineHeight: 1.3 }}
                              >
                                {group?.group_name}
                                <Typography
                                  component="span"
                                  variant="caption"
                                  sx={{
                                    ml: 1,
                                    color: "text.secondary",
                                    fontWeight: 500,
                                  }}
                                >
                                  ({sections.length} section
                                  {sections.length === 1 ? "" : "s"})
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            {group?.fee_count ?? 0}
                          </TableCell>
                          <AmountCell amount={group?.admission_fees} bold />
                          <AmountCell amount={group?.annual_charges} bold />
                          <TuitionExpandCell
                            amount={group?.tuition_fees}
                            open={isMonthlyOpen}
                            disabled={!hasMonthly}
                            bold
                            onToggle={() => toggleOthers(monthlyKey)}
                          />
                          <AmountCell amount={group?.late_fees} bold />
                          <OthersExpandCell
                            amount={group?.others_fees}
                            open={isOthersOpen}
                            disabled={!hasOthers}
                            onToggle={() => toggleOthers(othersKey)}
                          />
                          <AmountCell
                            amount={group?.total_collected}
                            bold
                            emphasize
                          />
                          {paymentModes.map((item) => (
                            <AmountCell
                              key={`g-pm-${groupKey}-${item.mode}`}
                              amount={paymentModeAmount(group, item.mode)}
                              bold
                              color={item.mode === "pg" ? "#1565c0" : undefined}
                            />
                          ))}
                        </TableRow>

                        <FeeDetailBlock
                          open={isOthersOpen}
                          title={group?.group_name}
                          detail={othersDetail}
                          colSpan={tableHeads.length}
                          rowKey={othersKey}
                          heading="One Time Fees Detail"
                          bgcolor="#fffaf3"
                        />

                        <FeeDetailBlock
                          open={isMonthlyOpen}
                          title={group?.group_name}
                          detail={monthlyDetail}
                          colSpan={tableHeads.length}
                          rowKey={monthlyKey}
                          heading="Monthly Fees Detail"
                          bgcolor="#f1f8f2"
                        />

                        {isGroupOpen &&
                          sections.map((section, sIdx) => {
                            const sectionKey = `s-${groupKey}-${section?.cg_id}-${sIdx}`;
                            const sectionOthersKey = `o-${sectionKey}`;
                            const sectionMonthlyKey = `m-${sectionKey}`;
                            const sectionOthersOpen =
                              !!expandedOthers[sectionOthersKey];
                            const sectionMonthlyOpen =
                              !!expandedOthers[sectionMonthlyKey];
                            const sectionOthers = Array.isArray(
                              section?.others_detail
                            )
                              ? section.others_detail
                              : [];
                            const sectionMonthly = Array.isArray(
                              section?.monthly_detail
                            )
                              ? section.monthly_detail
                              : [];
                            const hasSectionOthers =
                              (section?.others_fees || 0) > 0 &&
                              sectionOthers.length > 0;
                            const hasSectionMonthly =
                              (section?.monthly_fees || 0) > 0 &&
                              sectionMonthly.length > 0;
                            const label =
                              section?.display_name ||
                              section?.class_name ||
                              "-";

                            return (
                              <Fragment key={sectionKey}>
                                <TableRow
                                  hover
                                  sx={{
                                    bgcolor: section?.is_new_admission
                                      ? "#f7fbff"
                                      : "background.paper",
                                  }}
                                >
                                  <TableCell>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.75,
                                        minHeight: 24,
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: 22,
                                          height: 22,
                                          flexShrink: 0,
                                        }}
                                      />
                                      <Box
                                        component="span"
                                        sx={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          flexWrap: "wrap",
                                          gap: 0.75,
                                          lineHeight: 1.3,
                                        }}
                                      >
                                        {label}
                                        {section?.is_new_admission && (
                                          <Chip
                                            size="small"
                                            label="New Admission"
                                            sx={{
                                              height: 20,
                                              fontSize: 10,
                                            }}
                                            color="info"
                                            variant="outlined"
                                          />
                                        )}
                                      </Box>
                                    </Box>
                                  </TableCell>
                                  <TableCell align="center">
                                    {section?.fee_count ?? 0}
                                  </TableCell>
                                  <AmountCell
                                    amount={section?.admission_fees}
                                    muted
                                  />
                                  <AmountCell
                                    amount={section?.annual_charges}
                                    muted
                                  />
                                  <TuitionExpandCell
                                    amount={section?.tuition_fees}
                                    open={sectionMonthlyOpen}
                                    disabled={!hasSectionMonthly}
                                    onToggle={() =>
                                      toggleOthers(sectionMonthlyKey)
                                    }
                                  />
                                  <AmountCell
                                    amount={section?.late_fees}
                                    muted
                                  />
                                  <OthersExpandCell
                                    amount={section?.others_fees}
                                    open={sectionOthersOpen}
                                    disabled={!hasSectionOthers}
                                    onToggle={() =>
                                      toggleOthers(sectionOthersKey)
                                    }
                                  />
                                  <AmountCell
                                    amount={section?.total_collected}
                                    emphasize
                                  />
                                  {paymentModes.map((item) => (
                                    <AmountCell
                                      key={`s-pm-${sectionKey}-${item.mode}`}
                                      amount={paymentModeAmount(
                                        section,
                                        item.mode
                                      )}
                                      muted={item.mode !== "pg"}
                                      color={
                                        item.mode === "pg"
                                          ? "#1565c0"
                                          : undefined
                                      }
                                    />
                                  ))}
                                </TableRow>

                                <FeeDetailBlock
                                  open={sectionOthersOpen}
                                  title={label}
                                  detail={sectionOthers}
                                  colSpan={tableHeads.length}
                                  rowKey={sectionOthersKey}
                                  heading="One Time Fees Detail"
                                  bgcolor="#fffaf3"
                                />

                                <FeeDetailBlock
                                  open={sectionMonthlyOpen}
                                  title={label}
                                  detail={sectionMonthly}
                                  colSpan={tableHeads.length}
                                  rowKey={sectionMonthlyKey}
                                  heading="Monthly Fees Detail"
                                  bgcolor="#f1f8f2"
                                />
                              </Fragment>
                            );
                          })}
                      </Fragment>
                    );
                  })}

                  {notFound && <TableNoData query="" />}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              page={page}
              component="div"
              count={reportCount}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Groups per page"
            />
          </Box>
        )}
      </Card>
    </>
  );
}
