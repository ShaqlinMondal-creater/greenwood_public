import PropTypes from "prop-types";
import {
  Box,
  Button,
  Grid,
  TablePagination,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useGetApi } from "../../../../../hooks/useGetApi";
import { getAllClassGroup } from "../../../../../services/admin/classes.service";
import Loader from "../../../../../components/loader/loader";
import MessageBox from "../../../../../components/error/message-box";
import Iconify from "../../../../../components/iconify/iconify";
import AddNewClassModal from "./modals/add-new-class-modal";
import CopyClassesModal from "./modals/copy-classes-modal";

const Classes = ({ academicYear, academicYearList }) => {
  const theme = useTheme();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState();

  // Copy is allowed only for years newer than the current academic year.
  // Example: current=10 → enabled only for ay_id 11, 12, ...
  const canCopyFromPreviousYear = useMemo(() => {
    const list = academicYearList || [];
    const currentYear = list.find((y) => String(y?.ay_current) === "1");
    const currentAyId = Number(currentYear?.ay_id || 0);
    const thisAyId = Number(academicYear?.ay_id || 0);

    if (!thisAyId) return false;
    if (currentAyId > 0) return thisAyId > currentAyId;

    // Fallback: enable only for the highest ay_id
    const maxAyId = list.reduce(
      (max, y) => Math.max(max, Number(y?.ay_id || 0)),
      0,
    );
    return thisAyId === maxAyId && maxAyId > 0;
  }, [academicYear?.ay_id, academicYearList]);

  const handleSearch = (e) => {
    setPage(0);
    setSearch(e.target.value);
  };

  const handleChangePage = (_, newPage) => {
    if (!isLoading) setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleModalOpen = (option) => {
    setModalOpen(true);
    setSelectedRow(option);
  };
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedRow(null);
  };

  const handleCopyModalOpen = () => setCopyModalOpen(true);
  const handleCopyModalClose = () => setCopyModalOpen(false);

  const {
    dataList: classList,
    dataCount: classCount,
    isLoading,
    isError,
    refetch,
    errorMessage,
  } = useGetApi({
    apiFunction: getAllClassGroup,
    body: {
      ay_id: academicYear?.ay_id,
      offset: page * rowsPerPage,
      limit: rowsPerPage,
      search,
    },
    dependencies: [page, rowsPerPage, search, academicYear?.ay_id],
    debounceDelay: 500,
  });

  const notFound = !classCount;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          onClick={handleCopyModalOpen}
          disabled={!canCopyFromPreviousYear}
          title={
            canCopyFromPreviousYear
              ? "Copy classes from a previous academic year"
              : "Available only for academic years newer than the current year"
          }
        >
          Copy from Previous Year
        </Button>
        <Button variant="contained" onClick={() => handleModalOpen()}>
          + Add New
        </Button>
        <AddNewClassModal
          open={modalOpen}
          onClose={handleModalClose}
          refetch={refetch}
          academicYear={academicYear}
          detail={selectedRow}
        />
        <CopyClassesModal
          open={copyModalOpen}
          onClose={handleCopyModalClose}
          refetch={refetch}
          academicYear={academicYear}
          academicYearList={academicYearList}
        />
      </Box>
      <TextField
        value={search || ""}
        onChange={handleSearch}
        placeholder="Search by class or name..."
        size="small"
        fullWidth
      />
      {isLoading ? (
        <Loader />
      ) : isError ? (
        <MessageBox errorMessage={errorMessage} />
      ) : (
        <Box sx={{ py: 2 }}>
          <Grid container spacing={3}>
            {classList?.map((option) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={option?.cg_id}>
                <Box
                  sx={{
                    height: "150px",
                    width: "100%",
                    border: `2px solid ${theme.palette.primary.main}`,
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.5,
                      height: "calc(100% - 35px)",
                      textAlign: "center",
                      p: 0.5,
                    }}
                  >
                    <Typography
                      sx={{
                        color: "primary.main",
                        fontSize: { xs: "16px", md: "18px", xl: "20px" },
                        fontWeight: { xs: 500, md: 600 },
                        lineHeight: 1.2,
                      }}
                    >
                      {option?.cg_name || ""}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: { xs: "14px", md: "15px", xl: "16px" },
                        lineHeight: 1.2,
                      }}
                    >
                      {option?.class_teacher_name || ""}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      py: 0.5,
                      px: 1,
                      width: "100%",
                      height: "35px",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Iconify icon="hugeicons:students" />
                      <Typography variant="body2" noWrap>
                        {option?.total_students ?? 0}
                      </Typography>
                    </Box>
                    <Iconify
                      icon="lucide:edit"
                      sx={{ cursor: "pointer" }}
                      onClick={() => handleModalOpen(option)}
                    />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
          {notFound && (
            <Box
              sx={{ height: "150px", display: "grid", placeItems: "center" }}
            >
              <Typography variant="h4" sx={{ textAlign: "center" }}>
                No Data Found
              </Typography>
            </Box>
          )}

          <TablePagination
            page={page}
            component="div"
            count={classCount}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            rowsPerPageOptions={[4, 12, 24, 48, 100]}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      )}
    </Box>
  );
};

Classes.propTypes = {
  academicYear: PropTypes.object,
  academicYearList: PropTypes.array,
};

export default Classes;
