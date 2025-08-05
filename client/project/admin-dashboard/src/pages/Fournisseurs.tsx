import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Store,
  Edit,
  LocationOn,
  Schedule,
  Business,
  Person,
  Image as ImageIcon,
  Refresh,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { fournisseurService } from '../services/fournisseurService';
import { dataService } from '../services/dataService';
import { Fournisseur, User } from '../types';
import { useAuth } from '../context/AuthContext';
import FournisseurDialog from '../components/Fournisseurs/FournisseurDialog';

export default function Fournisseurs() {
  const { state } = useAuth();
  const [userFournisseur, setUserFournisseur] = useState<Fournisseur | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUserFournisseur();
  }, [state.user?.id]);

  const fetchUserFournisseur = async () => {
    if (!state.user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get all fournisseurs and filter by current user's ID
      const allFournisseurs = await fournisseurService.getFournisseurs();
      const userFournisseurData = allFournisseurs.find(f => f.ownerId === state.user!.id);
      
      setUserFournisseur(userFournisseurData || null);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error('Error fetching user fournisseur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (fournisseurData: Omit<Fournisseur, 'id'>) => {
    if (!state.user?.id) return;

    try {
      setSaveLoading(true);
      setError(null);

      // Ensure the fournisseur is linked to the current user
      const dataToSave = {
        ...fournisseurData,
        ownerId: state.user.id,
      };

      if (userFournisseur) {
        // Update existing fournisseur
        await fournisseurService.updateFournisseur(userFournisseur.id, dataToSave);
        setSuccess('Fournisseur modifié avec succès');
      } else {
        // Create new fournisseur
        await fournisseurService.addFournisseur(dataToSave);
        setSuccess('Fournisseur créé avec succès');
      }

      await fetchUserFournisseur();
      setDialogOpen(false);
    } catch (err) {
      setError('Erreur lors de l\'enregistrement du fournisseur');
      console.error('Error saving fournisseur:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Mon Fournisseur
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérez les informations de votre fournisseur
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={userFournisseur ? <Edit /> : <Add />}
            onClick={() => setDialogOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              },
              borderRadius: 2,
              px: 3,
              py: 1.5,
            }}
          >
            {userFournisseur ? 'Modifier' : 'Créer mon fournisseur'}
          </Button>
        </Box>

        {/* Important Notice */}
        <Alert 
          severity="info" 
          sx={{ mb: 3, borderRadius: 2 }}
          icon={<Warning />}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Information importante
          </Typography>
          <Typography variant="body2">
            Vous devez créer votre fournisseur avant de pouvoir ajouter des catégories ou des produits. 
            Chaque administrateur ne peut gérer qu'un seul fournisseur.
          </Typography>
        </Alert>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={handleCloseAlert} sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={handleCloseAlert} sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      {/* Fournisseur Content */}
      {userFournisseur ? (
        <Grid container spacing={3}>
          {/* Main Fournisseur Card */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <CardContent sx={{ p: 4 }}>
                {/* Header with Image and Basic Info */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 4 }}>
                  <Avatar
                    src={userFournisseur.image}
                    sx={{
                      width: 100,
                      height: 100,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontSize: '2rem',
                    }}
                  >
                    {userFournisseur.image ? <ImageIcon /> : <Store />}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {userFournisseur.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      Matricule fiscal: {userFournisseur.matriculeFiscale}
                    </Typography>
                    <Chip
                      icon={<CheckCircle />}
                      label="Fournisseur actif"
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Details Grid */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
                        <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
                        Adresse
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {userFournisseur.address}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
                        <Schedule sx={{ mr: 1, color: 'primary.main' }} />
                        Heures d'ouverture
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {userFournisseur.openingHours}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
                        <Business sx={{ mr: 1, color: 'primary.main' }} />
                        Matricule fiscal
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {userFournisseur.matriculeFiscale}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
                        <Person sx={{ mr: 1, color: 'primary.main' }} />
                        Propriétaire
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {state.user?.fullName}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Features */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Fonctionnalités
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {userFournisseur.useUserAddress && (
                      <Chip
                        label="Utilise l'adresse utilisateur"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {userFournisseur.openingHours.includes('24') && (
                      <Chip
                        label="Ouvert 24h/24"
                        color="success"
                        variant="outlined"
                      />
                    )}
                    <Chip
                      label={`Créé le ${new Date(userFournisseur.createdAt).toLocaleDateString('fr-FR')}`}
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Side Panel */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Quick Actions */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Actions rapides
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => setDialogOpen(true)}
                      fullWidth
                    >
                      Modifier les informations
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={fetchUserFournisseur}
                      fullWidth
                    >
                      Actualiser
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Informations
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Date de création
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {new Date(userFournisseur.createdAt).toLocaleDateString('fr-FR')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Dernière modification
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {new Date(userFournisseur.updatedAt).toLocaleDateString('fr-FR')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Statut
                      </Typography>
                      <Chip
                        label="Actif"
                        color="success"
                        size="small"
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      ) : (
        // No Fournisseur State
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Store sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Aucun fournisseur créé
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
            Vous devez créer votre fournisseur pour commencer à gérer vos catégories et produits. 
            Chaque administrateur ne peut créer qu'un seul fournisseur.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              },
              px: 4,
              py: 1.5,
            }}
          >
            Créer mon fournisseur
          </Button>
        </Paper>
      )}

      {/* Fournisseur Dialog */}
      <FournisseurDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        fournisseur={userFournisseur}
        loading={saveLoading}
      />
    </Box>
  );
}