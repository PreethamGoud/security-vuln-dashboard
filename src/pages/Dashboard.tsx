import { Box, Paper, Typography } from "@mui/material";

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Dashboard
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Welcome! We’ll load, process, and visualize large JSON vulnerability
          data here.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Next steps: data loading strategy, flattening utilities,
          virtualization, charts, and filters.
        </Typography>
      </Paper>
    </Box>
  );
}
