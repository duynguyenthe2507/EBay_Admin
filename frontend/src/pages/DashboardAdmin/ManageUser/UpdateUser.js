import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import axios from "axios";

const ALL_ROLES = [
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "admin", label: "Admin" },
  { value: "monitor", label: "Monitor" },
  { value: "support", label: "Support" },
  { value: "finance", label: "Finance" },
];

export default function UpdateUser({
  targetUser,
  onUpdated,
  open,
  handleClose,
  currentRole,
}) {
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const canChangeRole = ["admin", "support"].includes(currentRole);

  React.useEffect(() => {
    setUsername(targetUser?.username || "");
    setEmail(targetUser?.email || "");
    setRole(targetUser?.role || "");
    setErrorMessage("");
  }, [targetUser, open]);

  const handleUpdateUser = async (event) => {
    event.preventDefault();

    if (!canChangeRole) {
      setErrorMessage("You only have permission to view user information.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const response = await axios.put(
        `http://localhost:9999/api/admin/users/${targetUser._id}`,
        {
          username,
          email,
          role,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (response.status === 200) {
        onUpdated(true);
        handleClose();
      }
    } catch (error) {
      console.error("Update error:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "An error occurred while updating user.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: 22,
          color: "#1976d2",
        }}
      >
        {canChangeRole ? "Update User" : "User Details"}
      </DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {canChangeRole
            ? "Update the user's information and system role."
            : "You only have permission to view this user's information."}
        </DialogContentText>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Box component="form" onSubmit={handleUpdateUser}>
          <TextField
            label="User Name"
            variant="outlined"
            fullWidth
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={!canChangeRole}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={!canChangeRole}
            sx={{ mb: 2 }}
          />

          <TextField
            select
            label="Role"
            variant="outlined"
            fullWidth
            required
            value={role}
            onChange={(event) => setRole(event.target.value)}
            disabled={!canChangeRole}
            sx={{ mb: 2 }}
          >
            {ALL_ROLES.map((roleOption) => (
              <MenuItem key={roleOption.value} value={roleOption.value}>
                {roleOption.label}
              </MenuItem>
            ))}
          </TextField>

          <DialogActions sx={{ mt: 2, px: 0 }}>
            <Button onClick={handleClose} color="inherit">
              {canChangeRole ? "Cancel" : "Close"}
            </Button>

            {canChangeRole && (
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            )}
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
