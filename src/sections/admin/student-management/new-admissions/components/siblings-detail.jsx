import { memo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

const HEAD_LABEL = [
  { id: "sn", label: "SN" },
  { id: "name", label: "Name" },
  { id: "class", label: "Class" },
  { id: "roll_no", label: "Roll No" },
];

const SiblingsDetail = ({ detail }) => {
  return (
    <Box>
      {detail?.siblings?.length > 0 && (
        <Box sx={{ my: 4, px: 4 }}>
          <Typography
            variant="h4"
            sx={{ textAlign: "center", color: "primary.main", mb: 2 }}
          >
            {`Sibling's Details`}
          </Typography>
          <TableContainer sx={{ overflowY: "unset" }}>
            <Table sx={{ minWidth: 300 }}>
              <TableHead>
                <TableRow>
                  {HEAD_LABEL?.map((headCell) => (
                    <TableCell
                      key={headCell?.id}
                      align={headCell?.align || "left"}
                      sx={{
                        width: headCell?.width,
                        minWidth: headCell?.minWidth,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {headCell?.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {detail?.siblings?.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row?.name || "-"}</TableCell>
                    <TableCell>{row?.class || "-"}</TableCell>
                    <TableCell>{row?.roll_no || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

SiblingsDetail.propTypes = {
  detail: PropTypes.object.isRequired,
};

export default memo(SiblingsDetail);
