import { Box, Paper, Typography } from "@mui/material";

export default function Vulnerabilities() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Vulnerabilities
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          This will become the main listing with pagination/virtualization,
          sorting, and filters.
        </Typography>
      </Paper>
    </Box>
  );
}
