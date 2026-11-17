import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
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
import { ClearRounded, CloseRounded, RefreshRounded } from "@mui/icons-material";
import dayjs from "dayjs";
import { useGetApi } from "../../../hooks/useGetApi";
import useAuth from "../../../hooks/useAuth";
import Loader from "../../../components/loader/loader";
import MessageBox from "../../../components/error/message-box";
import TableEmptyRows from "../../../components/table/table-empty-rows";
import TableNoData from "../../../components/table/table-no-data";
import {
  DEFAULT_LIMIT,
  emptyRows,
  FORMAT_INDIAN_CURRENCY,
  ROWS_PER_PAGE_OPTIONS,
} from "../../../utils/constants";
import {
  getAllAcademicYears,
  getConcessionStudentFees,
  getConcessionStudents,
} from "../../../services/admin/students-management.service";

const ON_ROLL_LIST = [
  { label: "On Roll", value: "1" },
  { label: "Off Roll", value: "0" },
];

const HEAD_LABEL = [
  { id: "sn", label: "SN" },
  { id: "roll", label: "Roll No" },
  { id: "name", label: "Student Name" },
  { id: "class", label: "Class" },
  { id: "total_fees", label: "Total Fees Amount", align: "right" },
  { id: "total_concession", label: "Total Concession Amount", align: "right" },
  {
    id: "paid_concession",
    label: "Total Concession Paid Amount",
    align: "right",
  },
  {
    id: "unpaid_concession",
    label: "Total Concession Unpaid Amount",
    align: "right",
  },
  { id: "action", label: "Action", align: "center" },
];

const FEE_HEAD_LABEL = [
  { id: "sn", label: "SN" },
  { id: "fee", label: "Fee" },
  { id: "amount", label: "Fee Amount", align: "right" },
  { id: "concession", label: "Concession", align: "right" },
  { id: "payable", label: "Payable", align: "right" },
  { id: "status", label: "Status" },
  { id: "due", label: "Due Date" },
  { id: "paid_date", label: "Paid Date" },
];

const formatAmount = (amount) =>
  `₹ ${FORMAT_INDIAN_CURRENCY(amount) || "0"}`;

const AmountWithCount = ({ amount, count, countLabel = "fees", color }) => (
  <Box sx={{ textAlign: "right" }}>
    <Typography variant="body2" sx={{ fontWeight: 600, color }}>
      {formatAmount(amount)}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      ({count || 0} {countLabel})
    </Typography>
  </Box>
);

export default function ConcessionStudents() {
  const { userInfo, logout } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_LIMIT);
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState(null);
  const [stOnRoll, setStOnRoll] = useState(ON_ROLL_LIST[0]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailData, setDetailData] = useState(null);

  const { dataList: academicYearList } = useGetApi({
    apiFunction: getAllAcademicYears,
  });

  const resolvedYear = useMemo(() => {
    if (selectedYear?.ay_id) return selectedYear;
    const list = academicYearList || [];
    const byUser = list.find(
      (y) => Number(y?.ay_id) === Number(userInfo?.ay_id),
    );
    if (byUser) return byUser;
    return list.find((y) => String(y?.ay_current) === "1") || null;
  }, [selectedYear, academicYearList, userInfo?.ay_id]);

  const selectedAyId = Number(resolvedYear?.ay_id) || null;

  const {
    dataList,
    dataCount,
    allResponse,
    isLoading,
    isError,
    errorMessage,
    refetch,
  } = useGetApi({
    apiFunction: selectedAyId ? getConcessionStudents : null,
    body: {
      ay_id: selectedAyId,
      search: search.trim() || undefined,
      st_on_roll: stOnRoll?.value ?? "1",
      offset: page * rowsPerPage,
      limit: rowsPerPage,
    },
    dependencies: [selectedAyId, page, rowsPerPage, search, stOnRoll?.value],
    debounceDelay: 400,
    skip: !selectedAyId,
  });

  const summary = allResponse?.summary || {};
  const notFound = !dataCount;

  const handleSearch = (event) => {
    setPage(0);
    setSearch(event.target.value);
  };

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
    setSelectedYear(null);
    setStOnRoll(ON_ROLL_LIST[0]);
  };

  const handleOpenDetails = async (row) => {
    if (!selectedAyId || !row?.st_id) return;
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setDetailData(null);

    const response = await getConcessionStudentFees({
      st_id: row.st_id,
      ay_id: selectedAyId,
    });

    setDetailLoading(false);

    if (response?.code === 200) {
      setDetailData(response?.data || null);
    } else if (response?.code === 401) {
      logout(response);
    } else {
      setDetailError(
        response?.message || "Failed to fetch concession fee details.",
      );
    }
  };

  const handleCloseDetails = () => {
    setDetailOpen(false);
    setDetailData(null);
    setDetailError("");
  };

  return (
    <>
      <Helmet>
        <title>Concession Students | GREENWOOD</title>
      </Helmet>

      <Card sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mb: 2,
          }}
        >
          <Typography variant="h5">Concession Students</Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Chip
              color="primary"
              variant="outlined"
              label={`Applied Concession: ${formatAmount(
                summary.total_concession_amount,
              )}`}
            />
            <Chip
              color="success"
              variant="outlined"
              label={`Paid Amount: ${formatAmount(
                summary.paid_concession_amount,
              )}`}
            />
            <Chip
              color="error"
              variant="outlined"
              label={`Unpaid Amount: ${formatAmount(
                summary.unpaid_concession_amount,
              )}`}
            />
            <Button
              variant="outlined"
              startIcon={<ClearRounded />}
              onClick={handleClearFilters}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              startIcon={<RefreshRounded />}
              onClick={refetch}
              disabled={!selectedAyId || isLoading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 2,
            mb: 2,
          }}
        >
          <TextField
            value={search}
            onChange={handleSearch}
            placeholder="Search by name or roll no..."
            size="small"
            sx={{ width: 240 }}
          />

          <Autocomplete
            options={academicYearList || []}
            getOptionLabel={(option) => option?.ay_name || ""}
            isOptionEqualToValue={(option, value) =>
              Number(option?.ay_id) === Number(value?.ay_id)
            }
            value={resolvedYear}
            onChange={(_, value) => {
              setPage(0);
              setSelectedYear(value);
            }}
            sx={{ width: 200 }}
            renderInput={(params) => (
              <TextField {...params} label="Academic Year" size="small" />
            )}
          />

          <Autocomplete
            options={ON_ROLL_LIST}
            getOptionLabel={(option) => option?.label || ""}
            isOptionEqualToValue={(option, value) =>
              String(option?.value) === String(value?.value)
            }
            value={stOnRoll}
            onChange={(_, value) => {
              setPage(0);
              setStOnRoll(value || ON_ROLL_LIST[0]);
            }}
            disableClearable
            sx={{ width: 180 }}
            renderInput={(params) => (
              <TextField {...params} label="Student On Roll" size="small" />
            )}
          />
        </Box>

        {isLoading ? (
          <Loader />
        ) : isError ? (
          <MessageBox errorMessage={errorMessage} />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {HEAD_LABEL.map((head) => (
                    <TableCell key={head.id} align={head.align || "left"}>
                      {head.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(dataList || []).map((row, index) => (
                  <TableRow hover key={row.st_id}>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{row.st_roll_no || "-"}</TableCell>
                    <TableCell>{row.student_name || "-"}</TableCell>
                    <TableCell>{row.class_name || "-"}</TableCell>
                    <TableCell align="right">
                      <AmountWithCount
                        amount={row.total_fees_amount}
                        count={row.total_fees_count}
                        countLabel="fees"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <AmountWithCount
                        amount={row.total_concession_amount}
                        count={row.concession_fees_count}
                        countLabel="applied"
                        color="primary.main"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <AmountWithCount
                        amount={row.paid_concession_amount}
                        count={row.paid_concession_count}
                        countLabel="applied"
                        color="success.main"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <AmountWithCount
                        amount={row.unpaid_concession_amount}
                        count={row.unpaid_concession_count}
                        countLabel="applied"
                        color="error.main"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenDetails(row)}
                      >
                        View Fees
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                <TableEmptyRows
                  height={64}
                  emptyRows={emptyRows(page, rowsPerPage, dataCount || 0)}
                />

                {notFound && <TableNoData query={search} />}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          page={page}
          component="div"
          count={dataCount || 0}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      <Dialog
        open={detailOpen}
        onClose={handleCloseDetails}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box>
            <Typography variant="h6">Concession Fee Details</Typography>
            {detailData?.student && (
              <Typography variant="body2" color="text.secondary">
                {detailData.student.student_name} (
                {detailData.student.st_roll_no || "-"})
                {detailData.student.class_name
                  ? ` · ${detailData.student.class_name}`
                  : ""}
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleCloseDetails}>
            <CloseRounded />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Loader />
          ) : detailError ? (
            <MessageBox errorMessage={detailError} />
          ) : (
            <>
              {detailData?.summary && (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    mb: 2,
                  }}
                >
                  <Chip label={`Fees: ${detailData.summary.fees_count || 0}`} />
                  <Chip
                    color="primary"
                    label={`Total Concession: ${formatAmount(
                      detailData.summary.total_concession,
                    )}`}
                  />
                  <Chip
                    color="success"
                    label={`Paid: ${detailData.summary.paid_count || 0}`}
                  />
                  <Chip
                    color="error"
                    label={`Unpaid: ${detailData.summary.unpaid_count || 0}`}
                  />
                </Box>
              )}

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {FEE_HEAD_LABEL.map((head) => (
                        <TableCell key={head.id} align={head.align || "left"}>
                          {head.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(detailData?.fees || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={FEE_HEAD_LABEL.length}>
                          No concession fees found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      detailData.fees.map((fee, index) => (
                        <TableRow key={fee.id} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{fee.fpp_name || "-"}</TableCell>
                          <TableCell align="right">
                            {formatAmount(fee.fpp_amount)}
                          </TableCell>
                          <TableCell align="right">
                            {formatAmount(fee.f_concession)}
                          </TableCell>
                          <TableCell align="right">
                            {formatAmount(fee.payable_amount)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              color={
                                fee.payment_status === "Paid"
                                  ? "success"
                                  : "error"
                              }
                              label={fee.payment_status}
                            />
                          </TableCell>
                          <TableCell>
                            {fee.fpp_due_date
                              ? dayjs(fee.fpp_due_date).format("DD-MM-YYYY")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {fee.f_paid_date
                              ? dayjs(fee.f_paid_date).format("DD-MM-YYYY")
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
