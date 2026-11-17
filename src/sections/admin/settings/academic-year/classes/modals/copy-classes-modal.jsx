import PropTypes from "prop-types";
import { memo, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { CancelOutlined } from "@mui/icons-material";
import { toast } from "react-toastify";
import useAuth from "../../../../../../hooks/useAuth";
import {
  createClassGroup,
  getAllClassGroup,
  getClassGroupsByYear,
} from "../../../../../../services/admin/classes.service";
import {
  TERM_OPTIONS,
  fromTermCheckboxState,
  getDefaultTermNamesForClass,
  toTermCheckboxState,
  toggleTermInExclusivePairs,
} from "../utils/class-terms";

const normalizeName = (name) => String(name || "").trim().toLowerCase();

/** Split "Nursery - A" / "1 - B" / "XI A" into base + section label. */
const getClassBaseName = (cgName) => {
  const name = String(cgName || "").trim();
  if (!name) return "Other";

  const dashMatch = name.match(/^(.+?)\s*[-–]\s*[A-Za-z0-9]+$/);
  if (dashMatch) return dashMatch[1].trim();

  const spaceSection = name.match(/^(.+?)\s+[A-Za-z]$/);
  if (spaceSection) return spaceSection[1].trim();

  return name;
};

const buildGroups = (classes = []) => {
  const map = new Map();

  classes.forEach((item) => {
    const cgName = item?.cg_name || item?.name || "";
    if (!cgName) return;
    const base = getClassBaseName(cgName);
    if (!map.has(base)) {
      map.set(base, []);
    }
    const list = map.get(base);
    if (!list.some((n) => normalizeName(n) === normalizeName(cgName))) {
      list.push(cgName);
    }
  });

  return Array.from(map.entries()).map(([base, names]) => ({
    base,
    names,
  }));
};

const CopyClassesModal = ({
  open,
  onClose,
  refetch,
  academicYear,
  academicYearList,
}) => {
  const { logout } = useAuth();

  const defaultSourceYear = useMemo(() => {
    const list = academicYearList || [];
    const current = list.find((y) => String(y?.ay_current) === "1");
    if (current && Number(current.ay_id) !== Number(academicYear?.ay_id)) {
      return current;
    }
    return (
      list.find((y) => Number(y?.ay_id) !== Number(academicYear?.ay_id)) || null
    );
  }, [academicYearList, academicYear?.ay_id]);

  const [sourceYear, setSourceYear] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedNames, setSelectedNames] = useState([]);
  const [existingNames, setExistingNames] = useState([]);
  const [customInputs, setCustomInputs] = useState({});
  const [groupTerms, setGroupTerms] = useState({});
  const [loadingSource, setLoadingSource] = useState(false);
  const [saving, setSaving] = useState(false);

  const existingSet = useMemo(
    () => new Set(existingNames.map(normalizeName)),
    [existingNames],
  );

  const selectableNames = useMemo(
    () =>
      groups
        .flatMap((g) => g.names)
        .filter((name) => !existingSet.has(normalizeName(name))),
    [groups, existingSet],
  );

  const resetState = () => {
    setGroups([]);
    setSelectedNames([]);
    setCustomInputs({});
    setGroupTerms({});
  };

  const loadExistingTargetClasses = async () => {
    const response = await getAllClassGroup({
      ay_id: academicYear?.ay_id,
      offset: 0,
      limit: 100,
      search: "",
    });

    if (response?.code === 200) {
      const rows = Array.isArray(response?.data) ? response.data : [];
      const names = rows.map((r) => r?.cg_name).filter(Boolean);
      setExistingNames(names);
      return names;
    }

    if (response?.code === 401) {
      logout(response);
      return [];
    }

    setExistingNames([]);
    return [];
  };

  const loadSourceClasses = async (year, existingList = existingNames) => {
    if (!year?.ay_id) {
      resetState();
      return;
    }

    setLoadingSource(true);
    const response = await getClassGroupsByYear({ ay_id: year.ay_id });
    setLoadingSource(false);

    if (response?.code === 200) {
      const rows = Array.isArray(response?.data) ? response.data : [];
      const nextGroups = buildGroups(rows);
      setGroups(nextGroups);

      const nextGroupTerms = {};
      nextGroups.forEach((group) => {
        nextGroupTerms[group.base] = toTermCheckboxState(
          getDefaultTermNamesForClass(group.names?.[0] || group.base),
        );
      });
      setGroupTerms(nextGroupTerms);

      const existingLookup = new Set((existingList || []).map(normalizeName));
      setSelectedNames(
        nextGroups
          .flatMap((g) => g.names)
          .filter((name) => !existingLookup.has(normalizeName(name))),
      );
    } else if (response?.code === 401) {
      logout(response);
    } else {
      resetState();
      toast.error(response?.message || "Failed to load previous year classes.");
    }
  };

  useEffect(() => {
    if (!open) return;

    const year = defaultSourceYear;
    setSourceYear(year);
    setCustomInputs({});

    (async () => {
      const existing = await loadExistingTargetClasses();
      if (year) {
        await loadSourceClasses(year, existing);
      } else {
        resetState();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultSourceYear, academicYear?.ay_id]);

  const isChecked = (name) =>
    selectedNames.some((n) => normalizeName(n) === normalizeName(name));

  const toggleName = (name, checked) => {
    if (existingSet.has(normalizeName(name))) return;

    setSelectedNames((prev) => {
      if (checked) {
        if (prev.some((n) => normalizeName(n) === normalizeName(name))) {
          return prev;
        }
        return [...prev, name];
      }
      return prev.filter((n) => normalizeName(n) !== normalizeName(name));
    });
  };

  const toggleGroupAll = (group, checked) => {
    const groupSelectable = group.names.filter(
      (name) => !existingSet.has(normalizeName(name)),
    );

    setSelectedNames((prev) => {
      const withoutGroup = prev.filter(
        (n) =>
          !groupSelectable.some(
            (gName) => normalizeName(gName) === normalizeName(n),
          ),
      );
      if (!checked) return withoutGroup;
      return [...withoutGroup, ...groupSelectable];
    });
  };

  const isGroupAllChecked = (group) => {
    const selectable = group.names.filter(
      (name) => !existingSet.has(normalizeName(name)),
    );
    if (!selectable.length) return false;
    return selectable.every((name) => isChecked(name));
  };

  const isGroupIndeterminate = (group) => {
    const selectable = group.names.filter(
      (name) => !existingSet.has(normalizeName(name)),
    );
    const checkedCount = selectable.filter((name) => isChecked(name)).length;
    return checkedCount > 0 && checkedCount < selectable.length;
  };

  const handleAddCustom = (base) => {
    const raw = String(customInputs[base] || "").trim();
    if (!raw) {
      toast.info("Enter a class name to add.");
      return;
    }

    // Keep exact typed casing; if user typed only section letter, build from base.
    let nextName = raw;
    if (/^[A-Za-z0-9]$/.test(raw)) {
      nextName = `${base} - ${raw.toUpperCase()}`;
    }

    if (existingSet.has(normalizeName(nextName))) {
      toast.info("This class already exists in the selected year.");
      return;
    }

    setGroups((prev) =>
      prev.map((group) => {
        if (group.base !== base) return group;
        if (
          group.names.some((n) => normalizeName(n) === normalizeName(nextName))
        ) {
          return group;
        }
        return { ...group, names: [...group.names, nextName] };
      }),
    );

    setSelectedNames((prev) =>
      prev.some((n) => normalizeName(n) === normalizeName(nextName))
        ? prev
        : [...prev, nextName],
    );
    setCustomInputs((prev) => ({ ...prev, [base]: "" }));
  };

  const handleCreate = async () => {
    const toCreate = selectedNames.filter(
      (name) => !existingSet.has(normalizeName(name)),
    );

    if (!toCreate.length) {
      toast.info("Select at least one class to create.");
      return;
    }

    setSaving(true);
    let successCount = 0;
    let failCount = 0;

    for (const cg_name of toCreate) {
      const base = getClassBaseName(cg_name);
      const term_names = fromTermCheckboxState(
        groupTerms[base] ||
          toTermCheckboxState(getDefaultTermNamesForClass(cg_name)),
      );

      if (!term_names.length) {
        failCount += 1;
        continue;
      }

      const response = await createClassGroup({
        ay_id: Number(academicYear?.ay_id),
        cg_name,
        term_names,
      });

      if (response?.code === 200) {
        successCount += 1;
      } else if (response?.code === 401) {
        setSaving(false);
        logout(response);
        return;
      } else {
        failCount += 1;
      }
    }

    setSaving(false);

    if (successCount > 0) {
      toast.success(
        failCount > 0
          ? `Created ${successCount} class(es). ${failCount} failed.`
          : `Created ${successCount} class(es) successfully.`,
      );
      onClose();
      refetch();
    } else {
      toast.error("Failed to create classes.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!saving ? onClose : null}
      PaperProps={{
        sx: {
          minWidth: { xs: "95vw", sm: "720px" },
          maxWidth: "900px",
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
          fontSize: "24px",
          cursor: saving ? "not-allowed" : "pointer",
        }}
        onClick={!saving ? onClose : null}
      />
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          textAlign: "center",
          fontWeight: 600,
        }}
      >
        Copy Classes to {academicYear?.ay_name || "New Year"}
      </Box>

      <DialogContent sx={{ pt: 2 }}>
        <Autocomplete
          options={(academicYearList || []).filter(
            (y) => Number(y?.ay_id) !== Number(academicYear?.ay_id),
          )}
          getOptionLabel={(option) => option?.ay_name || ""}
          isOptionEqualToValue={(option, value) =>
            Number(option?.ay_id) === Number(value?.ay_id)
          }
          value={sourceYear}
          onChange={async (_, newValue) => {
            setSourceYear(newValue);
            await loadSourceClasses(newValue, existingNames);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Copy from Academic Year"
              size="small"
              helperText="Class names are copied exactly as in the selected year."
            />
          )}
          sx={{ mb: 2 }}
        />

        {loadingSource ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : !groups.length ? (
          <Typography sx={{ py: 3, textAlign: "center" }}>
            No classes found in the selected year.
          </Typography>
        ) : (
          <Box
            sx={{
              maxHeight: "55vh",
              overflowY: "auto",
              pr: 1,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={
                    selectableNames.length > 0 &&
                    selectableNames.every((name) => isChecked(name))
                  }
                  indeterminate={
                    selectableNames.some((name) => isChecked(name)) &&
                    !selectableNames.every((name) => isChecked(name))
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedNames(selectableNames);
                    } else {
                      setSelectedNames([]);
                    }
                  }}
                />
              }
              label={`Select all available (${selectableNames.length})`}
            />

            {groups.map((group) => (
              <Box
                key={group.base}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1.5,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "6fr 4fr" },
                  gridTemplateRows: { xs: "auto auto auto", md: "1fr auto" },
                  gap: 1.5,
                  alignItems: "stretch",
                }}
              >
                {/* Left top: class selection */}
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isGroupAllChecked(group)}
                        indeterminate={isGroupIndeterminate(group)}
                        onChange={(e) =>
                          toggleGroupAll(group, e.target.checked)
                        }
                        disabled={
                          !group.names.some(
                            (name) => !existingSet.has(normalizeName(name)),
                          )
                        }
                      />
                    }
                    label={
                      <Typography sx={{ fontWeight: 600 }}>
                        {group.base} : all
                      </Typography>
                    }
                  />

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "1fr 1fr",
                        md: "1fr 1fr 1fr",
                      },
                      gap: 0.5,
                      pl: 1,
                    }}
                  >
                    {group.names.map((name) => {
                      const alreadyExists = existingSet.has(
                        normalizeName(name),
                      );
                      return (
                        <FormControlLabel
                          key={name}
                          control={
                            <Checkbox
                              checked={alreadyExists || isChecked(name)}
                              disabled={alreadyExists}
                              onChange={(e) =>
                                toggleName(name, e.target.checked)
                              }
                            />
                          }
                          label={
                            <Typography variant="body2">
                              {name}
                              {alreadyExists ? " (already added)" : ""}
                            </Typography>
                          }
                        />
                      );
                    })}
                  </Box>
                </Box>

                {/* Right top: terms panel */}
                <Box
                  sx={{
                    bgcolor: "rgba(128, 0, 32, 0.06)",
                    border: "1px solid",
                    borderColor: "primary.light",
                    borderRadius: 1,
                    p: 1.25,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, fontWeight: 700, color: "primary.main" }}
                  >
                    Terms for {group.base}
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 0.25,
                    }}
                  >
                    {TERM_OPTIONS.map((termName) => (
                      <FormControlLabel
                        key={`${group.base}-${termName}`}
                        control={
                          <Checkbox
                            size="small"
                            checked={Boolean(
                              groupTerms?.[group.base]?.[termName],
                            )}
                            onChange={(e) =>
                              setGroupTerms((prev) => ({
                                ...prev,
                                [group.base]: toggleTermInExclusivePairs(
                                  prev[group.base],
                                  termName,
                                  e.target.checked,
                                ),
                              }))
                            }
                          />
                        }
                        label={
                          <Typography variant="body2">{termName}</Typography>
                        }
                        sx={{ mr: 0 }}
                      />
                    ))}
                  </Box>
                </Box>

                {/* Bottom row: input (left) + Add (right), same alignment */}
                <TextField
                  size="small"
                  placeholder={`+ Add new under ${group.base} (e.g. E or ${group.base} - E)`}
                  value={customInputs[group.base] || ""}
                  onChange={(e) =>
                    setCustomInputs((prev) => ({
                      ...prev,
                      [group.base]: e.target.value,
                    }))
                  }
                  fullWidth
                  sx={{ gridColumn: { xs: "1", md: "1" } }}
                />

                <Button
                  variant="contained"
                  onClick={() => handleAddCustom(group.base)}
                  disabled={saving}
                  fullWidth
                  sx={{
                    gridColumn: { xs: "1", md: "2" },
                    height: "40px",
                  }}
                >
                  + Add
                </Button>
              </Box>
            ))}
          </Box>
        )}

        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 1,
            mt: 2,
          }}
        >
          <Button variant="outlined" onClick={onClose} disabled={saving}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={saving || !selectedNames.length}
          >
            {saving ? (
              <CircularProgress size={22} />
            ) : (
              `Create Selected (${selectedNames.filter((n) => !existingSet.has(normalizeName(n))).length})`
            )}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

CopyClassesModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  refetch: PropTypes.func,
  academicYear: PropTypes.object,
  academicYearList: PropTypes.array,
};

export default memo(CopyClassesModal);
