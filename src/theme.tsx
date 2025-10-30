import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1976d2" },
    background: {
      default: "#fafafa",
    },
  },
  shape: { borderRadius: 8 },
});

export default theme;
