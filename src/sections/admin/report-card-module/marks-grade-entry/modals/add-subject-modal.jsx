import PropTypes from "prop-types";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";
import { toast } from "react-toastify";
import useAuth from "../../../../../hooks/useAuth";
import { CancelOutlined, Check, Close, EditOutlined } from "@mui/icons-material";
import { useGetApi } from "../../../../../hooks/useGetApi";
import {
  addSubjectToClass,
  copyPreviousYearSubjects,
  getMasterSubjects,
  previewPreviousYearSubjects,
  updateClassFmSubjectName,
} from "../../../../../services/admin/report-card-module.service";
import {
  getAllAcademicYears,
  getClasses,
} from "../../../../../services/admin/students-management.service";

const SUBJECT_TYPES = [
  { id: "G", label: "Grade (A+, A, B…)" },
  { id: "M", label: "Marks (numbers)" },
];

const SUBJECT_CATEGORIES = [
  { id: "", label: "Academic / default" },
  { id: "WR", label: "Written work in subjects" },
  { id: "DCC", label: "Drawing / colouring / craft" },
  { id: "RD", label: "Reading" },
  { id: "RC", label: "Recitation" },
  { id: "SP", label: "Speaking skills" },
  { id: "MT", label: "Maths / logical skills" },
  { id: "IL", label: "Indian language" },
  { id: "WH", label: "Work habits" },
];

/** Guide only — type this subject name so PDF shows the matching checkboxes. */
const ADDITIONAL_GUIDE_1_TO_10 = [
  "Additional → □ COMP □ ART □ H.Sc",
  "Additional- → □ Comp App □ ART □ H.sc □ Eco App",
];

const ADDITIONAL_GUIDE_11_12 = [
  "Additional → □ Psychology □ Art □ H.Sc",
  "Additional- → □ History □ H.Sc □ Comp App □ Art",
  "Additional Com → □ Maths □ Art □ H.Sc □ Comp Sci □ Entrepreneurship",
  "Additional Hm → □ History □ ART □ H.sc □ Comp Sc",
];

const filterSubjectOptions = createFilterOptions({
  stringify: (option) => option?.subj_name || "",
});

const categoryLabel = (id) => {
  const key = String(id || "").trim().toUpperCase();
  return (
    SUBJECT_CATEGORIES.find((item) => item.id === key)?.label ||
    (key ? key : "Academic / default")
  );
};

const AddSubjectModal = ({ open, onClose, refetch, detail }) => {
  const { logout } = useAuth();
  const [isCopying, setIsCopying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjName, setSubjName] = useState("");
  const [type, setType] = useState(SUBJECT_TYPES[0]);
  const [category, setCategory] = useState(SUBJECT_CATEGORIES[0]);
  const [nameOverrides, setNameOverrides] = useState({});
  const [fmOverrides, setFmOverrides] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [theoryFm, setTheoryFm] = useState(100);
  const [pracFm, setPracFm] = useState(0);
  const [sourceYear, setSourceYear] = useState(null);
  const [sourceClass, setSourceClass] = useState(null);
  const [targetClasses, setTargetClasses] = useState([]);
  const sourceTouchedRef = useRef(false);

  const { dataList: academicYearList } = useGetApi({
    apiFunction: open ? getAllAcademicYears : null,
    dependencies: [open],
  });

  const { dataList: masterSubjects, refetch: refetchMaster } = useGetApi({
    apiFunction: open ? getMasterSubjects : null,
    body: {},
    dependencies: [open],
  });

  const currentYearId =
    Number(detail?.ay_id?.ay_id) || Number(detail?.ay_id) || null;

  const { dataList: currentYearClasses } = useGetApi({
    apiFunction: open && currentYearId ? getClasses : null,
    body: { ay_id: currentYearId },
    dependencies: [open, currentYearId],
  });

  const sourceYearId = Number(sourceYear?.ay_id) || null;
  const { dataList: sourceYearClasses } = useGetApi({
    apiFunction: open && sourceYearId ? getClasses : null,
    body: { ay_id: sourceYearId },
    dependencies: [open, sourceYearId],
  });

  const skipSourcePreview = Boolean(sourceTouchedRef.current && !sourceClass?.id);

  const {
    dataList: preview,
    isLoading: isPreviewLoading,
    refetch: refetchPreview,
  } = useGetApi({
    apiFunction: open && detail?.cg_id?.id ? previewPreviousYearSubjects : null,
    body: {
      cg_id: detail?.cg_id?.id,
      from_cg_id: sourceClass?.id || undefined,
    },
    dependencies: [open, detail?.cg_id?.id, sourceClass?.id],
    skip: !open || !detail?.cg_id?.id || skipSourcePreview,
  });

  useEffect(() => {
    if (!open) {
      sourceTouchedRef.current = false;
      setSourceYear(null);
      setSourceClass(null);
      setTargetClasses([]);
      return;
    }
    if (detail?.cg_id?.id) {
      setTargetClasses([detail.cg_id]);
    }
  }, [open, detail?.cg_id?.id]);

  useEffect(() => {
    if (!preview?.from_cg_id || sourceTouchedRef.current) return;
    const year = (academicYearList || []).find(
      (item) => Number(item?.ay_id) === Number(preview.from_ay_id)
    );
    if (year) {
      setSourceYear(year);
    }
    setSourceClass({
      id: preview.from_cg_id,
      cg_name: preview.from_cg_name,
    });
  }, [preview, academicYearList]);

  const previousSubjects = preview?.subjects || [];
  const previewKey = `${preview?.from_cg_id || ""}-${preview?.to_cg_id || ""}`;

  useEffect(() => {
    if (!preview?.from_cg_id) return;
    setSelectedIds([]);
  }, [previewKey]);

  const masterSubjectOptions = useMemo(() => {
    const list = Array.isArray(masterSubjects) ? masterSubjects : [];
    const nameCounts = list.reduce((acc, subject) => {
      const name = subject.subj_name || "";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    return list.map((subject) => ({
      id: subject.id,
      subj_id: subject.id,
      subj_name: subject.subj_name,
      type: subject.type,
      category: subject.category || "",
      marks: Number(subject.marks ?? 100),
      prac: Number(subject.prac ?? 0),
      duplicateName: (nameCounts[subject.subj_name] || 0) > 1,
    }));
  }, [masterSubjects]);

  const sameSubjId = (a, b) => Number(a) === Number(b);

  const isSelectedId = (id) =>
    selectedIds.some((selectedId) => sameSubjId(selectedId, id));

  const leftSubjects = useMemo(() => {
    const alreadyAdded = previousSubjects.filter(
      (subject) => subject.already_added
    );
    const selectedToAdd = previousSubjects.filter(
      (subject) => isSelectedId(subject.subj_id) && !subject.already_added
    );
    const seen = new Set();
    return [...alreadyAdded, ...selectedToAdd].filter((subject) => {
      const key = `${Number(subject.subj_id)}-${subject.category || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [previousSubjects, selectedIds]);

  const displayName = (subject) => {
    if (nameOverrides[subject.subj_id] != null) {
      return nameOverrides[subject.subj_id];
    }
    if (subject.already_added) {
      return subject.current_subj_name || subject.subj_name;
    }
    return subject.subj_name;
  };

  const displayFm = (subject) => {
    const override = fmOverrides[subject.subj_id];
    return {
      marks: override?.marks ?? Number(subject?.marks ?? 0),
      prac: override?.prac ?? Number(subject?.prac ?? 0),
    };
  };

  const toFmNumber = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.round(n);
  };

  const selectableIds = useMemo(
    () => previousSubjects.map((subject) => Number(subject.subj_id)),
    [previousSubjects]
  );

  const allSelectableSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => isSelectedId(id));
  const someSelectableSelected = selectableIds.some((id) => isSelectedId(id));

  const handleSelectAll = (event) => {
    event.stopPropagation();
    if (allSelectableSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(selectableIds);
  };

  const handleDeselect = (subjId) => {
    setSelectedIds((prev) => prev.filter((id) => !sameSubjId(id, subjId)));
  };

  const fillLeftForm = (subject) => {
    setSelectedSubject({
      id: subject.subj_id,
      subj_id: subject.subj_id,
      subj_name: subject.subj_name,
      type: subject.type,
      category: subject.category || "",
    });
    setSubjName(subject.subj_name || "");
    setType(
      SUBJECT_TYPES.find((item) => item.id === subject.type) || SUBJECT_TYPES[0]
    );
    setCategory(
      SUBJECT_CATEGORIES.find(
        (item) => item.id === String(subject.category || "").trim().toUpperCase()
      ) || SUBJECT_CATEGORIES[0]
    );
    const fm = displayFm(subject);
    setTheoryFm(toFmNumber(fm.marks));
    setPracFm(toFmNumber(fm.prac));
  };

  const resetForm = () => {
    setSelectedIds([]);
    setSelectedSubject(null);
    setSubjName("");
    setType(SUBJECT_TYPES[0]);
    setCategory(SUBJECT_CATEGORIES[0]);
    setNameOverrides({});
    setFmOverrides({});
    setEditingId(null);
    setDraftName("");
    setTheoryFm(100);
    setPracFm(0);
  };

  const handleClose = () => {
    if (isCopying || isSaving || isRenaming) return;
    resetForm();
    onClose();
  };

  const handleTogglePrevious = (subject) => {
    const subjId = Number(subject.subj_id);
    const isSelected = isSelectedId(subjId);
    setSelectedIds((prev) =>
      isSelected
        ? prev.filter((id) => !sameSubjId(id, subjId))
        : [...prev, subjId]
    );
    fillLeftForm(subject);
  };

  const handleStartEdit = (event, subject) => {
    event.stopPropagation();
    if (!subject.already_added && !isSelectedId(subject.subj_id)) {
      setSelectedIds((prev) => [...prev, Number(subject.subj_id)]);
    }
    setEditingId(subject.subj_id);
    setDraftName(displayName(subject));
  };

  const handleCancelEdit = (event) => {
    event?.stopPropagation();
    setEditingId(null);
    setDraftName("");
  };

  const handleSaveEdit = async (event, subject) => {
    event?.stopPropagation();
    const nextName = String(draftName || "").trim();
    if (!nextName) {
      toast.error("Subject name is required.");
      return;
    }

    if (subject.already_added) {
      if (!detail?.cg_id?.id) {
        toast.info("Select a class first");
        return;
      }
      const fm = displayFm(subject);
      setIsRenaming(true);
      const response = await updateClassFmSubjectName({
        cg_id: detail.cg_id.id,
        cg_ids: (targetClasses.length
          ? targetClasses
          : [detail.cg_id]
        ).map((item) => item.id),
        subj_id: subject.subj_id,
        subj_name: nextName,
        marks: toFmNumber(fm.marks),
        prac: toFmNumber(fm.prac),
      });
      setIsRenaming(false);
      if (response?.code === 200) {
        toast.success(response?.message || "Subject name updated.");
        setEditingId(null);
        setDraftName("");
        refetchPreview();
        refetch();
      } else if (response?.code === 401) {
        logout(response);
      } else {
        toast.error(response?.message || "Could not update subject name.");
      }
      return;
    }

    setNameOverrides((prev) => ({
      ...prev,
      [subject.subj_id]: nextName,
    }));
    setEditingId(null);
    setDraftName("");
  };

  const handleFmChange = (event, subject, field) => {
    event.stopPropagation();
    const current = displayFm(subject);
    setFmOverrides((prev) => ({
      ...prev,
      [subject.subj_id]: {
        marks: current.marks,
        prac: current.prac,
        [field]: event.target.value,
      },
    }));
  };

  const handleFmBlur = async (subject) => {
    const current = displayFm(subject);
    const marks = toFmNumber(current.marks);
    const prac = toFmNumber(current.prac);
    setFmOverrides((prev) => ({
      ...prev,
      [subject.subj_id]: { marks, prac },
    }));
    if (!subject.already_added || !detail?.cg_id?.id) return;
    if (
      marks === toFmNumber(subject.marks) &&
      prac === toFmNumber(subject.prac)
    ) {
      return;
    }

    setIsRenaming(true);
    const response = await updateClassFmSubjectName({
      cg_id: detail.cg_id.id,
      cg_ids: (targetClasses.length ? targetClasses : [detail.cg_id]).map(
        (item) => item.id
      ),
      subj_id: subject.subj_id,
      marks,
      prac,
    });
    setIsRenaming(false);
    if (response?.code === 200) {
      refetchPreview();
      refetch();
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Could not update full marks.");
    }
  };

  const handleCopySelected = async () => {
    if (!detail?.cg_id?.id) {
      toast.info("Select a class first");
      return;
    }
    if (!selectedIds.length) {
      toast.info("Select subjects from last year on the right");
      return;
    }

    const selectedTargets = targetClasses.length
      ? targetClasses
      : [detail.cg_id];

    setIsCopying(true);
    const response = await copyPreviousYearSubjects({
      cg_id: detail.cg_id.id,
      cg_ids: selectedTargets.map((item) => item.id),
      from_cg_id: sourceClass?.id || undefined,
      subj_ids: selectedIds,
      subj_names: selectedIds
        .filter((id) => nameOverrides[id])
        .map((id) => ({
          subj_id: id,
          subj_name: nameOverrides[id],
        })),
      subj_fm: selectedIds.map((id) => {
        const subject = previousSubjects.find((item) => item.subj_id === id);
        const fm = subject ? displayFm(subject) : { marks: 0, prac: 0 };
        return {
          subj_id: id,
          marks: toFmNumber(fm.marks),
          prac: toFmNumber(fm.prac),
        };
      }),
    });
    setIsCopying(false);

    if (response?.code === 200) {
      toast.success(response?.message || "Selected subjects added");
      setSelectedIds([]);
      setNameOverrides({});
      setFmOverrides({});
      refetchPreview();
      refetch();
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Could not add selected subjects.");
    }
  };

  const handleAddOne = async (e) => {
    e.preventDefault();
    if (!detail?.cg_id?.id) {
      toast.info("Select a class first");
      return;
    }
    if (!selectedSubject?.id && !subjName.trim()) {
      toast.info("Select an existing subject or type a new name");
      return;
    }

    const selectedTargets = targetClasses.length
      ? targetClasses
      : [detail.cg_id];
    const typedName = (
      subjName.trim() ||
      selectedSubject?.subj_name ||
      ""
    ).trim();
    const selectedName = String(selectedSubject?.subj_name || "").trim();
    const nameDiffers =
      typedName !== "" &&
      selectedName !== "" &&
      typedName.toLowerCase() !== selectedName.toLowerCase();

    setIsSaving(true);
    const response = await addSubjectToClass({
      cg_id: detail.cg_id.id,
      cg_ids: selectedTargets.map((item) => item.id),
      subj_id: nameDiffers ? null : selectedSubject?.id || null,
      subj_name: typedName || null,
      type: type?.id || "G",
      category: category?.id ?? "",
      marks: toFmNumber(theoryFm),
      prac: toFmNumber(pracFm),
    });
    setIsSaving(false);

    if (response?.code === 200) {
      const alreadyAdded = /already added/i.test(response?.message || "");
      if (alreadyAdded) {
        toast.info(response.message);
      } else {
        toast.success(response?.message || "Subject added");
      }
      setSelectedSubject(null);
      setSubjName("");
      setType(SUBJECT_TYPES[0]);
      setCategory(SUBJECT_CATEGORIES[0]);
      setTheoryFm(100);
      setPracFm(0);
      refetchPreview();
      refetchMaster();
      refetch();
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Could not add subject.");
    }
  };

  const busy = isCopying || isSaving || isRenaming;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      scroll="paper"
      PaperProps={{
        sx: {
          width: { xs: "95vw", md: "1200px" },
          maxWidth: "1200px",
          height: { xs: "92vh", md: "90vh" },
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
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
          fontSize: "22px",
          cursor: "pointer",
          zIndex: 2,
        }}
        onClick={handleClose}
      />
      <Box
        sx={{
          px: 2,
          py: 0.75,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          textAlign: "center",
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        Add Subject
      </Box>

      <DialogContent
        sx={{
          p: 1.5,
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          flex: 1,
        }}
      >
        <Box sx={{ mb: 1, flexShrink: 0 }}>
          <Typography sx={{ mb: 0.75, fontWeight: 600, fontSize: 14 }}>
            Add to class
          </Typography>
          <Autocomplete
            multiple
            size="small"
            options={currentYearClasses || []}
            getOptionLabel={(option) => option?.cg_name || ""}
            isOptionEqualToValue={(option, value) =>
              Number(option?.id) === Number(value?.id)
            }
            value={targetClasses}
            onChange={(_, newValue) => {
              if (!newValue?.length && detail?.cg_id) {
                setTargetClasses([detail.cg_id]);
                return;
              }
              setTargetClasses(newValue || []);
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option?.id || index}
                  label={option?.cg_name || ""}
                  size="small"
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select one or more classes"
              />
            )}
          />
        </Box>

        <Box
          sx={{
            flex: "1 1 auto",
            minHeight: { xs: 420, md: 480 },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 1.5,
            alignItems: "stretch",
          }}
        >
          <Box
            sx={{
              width: { xs: "100%", md: "42%" },
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography sx={{ fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
              Subjects in this class / selected
              {leftSubjects.length ? ` (${leftSubjects.length})` : ""}
            </Typography>
            {leftSubjects.length === 0 ? (
              <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
                Tick subjects on the right. They will appear here. Use the pencil
                to change the class subject name.
              </Typography>
            ) : (
              <Box
                sx={{
                  border: "1px solid #ddd",
                  borderRadius: 1,
                  height: 260,
                  minHeight: 260,
                  maxHeight: 260,
                  overflowY: "auto",
                  overflowX: "hidden",
                  flexShrink: 0,
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {leftSubjects.map((subject, index) => {
                  const isEditing = editingId === subject.subj_id;
                  const fm = displayFm(subject);
                  return (
                    <Box
                      key={`${subject.subj_id}-${subject.category || "na"}-${index}`}
                      sx={{
                        px: 1,
                        py: 0.5,
                        bgcolor: subject.already_added ? "#fff8e1" : "#e8f5e9",
                        borderBottom: subject.already_added
                          ? "1px solid #ffe082"
                          : "1px solid #c8e6c9",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 0.5,
                      }}
                    >
                      {isEditing ? (
                        <TextField
                          size="small"
                          fullWidth
                          value={draftName}
                          autoFocus
                          onChange={(e) => setDraftName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveEdit(e, subject);
                            }
                            if (e.key === "Escape") {
                              handleCancelEdit(e);
                            }
                          }}
                          sx={{ "& .MuiInputBase-input": { fontSize: 12, py: 0.5 } }}
                        />
                      ) : (
                        <Box sx={{ minWidth: 0 }}>
                          {displayName(subject)}
                          <Typography
                            component="span"
                            sx={{ ml: 0.75, color: "text.secondary", fontSize: 11 }}
                          >
                            {subject.already_added
                              ? "already added"
                              : categoryLabel(subject.category)}
                            {` · ${toFmNumber(fm.marks)}+${toFmNumber(fm.prac)}`}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                        {isEditing ? (
                          <>
                            <IconButton
                              size="small"
                              onClick={(e) => handleSaveEdit(e, subject)}
                              disabled={busy}
                              sx={{ color: "success.main", p: 0.25 }}
                            >
                              <Check sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={handleCancelEdit}
                              disabled={busy}
                              sx={{ color: "text.secondary", p: 0.25 }}
                            >
                              <Close sx={{ fontSize: 16 }} />
                            </IconButton>
                          </>
                        ) : (
                          <IconButton
                            size="small"
                            onClick={(e) => handleStartEdit(e, subject)}
                            disabled={busy}
                            sx={{ color: "text.secondary", p: 0.25 }}
                          >
                            <EditOutlined sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                        {!subject.already_added && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeselect(subject.subj_id)}
                            sx={{ color: "text.secondary", p: 0.25 }}
                          >
                            <CancelOutlined sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}

            <Typography sx={{ fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
              Add / selected
            </Typography>
            <Box component="form" onSubmit={handleAddOne} sx={{ flexShrink: 0 }}>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Autocomplete
                    freeSolo
                    selectOnFocus
                    handleHomeEndKeys
                    options={masterSubjectOptions}
                    filterOptions={(options, params) => {
                      const filtered = filterSubjectOptions(options, params);
                      const input = String(params.inputValue || "").trim();
                      if (!input) return filtered;
                      const exists = options.some(
                        (option) =>
                          String(option?.subj_name || "").trim().toLowerCase() ===
                          input.toLowerCase()
                      );
                      if (!exists) {
                        filtered.push({
                          id: null,
                          subj_id: null,
                          subj_name: input,
                          type: type?.id || "G",
                          category: category?.id || "",
                          marks: toFmNumber(theoryFm),
                          prac: toFmNumber(pracFm),
                          isNew: true,
                        });
                      }
                      return filtered;
                    }}
                    getOptionLabel={(option) => {
                      if (typeof option === "string") return option;
                      if (option?.isNew) return `Add "${option.subj_name}"`;
                      if (!option?.subj_name) return "";
                      if (option.duplicateName) {
                        return `${option.subj_name} (${categoryLabel(option.category)})`;
                      }
                      return option.subj_name;
                    }}
                    isOptionEqualToValue={(option, value) =>
                      Number(option?.id) === Number(value?.id) &&
                      String(option?.subj_name || "") === String(value?.subj_name || "")
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Subject name"
                        size="small"
                        fullWidth
                        placeholder="Search existing or type a new name"
                        helperText="Pick an existing subject, or type a new name like Additional / Additional Hm"
                      />
                    )}
                    value={selectedSubject}
                    inputValue={subjName}
                    onInputChange={(_, next, reason) => {
                      if (reason === "reset") return;
                      setSubjName(next);
                      if (reason === "input") {
                        setSelectedSubject(null);
                      }
                    }}
                    onChange={(_, newValue) => {
                      if (typeof newValue === "string") {
                        setSelectedSubject(null);
                        setSubjName(newValue);
                        return;
                      }
                      if (!newValue) {
                        setSelectedSubject(null);
                        setSubjName("");
                        return;
                      }
                      setSelectedSubject(newValue?.id ? newValue : null);
                      setSubjName(newValue.subj_name || "");
                      setType(
                        SUBJECT_TYPES.find((item) => item.id === newValue.type) ||
                          SUBJECT_TYPES[0]
                      );
                      setCategory(
                        SUBJECT_CATEGORIES.find(
                          (item) =>
                            item.id ===
                            String(newValue.category || "").trim().toUpperCase()
                        ) || SUBJECT_CATEGORIES[0]
                      );
                      setTheoryFm(toFmNumber(newValue.marks ?? 100));
                      setPracFm(toFmNumber(newValue.prac ?? 0));
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={SUBJECT_TYPES}
                    getOptionLabel={(option) => option?.label || ""}
                    renderInput={(params) => (
                      <TextField {...params} label="Type" size="small" required />
                    )}
                    value={type}
                    onChange={(_, newValue) => setType(newValue)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={SUBJECT_CATEGORIES}
                    getOptionLabel={(option) => option?.label || ""}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Report card section"
                        size="small"
                      />
                    )}
                    value={category}
                    onChange={(_, newValue) => setCategory(newValue)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Theory FM"
                    size="small"
                    type="number"
                    fullWidth
                    value={theoryFm}
                    onChange={(e) => setTheoryFm(e.target.value)}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Practical FM"
                    size="small"
                    type="number"
                    fullWidth
                    value={pracFm}
                    onChange={(e) => setPracFm(e.target.value)}
                    inputProps={{ min: 0 }}
                    helperText="Total = theory + practical"
                  />
                </Grid>
              </Grid>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="small"
                sx={{ mt: 1 }}
                disabled={busy}
              >
                {isSaving ? <CircularProgress size={18} /> : "Add subject"}
              </Button>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="small"
              sx={{ flexShrink: 0 }}
              onClick={handleCopySelected}
              disabled={busy || selectedIds.length === 0}
            >
              {isCopying ? (
                <CircularProgress size={18} />
              ) : (
                `Add selected (${selectedIds.length}) to ${
                  targetClasses.length || 1
                } class${(targetClasses.length || 1) > 1 ? "es" : ""}`
              )}
            </Button>
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Typography sx={{ mb: 0.75, fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
              Copy from year / class
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                mb: 1,
                flexShrink: 0,
                flexWrap: "wrap",
              }}
            >
              <Autocomplete
                size="small"
                options={academicYearList || []}
                getOptionLabel={(option) => option?.ay_name || ""}
                isOptionEqualToValue={(option, value) =>
                  Number(option?.ay_id) === Number(value?.ay_id)
                }
                value={sourceYear}
                onChange={(_, newValue) => {
                  sourceTouchedRef.current = true;
                  setSourceYear(newValue);
                  setSourceClass(null);
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Session" />
                )}
                sx={{ flex: 1, minWidth: 140 }}
              />
              <Autocomplete
                size="small"
                options={sourceYearClasses || []}
                getOptionLabel={(option) => option?.cg_name || ""}
                isOptionEqualToValue={(option, value) =>
                  Number(option?.id) === Number(value?.id)
                }
                value={sourceClass}
                onChange={(_, newValue) => {
                  sourceTouchedRef.current = true;
                  setSourceClass(newValue);
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Class" />
                )}
                sx={{ flex: 1, minWidth: 140 }}
              />
            </Box>
            <Typography sx={{ mb: 0.75, fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
              {sourceClass?.cg_name
                ? `Subjects from ${sourceYear?.ay_name || ""} ${sourceClass.cg_name}`
                : `Last year ${preview?.from_cg_name || detail?.cg_id?.cg_name || ""}`}
            </Typography>
            <Box
              sx={{
                border: "1px solid #ddd",
                borderRadius: 1,
                overflowY: "scroll",
                overflowX: "auto",
                flex: 1,
                minHeight: 0,
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
              }}
            >
              {skipSourcePreview ? (
                <Typography sx={{ p: 1.5, color: "text.secondary", fontSize: 13 }}>
                  Select a class to load subjects.
                </Typography>
              ) : isPreviewLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : previousSubjects.length === 0 ? (
                <Typography sx={{ p: 1.5, color: "text.secondary", fontSize: 13 }}>
                  No subjects found for the selected class.
                </Typography>
              ) : (
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="success"
                          size="small"
                          checked={allSelectableSelected}
                          indeterminate={
                            someSelectableSelected && !allSelectableSelected
                          }
                          disabled={selectableIds.length === 0}
                          onClick={handleSelectAll}
                          inputProps={{ "aria-label": "Select all" }}
                        />
                      </TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Section</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="center" sx={{ width: 88 }}>
                        Theory FM
                      </TableCell>
                      <TableCell align="center" sx={{ width: 88 }}>
                        Prac FM
                      </TableCell>
                      <TableCell align="right">Edit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previousSubjects.map((subject, index) => {
                      const checked = isSelectedId(subject.subj_id);
                      const isGreen = checked || subject.already_added;
                      const fm = displayFm(subject);
                      return (
                        <TableRow
                          key={`${subject.subj_id}-${subject.category || "na"}-${index}`}
                          hover
                          onClick={() => handleTogglePrevious(subject)}
                          sx={{
                            cursor: "pointer",
                            bgcolor: isGreen ? "#e8f5e9" : "transparent",
                            "& td": {
                              bgcolor: isGreen ? "#e8f5e9" : "inherit",
                              py: 0.35,
                            },
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={checked}
                              color="success"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {editingId === subject.subj_id ? (
                              <TextField
                                size="small"
                                fullWidth
                                value={draftName}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setDraftName(e.target.value)}
                                onKeyDown={(e) => {
                                  e.stopPropagation();
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSaveEdit(e, subject);
                                  }
                                  if (e.key === "Escape") {
                                    handleCancelEdit(e);
                                  }
                                }}
                                sx={{ "& .MuiInputBase-input": { fontSize: 12, py: 0.5 } }}
                              />
                            ) : (
                              <>
                                {displayName(subject)}
                                {subject.already_added ? " (already added)" : ""}
                              </>
                            )}
                          </TableCell>
                          <TableCell>{categoryLabel(subject.category)}</TableCell>
                          <TableCell>
                            {subject.type === "G" ? "Grade" : "Marks"}
                          </TableCell>
                          <TableCell
                            align="center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <TextField
                              size="small"
                              type="number"
                              value={fm.marks}
                              disabled={busy}
                              onChange={(e) =>
                                handleFmChange(e, subject, "marks")
                              }
                              onBlur={() => handleFmBlur(subject)}
                              inputProps={{
                                min: 0,
                                style: {
                                  textAlign: "center",
                                  fontSize: 12,
                                  padding: "4px 6px",
                                },
                              }}
                              sx={{ width: 72 }}
                            />
                          </TableCell>
                          <TableCell
                            align="center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <TextField
                              size="small"
                              type="number"
                              value={fm.prac}
                              disabled={busy}
                              onChange={(e) =>
                                handleFmChange(e, subject, "prac")
                              }
                              onBlur={() => handleFmBlur(subject)}
                              inputProps={{
                                min: 0,
                                style: {
                                  textAlign: "center",
                                  fontSize: 12,
                                  padding: "4px 6px",
                                },
                              }}
                              sx={{ width: 72 }}
                            />
                          </TableCell>
                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            {editingId === subject.subj_id ? (
                              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleSaveEdit(e, subject)}
                                  disabled={busy}
                                  sx={{ p: 0.25 }}
                                >
                                  <Check sx={{ fontSize: 16 }} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={handleCancelEdit}
                                  disabled={busy}
                                  sx={{ p: 0.25 }}
                                >
                                  <Close sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Box>
                            ) : (
                              <IconButton
                                size="small"
                                onClick={(e) => handleStartEdit(e, subject)}
                                disabled={busy}
                                sx={{ p: 0.25 }}
                              >
                                <EditOutlined sx={{ fontSize: 16 }} />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            mt: 1,
            pt: 1,
            flexShrink: 0,
            borderTop: "1px solid #eee",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.25, color: "text.secondary" }}>
              1–8 / 9–10 use (type exact name):
            </Typography>
            <Box
              component="ul"
              sx={{
                m: 0,
                pl: 2,
                color: "text.secondary",
                fontSize: 10.5,
                lineHeight: 1.35,
              }}
            >
              {ADDITIONAL_GUIDE_1_TO_10.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </Box>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.25, color: "text.secondary" }}>
              11–12 use (type exact name):
            </Typography>
            <Box
              component="ul"
              sx={{
                m: 0,
                pl: 2,
                color: "text.secondary",
                fontSize: 10.5,
                lineHeight: 1.35,
              }}
            >
              {ADDITIONAL_GUIDE_11_12.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1, flexShrink: 0, justifyContent: "flex-end" }}>
        <Button variant="outlined" size="small" onClick={handleClose} disabled={busy}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AddSubjectModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  refetch: PropTypes.func,
  detail: PropTypes.object,
};

export default memo(AddSubjectModal);
