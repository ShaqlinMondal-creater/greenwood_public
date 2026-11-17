import PropTypes from "prop-types";
import {
  Box,
  CircularProgress,
  FormControlLabel,
  FormLabel,
  Grid,
  InputAdornment,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { memo, useState } from "react";
import { toast } from "react-toastify";
import {
  digitsOnlyPincode,
  lookupIndianPincode,
} from "../../../../../utils/pincode-lookup";

const MotherDetailsTab = ({ props }) => {
  const { formData, handleChange } = props;
  const [loadingPincode, setLoadingPincode] = useState("");

  const handlePincodeChange = (pincodeName, cityName, stateName, countryName) =>
    async (e) => {
      const digits = digitsOnlyPincode(e.target.value);
      handleChange({ target: { name: pincodeName, value: digits } });
      if (digits.length !== 6) return;

      setLoadingPincode(pincodeName);
      const result = await lookupIndianPincode(digits);
      setLoadingPincode("");

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      handleChange({ target: { name: cityName, value: result.data.city } });
      handleChange({ target: { name: stateName, value: result.data.state } });
      handleChange({ target: { name: countryName, value: result.data.country } });
    };
  return (
    <Box>
      <Grid container spacing={4}>
        {/*Name */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="m_name"
            label="Name"
            fullWidth
            required
            value={formData?.m_name || ""}
            onChange={handleChange}
          />
        </Grid>

        {/* Mobile */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="m_contact"
            label="Mobile"
            type="tel"
            fullWidth
            required
            value={formData?.m_contact || ""}
            onChange={handleChange}
          />
        </Grid>

        {/* Email */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="m_email"
            label="Email"
            type="email"
            fullWidth
            value={formData?.m_email || ""}
            onChange={handleChange}
          />
        </Grid>

        {/*Mother's Occupation */}
        <Grid item xs={12} sm={6}>
          <FormLabel component="legend" required>
            Occupation
          </FormLabel>
          <RadioGroup
            row
            name="m_occupation"
            value={formData?.m_occupation}
            onChange={handleChange}
          >
            <FormControlLabel
              value="self-employed"
              control={<Radio />}
              label="Self Employed"
            />
            <FormControlLabel
              value="employed"
              control={<Radio />}
              label="Employed"
            />
            <FormControlLabel
              value="home-maker"
              control={<Radio />}
              label="Home Maker"
            />
          </RadioGroup>
        </Grid>
      </Grid>

      {formData?.m_occupation !== "home-maker" && (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {formData?.m_occupation === "self-employed" && (
            <>
              {/* Business Name */}
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <TextField
                  name="m_business_name"
                  label="Business Name"
                  fullWidth
                  value={formData?.m_business_name || ""}
                  onChange={handleChange}
                />
              </Grid>

              {/* Business Nature */}
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <TextField
                  name="m_business_nature"
                  label="Business Nature"
                  fullWidth
                  value={formData?.m_business_nature || ""}
                  onChange={handleChange}
                />
              </Grid>
              {/* Address 1 */}
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <TextField
                  name="m_business_address1"
                  label="Address"
                  fullWidth
                  value={formData?.m_business_address1 || ""}
                  onChange={handleChange}
                />
              </Grid>

              {/* City */}
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <TextField
                  name="m_business_city"
                  label="City"
                  fullWidth
                  value={formData?.m_business_city || ""}
                  onChange={handleChange}
                />
              </Grid>

              {/* State */}
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <TextField
                  name="m_business_state"
                  label="State"
                  fullWidth
                  value={formData?.m_business_state || ""}
                  onChange={handleChange}
                />
              </Grid>

              {/* Country */}
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <TextField
                  name="m_business_country"
                  label="Country"
                  fullWidth
                  value={formData?.m_business_country || ""}
                  onChange={handleChange}
                />
              </Grid>

              {/* Pincode */}
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <TextField
                  name="m_business_pincode"
                  label="Pincode"
                  fullWidth
                  value={formData?.m_business_pincode || ""}
                  onChange={handlePincodeChange(
                    "m_business_pincode",
                    "m_business_city",
                    "m_business_state",
                    "m_business_country"
                  )}
                  helperText="Enter 6-digit pincode to auto-fill"
                  InputProps={{
                    endAdornment:
                      loadingPincode === "m_business_pincode" ? (
                        <InputAdornment position="end">
                          <CircularProgress size={18} />
                        </InputAdornment>
                      ) : null,
                  }}
                />
              </Grid>
            </>
          )}

          {formData?.m_occupation === "employed" && (
            <>
              {/* Employer */}
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <TextField
                  name="m_employer_name"
                  label="Employer"
                  fullWidth
                  value={formData?.m_employer_name || ""}
                  onChange={handleChange}
                />
              </Grid>
              {/* Designation */}
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <TextField
                  name="m_designation"
                  label="Designation"
                  fullWidth
                  value={formData?.m_designation || ""}
                  onChange={handleChange}
                />
              </Grid>
              {/* Address 1 */}
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <TextField
                  name="m_work_address1"
                  label="Address"
                  fullWidth
                  value={formData?.m_work_address1 || ""}
                  onChange={handleChange}
                />
              </Grid>

              {/* City */}
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <TextField
                  name="m_work_city"
                  label="City"
                  fullWidth
                  value={formData?.m_work_city || ""}
                  onChange={handleChange}
                />
              </Grid>

              {/* State */}
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <TextField
                  name="m_work_state"
                  label="State"
                  fullWidth
                  value={formData?.m_work_state || ""}
                  onChange={handleChange}
                />
              </Grid>

              {/* Country */}
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <TextField
                  name="m_work_country"
                  label="Country"
                  fullWidth
                  value={formData?.m_work_country || ""}
                  onChange={handleChange}
                />
              </Grid>

              {/* Pincode */}
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <TextField
                  name="m_work_pincode"
                  label="Pincode"
                  fullWidth
                  value={formData?.m_work_pincode || ""}
                  onChange={handlePincodeChange(
                    "m_work_pincode",
                    "m_work_city",
                    "m_work_state",
                    "m_work_country"
                  )}
                  helperText="Enter 6-digit pincode to auto-fill"
                  InputProps={{
                    endAdornment:
                      loadingPincode === "m_work_pincode" ? (
                        <InputAdornment position="end">
                          <CircularProgress size={18} />
                        </InputAdornment>
                      ) : null,
                  }}
                />
              </Grid>
            </>
          )}
        </Grid>
      )}
    </Box>
  );
};

MotherDetailsTab.propTypes = {
  props: PropTypes.object,
  formData: PropTypes.object,
  handleChange: PropTypes.func,
};

export default memo(MotherDetailsTab);
