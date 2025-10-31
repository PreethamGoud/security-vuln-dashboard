import { useEffect, useState } from "react";
import {
  Box,
  Drawer,
  Stack,
  Typography,
  Chip,
  Divider,
  Link,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { Vulnerability } from "../types/vuln";
import { db } from "../data/db";
import { useSelection } from "../contexts/SelectionContext";

function Field({
  label,
  left,
  right,
}: {
  label: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <Stack direction="row" spacing={2} sx={{ py: 0.75 }}>
      <Box sx={{ width: 160, color: "text.secondary" }}>{label}</Box>
      <Box sx={{ flex: 1 }}>{left ?? "—"}</Box>
      <Box sx={{ flex: 1 }}>{right ?? "—"}</Box>
    </Stack>
  );
}

export default function CompareDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { selected, clear } = useSelection();
  const [left, setLeft] = useState<Vulnerability | null>(null);
  const [right, setRight] = useState<Vulnerability | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [a, b] = selected;
      const va = a ? await db.vulnerabilities.get(a) : null;
      const vb = b ? await db.vulnerabilities.get(b) : null;
      if (!alive) return;
      setLeft(va ?? null);
      setRight(vb ?? null);
    })();
    return () => {
      alive = false;
    };
  }, [selected]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 640 } } }}
    >
      <Box sx={{ p: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6">Compare CVEs</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={selected[0] ?? "—"} size="small" />
            <Chip label={selected[1] ?? "—"} size="small" />
            <IconButton
              size="small"
              onClick={() => {
                clear();
                onClose();
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Field label="CVE" left={left?.cve} right={right?.cve} />
        <Field
          label="Severity"
          left={(left?.severity ?? "unknown").toUpperCase()}
          right={(right?.severity ?? "unknown").toUpperCase()}
        />
        <Field label="CVSS" left={left?.cvss} right={right?.cvss} />
        <Field
          label="Package"
          left={left?.packageName}
          right={right?.packageName}
        />
        <Field
          label="Version"
          left={left?.packageVersion}
          right={right?.packageVersion}
        />
        <Field
          label="Type"
          left={left?.packageType}
          right={right?.packageType}
        />
        <Field
          label="Published"
          left={left?.published}
          right={right?.published}
        />
        <Field label="Fix date" left={left?.fixDate} right={right?.fixDate} />
        <Field
          label="kaiStatus"
          left={left?.kaiStatus}
          right={right?.kaiStatus}
        />
        <Field
          label="Link"
          left={
            left?.link ? (
              <Link href={left.link} target="_blank" rel="noreferrer">
                Open
              </Link>
            ) : (
              "—"
            )
          }
          right={
            right?.link ? (
              <Link href={right.link} target="_blank" rel="noreferrer">
                Open
              </Link>
            ) : (
              "—"
            )
          }
        />
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Description
          </Typography>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1, whiteSpace: "pre-wrap" }}>
              {left?.description ?? "—"}
            </Box>
            <Box sx={{ flex: 1, whiteSpace: "pre-wrap" }}>
              {right?.description ?? "—"}
            </Box>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
