import PropTypes from "prop-types";
import {
  Autocomplete,
  Box,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { memo } from "react";

const PRESET_RELATIONS = ["Brother", "Grand Father", "Uncle"];
const RELATION_OPTIONS = [...PRESET_RELATIONS, "Other"];

const OCCUPATION_OPTIONS = [
  { label: "Employed", value: "employed" },
  { label: "Self Employed", value: "self-employed" },
  { label: "None", value: "none" },
  { label: "Home Maker", value: "home-maker" },
];

const GuardianDetailsTab = ({ props }) => {
  const { formData, setFormData, handleChange } = props;

  // Dropdown selection must follow g_relation_choice (not g_relation),
  // otherwise selecting "Other" with empty custom text clears the UI.
  const relationChoice = (() => {
    const choice = String(formData?.g_relation_choice || "").trim();
    if (choice === "Other") return "Other";
    if (PRESET_RELATIONS.includes(choice)) return choice;

    const value = String(formData?.g_relation || "").trim();
    if (!value) return null;
    if (PRESET_RELATIONS.includes(value)) return value;
    return "Other";
  })();

  const customRelation =
    relationChoice === "Other"
      ? formData?.g_relation_other ||
        (PRESET_RELATIONS.includes(formData?.g_relation)
          ? ""
          : formData?.g_relation) ||
        ""
      : "";

  return (
    <Box>
      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Autocomplete
            options={RELATION_OPTIONS}
            value={relationChoice}
            onChange={(_, newValue) => {
              setFormData((prev) => {
                if (newValue === "Other") {
                  return {
                    ...prev,
                    g_relation_choice: "Other",
                    g_relation: prev.g_relation_other || "",
                  };
                }

                return {
                  ...prev,
                  g_relation_choice: newValue || "",
                  g_relation: newValue || "",
                  g_relation_other: "",
                };
              });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Relation with student"
                required
                fullWidth
              />
            )}
          />
        </Grid>

        {relationChoice === "Other" && (
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <TextField
              name="g_relation_other"
              label="Specify relation"
              placeholder="Enter relation"
              fullWidth
              required
              autoFocus
              value={customRelation}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  g_relation_choice: "Other",
                  g_relation_other: value,
                  g_relation: value,
                }));
              }}
            />
          </Grid>
        )}

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="g_name"
            label="Guardian Name"
            fullWidth
            required
            value={formData?.g_name || ""}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="g_contact"
            label="Mobile"
            type="tel"
            fullWidth
            required
            value={formData?.g_contact || ""}
            onChange={(e) => {
              const value = String(e.target.value || "")
                .replace(/\D/g, "")
                .slice(0, 10);
              setFormData((prev) => ({ ...prev, g_contact: value }));
            }}
            inputProps={{ maxLength: 10, inputMode: "numeric" }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="g_email"
            label="Email"
            type="email"
            fullWidth
            value={formData?.g_email || ""}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="g_aadhar"
            label="Aadhaar No"
            fullWidth
            required
            value={formData?.g_aadhar || ""}
            onChange={(e) => {
              const value = String(e.target.value || "")
                .replace(/\D/g, "")
                .slice(0, 12);
              setFormData((prev) => ({ ...prev, g_aadhar: value }));
            }}
            inputProps={{ maxLength: 12, inputMode: "numeric" }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <FormLabel component="legend">Occupation</FormLabel>
          <RadioGroup
            row
            name="g_occupation"
            value={formData?.g_occupation || ""}
            onChange={handleChange}
          >
            {OCCUPATION_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
              />
            ))}
          </RadioGroup>
        </Grid>
      </Grid>
    </Box>
  );
};

GuardianDetailsTab.propTypes = {
  props: PropTypes.shape({
    formData: PropTypes.object,
    setFormData: PropTypes.func,
    handleChange: PropTypes.func,
  }),
};

export default memo(GuardianDetailsTab);
