import PropTypes from "prop-types";
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
import { CancelOutlined, ClearRounded, RefreshRounded } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import { useGetApi } from "../../../../../hooks/useGetApi";
import {
  DEFAULT_LIMIT,
  emptyRows,
  FORMAT_INDIAN_CURRENCY,
  ROWS_PER_PAGE_OPTIONS,
} from "../../../../../utils/constants";
import Loader from "../../../../../components/loader/loader";
import MessageBox from "../../../../../components/error/message-box";
import TableEmptyRows from "../../../../../components/table/table-empty-rows";
import TableNoData from "../../../../../components/table/table-no-data";
import {
  getPgLogDetail,
  getPgLogs,
} from "../../../../../services/admin/pg-logs.service";
import dayjs from "dayjs";

const HEAD_LABEL = [
  { id: "created_at", label: "Date/Time" },
  { id: "pg_reference_no", label: "Txn ID" },
  { id: "amount", label: "Amount" },
  { id: "status", label: "Status" },
  { id: "remarks", label: "Remarks" },
  { id: "view", label: "View", align: "center" },
];

const STATUS_OPTIONS = [
  { label: "All", value: "%" },
  { label: "Success", value: "success" },
  { label: "Failure", value: "failure" },
  { label: "Pending", value: "pending" },
];

const statusColor = (status) => {
  const key = String(status || "").toLowerCase();
  if (key === "success" || key === "shipped") return "success";
  if (["failure", "failed", "aborted", "timeout"].includes(key)) return "error";
  if (key === "pending" || key === "awaited") return "warning";
  return "default";
};

const prettyJson = (value) => {
  if (value === null || value === undefined || value === "") return "-";
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

const resolveDateFilter = (fromValue, toValue) => {
  const from = toApiDate(fromValue);
  const to = toApiDate(toValue);
  if (from && !to) return { date_from: from, date_to: from };
  if (!from && to) return { date_from: undefined, date_to: to };
  if (from && to) return { date_from: from, date_to: to };
  return { date_from: undefined, date_to: undefined };
};

const dash = (value) =>
  value === null || value === undefined || value === "" ? "—" : value;

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
        {dash(value)}
      </Typography>
    )}
  </Box>
);

export default function StudentTxnTab({ detail, refreshKey }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_LIMIT);
  const [statusFilter, setStatusFilter] = useState(STATUS_OPTIONS[0]);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [txnDetail, setTxnDetail] = useState(null);

  const dateFilter = resolveDateFilter(dateFrom, dateTo);

  const {
    dataCount: txnCount,
    dataList: txnList,
    isLoading,
    isError,
    errorMessage,
    refetch,
  } = useGetApi({
    apiFunction: getPgLogs,
    skip: !detail?.st_roll_no,
    body: {
      search: detail?.st_roll_no || undefined,
      offset: page * rowsPerPage,
      limit: rowsPerPage,
      status: statusFilter?.value || "%",
      date_from: dateFilter.date_from,
      date_to: dateFilter.date_to,
    },
    dependencies: [
      detail?.st_roll_no,
      page,
      rowsPerPage,
      statusFilter,
      dateFrom,
      dateTo,
      refreshKey,
    ],
    debounceDelay: 400,
  });

  const handleClearFilters = () => {
    setPage(0);
    setStatusFilter(STATUS_OPTIONS[0]);
    setDateFrom(null);
    setDateTo(null);
  };

  const handleCloseDetail = () => {
    if (detailLoading) return;
    setDetailOpen(false);
    setTxnDetail(null);
  };

  const handleView = async (id) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setTxnDetail(null);
    const response = await getPgLogDetail(id);
    setDetailLoading(false);
    if (response?.code === 200) {
      setTxnDetail(response?.data || null);
    } else {
      setTxnDetail({ message: response?.message || "Failed to load detail." });
    }
  };

  const notFound = !txnCount;
  const gateway = txnDetail?.gateway_responses?.[0];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
          mb: 2,
        }}
      >
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
          slotProps={{ textField: { size: "small", sx: { width: 185 } } }}
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
          slotProps={{ textField: { size: "small", sx: { width: 185 } } }}
          disableFuture
        />
        <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
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

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <MessageBox errorMessage={errorMessage} />
      ) : (
        <TableContainer sx={{ overflowY: "unset" }}>
          <Table sx={{ minWidth: 800 }}>
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
              {(txnList || []).map((row) => (
                <TableRow hover key={row.id}>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {row.created_at
                      ? dayjs(row.created_at).format("DD-MM-YYYY HH:mm")
                      : "—"}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {row.pg_reference_no || "—"}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    ₹ {FORMAT_INDIAN_CURRENCY(row.amount) || "0"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.status_label || row.status || "—"}
                      color={statusColor(row.status)}
                    />
                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 280,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={row.remarks || ""}
                  >
                    {row.remarks || "—"}
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
                emptyRows={emptyRows(page, rowsPerPage, txnCount)}
              />
              {notFound && <TableNoData />}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TablePagination
        page={page}
        component="div"
        count={txnCount || 0}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, newPage) => {
          if (!isLoading) setPage(newPage);
        }}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        onRowsPerPageChange={(event) => {
          setPage(0);
          setRowsPerPage(parseInt(event.target.value, 10));
        }}
      />

      <Dialog
        open={detailOpen}
        onClose={handleCloseDetail}
        PaperProps={{
          sx: {
            minWidth: { xs: "95vw", sm: "620px", md: "820px" },
            maxWidth: "940px",
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
          Transaction Detail
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          {detailLoading ? (
            <Loader />
          ) : txnDetail?.pg_reference_no ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem label="Txn ID" value={txnDetail.pg_reference_no} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem label="Status">
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        size="small"
                        label={txnDetail.status_label || txnDetail.status || "—"}
                        color={statusColor(txnDetail.status)}
                      />
                    </Box>
                  </DetailItem>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem
                    label="Amount"
                    value={`₹ ${FORMAT_INDIAN_CURRENCY(txnDetail.amount) || "0"}`}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem
                    label="Date"
                    value={
                      txnDetail.created_at
                        ? dayjs(txnDetail.created_at).format(
                            "DD-MM-YYYY HH:mm:ss"
                          )
                        : "—"
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <DetailItem label="Remarks" value={txnDetail.remarks} />
                </Grid>
              </Grid>

              <Typography variant="subtitle2">Fees in this attempt</Typography>
              {(txnDetail.fees || []).length ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fee ID</TableCell>
                      <TableCell>Fee Name</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Due Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {txnDetail.fees.map((fee) => (
                      <TableRow key={fee.fpp_id}>
                        <TableCell>{fee.fpp_id}</TableCell>
                        <TableCell>{fee.fpp_name || "—"}</TableCell>
                        <TableCell>
                          ₹ {FORMAT_INDIAN_CURRENCY(fee.fpp_amount) || "0"}
                        </TableCell>
                        <TableCell>
                          {fee.fpp_due_date
                            ? dayjs(fee.fpp_due_date).format("DD-MM-YYYY")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No fee names found for IDs: {dash(txnDetail.f_id)}
                </Typography>
              )}

              <Typography variant="subtitle2">Gateway response</Typography>
              {gateway ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <DetailItem label="Payment Mode" value={gateway.payment_mode} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <DetailItem
                      label="Bank / Tracking Ref"
                      value={gateway.unique_ref_number}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <DetailItem label="Bank Ref No" value={gateway.bank_ref_no} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <DetailItem
                      label="Gateway Status"
                      value={gateway.response_code}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <DetailItem
                      label="Status Message"
                      value={gateway.status_message}
                    />
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No gateway callback saved for this attempt.
                </Typography>
              )}

              {(txnDetail.related_txns || []).length > 0 && (
                <>
                  <Typography variant="subtitle2">Related ledger txns</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Mode</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {txnDetail.related_txns.map((txn) => (
                        <TableRow key={txn.id}>
                          <TableCell>
                            {txn.txn_date || "—"} {txn.txn_time || ""}
                          </TableCell>
                          <TableCell>{txn.txn_mode || "—"}</TableCell>
                          <TableCell>
                            ₹ {FORMAT_INDIAN_CURRENCY(txn.txn_amount) || "0"}
                          </TableCell>
                          <TableCell>{txn.txn_reason || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}

              {gateway?.optional_fields ? (
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
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {prettyJson(gateway.optional_fields)}
                </Box>
              ) : null}

              <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1 }}>
                <Button variant="contained" onClick={handleCloseDetail}>
                  Close
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography>{txnDetail?.message || "No detail found."}</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

StudentTxnTab.propTypes = {
  detail: PropTypes.object,
  refreshKey: PropTypes.number,
};
