import { useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
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
import {
  CheckBox,
  CheckBoxOutlineBlank,
  ClearRounded,
  RefreshRounded,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import { Helmet } from "react-helmet-async";
import { useGetApi } from "../../../hooks/useGetApi";
import {
  DEFAULT_LIMIT,
  emptyRows,
  FORMAT_INDIAN_CURRENCY,
  ROWS_PER_PAGE_OPTIONS,
} from "../../../utils/constants";
import Loader from "../../../components/loader/loader";
import MessageBox from "../../../components/error/message-box";
import TableEmptyRows from "../../../components/table/table-empty-rows";
import TableNoData from "../../../components/table/table-no-data";
import {
  getCreditReport,
  getCreditReportDay,
} from "../../../services/admin/pg-logs.service";
import dayjs from "dayjs";

const MODE_OPTIONS = [
  { value: "pg", label: "PG (Online)" },
  { value: "draft", label: "Draft" },
  { value: "cash", label: "Cash" },
  { value: "neft", label: "NEFT" },
  { value: "imps", label: "IMPS" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
  { value: "internal", label: "Internal / Wallet" },
];

const DEFAULT_MODES = MODE_OPTIONS.filter(
  (m) => m.value !== "internal" && m.value !== "other",
);

const HEAD_LABEL = [
  { id: "date", label: "Date" },
  { id: "txn_count", label: "Credits", align: "right" },
  { id: "total_credit", label: "Total Credit", align: "right" },
];

const DAY_HEAD_LABEL = [
  { id: "created_at", label: "Date/Time" },
  { id: "mode", label: "Mode" },
  { id: "payer_name", label: "Student / Applicant" },
  { id: "roll_no", label: "Roll / App No" },
  { id: "pg_reference_no", label: "Ref / Txn ID" },
  { id: "amount", label: "Amount", align: "right" },
];

const toApiDate = (value) => {
  if (!value) return undefined;
  const d = dayjs(value);
  return d.isValid() ? d.format("YYYY-MM-DD") : undefined;
};

const formatAmount = (amount) =>
  `₹ ${FORMAT_INDIAN_CURRENCY(amount) || "0"}`;

export default function CreditReports() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_LIMIT);
  const [dateFrom, setDateFrom] = useState(dayjs().startOf("month"));
  const [dateTo, setDateTo] = useState(dayjs());
  const [selectedModes, setSelectedModes] = useState(DEFAULT_MODES);
  const [selectedDate, setSelectedDate] = useState(null);

  const dateFromApi = toApiDate(dateFrom);
  const dateToApi = toApiDate(dateTo);
  const modes = (selectedModes || []).map((m) => m.value);

  const {
    dataCount: dayCount,
    dataList: dayList,
    allResponse,
    isLoading,
    isError,
    errorMessage,
    refetch,
  } = useGetApi({
    apiFunction: getCreditReport,
    body: {
      offset: page * rowsPerPage,
      limit: rowsPerPage,
      date_from: dateFromApi,
      date_to: dateToApi,
      modes,
    },
    dependencies: [page, rowsPerPage, dateFrom, dateTo, selectedModes],
  });

  const {
    dataList: dayTxnList,
    dataCount: dayTxnCount,
    isLoading: isDayLoading,
    isError: isDayError,
    errorMessage: dayErrorMessage,
  } = useGetApi({
    apiFunction: selectedDate ? getCreditReportDay : null,
    body: {
      date: selectedDate,
      modes,
      limit: 300,
    },
    dependencies: [selectedDate, selectedModes],
    skip: !selectedDate,
  });

  const summary = allResponse?.summary || {};
  const byMode = Array.isArray(summary.by_mode) ? summary.by_mode : [];
  const notFound = !dayCount;

  const handleChangePage = (_, newPage) => {
    if (!isLoading) setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleClearFilters = () => {
    setPage(0);
    setDateFrom(dayjs().startOf("month"));
    setDateTo(dayjs());
    setSelectedModes(DEFAULT_MODES);
  };

  return (
    <Box>
      <Helmet>
        <title>Credit Reports | GREENWOOD</title>
      </Helmet>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h5">Credit Reports</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Daily credits by payment mode. Select PG only to match the bank
          statement. Other shows any mode that is not PG / Draft / Cash / NEFT /
          IMPS / Cheque / Internal. Leave Internal off — that is wallet posting.
        </Typography>
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
          <DatePicker
            label="From Date"
            value={dateFrom}
            onChange={(newDate) => {
              setPage(0);
              setDateFrom(newDate);
            }}
            slotProps={{
              textField: { size: "small", sx: { width: 185 } },
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
              textField: { size: "small", sx: { width: 185 } },
            }}
            disableFuture
          />
          <Autocomplete
            multiple
            disableCloseOnSelect
            size="small"
            options={MODE_OPTIONS}
            value={selectedModes}
            onChange={(_, value) => {
              setPage(0);
              setSelectedModes(value || []);
            }}
            getOptionLabel={(option) => option?.label || ""}
            isOptionEqualToValue={(option, value) =>
              option.value === value.value
            }
            sx={{ minWidth: 280, flex: 1 }}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option.value}>
                <Checkbox
                  icon={<CheckBoxOutlineBlank fontSize="small" />}
                  checkedIcon={<CheckBox fontSize="small" />}
                  checked={selected}
                  sx={{ mr: 1 }}
                />
                {option.label}
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Payment mode" />
            )}
          />
          <Box sx={{ display: "flex", gap: 1, ml: "auto", alignItems: "center" }}>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={handleClearFilters}
              disabled={isLoading}
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
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mt: 2 }}>
          <Typography variant="body2">
            Credits: <strong>{summary.total_txn ?? 0}</strong>
          </Typography>
          <Typography variant="body2">
            Total credit: <strong>{formatAmount(summary.total_credit)}</strong>
          </Typography>
        </Box>
        {byMode.length > 0 && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.5 }}>
            {byMode.map((item) => (
              <Chip
                key={item.mode}
                size="small"
                variant="outlined"
                label={`${item.label}: ${formatAmount(item.total_credit)} (${item.txn_count})`}
              />
            ))}
          </Box>
        )}
      </Card>

      <Card>
        {isLoading ? (
          <Loader />
        ) : isError ? (
          <MessageBox errorMessage={errorMessage} />
        ) : (
          <TableContainer sx={{ overflowY: "unset" }}>
            <Table sx={{ minWidth: 640 }}>
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
                {(dayList || []).map((row) => (
                  <TableRow
                    hover
                    key={row.date}
                    sx={{ cursor: "pointer" }}
                    onClick={() => setSelectedDate(row.date)}
                  >
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {row.date ? dayjs(row.date).format("DD-MM-YYYY") : "—"}
                    </TableCell>
                    <TableCell align="right">{row.txn_count ?? 0}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatAmount(row.total_credit)}
                    </TableCell>
                  </TableRow>
                ))}

                <TableEmptyRows
                  height={77}
                  emptyRows={emptyRows(page, rowsPerPage, dayCount)}
                />
                {notFound && <TableNoData />}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          page={page}
          component="div"
          count={dayCount || 0}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      <Dialog
        open={Boolean(selectedDate)}
        onClose={() => setSelectedDate(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            {selectedDate ? dayjs(selectedDate).format("DD-MM-YYYY") : ""}{" "}
            credits
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Credits for this day with the selected payment modes.
          </Typography>

          {isDayLoading ? (
            <Loader />
          ) : isDayError ? (
            <MessageBox errorMessage={dayErrorMessage} />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {DAY_HEAD_LABEL.map((headCell) => (
                      <TableCell
                        key={headCell.id}
                        align={headCell.align || "left"}
                      >
                        {headCell.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(dayTxnList || []).map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {row.created_at
                          ? dayjs(row.created_at).isValid()
                            ? dayjs(row.created_at).format("DD-MM-YYYY HH:mm")
                            : row.created_at
                          : "—"}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {row.mode_label || row.mode || "—"}
                      </TableCell>
                      <TableCell>{row.payer_name || "—"}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {row.roll_no || row.application_no || "—"}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {row.pg_reference_no || "—"}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        {formatAmount(row.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!(dayTxnList || []).length && (
                    <TableRow>
                      <TableCell colSpan={6}>No credits this day.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2,
            }}
          >
            <Typography variant="body2">
              {dayTxnCount || 0} credit(s)
            </Typography>
            <Button onClick={() => setSelectedDate(null)}>Close</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
