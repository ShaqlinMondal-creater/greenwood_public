import { useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Card from "@mui/material/Card";
import { CancelOutlined, ClearRounded, RefreshRounded } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import { Helmet } from "react-helmet-async";
import { useGetApi } from "../../../hooks/useGetApi";
import {
  DEFAULT_LIMIT,
  emptyRows,
  ROWS_PER_PAGE_OPTIONS,
} from "../../../utils/constants";
import Loader from "../../../components/loader/loader";
import MessageBox from "../../../components/error/message-box";
import TableEmptyRows from "../../../components/table/table-empty-rows";
import TableNoData from "../../../components/table/table-no-data";
import {
  getActionLogDetail,
  getActionLogs,
} from "../../../services/admin/action-logs.service";
import dayjs from "dayjs";

const HEAD_LABEL = [
  { id: "created_at", label: "Date/Time" },
  { id: "module", label: "Module" },
  { id: "action", label: "Action" },
  { id: "status", label: "Status" },
  { id: "reference", label: "Reference" },
  { id: "message", label: "Message" },
  { id: "view", label: "View", align: "center" },
];

const MODULE_OPTIONS = [
  { label: "All", value: "%" },
  { label: "Admission", value: "admission" },
  { label: "Payment", value: "payment" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "UDISE", value: "udise" },
  { label: "Fees", value: "fees" },
  { label: "Student Fees", value: "student_fees" },
  { label: "Student Profile", value: "student_profile" },
  { label: "Student Parent", value: "student_parent" },
  { label: "Student Dashboard", value: "student_dashboard" },
  { label: "Auth", value: "auth" },
  { label: "General", value: "general" },
];

const STATUS_OPTIONS = [
  { label: "All", value: "%" },
  { label: "Success", value: "success" },
  { label: "Failed", value: "failed" },
  { label: "Skipped", value: "skipped" },
];

const statusColor = (status) => {
  if (status === "success") return "success";
  if (status === "failed") return "error";
  if (status === "skipped") return "warning";
  return "default";
};

const prettyJson = (value) => {
  if (!value) return "-";
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(value);
  }
};

const toApiDate = (value) => {
  if (!value) return undefined;
  const d = dayjs(value);
  return d.isValid() ? d.format("YYYY-MM-DD") : undefined;
};

/** From only = that day; To only = beginning..To; both = range. */
const resolveDateFilter = (fromValue, toValue) => {
  const from = toApiDate(fromValue);
  const to = toApiDate(toValue);

  if (from && !to) {
    return { date_from: from, date_to: from };
  }
  if (!from && to) {
    return { date_from: undefined, date_to: to };
  }
  if (from && to) {
    return { date_from: from, date_to: to };
  }
  return { date_from: undefined, date_to: undefined };
};

const DetailItem = ({ label, value, children }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    {children || (
      <Typography
        variant="body2"
        sx={{ fontWeight: 500, mt: 0.25, wordBreak: "break-word" }}
      >
        {value || "-"}
      </Typography>
    )}
  </Box>
);

const JsonBlock = ({ label, value }) => (
  <Box>
    <Typography
      variant="caption"
      color="text.secondary"
      display="block"
      mb={0.5}
    >
      {label}
    </Typography>
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 1.5,
        bgcolor: "grey.100",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        overflow: "auto",
        maxHeight: 240,
        fontSize: 12,
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {prettyJson(value)}
    </Box>
  </Box>
);

export default function ActionLogs() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_LIMIT);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState(MODULE_OPTIONS[0]);
  const [statusFilter, setStatusFilter] = useState(STATUS_OPTIONS[0]);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const dateFilter = resolveDateFilter(dateFrom, dateTo);

  const {
    dataCount: logsCount,
    dataList: logsList,
    isLoading,
    isError,
    errorMessage,
    refetch,
  } = useGetApi({
    apiFunction: getActionLogs,
    body: {
      offset: page * rowsPerPage,
      limit: rowsPerPage,
      search: search || undefined,
      module: moduleFilter?.value || "%",
      status: statusFilter?.value || "%",
      date_from: dateFilter.date_from,
      date_to: dateFilter.date_to,
    },
    dependencies: [
      page,
      rowsPerPage,
      search,
      moduleFilter,
      statusFilter,
      dateFrom,
      dateTo,
    ],
    debounceDelay: 400,
  });

  const handleChangePage = (_, newPage) => {
    if (!isLoading) setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleClearFilters = () => {
    setPage(0);
    setSearch("");
    setModuleFilter(MODULE_OPTIONS[0]);
    setStatusFilter(STATUS_OPTIONS[0]);
    setDateFrom(null);
    setDateTo(null);
  };

  const handleCloseDetail = () => {
    if (detailLoading) return;
    setDetailOpen(false);
    setDetail(null);
  };

  const handleView = async (id) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    const response = await getActionLogDetail(id);
    setDetailLoading(false);
    if (response?.code === 200) {
      setDetail(response?.data || null);
    } else {
      setDetail({ message: response?.message || "Failed to load detail." });
    }
  };

  const notFound = !logsCount;

  return (
    <Box>
      <Helmet>
        <title>Logs | GREENWOOD</title>
      </Helmet>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h5">Action Logs</Typography>
      </Box>

      <Card sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
            sx={{ minWidth: 260 }}
            placeholder="App no / ref / action / message"
          />
          <Autocomplete
            size="small"
            options={MODULE_OPTIONS}
            value={moduleFilter}
            onChange={(_, value) => {
              setPage(0);
              setModuleFilter(value || MODULE_OPTIONS[0]);
            }}
            getOptionLabel={(option) => option?.label || ""}
            sx={{ minWidth: 180 }}
            renderInput={(params) => <TextField {...params} label="Module" />}
          />
          <Autocomplete
            size="small"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(_, value) => {
              setPage(0);
              setStatusFilter(value || STATUS_OPTIONS[0]);
            }}
            getOptionLabel={(option) => option?.label || ""}
            sx={{ width: 120 }}
            renderInput={(params) => <TextField {...params} label="Status" />}
          />
          <DatePicker
            label="From Date"
            value={dateFrom}
            onChange={(newDate) => {
              setPage(0);
              setDateFrom(newDate);
            }}
            slotProps={{
              textField: {
                size: "small",
                sx: { width: 185 },
              },
            }}
            disableFuture
          />
          <DatePicker
            label="To Date"
            value={dateTo}
            minDate={dateFrom || undefined}
            onChange={(newDate) => {
              setPage(0);
              setDateTo(newDate);
            }}
            slotProps={{
              textField: {
                size: "small",
                sx: { width: 185 },
              },
            }}
            disableFuture
          />
          <Box sx={{ display: "flex", gap: 1, ml: "auto", alignItems: "center" }}>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={handleClearFilters}
              disabled={isLoading}
              aria-label="Clear filters"
              title="Clear filters"
              sx={{ minWidth: 36, px: 1 }}
            >
              <ClearRounded fontSize="small" />
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshRounded />}
              onClick={() => refetch?.()}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </Box>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1.25 }}
        >
          Search accepts: application no, roll no, student id, mobile, PG/order
          reference, action name, module name, student name, or message text.
          Date: From only = that day; To only = all until To; both = date range.
        </Typography>
      </Card>

      <Card>
        {isLoading ? (
          <Loader />
        ) : isError ? (
          <MessageBox errorMessage={errorMessage} />
        ) : (
          <TableContainer sx={{ overflowY: "unset" }}>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  {HEAD_LABEL.map((headCell) => (
                    <TableCell
                      key={headCell.id}
                      align={headCell.align || "left"}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      {headCell.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(logsList || []).map((row) => (
                  <TableRow hover key={row.id}>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {row.created_at
                        ? dayjs(row.created_at).format("DD-MM-YYYY HH:mm")
                        : "-"}
                    </TableCell>
                    <TableCell>{row.module || "-"}</TableCell>
                    <TableCell>{row.action || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.status || "-"}
                        color={statusColor(row.status)}
                      />
                    </TableCell>
                    <TableCell>{row.reference || "-"}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 320,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={row.message || ""}
                    >
                      {row.message || "-"}
                    </TableCell>
                    <TableCell align="center">
                      <Button size="small" onClick={() => handleView(row.id)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                <TableEmptyRows
                  height={77}
                  emptyRows={emptyRows(page, rowsPerPage, logsCount)}
                />
                {notFound && <TableNoData />}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          page={page}
          component="div"
          count={logsCount || 0}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      <Dialog
        open={detailOpen}
        onClose={handleCloseDetail}
        PaperProps={{
          sx: {
            minWidth: { xs: "95vw", sm: "560px", md: "760px" },
            maxWidth: "900px",
            width: "100%",
            position: "relative",
          },
        }}
      >
        <CancelOutlined
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "primary.contrastText",
            fontSize: 24,
            cursor: detailLoading ? "default" : "pointer",
            zIndex: 1,
          }}
          onClick={handleCloseDetail}
        />
        <Box
          sx={{
            px: 2,
            py: 1.25,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          Log Detail
        </Box>

        <DialogContent sx={{ pt: 2.5 }}>
          {detailLoading ? (
            <Loader />
          ) : detail ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem label="Module" value={detail.module} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem label="Action" value={detail.action} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem label="Status">
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        size="small"
                        label={detail.status || "-"}
                        color={statusColor(detail.status)}
                      />
                    </Box>
                  </DetailItem>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem label="Reference" value={detail.reference} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem label="User ID" value={detail.user_id} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem label="IP" value={detail.ip} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem
                    label="Date"
                    value={
                      detail.created_at
                        ? dayjs(detail.created_at).format(
                            "DD-MM-YYYY HH:mm:ss"
                          )
                        : "-"
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <DetailItem label="Message" value={detail.message} />
                </Grid>
              </Grid>

              <JsonBlock label="Request Data" value={detail.request_data} />
              <JsonBlock label="Response Data" value={detail.response_data} />

              <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1 }}>
                <Button variant="contained" onClick={handleCloseDetail}>
                  Close
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography>No detail found.</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
