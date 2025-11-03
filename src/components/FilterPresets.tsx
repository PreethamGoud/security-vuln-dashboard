import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import { usePreferences } from "../contexts/PreferencesContext";
import { useFilters } from "../contexts/FiltersContext";

export default function FilterPresets() {
  const {
    preferences,
    saveFilterPreset,
    deleteFilterPreset,
    loadFilterPreset,
  } = usePreferences();
  const { filters, setFilters } = useFilters();
  const [open, setOpen] = useState(false);
  const [presetName, setPresetName] = useState("");

  const handleSave = () => {
    if (presetName.trim()) {
      saveFilterPreset(presetName.trim(), filters);
      setPresetName("");
      setOpen(false);
    }
  };

  const handleLoad = (name: string) => {
    const preset = loadFilterPreset(name);
    if (preset) {
      setFilters(preset);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<SaveIcon />}
        onClick={() => setOpen(true)}
      >
        Filter Presets
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Filter Presets</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Save Current Filters As"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="e.g., Critical Only"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleSave}
              disabled={!presetName.trim()}
            >
              Save Current Filters
            </Button>

            {preferences.savedFilters.length > 0 && (
              <>
                <div style={{ borderTop: "1px solid #ddd", marginTop: 16 }} />
                <List dense>
                  {preferences.savedFilters.map((preset) => (
                    <ListItem
                      key={preset.name}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => deleteFilterPreset(preset.name)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={preset.name}
                        sx={{ cursor: "pointer" }}
                        onClick={() => {
                          handleLoad(preset.name);
                          setOpen(false);
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
