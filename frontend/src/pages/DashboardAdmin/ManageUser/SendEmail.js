import React, { useState, useCallback } from 'react';
import {
  Box, Button, Card, CardContent, Chip, CircularProgress,
  Divider, FormControlLabel, Grid, IconButton, InputAdornment,
  MenuItem, Paper, Radio, RadioGroup, Snackbar, Alert,
  TextField, Tooltip, Typography, Avatar, List, ListItem,
  ListItemAvatar, ListItemText, ListItemSecondaryAction,
  FormLabel, FormControl,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Title from '../Title';

// Icons
import SendIcon from '@mui/icons-material/Send';
import ScheduleSendIcon from '@mui/icons-material/ScheduleSend';
import GroupIcon from '@mui/icons-material/Group';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import EmailIcon from '@mui/icons-material/Email';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const RECIPIENT_OPTIONS = [
  {
    value: 'all',
    label: 'All Users',
    description: 'Send to every registered user in the system',
    icon: <PeopleAltIcon />,
    color: '#3b82f6',
  },
  {
    value: 'admins',
    label: 'All Admins',
    description: 'Send to all users with admin role',
    icon: <AdminPanelSettingsIcon />,
    color: '#8b5cf6',
  },
  {
    value: 'specific',
    label: 'Specific Users',
    description: 'Search and select individual recipients',
    icon: <PersonSearchIcon />,
    color: '#f59e0b',
  },
];

export default function SendEmail() {
  const navigate = useNavigate();

  // Form state
  const [recipientType, setRecipientType] = useState('all');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendMode, setSendMode] = useState('immediate');

  // Scheduled time fields
  const [schedYear, setSchedYear] = useState(new Date().getFullYear());
  const [schedMonth, setSchedMonth] = useState(new Date().getMonth() + 1);
  const [schedDay, setSchedDay] = useState(new Date().getDate());
  const [schedHour, setSchedHour] = useState(new Date().getHours());
  const [schedMinute, setSchedMinute] = useState(new Date().getMinutes() + 1);
  const [schedSecond, setSchedSecond] = useState(0);

  // Specific user search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searching, setSearching] = useState(false);

  // UI state
  const [sending, setSending] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'success' });
  const [successInfo, setSuccessInfo] = useState(null);

  const getToken = () => localStorage.getItem('accessToken') || '';

  // ── User search ──────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await axios.get(
        `http://localhost:9999/api/users/search?q=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      // API returns array of users
      const data = Array.isArray(res.data) ? res.data : res.data.users || [];
      setSearchResults(data);
    } catch {
      // Fallback: search from admin users list
      try {
        const res = await axios.get(
          `http://localhost:9999/api/admin/users?search=${encodeURIComponent(searchQuery)}&limit=20`,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        setSearchResults(res.data.data || []);
      } catch (err) {
        setSnackbar({ open: true, msg: 'Search failed. Please try again.', severity: 'error' });
      }
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleAddUser = (user) => {
    if (!selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u._id !== userId));
  };

  // ── Build scheduled date ─────────────────────────────────────────
  const buildScheduledAt = () => {
    const d = new Date(schedYear, schedMonth - 1, schedDay, schedHour, schedMinute, schedSecond);
    return d.toISOString();
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!subject.trim()) {
      setSnackbar({ open: true, msg: 'Please enter an email subject.', severity: 'warning' });
      return;
    }
    if (!body.trim()) {
      setSnackbar({ open: true, msg: 'Please enter email body content.', severity: 'warning' });
      return;
    }
    if (recipientType === 'specific' && selectedUsers.length === 0) {
      setSnackbar({ open: true, msg: 'Please select at least one recipient.', severity: 'warning' });
      return;
    }
    if (sendMode === 'scheduled') {
      const scheduled = new Date(buildScheduledAt());
      if (isNaN(scheduled.getTime()) || scheduled <= new Date()) {
        setSnackbar({ open: true, msg: 'Scheduled time must be in the future.', severity: 'warning' });
        return;
      }
    }

    setSending(true);
    try {
      const payload = {
        recipients: {
          type: recipientType,
          emails: recipientType === 'specific' ? selectedUsers.map(u => u.email) : [],
        },
        subject,
        body,
        sendMode,
        scheduledAt: sendMode === 'scheduled' ? buildScheduledAt() : undefined,
      };

      const res = await axios.post(
        'http://localhost:9999/api/admin/send-email',
        payload,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      setSuccessInfo(res.data.message);
      setSnackbar({ open: true, msg: res.data.message, severity: 'success' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send email.';
      setSnackbar({ open: true, msg, severity: 'error' });
    } finally {
      setSending(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────
  if (successInfo) {
    return (
      <Box sx={{ maxWidth: 520, mx: 'auto', mt: 8, textAlign: 'center' }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" fontWeight="bold" gutterBottom>Done!</Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>{successInfo}</Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/manage-users')}>
            Back to Users
          </Button>
          <Button variant="contained" startIcon={<EmailIcon />} onClick={() => { setSuccessInfo(null); setSubject(''); setBody(''); }}>
            Send Another
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Tooltip title="Back to Manage Users">
          <IconButton onClick={() => navigate('/admin/manage-users')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Title highlight>Send Email</Title>
      </Box>

      <Grid container spacing={3}>
        {/* LEFT — Recipient & Schedule */}
        <Grid item xs={12} md={4}>
          {/* Recipient Type */}
          <Card elevation={0} sx={{ borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon fontSize="small" /> Recipients
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={recipientType}
                  onChange={e => { setRecipientType(e.target.value); setSelectedUsers([]); setSearchResults([]); }}
                >
                  {RECIPIENT_OPTIONS.map(opt => (
                    <Paper
                      key={opt.value}
                      variant="outlined"
                      sx={{
                        mb: 1.5, p: 1.5, borderRadius: 2, cursor: 'pointer',
                        borderColor: recipientType === opt.value ? opt.color : 'divider',
                        bgcolor: recipientType === opt.value ? `${opt.color}11` : 'transparent',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => { setRecipientType(opt.value); setSelectedUsers([]); setSearchResults([]); }}
                    >
                      <FormControlLabel
                        value={opt.value}
                        control={<Radio size="small" sx={{ color: opt.color, '&.Mui-checked': { color: opt.color } }} />}
                        label={
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ color: opt.color, display: 'flex' }}>{opt.icon}</Box>
                              <Typography variant="body2" fontWeight="bold">{opt.label}</Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">{opt.description}</Typography>
                          </Box>
                        }
                        sx={{ m: 0 }}
                      />
                    </Paper>
                  ))}
                </RadioGroup>
              </FormControl>

              {/* Specific user search */}
              {recipientType === 'specific' && (
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ mb: 1, display: 'block' }}>
                    Search by name or email
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Type to search..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                      }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleSearch}
                      disabled={searching}
                      sx={{ minWidth: 48, px: 1 }}
                    >
                      {searching ? <CircularProgress size={16} color="inherit" /> : <SearchIcon fontSize="small" />}
                    </Button>
                  </Box>

                  {/* Search results */}
                  {searchResults.length > 0 && (
                    <Paper variant="outlined" sx={{ borderRadius: 2, maxHeight: 220, overflow: 'auto', mb: 2 }}>
                      <List dense>
                        {searchResults.map(user => (
                          <ListItem
                            key={user._id}
                            button
                            onClick={() => handleAddUser(user)}
                            sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                          >
                            <ListItemAvatar>
                              <Avatar src={user.avatarURL} sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                                {(user.username || user.email || '?')[0].toUpperCase()}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={<Typography variant="body2">{user.username || 'N/A'}</Typography>}
                              secondary={<Typography variant="caption" color="text.secondary">{user.email}</Typography>}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}

                  {/* Selected users */}
                  {selectedUsers.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ mb: 1, display: 'block' }}>
                        Selected ({selectedUsers.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selectedUsers.map(u => (
                          <Chip
                            key={u._id}
                            label={u.username || u.email}
                            size="small"
                            avatar={<Avatar src={u.avatarURL}>{(u.username || u.email || '?')[0].toUpperCase()}</Avatar>}
                            onDelete={() => handleRemoveUser(u._id)}
                            sx={{ maxWidth: 160 }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Send Mode */}
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon fontSize="small" /> Delivery
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControl component="fieldset" fullWidth>
                <RadioGroup value={sendMode} onChange={e => setSendMode(e.target.value)}>
                  <Paper
                    variant="outlined"
                    sx={{
                      mb: 1.5, p: 1.5, borderRadius: 2, cursor: 'pointer',
                      borderColor: sendMode === 'immediate' ? '#10b981' : 'divider',
                      bgcolor: sendMode === 'immediate' ? '#10b98111' : 'transparent',
                    }}
                    onClick={() => setSendMode('immediate')}
                  >
                    <FormControlLabel
                      value="immediate"
                      control={<Radio size="small" sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' } }} />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight="bold">Send Immediately</Typography>
                          <Typography variant="caption" color="text.secondary">Email is sent right now</Typography>
                        </Box>
                      }
                      sx={{ m: 0 }}
                    />
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5, borderRadius: 2, cursor: 'pointer',
                      borderColor: sendMode === 'scheduled' ? '#f59e0b' : 'divider',
                      bgcolor: sendMode === 'scheduled' ? '#f59e0b11' : 'transparent',
                    }}
                    onClick={() => setSendMode('scheduled')}
                  >
                    <FormControlLabel
                      value="scheduled"
                      control={<Radio size="small" sx={{ color: '#f59e0b', '&.Mui-checked': { color: '#f59e0b' } }} />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight="bold">Schedule for Later</Typography>
                          <Typography variant="caption" color="text.secondary">Pick a specific date & time</Typography>
                        </Box>
                      }
                      sx={{ m: 0 }}
                    />
                  </Paper>
                </RadioGroup>
              </FormControl>

              {/* Date/Time picker */}
              {sendMode === 'scheduled' && (
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Schedule Date &amp; Time
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField label="Year" size="small" type="number" fullWidth
                        value={schedYear} onChange={e => setSchedYear(Number(e.target.value))}
                        inputProps={{ min: new Date().getFullYear() }} />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField label="Month" size="small" type="number" fullWidth
                        value={schedMonth} onChange={e => setSchedMonth(Number(e.target.value))}
                        inputProps={{ min: 1, max: 12 }} />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField label="Day" size="small" type="number" fullWidth
                        value={schedDay} onChange={e => setSchedDay(Number(e.target.value))}
                        inputProps={{ min: 1, max: 31 }} />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField label="Hour" size="small" type="number" fullWidth
                        value={schedHour} onChange={e => setSchedHour(Number(e.target.value))}
                        inputProps={{ min: 0, max: 23 }} />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField label="Min" size="small" type="number" fullWidth
                        value={schedMinute} onChange={e => setSchedMinute(Number(e.target.value))}
                        inputProps={{ min: 0, max: 59 }} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Second" size="small" type="number" fullWidth
                        value={schedSecond} onChange={e => setSchedSecond(Number(e.target.value))}
                        inputProps={{ min: 0, max: 59 }} />
                    </Grid>
                  </Grid>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Scheduled: {new Date(schedYear, schedMonth - 1, schedDay, schedHour, schedMinute, schedSecond).toLocaleString('vi-VN')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT — Compose */}
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon fontSize="small" /> Compose Email
              </Typography>
              <Divider />

              {/* Recipient summary badge */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">To:</Typography>
                {recipientType === 'all' && <Chip size="small" icon={<PeopleAltIcon />} label="All Users" color="primary" variant="outlined" />}
                {recipientType === 'admins' && <Chip size="small" icon={<AdminPanelSettingsIcon />} label="All Admins" color="secondary" variant="outlined" />}
                {recipientType === 'specific' && (
                  selectedUsers.length === 0
                    ? <Chip size="small" icon={<PersonSearchIcon />} label="No recipients selected" color="warning" variant="outlined" />
                    : <Chip size="small" icon={<PersonSearchIcon />} label={`${selectedUsers.length} user(s)`} color="warning" variant="outlined" />
                )}
              </Box>

              <TextField
                label="Subject"
                fullWidth
                variant="outlined"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Enter email subject..."
                InputProps={{
                  startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" color="action" /></InputAdornment>
                }}
              />

              <TextField
                label="Email Body"
                fullWidth
                multiline
                rows={14}
                variant="outlined"
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your email content here..."
                sx={{ flexGrow: 1 }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/admin/manage-users')}
                  disabled={sending}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color={sendMode === 'scheduled' ? 'warning' : 'primary'}
                  size="large"
                  startIcon={sending
                    ? <CircularProgress size={18} color="inherit" />
                    : sendMode === 'scheduled' ? <ScheduleSendIcon /> : <SendIcon />}
                  onClick={handleSend}
                  disabled={sending}
                  sx={{ minWidth: 180, fontWeight: 'bold' }}
                >
                  {sending
                    ? 'Sending...'
                    : sendMode === 'scheduled' ? 'Schedule Email' : 'Send Now'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
