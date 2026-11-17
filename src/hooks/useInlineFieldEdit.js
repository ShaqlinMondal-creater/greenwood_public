import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { updateStudentDetail } from "../services/admin/students-management.service";

const valuesEqual = (a, b, type) => {
  if (type === "date") {
    const da = a ? dayjs(a).format("YYYY-MM-DD") : null;
    const db = b ? dayjs(b).format("YYYY-MM-DD") : null;
    return da === db;
  }
  if (type === "object") {
    const aId = a?.id ?? a;
    const bId = b?.id ?? b;
    return aId === bId;
  }
  return a === b;
};

export const useInlineFieldEdit = ({
  detail,
  fieldConfigs,
  stId,
  onSuccess,
  logout,
  updateFn = updateStudentDetail,
}) => {
  const buildInitialState = useCallback(() => {
    return Object.entries(fieldConfigs).reduce((acc, [key, config]) => {
      acc[key] = config.getValue(detail);
      return acc;
    }, {});
  }, [detail, fieldConfigs]);

  const initialState = useMemo(() => buildInitialState(), [buildInitialState]);

  const [formData, setFormData] = useState(initialState);
  const [loadingState, setLoadingState] = useState({});
  const [editingState, setEditingState] = useState({});
  const [hoverKey, setHoverKey] = useState(null);

  useEffect(() => {
    setFormData(buildInitialState());
  }, [buildInitialState]);

  const handleChange = (name, value, type) => {
    const parsedValue =
      type === "date" && value ? dayjs(value).format("YYYY-MM-DD") : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleEditingState = (key, value = true) => {
    if (value === false) {
      setFormData((prev) => ({ ...prev, [key]: initialState[key] }));
      setHoverKey(null);
    }
    setEditingState((prev) => ({ ...prev, [key]: value }));
  };

  const handleHoverState = (key, value = true) => {
    setHoverKey(value ? key : null);
  };

  const handleUpdateStudentData = async (key) => {
    const config = fieldConfigs[key];
    const fieldType = config?.type || "text";

    if (valuesEqual(formData[key], initialState[key], fieldType)) {
      handleEditingState(key, false);
      return;
    }

    if (
      config?.allowEmpty !== true &&
      (formData[key] === null ||
        formData[key] === undefined ||
        formData[key] === "")
    ) {
      toast.error("Value cannot be empty");
      return;
    }

    setLoadingState((prev) => ({ ...prev, [key]: true }));

    const fieldValue = config?.formatSubmit
      ? config.formatSubmit(formData[key])
      : formData[key];

    const response = await updateFn({
      st_id: stId,
      field_name: config?.apiField || key,
      field_value: fieldValue,
    });

    setLoadingState((prev) => ({ ...prev, [key]: false }));
    handleEditingState(key, false);

    if (response?.code === 200) {
      onSuccess?.();
      toast.success(response?.message || "Student details updated");
    } else if (response?.code === 401) {
      logout?.(response);
    } else {
      toast.error(response?.message || "Failed to update student details");
    }
  };

  const handleUpdateMultipleFields = async (keys) => {
    const unchanged = keys.every((key) =>
      valuesEqual(
        formData[key],
        initialState[key],
        fieldConfigs[key]?.type || "text",
      ),
    );

    if (unchanged) {
      keys.forEach((key) => handleEditingState(key, false));
      return;
    }

    for (const key of keys) {
      const config = fieldConfigs[key];
      if (
        config?.allowEmpty !== true &&
        (formData[key] === null ||
          formData[key] === undefined ||
          formData[key] === "")
      ) {
        toast.error("Value cannot be empty");
        return;
      }
    }

    const groupKey = keys.join("_");
    setLoadingState((prev) => {
      const next = { ...prev, [groupKey]: true };
      keys.forEach((key) => {
        next[key] = true;
      });
      return next;
    });

    for (const key of keys) {
      if (valuesEqual(formData[key], initialState[key], fieldConfigs[key]?.type)) {
        continue;
      }

      const config = fieldConfigs[key];
      const fieldValue = config?.formatSubmit
        ? config.formatSubmit(formData[key])
        : formData[key];

      const response = await updateFn({
        st_id: stId,
        field_name: config?.apiField || key,
        field_value: fieldValue,
      });

      if (response?.code !== 200) {
        setLoadingState((prev) => {
          const next = { ...prev, [groupKey]: false };
          keys.forEach((item) => {
            next[item] = false;
          });
          return next;
        });
        if (response?.code === 401) {
          logout?.(response);
        } else {
          toast.error(response?.message || "Failed to update student details");
        }
        return;
      }
    }

    setLoadingState((prev) => {
      const next = { ...prev, [groupKey]: false };
      keys.forEach((key) => {
        next[key] = false;
      });
      return next;
    });
    keys.forEach((key) => handleEditingState(key, false));
    onSuccess?.();
    toast.success("Student details updated");
  };

  return {
    formData,
    setFormData,
    loadingState,
    editingState,
    hoverKey,
    handleChange,
    handleEditingState,
    handleHoverState,
    handleUpdateStudentData,
    handleUpdateMultipleFields,
    initialState,
  };
};
