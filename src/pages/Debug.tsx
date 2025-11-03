import { useEffect, useState } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import { db } from "../data/db";

export default function Debug() {
  const [stats, setStats] = useState<any>(null);

  const loadStats = async () => {
    const count = await db.vulnerabilities.count();
    const indexes = db.vulnerabilities.schema.indexes.map((idx) => ({
      name: idx.name,
      keyPath: idx.keyPath,
      unique: idx.unique,
    }));
    const meta = await db.meta.toArray();
    const sample = await db.vulnerabilities.limit(5).toArray();

    setStats({
      count,
      indexes,
      meta,
      sample,
      dbVersion: db.verno,
    });
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        IndexedDB Debug Info
      </Typography>

      <Button variant="contained" onClick={loadStats} sx={{ mb: 2 }}>
        Refresh
      </Button>

      {stats && (
        <Paper sx={{ p: 2 }}>
          <pre style={{ overflow: "auto", maxHeight: "80vh" }}>
            {JSON.stringify(stats, null, 2)}
          </pre>
        </Paper>
      )}
    </Box>
  );
}
