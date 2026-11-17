import { useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Card from "@mui/material/Card";
import { RefreshRounded, UploadFileRounded } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useGetApi } from "../../../hooks/useGetApi";
import useAuth from "../../../hooks/useAuth";
import Iconify from "../../../components/iconify/iconify";
import { FORMAT_INDIAN_CURRENCY } from "../../../utils/constants";
import Loader from "../../../components/loader/loader";
import MessageBox from "../../../components/error/message-box";
import TableNoData from "../../../components/table/table-no-data";
import {
  generateCcAvenueClassPdf,
  generateCcAvenueFeesPdf,
  getCcAvenueFeesPreview,
  generateCcAvenuePayoutDayPdf,
  generateCcAvenueSettlementPdf,
  getCcAvenuePayoutDay,
  getCcAvenuePayoutDays,
  importCcAvenuePayout,
} from "../../../services/admin/ccavenue-payout.service";

const HEAD_LABEL = [
  { id: "payment_date", label: "Payment date" },
  { id: "school", label: "School PG", align: "right" },
  { id: "cc", label: "CC Avenue", align: "right" },
  { id: "difference", label: "Difference", align: "right" },
  { id: "next_payout", label: "Next payout" },
  { id: "payout_due", label: "Payout due" },
  { id: "result", label: "Result" },
];

const STATUS_LABEL = {
  matched: "Matched",
  amount_mismatch: "Amount differs",
  missing_in_school: "Not in school",
  missing_in_payout: "Not in payout file",
};

const toApiDate = (value) => {
  if (!value) return undefined;
  const d = dayjs(value);
  return d.isValid() ? d.format("YYYY-MM-DD") : undefined;
};

const formatAmount = (amount) => {
  if (amount === null || amount === undefined || amount === "") return "—";
  return `₹ ${FORMAT_INDIAN_CURRENCY(amount) || "0"}`;
};

const formatWhen = (value) => {
  if (!value) return "—";
  const d = dayjs(value);
  return d.isValid() ? d.format("DD-MM-YYYY HH:mm") : value;
};

export default function BankPayouts() {
  const { logout } = useAuth();
  const fileRef = useRef(null);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [importing, setImporting] = useState(false);
  const [pdfDate, setPdfDate] = useState(null);
  const [settlementPdfLoading, setSettlementPdfLoading] = useState(false);
  const [classPdfLoading, setClassPdfLoading] = useState(false);
  const [feesPdfLoading, setFeesPdfLoading] = useState(false);

  const [feesOpen, setFeesOpen] = useState(false);
  const [feesPreviewLoading, setFeesPreviewLoading] = useState(false);
  const [feesPreview, setFeesPreview] = useState(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const dateFromApi = toApiDate(dateFrom);
  const dateToApi = toApiDate(dateTo);

  const {
    dataList: dayList,
    allResponse,
    isLoading,
    isError,
    errorMessage,
    refetch,
  } = useGetApi({
    apiFunction: getCcAvenuePayoutDays,
    body: {
      date_from: dateFromApi,
      date_to: dateToApi,
    },
    dependencies: [dateFrom, dateTo],
  });

  const {
    dataList: orderList,
    allResponse: dayResponse,
    isLoading: isDayLoading,
    isError: isDayError,
    errorMessage: dayErrorMessage,
  } = useGetApi({
    apiFunction: selectedDate ? getCcAvenuePayoutDay : null,
    body: { date: selectedDate },
    dependencies: [selectedDate],
    skip: !selectedDate,
  });

  const summary = allResponse?.summary || {};
  const daySummary = dayResponse?.summary || {};
  const rows = Array.isArray(dayList) ? dayList : [];
  const otherModes = summary.other_modes || [];
  const schoolCount = rows.reduce((sum, row) => sum + Number(row.school_count || 0), 0);
  const ccCount = rows.reduce((sum, row) => sum + Number(row.cc_count || 0), 0);
  const otherCount = otherModes.reduce((sum, mode) => sum + Number(mode.count || 0), 0);
  const orderRows = Array.isArray(orderList) ? orderList : [];

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setImporting(true);
    const response = await importCcAvenuePayout(formData);
    setImporting(false);

    if (response?.code === 200) {
      const saved = response.data || {};
      toast.success(
        `Imported ${saved.payouts || 0} bank credits and ${saved.transactions || 0} orders.`
      );
      refetch?.();
      return;
    }

    toast.error(response?.message || "Could not import the payout file.");
  };

  const handleGenerateReport = async (date, event) => {
    event?.stopPropagation?.();
    const reportDate = date || selectedDate;
    if (!reportDate || pdfDate) return;

    setPdfDate(reportDate);
    const response = await generateCcAvenuePayoutDayPdf({ date: reportDate });
    setPdfDate(null);

    if (response?.code === 200) {
      toast.success(response?.message || "Report downloaded.");
      return;
    }

    if (response?.code === 401) {
      logout(response);
      return;
    }

    toast.error(response?.message || "Could not generate the report.");
  };

  const handleSettlementReport = async () => {
    setSettlementPdfLoading(true);
    const response = await generateCcAvenueSettlementPdf({
      date_from: dateFromApi,
      date_to: dateToApi,
    });
    setSettlementPdfLoading(false);

    if (response?.code === 200) {
      const link = document.createElement("a");
      link.href = response?.data?.file_url || "";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(response?.message || "Report generated.");
      return;
    }

    if (response?.code === 401) {
      logout(response);
      return;
    }

    toast.error(response?.message || "Could not generate the settlement report.");
  };

  const handleClassReport = async () => {
    setClassPdfLoading(true);
    const response = await generateCcAvenueClassPdf({
      date_from: dateFromApi,
      date_to: dateToApi,
    });
    setClassPdfLoading(false);

    if (response?.code === 200) {
      const link = document.createElement("a");
      link.href = response?.data?.file_url || "";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(response?.message || "Report generated.");
      return;
    }

    if (response?.code === 401) {
      logout(response);
      return;
    }

    toast.error(response?.message || "Could not generate the class wise report.");
  };

  const handleOpenFees = async () => {
    setFeesOpen(true);
    setFeesPreview(null);
    setFeesPreviewLoading(true);
    const response = await getCcAvenueFeesPreview({
      date_from: dateFromApi,
      date_to: dateToApi,
    });
    setFeesPreviewLoading(false);

    if (response?.code === 200) {
      setFeesPreview(response.data || {});
      return;
    }

    if (response?.code === 401) {
      logout(response);
      return;
    }

    toast.error(response?.message || "Could not load the fees collection.");
    setFeesOpen(false);
  };

  const handleFeesReport = async () => {
    setFeesPdfLoading(true);
    const response = await generateCcAvenueFeesPdf({
      date_from: dateFromApi,
      date_to: dateToApi,
    });
    setFeesPdfLoading(false);

    if (response?.code === 200) {
      const link = document.createElement("a");
      link.href = response?.data?.file_url || "";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(response?.message || "Report generated.");
      return;
    }

    if (response?.code === 401) {
      logout(response);
      return;
    }

    toast.error(response?.message || "Could not generate the fees collection report.");
  };

  return (
    <Box>
      <Helmet>
        <title>Bank Payouts | GREENWOOD</title>
      </Helmet>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h5">Bank Payouts</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Next payout is the bank transfer for this day. Payout due, in red, is
          the part that settled later. The blue date is the day that due amount
          reached Kotak.
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
            label="Payment from"
            value={dateFrom}
            onChange={(newDate) => setDateFrom(newDate)}
            slotProps={{
              textField: { size: "small", sx: { width: 185 } },
            }}
          />
          <DatePicker
            label="Payment to"
            value={dateTo}
            minDate={dateFrom || undefined}
            onChange={(newDate) => setDateTo(newDate)}
            slotProps={{
              textField: { size: "small", sx: { width: 185 } },
            }}
          />
          <Box sx={{ display: "flex", gap: 1, ml: "auto", alignItems: "center" }}>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={handleImport}
            />
            <Button
              size="small"
              variant="contained"
              onClick={handleSettlementReport}
              disabled={settlementPdfLoading || isLoading || importing}
              startIcon={
                settlementPdfLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Iconify icon="uiw:file-pdf" />
                )
              }
              sx={{ whiteSpace: "nowrap" }}
            >
              {settlementPdfLoading ? "Generating..." : "Settlement report"}
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleClassReport}
              disabled={classPdfLoading || isLoading || importing}
              startIcon={
                classPdfLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Iconify icon="uiw:file-pdf" />
                )
              }
              sx={{ whiteSpace: "nowrap" }}
            >
              {classPdfLoading ? "Generating..." : "Class report"}
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleOpenFees}
              disabled={feesPreviewLoading || feesPdfLoading || isLoading || importing}
              startIcon={
                feesPdfLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Iconify icon="uiw:file-pdf" />
                )
              }
              sx={{ whiteSpace: "nowrap" }}
            >
              {feesPdfLoading ? "Generating..." : "Fees report"}
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<UploadFileRounded />}
              disabled={importing}
              onClick={() => fileRef.current?.click()}
            >
              {importing ? "Importing..." : "Import CSV"}
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshRounded />}
              onClick={() => refetch?.()}
              disabled={isLoading || importing}
            >
              Refresh
            </Button>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
          <Chip
            size="small"
            variant="outlined"
            label={`Days: ${summary.days ?? 0}`}
          />
          <Chip
            size="small"
            variant="outlined"
            color="success"
            label={`Matched days: ${summary.matched_days ?? 0}`}
          />
          <Chip
            size="small"
            variant="outlined"
            color="primary"
            label={`Total Credit (School): ${formatAmount(summary.school_credit)} (${schoolCount + otherCount})`}
          />
          <Chip
            size="small"
            variant="outlined"
            label={`School PG: ${formatAmount(summary.school_amount)} (${schoolCount})`}
          />
          <Chip
            size="small"
            variant="outlined"
            label={`CC Avenue: ${formatAmount(summary.cc_amount)} (${ccCount})`}
          />
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
          <Chip
            size="small"
            variant="outlined"
            label={`Other total: ${formatAmount(summary.other_amount)} (${otherCount})`}
          />
          {otherModes.map((mode) => (
            <Chip
              key={mode.mode}
              size="small"
              variant="outlined"
              label={`${mode.label}: ${formatAmount(mode.amount)} (${mode.count ?? 0})`}
            />
          ))}
        </Box>
      </Card>

      <Card>
        {isLoading ? (
          <Loader />
        ) : isError ? (
          <MessageBox errorMessage={errorMessage} />
        ) : (
          <TableContainer sx={{ overflowY: "unset" }}>
            <Table sx={{ minWidth: 1100 }}>
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
                {rows.map((row) => (
                  <TableRow
                    hover
                    key={row.payment_date}
                    sx={{ cursor: "pointer" }}
                    onClick={() => setSelectedDate(row.payment_date)}
                  >
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {row.payment_date
                        ? dayjs(row.payment_date).format("DD-MM-YYYY")
                        : "—"}
                      {row.payment_date ? (
                        <Box>
                          <Button
                            size="small"
                            variant="text"
                            disabled={Boolean(pdfDate)}
                            onClick={(event) => handleGenerateReport(row.payment_date, event)}
                            sx={{
                              p: 0,
                              minWidth: 0,
                              fontSize: 12,
                              fontWeight: 600,
                              textTransform: "none",
                              lineHeight: 1.2,
                            }}
                          >
                            {pdfDate === row.payment_date ? "Generating..." : "Get daily report"}
                          </Button>
                        </Box>
                      ) : null}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {row.school_count ?? 0}
                      <br />
                      {formatAmount(row.school_amount)}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {row.cc_count ?? 0}
                      <br />
                      {formatAmount(row.cc_amount)}
                    </TableCell>
                    <DifferenceCell row={row} />
                    <TableCell>
                      <NextPayout row={row} />
                    </TableCell>
                    <TableCell>
                      <PayoutDue row={row} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.result === "matched" ? "Matched" : "Check"}
                        color={row.result === "matched" ? "success" : "warning"}
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {!rows.length && <TableNoData />}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog
        open={feesOpen}
        onClose={() => {
          if (!feesPdfLoading) setFeesOpen(false);
        }}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>Fees Collection Report</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {feesPreview?.period || "Selected payment dates"}
          </Typography>
          {feesPreviewLoading ? (
            <Loader />
          ) : (
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
              <Box sx={{ flex: "1 1 420px", minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  PG
                </Typography>
                <TableContainer sx={{ maxHeight: "70vh" }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fees</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(feesPreview?.lines || []).map((line) => (
                        <TableRow key={`pg-${line.label}`}>
                          <TableCell
                            sx={{ color: Number(line.amount) < 0 ? "error.main" : "inherit" }}
                          >
                            {line.label}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              whiteSpace: "nowrap",
                              color: Number(line.amount) < 0 ? "error.main" : "inherit",
                            }}
                          >
                            {formatAmount(line.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!(feesPreview?.lines || []).length && (
                        <TableRow>
                          <TableCell colSpan={2}>No PG fee collections for this filter.</TableCell>
                        </TableRow>
                      )}
                      {(feesPreview?.lines || []).length > 0 && (
                        <>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Fees total</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                              {formatAmount(feesPreview.fee_total)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Payout total</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                              {formatAmount(feesPreview.payout_total)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Difference</TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                                color:
                                  Math.abs(Number(feesPreview.difference) || 0) < 0.05
                                    ? "success.main"
                                    : "error.main",
                              }}
                            >
                              {feesPreview.difference_label || formatAmount(feesPreview.difference)}
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
              <Box sx={{ flex: "1 1 420px", minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Other sources
                </Typography>
                <TableContainer sx={{ maxHeight: "70vh" }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fees</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(feesPreview?.other_sources?.modes || []).map((mode) => (
                        <TableRow key={`mode-${mode.mode}`}>
                          <TableCell sx={{ fontWeight: 700 }}>{mode.label}</TableCell>
                          <TableCell align="right">{mode.count ?? 0}</TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap", fontWeight: 700 }}>
                            {formatAmount(mode.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(feesPreview?.other_sources?.modes || []).length > 0 && (
                        <TableRow>
                          <TableCell colSpan={3} sx={{ fontWeight: 700, bgcolor: "grey.100" }}>
                            By fee
                          </TableCell>
                        </TableRow>
                      )}
                      {(feesPreview?.other_sources?.lines || []).map((line) => (
                        <TableRow key={`other-${line.label}`}>
                          <TableCell
                            sx={{ color: Number(line.amount) < 0 ? "error.main" : "inherit" }}
                          >
                            {line.label}
                          </TableCell>
                          <TableCell align="right">{line.count ?? 0}</TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              whiteSpace: "nowrap",
                              color: Number(line.amount) < 0 ? "error.main" : "inherit",
                            }}
                          >
                            {formatAmount(line.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!(feesPreview?.other_sources?.lines || []).length && (
                        <TableRow>
                          <TableCell colSpan={3}>
                            No cash, draft, or NEFT in these dates.
                          </TableCell>
                        </TableRow>
                      )}
                      {(feesPreview?.other_sources?.lines || []).length > 0 && (
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Other total</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {feesPreview.other_sources.count ?? 0}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                            {formatAmount(feesPreview.other_sources.total)}
                          </TableCell>
                        </TableRow>
                      )}
                      {(feesPreview?.other_sources?.lines || []).length > 0 && (
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, color: "error.main" }}>
                            Concession
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "error.main" }}>
                            {feesPreview.other_sources.concession_students ?? 0}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontWeight: 700, whiteSpace: "nowrap", color: "error.main" }}
                          >
                            {formatAmount(feesPreview.other_sources.concession_amount)}
                          </TableCell>
                        </TableRow>
                      )}
                      {(feesPreview?.other_sources?.receipts || []).length > 0 && (
                        <TableRow
                          hover
                          onClick={() => setWalletOpen((open) => !open)}
                          sx={{ cursor: "pointer" }}
                        >
                          <TableCell colSpan={3} sx={{ fontWeight: 700, bgcolor: "grey.100" }}>
                            {walletOpen ? "Hide" : "Show"} wallet receipts (
                            {(feesPreview?.other_sources?.receipts || []).length})
                          </TableCell>
                        </TableRow>
                      )}
                      {walletOpen &&
                        (feesPreview?.other_sources?.receipts || []).map((receipt, index) => (
                        <TableRow key={`receipt-${receipt.date}-${receipt.reference}-${index}`}>
                          <TableCell>
                            <Box sx={{ fontWeight: 600 }}>
                              {receipt.name}
                              {receipt.reference ? ` · ${receipt.reference}` : ""}
                            </Box>
                            <Box sx={{ color: "text.secondary", fontSize: 12 }}>
                              {receipt.date} · {receipt.mode} · {receipt.what}
                              {receipt.detail ? ` · ${receipt.detail}` : ""}
                            </Box>
                            {receipt.same_day ? (
                              <Box sx={{ color: "text.secondary", fontSize: 12 }}>
                                {receipt.same_day}
                              </Box>
                            ) : null}
                          </TableCell>
                          <TableCell />
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                            {formatAmount(receipt.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeesOpen(false)} disabled={feesPdfLoading}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleFeesReport}
            disabled={feesPdfLoading || feesPreviewLoading || !(feesPreview?.lines || []).length}
            startIcon={
              feesPdfLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Iconify icon="uiw:file-pdf" />
              )
            }
          >
            {feesPdfLoading ? "Generating..." : "Generate PDF"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(selectedDate)}
        onClose={() => setSelectedDate(null)}
        maxWidth="xl"
        fullWidth
      >
        <DialogContent sx={{ pt: 1.5 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Button
              size="small"
              variant="contained"
              onClick={() => handleGenerateReport(selectedDate)}
              disabled={Boolean(pdfDate) || isDayLoading || isDayError || !selectedDate}
              startIcon={
                pdfDate ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Iconify icon="uiw:file-pdf" />
                )
              }
            >
              {pdfDate ? "Generating..." : "Generate Report"}
            </Button>
          </Box>
          <DayHead date={selectedDate} summary={daySummary} />

          {isDayLoading ? (
            <Loader />
          ) : isDayError ? (
            <MessageBox errorMessage={dayErrorMessage} />
          ) : (
            <TableContainer sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <HeaderLine top="Student" bottom="Roll / App No" />
                    </TableCell>
                    <TableCell>
                      <HeaderLine top="Order ID" bottom="Paid at" />
                    </TableCell>
                    <TableCell align="right">
                      <HeaderLine top="CC Avenue Payout" bottom="School" align="right" />
                    </TableCell>
                    <TableCell>Fees Details</TableCell>
                    <TableCell>
                      <HeaderLine top="Settle date" bottom="Bank" />
                    </TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderRows.map((row) => {
                    const laterSettlement = isLaterSettlement(row, daySummary);
                    return (
                    <TableRow
                      key={`${row.status}-${row.order_id}`}
                      hover
                      sx={
                        laterSettlement
                          ? {
                              backgroundColor: "#fff3e0",
                              "&:hover": { backgroundColor: "#ffe0b2" },
                            }
                          : undefined
                      }
                    >
                      <TableCell>
                        <Typography variant="body2">{row.payer_name || "—"}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {row.roll_no || row.application_no || "—"}
                        </Typography>
                        {row.class_name ? (
                          <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>
                            {row.class_name}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Typography variant="body2">{row.order_id || "—"}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatWhen(row.paid_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Typography variant="body2">{formatAmount(row.cc_amount)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatAmount(row.school_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <FeeLines fees={row.fees} />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: laterSettlement ? "#e65100" : "info.main",
                            fontWeight: 600,
                          }}
                        >
                          {row.settlement_date
                            ? dayjs(row.settlement_date).format("DD-MM-YYYY")
                            : "—"}
                          {row.settlement_mode ? ` · ${row.settlement_mode}` : ""}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: laterSettlement ? "#e65100" : "text.secondary" }}
                        >
                          {row.utr_no || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5 }}>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={
                              row.status === "cc_other_date" && row.cc_payment_date
                                ? `CC Avenue ${dayjs(row.cc_payment_date).format("DD-MM-YYYY")}`
                                : STATUS_LABEL[row.status] || row.status
                            }
                            color={
                              row.status === "matched"
                                ? "success"
                                : row.status === "cc_other_date"
                                  ? "info"
                                  : row.status === "amount_mismatch"
                                  ? "warning"
                                  : "error"
                            }
                          />
                          {Number(row.cc_amount) < 0 ? (
                            <Chip size="small" label="Reversed" color="error" />
                          ) : null}
                        </Box>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                  {!orderRows.length && (
                    <TableRow>
                      <TableCell colSpan={6}>No orders for this day.</TableCell>
                    </TableRow>
                  )}
                  {orderRows.length > 0 && (
                    <DayTotals rows={orderRows} summary={daySummary} />
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button onClick={() => setSelectedDate(null)}>Close</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function DayHead({ date, summary }) {
  const { next, dues } = splitPayouts(summary);
  const paymentDate = date ? dayjs(date).format("DD-MM-YYYY") : "—";

  return (
    <Box sx={{ mb: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          gap: 0.75,
          px: 1.5,
          py: 0.75,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>
          Date wise Collection Report :
        </Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>
          {paymentDate}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
          px: 1.5,
          py: 0.85,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.3 }}>
            Payment date
          </Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>
            {paymentDate}
          </Typography>
        </Box>
        <Box>
          <AmountLine
            label="School PG Amount"
            count={summary.school_count}
            amount={summary.school_amount}
          />
          <AmountLine
            label="CC Avenue Amount"
            count={summary.cc_count}
            amount={summary.cc_amount}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
          px: 1.5,
          py: 0.85,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.3 }}>
            Payout date
          </Typography>
          {next.length ? (
            next.map((item) => (
              <Typography
                key={item.pay_id || item.utr_no}
                sx={{ fontSize: 13, fontWeight: 600, color: "info.main", lineHeight: 1.4 }}
              >
                {formatDay(item.settlement_date)}
                {item.settlement_mode ? ` · ${item.settlement_mode}` : ""}
              </Typography>
            ))
          ) : (
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>—</Typography>
          )}
        </Box>
        <Box>
          {next.length ? (
            next.map((item) => {
              const included = (item.included_from || []).filter(
                (part) => Math.abs(Number(part.amount) || 0) >= 0.05
              );
              return (
                <Box key={`amt-${item.pay_id || item.utr_no}`}>
                  <AmountLine label="Payout amount" text={payoutMath(item)} />
                  {included.map((part) => (
                    <Typography
                      key={part.payment_date}
                      sx={{ fontSize: 12, fontWeight: 600, color: "success.main", lineHeight: 1.4 }}
                    >
                      + {formatAmount(part.amount)} from {formatDay(part.payment_date)}
                    </Typography>
                  ))}
                  {item.utr_no ? (
                    <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.4 }}>
                      {item.utr_no}
                    </Typography>
                  ) : null}
                </Box>
              );
            })
          ) : (
            <AmountLine label="Payout amount" text="—" />
          )}
          <Box sx={{ mt: 0.25 }}>
            {!dues.length ? (
              <AmountLine label="Payout due" text="₹ 0" tone="ok" />
            ) : (
              dues.map((item) => (
                <Box key={item.pay_id || item.utr_no}>
                  <AmountLine
                    label="Payout due"
                    text={formatAmount(item.this_day_amount)}
                    tone="due"
                  />
                  <Typography
                    sx={{ fontSize: 12, fontWeight: 600, color: "info.main", lineHeight: 1.4 }}
                  >
                    {formatDay(item.settlement_date)}
                    {item.settlement_mode ? ` · ${item.settlement_mode}` : ""}
                    {item.utr_no ? ` · ${item.utr_no}` : ""}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function AmountLine({ label, count, amount, text, tone }) {
  const value = text !== undefined ? text : formatAmount(amount);
  const color = tone === "due" ? "error.main" : tone === "ok" ? "success.main" : "text.primary";

  return (
    <Typography sx={{ fontSize: 13, lineHeight: 1.5 }}>
      <Box component="span" sx={{ color: "text.secondary", fontSize: 12 }}>
        {label}
        {count !== undefined && count !== null ? ` (${count})` : ""}
        {" : "}
      </Box>
      <Box component="span" sx={{ fontWeight: 600, color }}>
        {value}
      </Box>
    </Typography>
  );
}

function HeaderLine({ top, bottom, align = "left" }) {
  return (
    <Box sx={{ textAlign: align }}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {top}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {bottom}
      </Typography>
    </Box>
  );
}

function FeeLines({ fees }) {
  const lines = Array.isArray(fees) ? fees : [];
  if (!lines.length) {
    return (
      <Typography variant="caption" color="text.secondary">
        —
      </Typography>
    );
  }

  return (
    <Box>
      {lines.map((fee) => (
        <Typography
          key={fee.key || fee.label}
          variant="caption"
          display="block"
          sx={{ whiteSpace: "nowrap", color: Number(fee.amount) < 0 ? "error.main" : "inherit" }}
        >
          {fee.label} {formatAmount(fee.amount)}
        </Typography>
      ))}
    </Box>
  );
}

function isLaterSettlement(row, summary) {
  const { next } = splitPayouts(summary || {});
  const earliest = next[0]?.settlement_date;
  return Boolean(row?.settlement_date && earliest && row.settlement_date !== earliest);
}

function DayTotals({ rows, summary }) {
  const ccTotal = rows.reduce((sum, row) => sum + (Number(row.cc_amount) || 0), 0);
  const schoolTotal = rows.reduce((sum, row) => sum + (Number(row.school_amount) || 0), 0);
  const matched = rows.filter((row) => row.status === "matched").length;
  const check = rows.length - matched;
  const groups = {};

  rows.forEach((row) => {
    (row.fees || []).forEach((fee) => {
      const key = fee.key || fee.label;
      if (!groups[key]) {
        groups[key] = {
          key,
          label: fee.label,
          amount: 0,
          sort: fee.sort ?? 50,
        };
      }
      groups[key].amount += Number(fee.amount) || 0;
    });
  });

  const feeLines = Object.values(groups).sort(
    (a, b) => a.sort - b.sort || a.label.localeCompare(b.label)
  );
  const feeTotal = feeLines.reduce((sum, line) => sum + line.amount, 0);
  const classGroups = {};

  rows.forEach((row) => {
    const name = row.class_name || "No class";
    if (!classGroups[name]) {
      classGroups[name] = {
        class_name: name,
        amount: 0,
        count: 0,
        sort: row.class_order ?? 999,
      };
    }
    const paid = row.school_amount !== null && row.school_amount !== undefined
      ? Number(row.school_amount)
      : Number(row.cc_amount) || 0;
    classGroups[name].amount += paid;
    classGroups[name].count += 1;
  });

  const classLines = Object.values(classGroups).sort(
    (a, b) => a.sort - b.sort || a.class_name.localeCompare(b.class_name)
  );
  const classTotal = classLines.reduce((sum, line) => sum + line.amount, 0);
  const settleGroups = {};

  rows.forEach((row) => {
    const key = `${row.settlement_date || "none"}|${row.utr_no || ""}`;
    if (!settleGroups[key]) {
      settleGroups[key] = {
        settlement_date: row.settlement_date,
        settlement_mode: row.settlement_mode,
        utr_no: row.utr_no,
        amount: 0,
        later: isLaterSettlement(row, summary),
      };
    }
    settleGroups[key].amount += Number(row.cc_amount) || 0;
  });

  const settleLines = Object.values(settleGroups).sort((a, b) =>
    String(a.settlement_date || "9999").localeCompare(String(b.settlement_date || "9999"))
  );

  return (
    <TableRow sx={{ backgroundColor: "action.hover" }}>
      <TableCell sx={{ fontWeight: 700, verticalAlign: "top" }}>
        {rows.length}
      </TableCell>
      <TableCell />
      <TableCell align="right" sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          Total CC Avenue Payout = {formatAmount(ccTotal)}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          Total School Pays = {formatAmount(schoolTotal)}
        </Typography>
        <Box sx={{ mt: 0.75 }}>
          {classLines.map((line) => (
            <Typography key={line.class_name} variant="caption" display="block">
              {line.class_name} ({line.count}) : {formatAmount(line.amount)}
            </Typography>
          ))}
          <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }}>
            Total {formatAmount(classTotal)}
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ verticalAlign: "top" }}>
        {feeLines.map((line) => (
          <Typography key={line.key} variant="caption" display="block" sx={{ whiteSpace: "nowrap" }}>
            {line.label} {formatAmount(line.amount)}
          </Typography>
        ))}
        <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
          Total {formatAmount(feeTotal)}
        </Typography>
      </TableCell>
      <TableCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
        {settleLines.map((line) => (
          <Box key={`${line.settlement_date}-${line.utr_no}`} sx={{ mb: 0.5 }}>
            <Typography
              variant="caption"
              display="block"
              sx={{ fontWeight: 700, color: line.later ? "#e65100" : "info.main" }}
            >
              {line.settlement_date ? formatDay(line.settlement_date) : "Not settled"}
              {line.settlement_mode ? ` · ${line.settlement_mode}` : ""}
            </Typography>
            <Typography variant="caption" display="block" sx={{ color: line.later ? "#e65100" : "text.secondary" }}>
              {line.utr_no || "—"}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: line.later ? "#e65100" : "text.primary" }}>
              {formatAmount(line.amount)}
            </Typography>
          </Box>
        ))}
      </TableCell>
      <TableCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
        <Typography variant="body2" sx={{ color: "success.main", fontWeight: 700 }}>
          {matched} match
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: check ? "warning.main" : "success.main", fontWeight: 700 }}
        >
          {check} check
        </Typography>
      </TableCell>
    </TableRow>
  );
}

function splitPayouts(row) {
  if (Array.isArray(row?.next_payouts) || Array.isArray(row?.payout_dues)) {
    return {
      next: Array.isArray(row.next_payouts) ? row.next_payouts : [],
      dues: Array.isArray(row.payout_dues) ? row.payout_dues : [],
    };
  }

  const list = [...(row?.settlements || [])].sort((a, b) =>
    String(a.settlement_date || "").localeCompare(String(b.settlement_date || ""))
  );
  if (!list.length) return { next: [], dues: [] };
  const earliest = list[0].settlement_date;
  const onEarliest = list.filter((item) => item.settlement_date === earliest);
  const later = list.filter((item) => item.settlement_date !== earliest);
  const mainAmount = onEarliest.reduce(
    (max, item) => Math.max(max, Number(item.this_day_amount) || 0),
    0
  );
  return {
    next: onEarliest.filter((item) => Math.abs((Number(item.this_day_amount) || 0) - mainAmount) < 0.05),
    dues: [
      ...onEarliest.filter((item) => Math.abs((Number(item.this_day_amount) || 0) - mainAmount) >= 0.05),
      ...later,
    ],
  };
}

function DifferenceCell({ row }) {
  const schoolGap = Number(row.difference) || 0;
  const amount = -schoolGap;
  const zero = Math.abs(amount) < 0.05;
  const positive = amount > 0;
  const gaps = Array.isArray(row.date_gaps) ? row.date_gaps : [];

  return (
    <TableCell
      align="right"
      sx={{
        whiteSpace: "nowrap",
        color: zero || positive ? "success.main" : "error.main",
        fontWeight: 600,
      }}
    >
      {zero ? formatAmount(0) : `${positive ? "+ " : "− "}${formatAmount(Math.abs(amount))}`}
      {gaps.map((gap) => {
        const addedOnCc = gap.direction === "from";
        return (
          <Typography
            key={`${gap.direction}-${gap.other_date}`}
            display="block"
            sx={{
              color: addedOnCc ? "success.main" : "error.main",
              fontWeight: 600,
              fontSize: 11,
              lineHeight: 1.3,
            }}
          >
            {addedOnCc ? "+ " : "− "}
            {formatAmount(gap.amount)}{" "}
            {addedOnCc
              ? `from ${formatDay(gap.other_date)} from School PG`
              : `dated ${formatDay(gap.other_date)} from CC Avenue`}
          </Typography>
        );
      })}
    </TableCell>
  );
}

function formatDay(value) {
  if (!value) return "—";
  const d = dayjs(value);
  return d.isValid() ? d.format("DD-MM-YYYY") : value;
}

function payoutMath(item) {
  const included = (item.included_from || []).filter(
    (part) => Math.abs(Number(part.amount) || 0) >= 0.05
  );
  if (included.length) {
    const pieces = [
      formatAmount(item.this_day_amount),
      ...included.map((part) => formatAmount(part.amount)),
    ];
    return `${pieces.join(" + ")} = ${formatAmount(item.bank_amount)}`;
  }

  const bank = Number(item.bank_amount);
  const today = Number(item.this_day_amount);
  if (Number.isFinite(bank) && Number.isFinite(today) && Math.abs(bank - today) >= 0.05) {
    return `${formatAmount(today)} + ${formatAmount(bank - today)} = ${formatAmount(bank)}`;
  }

  return formatAmount(item.bank_amount ?? item.this_day_amount);
}

function NextPayout({ row }) {
  const { next } = splitPayouts(row);
  if (!next.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {next.map((item) => {
        const included = (item.included_from || []).filter(
          (part) => Math.abs(Number(part.amount) || 0) >= 0.05
        );
        return (
          <Box key={item.pay_id || item.utr_no}>
            <Typography variant="body2" sx={{ color: "info.main", fontWeight: 600 }}>
              {formatDay(item.settlement_date)}
              {item.settlement_mode ? ` · ${item.settlement_mode}` : ""}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
              {payoutMath(item)}
            </Typography>
            {included.map((part) => (
              <Typography
                key={part.payment_date}
                variant="body2"
                display="block"
                sx={{ color: "success.main", fontWeight: 700, whiteSpace: "nowrap" }}
              >
                + {formatAmount(part.amount)} from {formatDay(part.payment_date)}
              </Typography>
            ))}
            {item.utr_no ? (
              <Typography variant="caption" display="block" color="text.secondary">
                {item.utr_no}
              </Typography>
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}

function PayoutDue({ row }) {
  const { next, dues } = splitPayouts(row);
  if (!next.length && !dues.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }
  if (!dues.length) {
    return (
      <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
        ₹ 0
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {dues.map((item) => (
        <Box key={item.pay_id || item.utr_no}>
          <Typography variant="body2" sx={{ color: "error.main", fontWeight: 700 }}>
            {formatAmount(item.this_day_amount)}
          </Typography>
          <Typography variant="body2" sx={{ color: "info.main", fontWeight: 600 }}>
            {formatDay(item.settlement_date)}
            {item.settlement_mode ? ` · ${item.settlement_mode}` : ""}
          </Typography>
          {item.utr_no ? (
            <Typography variant="caption" display="block" color="text.secondary">
              {item.utr_no}
            </Typography>
          ) : null}
        </Box>
      ))}
    </Box>
  );
}
