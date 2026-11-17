import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";
import {
  Autocomplete,
  Box,
  Button,
  Card,
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
  TextField,
  Typography,
} from "@mui/material";
import { useGetApi } from "../../../../hooks/useGetApi";
import useAuth from "../../../../hooks/useAuth";
import {
  getAllAcademicYears,
  getClasses,
} from "../../../../services/admin/students-management.service";
import {
  copyFeeStructureClasses,
  copyFeeStructureYear,
  getFeeRevenueBreakups,
  updateFeeRevenueBreakup,
} from "../../../../services/admin/fees-breakup.service";

const SESSION_MONTHS = [
  { no: 4, label: "APR" },
  { no: 5, label: "MAY" },
  { no: 6, label: "JUN" },
  { no: 7, label: "JUL" },
  { no: 8, label: "AUG" },
  { no: 9, label: "SEP" },
  { no: 10, label: "OCT" },
  { no: 11, label: "NOV" },
  { no: 12, label: "DEC" },
  { no: 1, label: "JAN" },
  { no: 2, label: "FEB" },
  { no: 3, label: "MAR" },
];

const headerCellSx = {
  fontWeight: 700,
  fontSize: 11,
  lineHeight: 1.2,
  px: 0.5,
  py: 0.4,
  bgcolor: "primary.main",
  color: "primary.contrastText",
  borderRight: "1px solid rgba(255,255,255,0.3)",
  borderBottom: "1px solid rgba(255,255,255,0.3)",
};

const subHeaderCellSx = {
  fontWeight: 600,
  fontSize: 10,
  lineHeight: 1.1,
  px: 0.4,
  py: 0.3,
  bgcolor: "primary.dark",
  color: "primary.contrastText",
  whiteSpace: "nowrap",
  borderRight: "1px solid rgba(255,255,255,0.25)",
};

const parseSessionYears = (ayName) => {
  const parts = String(ayName || "").match(/\d{2,4}/g) || [];
  if (!parts.length) return { start: null, end: null };

  const toFull = (value, centuryBase) => {
    const n = parseInt(value, 10);
    if (String(value).length === 4) return n;
    const base = centuryBase ?? 2000;
    return base + n;
  };

  const start = toFull(parts[0]);
  const century = Math.floor(start / 100) * 100;
  let end = parts[1] ? toFull(parts[1], century) : start + 1;
  if (end < start) end += 100;
  return { start, end };
};

const shortYear = (year) => (year ? String(year).slice(-2) : "");

const money = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return Number.isInteger(num) ? String(num) : String(Math.round(num * 100) / 100);
};

function EditableAmount({ record, field, onSaved, color }) {
  const { logout } = useAuth();
  const skipSave = useRef(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  if (!record?.id) {
    return "—";
  }

  const display = money(record[field]);

  const startEdit = () => {
    if (saving) return;
    setValue(display);
    setEditing(true);
  };

  const commit = async () => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    const next = String(value).trim();
    const amount = Number(next);
    if (next === "" || Number.isNaN(amount) || amount < 0) {
      toast.error("Enter a valid amount");
      setEditing(false);
      return;
    }
    if (money(amount) === display) {
      setEditing(false);
      return;
    }

    setSaving(true);
    const response = await updateFeeRevenueBreakup(record.id, {
      tuition_amount:
        field === "tuition_amount" ? amount : Number(record.tuition_amount),
      annual_amount:
        field === "annual_amount" ? amount : Number(record.annual_amount),
    });
    setSaving(false);
    setEditing(false);

    if (response?.code === 200) {
      onSaved(record.id, response.data || {});
      toast.success("Updated");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Could not save");
    }
  };

  if (!editing) {
    return (
      <Box
        onClick={startEdit}
        title="Click to edit"
        sx={{
          cursor: "pointer",
          minWidth: 36,
          px: 0.25,
          borderRadius: 0.5,
          color,
          fontWeight: 600,
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        {saving ? "..." : display}
      </Box>
    );
  }

  return (
    <TextField
      autoFocus
      value={value}
      size="small"
      type="number"
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          skipSave.current = true;
          setEditing(false);
        }
      }}
      slotProps={{
        htmlInput: {
          min: 0,
          step: "1",
          style: { textAlign: "center", padding: "2px 4px", fontSize: 12 },
        },
      }}
      sx={{ width: 62 }}
    />
  );
}

export default function FeesStructure() {
  const { userInfo, logout } = useAuth();
  const [academicYear, setAcademicYear] = useState(null);
  const [savedPatches, setSavedPatches] = useState({});
  const [copyYearOpen, setCopyYearOpen] = useState(false);
  const [copyClassOpen, setCopyClassOpen] = useState(false);
  const [fromYear, setFromYear] = useState(null);
  const [toYear, setToYear] = useState(null);
  const [sourceClass, setSourceClass] = useState(null);
  const [targetClasses, setTargetClasses] = useState([]);
  const [isCopying, setIsCopying] = useState(false);

  const { dataList: academicYearList } = useGetApi({
    apiFunction: getAllAcademicYears,
  });

  useEffect(() => {
    if (!academicYearList?.length || academicYear) return;
    const current =
      academicYearList.find(
        (ay) => String(ay?.ay_current) === "1" || ay?.ay_current === 1
      ) ||
      academicYearList.find((ay) => ay?.ay_id === userInfo?.ay_id) ||
      academicYearList[0];
    if (current) setAcademicYear(current);
  }, [academicYearList, academicYear, userInfo?.ay_id]);

  const { dataList: classList, isLoading: isClassLoading } = useGetApi({
    apiFunction: getClasses,
    body: { ay_id: academicYear?.ay_id },
    dependencies: [academicYear?.ay_id],
    skip: !academicYear?.ay_id,
  });

  const {
    dataList: breakupList,
    isLoading: isBreakupLoading,
    refetch: refetchBreakup,
  } = useGetApi({
    apiFunction: getFeeRevenueBreakups,
    body: {
      ay_id: academicYear?.ay_id,
      offset: 0,
      limit: 500,
    },
    dependencies: [academicYear?.ay_id],
    skip: !academicYear?.ay_id,
  });

  const rows = useMemo(() => {
    const classes = Array.isArray(classList) ? classList : [];
    const breakups = Array.isArray(breakupList) ? breakupList : [];
    const byClass = new Map(
      breakups.map((group) => [Number(group?.cg_id), group])
    );

    const seen = new Set();
    const list = classes.map((item) => {
      const cgId = Number(item?.id || item?.cg_id);
      seen.add(cgId);
      const group = byClass.get(cgId);
      const months = new Map(
        (group?.months || []).map((month) => {
          const patch = savedPatches[month.id];
          return [
            Number(month.month_no),
            patch
              ? {
                  ...month,
                  tuition_amount: patch.tuition_amount ?? month.tuition_amount,
                  annual_amount: patch.annual_amount ?? month.annual_amount,
                }
              : month,
          ];
        })
      );
      return {
        cgId,
        className: item?.cg_name || group?.class_name || "—",
        months,
      };
    });

    breakups.forEach((group) => {
      const cgId = Number(group?.cg_id);
      if (seen.has(cgId)) return;
      list.push({
        cgId,
        className: group?.class_name || "—",
        months: new Map(
          (group?.months || []).map((month) => {
            const patch = savedPatches[month.id];
            return [
              Number(month.month_no),
              patch
                ? {
                    ...month,
                    tuition_amount: patch.tuition_amount ?? month.tuition_amount,
                    annual_amount: patch.annual_amount ?? month.annual_amount,
                  }
                : month,
            ];
          })
        ),
      });
    });

    return list;
  }, [classList, breakupList, savedPatches]);

  const years = useMemo(
    () => parseSessionYears(academicYear?.ay_name),
    [academicYear?.ay_name]
  );
  const startShort = shortYear(years.start);
  const endShort = shortYear(years.end);
  const columns = SESSION_MONTHS.map((month) => ({
    ...month,
    title: `${month.label}'${month.no >= 4 ? startShort : endShort}`,
  }));
  const isLoading = isClassLoading || isBreakupLoading;
  const classOptions = Array.isArray(classList) ? classList : [];

  const handleCopyYear = async () => {
    if (!fromYear?.ay_id || !toYear?.ay_id) {
      toast.info("Select both years");
      return;
    }
    setIsCopying(true);
    const response = await copyFeeStructureYear({
      from_ay_id: fromYear.ay_id,
      to_ay_id: toYear.ay_id,
    });
    setIsCopying(false);
    if (response?.code === 200) {
      toast.success(response.message || "Year copied");
      setCopyYearOpen(false);
      if (academicYear?.ay_id === toYear.ay_id) {
        setSavedPatches({});
        refetchBreakup();
      }
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Could not copy year");
    }
  };

  const handleCopyClasses = async () => {
    const fromId = sourceClass?.id || sourceClass?.cg_id;
    const toIds = (targetClasses || [])
      .map((item) => item?.id || item?.cg_id)
      .filter((id) => id && id !== fromId);
    if (!academicYear?.ay_id || !fromId || !toIds.length) {
      toast.info("Select a source class and at least one other class");
      return;
    }
    setIsCopying(true);
    const response = await copyFeeStructureClasses({
      ay_id: academicYear.ay_id,
      from_cg_id: fromId,
      to_cg_ids: toIds,
    });
    setIsCopying(false);
    if (response?.code === 200) {
      toast.success(response.message || "Classes copied");
      setCopyClassOpen(false);
      setSavedPatches({});
      refetchBreakup();
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Could not copy classes");
    }
  };

  return (
    <>
      <Helmet>
        <title>Fees Structure | GREENWOOD</title>
      </Helmet>

      <Card sx={{ p: 2, width: "100%" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
            mb: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700 }}>
              Fee Structure {academicYear?.ay_name || ""}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Click a Tuition or A Charges cell to edit it. Enter saves, Escape cancels.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setFromYear(academicYear);
                setToYear(null);
                setCopyYearOpen(true);
              }}
            >
              Copy year
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setSourceClass(null);
                setTargetClasses([]);
                setCopyClassOpen(true);
              }}
            >
              Copy class
            </Button>
            <Autocomplete
              options={academicYearList || []}
              getOptionLabel={(option) => option?.ay_name || ""}
              value={academicYear}
              onChange={(_e, newValue) => {
                setAcademicYear(newValue);
                setSavedPatches({});
              }}
              sx={{ width: { xs: "100%", sm: 220 } }}
              renderInput={(params) => (
                <TextField {...params} label="Academic Year" size="small" />
              )}
            />
          </Box>
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <TableContainer sx={{ border: "1px solid", borderColor: "divider" }}>
            <Table size="small" sx={{ minWidth: 1680 }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    rowSpan={2}
                    sx={{
                      ...headerCellSx,
                      position: "sticky",
                      left: 0,
                      zIndex: 2,
                    }}
                  >
                    CLASS
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell
                      key={column.title}
                      align="center"
                      colSpan={2}
                      sx={headerCellSx}
                    >
                      {column.title}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  {columns.map((column) =>
                    [
                      { label: "Tuition", color: "#1565c0" },
                      { label: "A Charges", color: "#2e7d32" },
                    ].map((item) => (
                      <TableCell
                        key={`${column.title}-${item.label}`}
                        align="center"
                        sx={{ ...subHeaderCellSx, bgcolor: item.color }}
                      >
                        {item.label}
                      </TableCell>
                    ))
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={25} align="center" sx={{ py: 4 }}>
                      No classes found for this academic year.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow
                      key={row.cgId || row.className}
                      sx={{
                        bgcolor: index % 2 === 0 ? "grey.50" : "background.paper",
                      }}
                    >
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          fontSize: 12,
                          whiteSpace: "nowrap",
                          px: 0.75,
                          py: 0.25,
                          borderRight: "1px solid",
                          borderColor: "divider",
                          position: "sticky",
                          left: 0,
                          bgcolor: index % 2 === 0 ? "grey.50" : "background.paper",
                          zIndex: 1,
                        }}
                      >
                        {row.className}
                      </TableCell>
                      {SESSION_MONTHS.map((month) => {
                        const saved = row.months.get(month.no);
                        return [
                          { field: "tuition_amount", color: "#1565c0" },
                          { field: "annual_amount", color: "#2e7d32" },
                        ].map((item) => (
                          <TableCell
                            key={`${row.cgId}-${month.no}-${item.field}`}
                            align="center"
                            sx={{
                              fontSize: 12,
                              px: 0.25,
                              py: 0.25,
                              borderRight: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            <EditableAmount
                              record={saved}
                              field={item.field}
                              color={item.color}
                              onSaved={(id, data) =>
                                setSavedPatches((prev) => ({
                                  ...prev,
                                  [id]: data,
                                }))
                              }
                            />
                          </TableCell>
                        ));
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={copyYearOpen} onClose={() => !isCopying && setCopyYearOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Copy full year</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Copies every class month from one year onto the same class names in another year.
          </Typography>
          <Autocomplete
            options={academicYearList || []}
            getOptionLabel={(option) => option?.ay_name || ""}
            value={fromYear}
            onChange={(_e, value) => setFromYear(value)}
            renderInput={(params) => <TextField {...params} label="From year" size="small" />}
          />
          <Autocomplete
            options={(academicYearList || []).filter((ay) => ay?.ay_id !== fromYear?.ay_id)}
            getOptionLabel={(option) => option?.ay_name || ""}
            value={toYear}
            onChange={(_e, value) => setToYear(value)}
            renderInput={(params) => <TextField {...params} label="To year" size="small" />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopyYearOpen(false)} disabled={isCopying}>Close</Button>
          <Button variant="contained" onClick={handleCopyYear} disabled={isCopying}>
            {isCopying ? "Copying..." : "Copy"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={copyClassOpen} onClose={() => !isCopying && setCopyClassOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Copy one class</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Copies {academicYear?.ay_name || "this year"} from one class onto the classes you select. Example: Class 4-B onto 5-A and 6-A.
          </Typography>
          <Autocomplete
            options={classOptions}
            getOptionLabel={(option) => option?.cg_name || ""}
            value={sourceClass}
            onChange={(_e, value) => {
              setSourceClass(value);
              setTargetClasses([]);
            }}
            renderInput={(params) => <TextField {...params} label="Copy from class" size="small" />}
          />
          <Autocomplete
            multiple
            options={classOptions.filter(
              (item) => (item?.id || item?.cg_id) !== (sourceClass?.id || sourceClass?.cg_id)
            )}
            getOptionLabel={(option) => option?.cg_name || ""}
            value={targetClasses}
            onChange={(_e, value) => setTargetClasses(value)}
            renderInput={(params) => <TextField {...params} label="Copy to classes" size="small" />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopyClassOpen(false)} disabled={isCopying}>Close</Button>
          <Button variant="contained" onClick={handleCopyClasses} disabled={isCopying}>
            {isCopying ? "Copying..." : "Copy"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
