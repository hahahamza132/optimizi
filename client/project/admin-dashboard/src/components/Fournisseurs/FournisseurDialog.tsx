import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Box,
  Avatar,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Close,
  Store,
  Image as ImageIcon,
  Save,
  Cancel,
} from '@mui/icons-material';
import { Fournisseur } from '../../types';

interface FournisseurDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (fournisseur: Omit<Fournisseur, 'id'>) => Promise<void>;
  fournisseur?: Fournisseur | null;
  loading?: boolean;
}

export default function FournisseurDialog({
  open,
  onClose,
  onSave,
  fournisseur,
  loading = false,
}: FournisseurDialogProps) {
  const [formData, setFormData] = useState<Omit<Fournisseur, 'id'>>({
    name: '',
    address: '',
    ownerId: '',
    image: '',
    matriculeFiscale: '',
    openingHours: '',
    useUserAddress: false,
    createdAt: '',
    updatedAt: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (fournisseur) {
      setFormData({
        name: fournisseur.name,
        address: fournisseur.address,
        ownerId: fournisseur.ownerId,
        image: fournisseur.image,
        matriculeFiscale: fournisseur.matriculeFiscale,
        openingHours: fournisseur.openingHours,
        useUserAddress: fournisseur.useUserAddress,
        createdAt: fournisseur.createdAt,
        updatedAt: fournisseur.updatedAt,
      });
    } else {
      setFormData({
        name: '',
        address: '',
        ownerId: '',
        image: '',
        matriculeFiscale: '',
        openingHours: '',
        useUserAddress: false,
        createdAt: '',
        updatedAt: '',
      });
    }
    setErrors({});
  }, [fournisseur, open]);

  const handleInputChange = (field: keyof Omit<Fournisseur, 'id'>) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'L\'adresse est requise';
    }

    if (!formData.ownerId.trim()) {
      newErrors.ownerId = 'L\'ID du propriétaire est requis';
    }

    if (!formData.matriculeFiscale.trim()) {
      newErrors.matriculeFiscale = 'Le matricule fiscal est requis';
    }

    if (!formData.openingHours.trim()) {
      newErrors.openingHours = 'Les heures d\'ouverture sont requises';
    }

    if (formData.image && !isValidUrl(formData.image)) {
      newErrors.image = 'L\'URL de l\'image n\'est pas valide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Ensure the current timestamp is set for new fournisseurs
      const dataToSave = {
        ...formData,
        createdAt: fournisseur?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Error saving fournisseur:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      address: '',
      ownerId: '',
      image: '',
      matriculeFiscale: '',
      openingHours: '',
      useUserAddress: false,
      createdAt: '',
      updatedAt: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Store sx={{ mr: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {fournisseur ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            sx={{ 
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3} sx={{ mt: 0 }}>
          {/* Image Preview */}
          {formData.image && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  src={formData.image}
                  sx={{ 
                    width: 80, 
                    height: 80,
                    border: '3px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  <ImageIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Aperçu de l'image
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Image du fournisseur
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nom du fournisseur"
              value={formData.name}
              onChange={handleInputChange('name')}
              error={!!errors.name}
              helperText={errors.name}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Matricule fiscal"
              value={formData.matriculeFiscale}
              onChange={handleInputChange('matriculeFiscale')}
              error={!!errors.matriculeFiscale}
              helperText={errors.matriculeFiscale}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Adresse complète"
              value={formData.address}
              onChange={handleInputChange('address')}
              error={!!errors.address}
              helperText={errors.address}
              required
              disabled={loading}
              multiline
              rows={2}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="ID du propriétaire"
              value={formData.ownerId}
              onChange={handleInputChange('ownerId')}
              error={!!errors.ownerId}
              helperText={errors.ownerId || 'Identifiant unique du propriétaire du fournisseur'}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Heures d'ouverture"
              value={formData.openingHours}
              onChange={handleInputChange('openingHours')}
              error={!!errors.openingHours}
              helperText={errors.openingHours || 'Ex: 8h-20h, 24/24, Lun-Ven 9h-18h'}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="URL de l'image"
              value={formData.image}
              onChange={handleInputChange('image')}
              error={!!errors.image}
              helperText={errors.image || 'URL de l\'image du fournisseur (optionnel)'}
              disabled={loading}
              placeholder="https://example.com/image.jpg"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.useUserAddress}
                  onChange={handleInputChange('useUserAddress')}
                  disabled={loading}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Utiliser l'adresse utilisateur
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Permet au fournisseur d'utiliser l'adresse de l'utilisateur pour la livraison
                  </Typography>
                </Box>
              }
            />
          </Grid>

          {Object.keys(errors).length > 0 && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                Veuillez corriger les erreurs ci-dessus avant de continuer.
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          startIcon={<Cancel />}
          sx={{ mr: 1 }}
        >
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Save />}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
            }
          }}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}