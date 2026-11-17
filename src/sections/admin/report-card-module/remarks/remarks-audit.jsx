import { useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";
import Loader from "../../../../components/loader/loader";
import MessageBox from "../../../../components/error/message-box";
import { useGetApi } from "../../../../hooks/useGetApi";
import useAuth from "../../../../hooks/useAuth";
import {
  fixRemarksAudit,
  getRemarksAuditCompare,
} from "../../../../services/admin/report-card-module.service";
import {
  DEFAULT_LIMIT,
  ROWS_PER_PAGE_OPTIONS,
} from "../../../../utils/constants";

const wrongSx = {
  color: "error.main",
  textDecoration: "underline",
  textDecorationColor: "error.main",
  textUnderlineOffset: "2px",
  fontWeight: 600,
};

const RemarksAudit = () => {
  const { logout, userInfo } = useAuth();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [classFilters, setClassFilters] = useState([]);
  const [slFilter, setSlFilter] = useState(null);
  const [mismatchesOnly, setMismatchesOnly] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_LIMIT || 50);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [savedMismatchCount, setSavedMismatchCount] = useState(0);
  const tableContainerRef = useRef(null);
  const scrollTopRef = useRef(0);

  const classKey = useMemo(
    () =>
      (classFilters || [])
        .map((c) => c.cg_id)
        .sort()
        .join(","),
    [classFilters],
  );

  const body = useMemo(
    () => ({
      ay_id: userInfo?.ay_id || null,
      cg_ids: (classFilters || []).map((c) => c.cg_id),
      sl_no: slFilter || null,
      search: search || "",
      mismatches_only: mismatchesOnly,
      offset: page * rowsPerPage,
      limit: rowsPerPage,
    }),
    [
      userInfo?.ay_id,
      classKey,
      slFilter,
      search,
      mismatchesOnly,
      page,
      rowsPerPage,
    ],
  );

  const {
    dataList: auditData,
    isLoading,
    isError,
    errorMessage,
    allResponse,
  } = useGetApi({
    apiFunction: getRemarksAuditCompare,
    body,
    dependencies: [
      body.ay_id,
      classKey,
      body.sl_no,
      body.search,
      body.mismatches_only,
      body.offset,
      body.limit,
    ],
    debounceDelay: 400,
  });

  if (allResponse?.code === 401) {
    logout(allResponse);
  }

  const data = auditData && typeof auditData === "object" ? auditData : null;
  const correctBank = Array.isArray(data?.correct_bank) ? data.correct_bank : [];
  const classOptions = Array.isArray(data?.class_options)
    ? data.class_options
    : [];
  const slOptions = Array.isArray(data?.sl_options) ? data.sl_options : [];

  useEffect(() => {
    if (!data) return;
    setStudents(Array.isArray(data.students) ? data.students : []);
    setTotal(Number(data.student_count || 0));
    setSavedMismatchCount(Number(data.saved_mismatch_count ?? 0));
  }, [data]);

  const rememberScroll = () => {
    scrollTopRef.current = tableContainerRef.current?.scrollTop || 0;
  };

  const restoreScroll = () => {
    requestAnimationFrame(() => {
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = scrollTopRef.current;
      }
    });
  };

  const applyLocalRowFix = (row, savedText) => {
    rememberScroll();
    const hadSavedMismatch = !!row.saved_vs_correct_mismatch;
    const nextHasMismatch = false;

    const patched = {
      ...row,
      saved_remark_text: savedText,
      expected_personalized_text:
        row.expected_personalized_text || savedText,
      saved_vs_correct_mismatch: false,
      has_mismatch: nextHasMismatch,
      saved_segments: (row.saved_segments || []).map((seg) => ({
        ...seg,
        is_wrong: false,
      })),
    };

    setStudents((prev) => {
      if (mismatchesOnly && !nextHasMismatch) {
        return prev.filter((r) => r.remark_row_id !== row.remark_row_id);
      }
      return prev.map((r) =>
        r.remark_row_id === row.remark_row_id ? patched : r,
      );
    });

    if (mismatchesOnly && !nextHasMismatch) {
      setTotal((n) => Math.max(0, n - 1));
    }
    if (hadSavedMismatch) {
      setSavedMismatchCount((n) => Math.max(0, n - 1));
    }
    restoreScroll();
  };

  const handleSearchSubmit = () => {
    setPage(0);
    setSearch(searchInput.trim());
  };

  const handleFixFromCorrect = async (row) => {
    setSavingId(row.remark_row_id);
    const response = await fixRemarksAudit({
      remark_row_id: row.remark_row_id,
      mode: "fix_from_correct",
      remark_ids: row.remark_ids || [],
    });
    setSavingId(null);
    if (response?.code === 200) {
      toast.success(response?.message || "Fixed from correct bank");
      setEditingId(null);
      applyLocalRowFix(
        row,
        response?.data?.remark_text ||
          row.expected_personalized_text ||
          row.saved_remark_text,
      );
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Fix failed");
    }
  };

  const handleSaveText = async (row) => {
    const text = String(editText || "").trim();
    if (!text) {
      toast.error("Remark text cannot be empty");
      return;
    }
    setSavingId(row.remark_row_id);
    const response = await fixRemarksAudit({
      remark_row_id: row.remark_row_id,
      mode: "save_text",
      remark_ids: row.remark_ids || [],
      remark_text: text,
    });
    setSavingId(null);
    if (response?.code === 200) {
      toast.success("Remark text saved");
      setEditingId(null);
      applyLocalRowFix(row, response?.data?.remark_text || text);
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Save failed");
    }
  };

  return (
    <Box>
      <Helmet>
        <title>Remarks Audit | GREENWOOD</title>
      </Helmet>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Remarks audit (saved text vs correct bank)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Saved text that does not match the correct bank is underlined in
            red. Use Fix to rebuild it (keeps SL nos + student name).
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "center",
              mb: 1.5,
            }}
          >
            <TextField
              size="small"
              label="Search roll / name"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchSubmit();
              }}
              onBlur={handleSearchSubmit}
              sx={{ minWidth: 220 }}
            />

            <Autocomplete
              multiple
              size="small"
              options={classOptions}
              getOptionLabel={(opt) => opt?.cg_name || ""}
              isOptionEqualToValue={(a, b) =>
                String(a?.cg_id) === String(b?.cg_id)
              }
              value={classFilters}
              onChange={(_, v) => {
                setClassFilters(v || []);
                setPage(0);
              }}
              renderInput={(params) => (
                <TextField {...params} label="Classes (multi)" />
              )}
              sx={{ minWidth: 320 }}
            />

            <Autocomplete
              size="small"
              options={slOptions}
              getOptionLabel={(opt) => String(opt)}
              value={slFilter}
              onChange={(_, v) => {
                setSlFilter(v);
                setPage(0);
              }}
              renderInput={(params) => (
                <TextField {...params} label="SL no" />
              )}
              sx={{ minWidth: 120 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={mismatchesOnly}
                  onChange={(e) => {
                    setMismatchesOnly(e.target.checked);
                    setPage(0);
                  }}
                />
              }
              label="Mismatches only"
            />

            <Chip label={`Rows: ${total}`} size="small" />
            <Chip
              color="error"
              label={`Saved mismatches: ${savedMismatchCount}`}
              size="small"
            />
          </Box>
        </CardContent>
      </Card>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <MessageBox message={errorMessage || "Failed to load"} />
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                  Students with saved remarks
                </Typography>
                <TableContainer
                  ref={tableContainerRef}
                  sx={{ maxHeight: "62vh" }}
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Roll</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Class</TableCell>
                        <TableCell>SL</TableCell>
                        <TableCell>Saved text (DB)</TableCell>
                        <TableCell>Expected (correct)</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7}>No students found.</TableCell>
                        </TableRow>
                      ) : (
                        students.map((row) => {
                          const isEditing = editingId === row.remark_row_id;
                          const isSaving = savingId === row.remark_row_id;
                          return (
                            <TableRow
                              key={`${row.remark_row_id}-${row.st_id}`}
                              sx={{
                                bgcolor: row.has_mismatch
                                  ? "rgba(255, 152, 0, 0.06)"
                                  : undefined,
                              }}
                            >
                              <TableCell>{row.st_roll_no}</TableCell>
                              <TableCell>{row.student_name}</TableCell>
                              <TableCell sx={{ maxWidth: 140 }}>
                                {row.cg_name}
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "nowrap" }}>
                                {(row.remark_ids || []).join(", ")}
                              </TableCell>
                              <TableCell sx={{ minWidth: 220 }}>
                                {isEditing ? (
                                  <TextField
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    multiline
                                    minRows={3}
                                    fullWidth
                                    size="small"
                                  />
                                ) : (
                                  <Box
                                    component="span"
                                    sx={{
                                      fontSize: 12,
                                      ...(row.saved_vs_correct_mismatch
                                        ? wrongSx
                                        : {}),
                                    }}
                                  >
                                    {row.saved_remark_text}
                                  </Box>
                                )}
                              </TableCell>
                              <TableCell sx={{ minWidth: 180, fontSize: 12 }}>
                                {row.expected_body}
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "nowrap" }}>
                                {isEditing ? (
                                  <Box sx={{ display: "flex", gap: 0.5 }}>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      disabled={isSaving}
                                      onClick={() => handleSaveText(row)}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="small"
                                      disabled={isSaving}
                                      onClick={() => setEditingId(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </Box>
                                ) : (
                                  <Box sx={{ display: "flex", gap: 0.5 }}>
                                    <Tooltip title="Rebuild saved text from correct bank (keep SL + name)">
                                      <span>
                                        <Button
                                          size="small"
                                          variant="contained"
                                          color="warning"
                                          disabled={isSaving || !row.has_mismatch}
                                          onClick={() =>
                                            handleFixFromCorrect(row)
                                          }
                                        >
                                          Fix
                                        </Button>
                                      </span>
                                    </Tooltip>
                                    <Button
                                      size="small"
                                      disabled={isSaving}
                                      onClick={() => {
                                        setEditingId(row.remark_row_id);
                                        setEditText(
                                          row.expected_personalized_text ||
                                            row.saved_remark_text ||
                                            "",
                                        );
                                      }}
                                    >
                                      Edit
                                    </Button>
                                  </Box>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={total}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS || [25, 50, 100]}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                  Correct SL bank
                </Typography>
                <Box sx={{ maxHeight: "70vh", overflow: "auto" }}>
                  {correctBank.map((band) => (
                    <Box key={band.band_key} sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, mb: 0.5 }}
                      >
                        {band.band_label}
                      </Typography>
                      {(band.groups || []).map((group) => (
                        <Box key={group.group_key} sx={{ mb: 1.5, pl: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, display: "block", mb: 0.5 }}
                          >
                            {group.group_label}
                          </Typography>
                          {(group.points || []).map((point) => (
                            <Typography
                              key={point.sl_no}
                              variant="body2"
                              sx={{ mb: 0.75, fontSize: 12 }}
                            >
                              <strong>{point.sl_no}.</strong> {point.text}
                            </Typography>
                          ))}
                        </Box>
                      ))}
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default RemarksAudit;
