import { memo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";

const OtherInformation = ({ detail }) => {
  const theme = useTheme();
  return (
    <Box sx={{ px: 4 }}>
      <Typography
        variant="h4"
        sx={{ textAlign: "center", color: "primary.main", mt: 2 }}
      >
        Other Information
      </Typography>
      <List>
        <ListItem sx={{ alignItems: "start" }}>
          <ListItemIcon sx={{ fontWeight: 500, color: "primary.main" }}>
            1.
          </ListItemIcon>
          <ListItemText
            primary="What attracted you to our school?"
            secondary={detail?.attracted || "N/A"}
            slotProps={{
              primary: {
                typography: {
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                },
              },
              secondary: { typography: { color: "black" } },
            }}
          />
        </ListItem>
        <ListItem sx={{ alignItems: "start" }}>
          <ListItemIcon sx={{ fontWeight: 500, color: "primary.main" }}>
            2.
          </ListItemIcon>
          <ListItemText
            primary="Strengths and weaknesses of your child?"
            secondary={detail?.strengths || "N/A"}
            slotProps={{
              primary: {
                typography: {
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                },
              },
              secondary: { typography: { color: "black" } },
            }}
          />
        </ListItem>
        <ListItem sx={{ alignItems: "start" }}>
          <ListItemIcon sx={{ fontWeight: 500, color: "primary.main" }}>
            3.
          </ListItemIcon>
          <ListItemText
            primary="Other Remarks"
            secondary={detail?.remarks || "N/A"}
            slotProps={{
              primary: {
                typography: {
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                },
              },
              secondary: { typography: { color: "black" } },
            }}
          />
        </ListItem>
      </List>
    </Box>
  );
};

OtherInformation.propTypes = {
  detail: PropTypes.object.isRequired,
};

export default memo(OtherInformation);
