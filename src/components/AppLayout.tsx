import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Button,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import { Link as RouterLink, useLocation } from "react-router-dom";

type Props = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: Props) {
  const { pathname } = useLocation();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column", // stack header above content
        minHeight: "100vh",
        bgcolor: "background.default",
        overflowX: "hidden", // avoid horizontal scrollbar from rounding/padding
      }}
    >
      <AppBar position="sticky" elevation={1} color="default">
        <Toolbar>
          <SecurityIcon sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            style={{ textDecoration: "none", color: "inherit" }}
            sx={{ flexGrow: 1 }}
          >
            Security Vulnerability Dashboard
          </Typography>
          <Button
            component={RouterLink}
            to="/"
            color={pathname === "/" ? "primary" : "inherit"}
          >
            Dashboard
          </Button>
          <Button
            component={RouterLink}
            to="/vulns"
            color={pathname === "/vulns" ? "primary" : "inherit"}
          >
            Vulnerabilities
          </Button>
          <Button
            component={RouterLink}
            to="/about"
            color={pathname === "/about" ? "primary" : "inherit"}
          >
            About
          </Button>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="lg" // change to "xl" if you want wider content
        sx={{ py: 3, flex: 1, width: "100%" }}
      >
        {children}
      </Container>
    </Box>
  );
}
