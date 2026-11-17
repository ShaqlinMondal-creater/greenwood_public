import PropTypes from "prop-types";
import {
  Box,
  CircularProgress,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { memo, useState } from "react";
import { toast } from "react-toastify";
import { lookupIndianPincode } from "../../utils/pincode-lookup";

const MotherDetailsTab = ({ props }) => {
  const { formData, setFormData, handleChange } = props;
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const prefix =
    formData?.mother_occupation?.toLowerCase() === "employed"
      ? "mother_work_"
      : "mother_business_";

  const handlePincodeChange = async (e) => {
    const digits = String(e.target.value || "")
      .replace(/\D/g, "")
      .slice(0, 6);

    setFormData((prev) => ({
      ...prev,
      [`${prefix}pincode`]: digits,
      ...(digits.length < 6
        ? {
            [`${prefix}city`]: "",
            [`${prefix}state`]: "",
            [`${prefix}country`]: "",
          }
        : {}),
    }));

    if (digits.length !== 6) return;

    setIsPincodeLoading(true);
    const result = await lookupIndianPincode(digits);
    setIsPincodeLoading(false);

    if (!result.ok) {
      toast.error(result.message);
      setFormData((prev) => ({
        ...prev,
        [`${prefix}city`]: "",
        [`${prefix}state`]: "",
        [`${prefix}country`]: "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [`${prefix}pincode`]: digits,
      [`${prefix}city`]: result.data.city,
      [`${prefix}state`]: result.data.state,
      [`${prefix}country`]: result.data.country,
    }));
  };

  return (
    <Box>
      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="mother_first_name"
            label="Mother's Name"
            fullWidth
            required
            value={formData?.mother_first_name || ""}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="mother_last_name"
            label="Mother's Surname"
            fullWidth
            required
            value={formData?.mother_last_name || ""}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="mother_mobile"
            label="Mobile"
            type="tel"
            fullWidth
            required
            value={formData?.mother_mobile || ""}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="mother_email"
            label="Email"
            type="email"
            fullWidth
            value={formData?.mother_email || ""}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="mother_aadhar"
            label="Aadhaar No"
            fullWidth
            required
            value={formData?.mother_aadhar || ""}
            onChange={(e) => {
              const value = String(e.target.value || "")
                .replace(/\D/g, "")
                .slice(0, 12);
              setFormData((prev) => ({ ...prev, mother_aadhar: value }));
            }}
            inputProps={{ maxLength: 12, inputMode: "numeric" }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="mother_qualification"
            label="Qualification"
            fullWidth
            required
            value={formData?.mother_qualification || ""}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormLabel component="legend" required>
            Occupation
          </FormLabel>
          <RadioGroup
            row
            name="mother_occupation"
            value={formData?.mother_occupation || ""}
            onChange={handleChange}
          >
            <FormControlLabel
              value="business"
              control={<Radio />}
              label="Business"
            />
            <FormControlLabel
              value="employed"
              control={<Radio />}
              label="Employed"
            />
            <FormControlLabel
              value="housewife"
              control={<Radio />}
              label="Housewife"
            />
            <FormControlLabel
              value="not-applicable"
              control={<Radio />}
              label="None"
            />
          </RadioGroup>
        </Grid>
      </Grid>

      {formData?.mother_occupation !== "not-applicable" &&
        formData?.mother_occupation !== "housewife" && (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {formData?.mother_occupation === "business" && (
              <>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <TextField
                    name="mother_business_name"
                    label="Business Name"
                    fullWidth
                    value={formData?.mother_business_name || ""}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <TextField
                    name="mother_business_nature"
                    label="Business Nature"
                    fullWidth
                    value={formData?.mother_business_nature || ""}
                    onChange={handleChange}
                  />
                </Grid>
              </>
            )}

            {formData?.mother_occupation === "employed" && (
              <>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <TextField
                    name="mother_employer_name"
                    label="Employer"
                    fullWidth
                    value={formData?.mother_employer_name || ""}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <TextField
                    name="mother_designation"
                    label="Designation"
                    fullWidth
                    value={formData?.mother_designation || ""}
                    onChange={handleChange}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} sm={6} md={4} lg={3}>
              <TextField
                name="mother_monthly_income"
                label="Monthly Income"
                fullWidth
                value={formData?.mother_monthly_income || ""}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3}>
              <TextField
                name={`${prefix}address`}
                label="Address"
                fullWidth
                value={formData?.[`${prefix}address`] || ""}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3}>
              <TextField
                name={`${prefix}pincode`}
                label="Pincode"
                fullWidth
                value={formData?.[`${prefix}pincode`] || ""}
                onChange={handlePincodeChange}
                inputProps={{ maxLength: 6, inputMode: "numeric" }}
                InputProps={{
                  endAdornment: isPincodeLoading ? (
                    <CircularProgress size={18} />
                  ) : null,
                }}
                helperText={
                  isPincodeLoading
                    ? "Fetching city, state, country..."
                    : "Enter 6-digit pincode to auto-fill"
                }
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3}>
              <TextField
                name={`${prefix}city`}
                label="City"
                fullWidth
                value={formData?.[`${prefix}city`] || ""}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3}>
              <TextField
                name={`${prefix}state`}
                label="State"
                fullWidth
                value={formData?.[`${prefix}state`] || ""}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3}>
              <TextField
                name={`${prefix}country`}
                label="Country"
                fullWidth
                value={formData?.[`${prefix}country`] || ""}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        )}
    </Box>
  );
};

MotherDetailsTab.propTypes = {
  props: PropTypes.shape({
    formData: PropTypes.object,
    setFormData: PropTypes.func,
    handleChange: PropTypes.func,
  }),
};

export default memo(MotherDetailsTab);
