import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Avatar,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Lock,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Cancel,
  Shield,
  Key,
  History,
  Warning,
  Info,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { securityService, ChangePasswordData } from '../services/securityService';

export default function Security() {
  const { state } = useAuth();
  const [formData, setFormData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordStrength = securityService.validatePasswordStrength(formData.newPassword);

  const handleInputChange = (field: keyof ChangePasswordData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError(null);
    setSuccess(false);
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await securityService.changePassword(formData);
      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 1) return 'error';
    if (score <= 2) return 'warning';
    if (score <= 3) return 'info';
    return 'success';
  };

  const getPasswordStrengthLabel = (score: number) => {
    if (score <= 1) return 'Très faible';
    if (score <= 2) return 'Faible';
    if (score <= 3) return 'Moyen';
    if (score <= 4) return 'Fort';
    return 'Très fort';
  };

  const isFormValid = () => {
    return (
      formData.currentPassword &&
      formData.newPassword &&
      formData.confirmPassword &&
      formData.newPassword === formData.confirmPassword &&
      passwordStrength.isValid
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Sécurité
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gérez la sécurité de votre compte et modifiez votre mot de passe
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Security Overview */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 'fit-content' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  <SecurityIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Sécurité du compte
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {state.user?.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {state.user?.email}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Shield color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Compte vérifié"
                    secondary="Votre compte est sécurisé"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Key color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Authentification"
                    secondary="Email et mot de passe"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <History color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Dernière connexion"
                    secondary="Aujourd'hui"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Security Tips */}
          <Card sx={{ mt: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
                <Info sx={{ mr: 1, color: 'info.main' }} />
                Conseils de sécurité
              </Typography>
              
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Utilisez un mot de passe fort"
                    secondary="Au moins 8 caractères avec majuscules, minuscules, chiffres et symboles"
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Changez régulièrement"
                    secondary="Modifiez votre mot de passe tous les 3-6 mois"
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Ne partagez jamais"
                    secondary="Gardez vos identifiants confidentiels"
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Change Password Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                <Lock sx={{ mr: 1, color: 'primary.main' }} />
                Changer le mot de passe
              </Typography>

              {success && (
                <Alert 
                  severity="success" 
                  sx={{ mb: 3, borderRadius: 2 }}
                  icon={<CheckCircle />}
                >
                  Mot de passe modifié avec succès !
                </Alert>
              )}

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 3, borderRadius: 2 }}
                  icon={<Cancel />}
                >
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Current Password */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Mot de passe actuel"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={formData.currentPassword}
                      onChange={handleInputChange('currentPassword')}
                      required
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => togglePasswordVisibility('current')}
                              edge="end"
                            >
                              {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {/* New Password */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nouveau mot de passe"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={handleInputChange('newPassword')}
                      required
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => togglePasswordVisibility('new')}
                              edge="end"
                            >
                              {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    {/* Password Strength Indicator */}
                    {formData.newPassword && (
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ mr: 2 }}>
                            Force du mot de passe:
                          </Typography>
                          <Chip
                            label={getPasswordStrengthLabel(passwordStrength.score)}
                            color={getPasswordStrengthColor(passwordStrength.score) as any}
                            size="small"
                          />
                        </Box>
                        
                        <LinearProgress
                          variant="determinate"
                          value={(passwordStrength.score / 5) * 100}
                          color={getPasswordStrengthColor(passwordStrength.score) as any}
                          sx={{ height: 8, borderRadius: 4, mb: 1 }}
                        />

                        {passwordStrength.feedback.length > 0 && (
                          <Paper sx={{ p: 2, backgroundColor: 'warning.light', mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
                              <Warning sx={{ mr: 1, fontSize: 16 }} />
                              Améliorations suggérées:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {passwordStrength.feedback.map((feedback, index) => (
                                <Chip
                                  key={index}
                                  label={feedback}
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                />
                              ))}
                            </Box>
                          </Paper>
                        )}
                      </Box>
                    )}
                  </Grid>

                  {/* Confirm Password */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Confirmer le nouveau mot de passe"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      required
                      disabled={loading}
                      error={formData.confirmPassword !== '' && formData.newPassword !== formData.confirmPassword}
                      helperText={
                        formData.confirmPassword !== '' && formData.newPassword !== formData.confirmPassword
                          ? 'Les mots de passe ne correspondent pas'
                          : ''
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => togglePasswordVisibility('confirm')}
                              edge="end"
                            >
                              {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={!isFormValid() || loading}
                        sx={{
                          px: 4,
                          py: 1.5,
                          fontWeight: 600,
                          borderRadius: 2,
                        }}
                      >
                        {loading ? 'Modification en cours...' : 'Changer le mot de passe'}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outlined"
                        size="large"
                        disabled={loading}
                        onClick={() => {
                          setFormData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                          });
                          setError(null);
                          setSuccess(false);
                        }}
                        sx={{
                          px: 4,
                          py: 1.5,
                          fontWeight: 600,
                          borderRadius: 2,
                        }}
                      >
                        Annuler
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}