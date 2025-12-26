'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Bell,
  Palette,
  Monitor,
  Database,
  Globe,
  Shield,
  Lock,
  Mail,
  Save,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/store/useAppStore';
import { UserRole } from '@/types/geophysic';
import AppLayout from '@/components/layout/AppLayout';
import { ChangePasswordModal } from '@/components/modals/ChangePasswordModal';
import { LogoutConfirmModal } from '@/components/modals/LogoutConfirmModal';

// Mock user data
const mockUser = {
  id: '1',
  email: 'admin@geomine.com',
  name: 'Dr. Jean Dupont',
  role: UserRole.ADMIN,
  createdAt: new Date('2024-01-01'),
  lastLogin: new Date(),
};

export default function SettingsPage() {
  const { activeTab, setActiveTab } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  // Profile settings
  const [name, setName] = useState(mockUser.name);
  const [email, setEmail] = useState(mockUser.email);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(false);
  const [inversionNotifications, setInversionNotifications] = useState(true);

  // Display settings
  const [showGridLines, setShowGridLines] = useState(true);
  const [showAxisLabels, setShowAxisLabels] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState('normal');
  const [maxPoints, setMaxPoints] = useState(10000);

  // Data settings
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupInterval, setBackupInterval] = useState('daily');
  const [dataRetention, setDataRetention] = useState('90');

  // System settings
  const [systemLanguage, setSystemLanguage] = useState('fr');
  const [timezone, setTimezone] = useState('Europe/Paris');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [coordinateFormat, setCoordinateFormat] = useState('decimal');

  useEffect(() => {
    if (activeTab !== 'settings') {
      setActiveTab('settings');
    }
  }, [activeTab, setActiveTab]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSavingProfile(false);
  };

  const handleLogout = () => {
    setLogoutOpen(true);
  };

  const confirmLogout = async () => {
    const { signOut } = await import('next-auth/react');
    await signOut({ callbackUrl: '/auth/signin' });
  };

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrateur';
      case UserRole.PROJECT_MANAGER:
        return 'Chef de projet';
      case UserRole.GEOPHYSICIST:
        return 'Géophysicien';
      case UserRole.VIEWER:
        return 'Lecteur';
      default:
        return role;
    }
  };

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-red-500/15 text-red-500 border-red-500/30';
      case UserRole.PROJECT_MANAGER:
        return 'bg-purple-500/15 text-purple-500 border-purple-500/30';
      case UserRole.GEOPHYSICIST:
        return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
      case UserRole.VIEWER:
        return 'bg-gray-500/15 text-gray-500 border-gray-500/30';
      default:
        return 'bg-gray-500/15 text-gray-500 border-gray-500/30';
    }
  };

  return (
    <AppLayout headerTitle="Paramètres">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Paramètres
          </h1>
          <p className="text-muted-foreground mt-1">
            Configurez vos préférences utilisateur et paramètres système
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="display">Affichage</TabsTrigger>
            <TabsTrigger value="system">Système</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations du Profil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">JD</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{mockUser.name}</h3>
                    <p className="text-sm text-muted-foreground">{mockUser.email}</p>
                    <Badge variant="outline" className={getRoleColor(mockUser.role)}>
                      {getRoleLabel(mockUser.role)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Nom complet</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Votre nom complet"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                      />
                      <Button variant="outline">Changer</Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="flex-1 gap-2"
                    >
                      {isSavingProfile ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Sauvegarder
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setChangePasswordOpen(true)}
                    >
                      <Lock className="w-4 h-4" />
                      Changer mot de passe
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Dernière connexion</h4>
                  <p className="text-sm text-muted-foreground">
                    {mockUser.lastLogin?.toLocaleString('fr-FR', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-medium">Authentification à deux facteurs</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Activer 2FA</span>
                    <Switch checked={false} />
                  </div>
                </div>

                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Notifications par email</h4>
                    <p className="text-sm text-muted-foreground">
                      Recevoir les alertes et rapports par email
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Notifications navigateur</h4>
                    <p className="text-sm text-muted-foreground">
                      Afficher les notifications dans le navigateur
                    </p>
                  </div>
                  <Switch
                    checked={browserNotifications}
                    onCheckedChange={setBrowserNotifications}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Notifications d'inversion</h4>
                    <p className="text-sm text-muted-foreground">
                      Alerte quand une inversion est terminée
                    </p>
                  </div>
                  <Switch
                    checked={inversionNotifications}
                    onCheckedChange={setInversionNotifications}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Display Tab */}
          <TabsContent value="display" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Préférences d'affichage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Thème</h4>
                    <p className="text-sm text-muted-foreground">
                      {theme === 'dark' ? 'Thème sombre' : 'Thème clair'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  >
                    <Palette className="w-4 h-4 mr-2" />
                    Changer
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Lignes de grille</h4>
                    <p className="text-sm text-muted-foreground">
                      Afficher les lignes de grille par défaut
                    </p>
                  </div>
                  <Switch
                    checked={showGridLines}
                    onCheckedChange={setShowGridLines}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Étiquettes des axes</h4>
                    <p className="text-sm text-muted-foreground">
                      Afficher les étiquettes des axes par défaut
                    </p>
                  </div>
                  <Switch
                    checked={showAxisLabels}
                    onCheckedChange={setShowAxisLabels}
                  />
                </div>

                <div className="space-y-2 p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Performance</h4>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Vitesse d'animation</span>
                      <Select value={animationSpeed} onValueChange={(v: any) => setAnimationSpeed(v)}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slow">Lente</SelectItem>
                          <SelectItem value="normal">Normale</SelectItem>
                          <SelectItem value="fast">Rapide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Max points par graphe</span>
                      <Input
                        type="number"
                        value={maxPoints}
                        onChange={(e) => setMaxPoints(parseInt(e.target.value))}
                        className="w-[150px]"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Paramètres régionaux et langue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Langue du système</Label>
                    <Select value={systemLanguage} onValueChange={(v: any) => setSystemLanguage(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fuseau horaire</Label>
                    <Select value={timezone} onValueChange={(v: any) => setTimezone(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                        <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Format de date</Label>
                  <Select value={dateFormat} onValueChange={(v: any) => setDateFormat(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Format de coordonnées</Label>
                  <Select value={coordinateFormat} onValueChange={(v: any) => setCoordinateFormat(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="decimal">Décimal (45.234, 2.567)</SelectItem>
                      <SelectItem value="dms">DMS (45° 14' 2" N, 2° 34' 0" E)</SelectItem>
                    <SelectItem value="utm">UTM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Données et sauvegarde
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Sauvegarde automatique</h4>
                    <p className="text-sm text-muted-foreground">
                      Sauvegarder automatiquement les données
                    </p>
                  </div>
                  <Switch
                    checked={autoBackup}
                    onCheckedChange={setAutoBackup}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Intervalle de sauvegarde</Label>
                  <Select value={backupInterval} onValueChange={(v: any) => setBackupInterval(v)} disabled={!autoBackup}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Toutes les heures</SelectItem>
                      <SelectItem value="daily">Tous les jours</SelectItem>
                      <SelectItem value="weekly">Toutes les semaines</SelectItem>
                      <SelectItem value="monthly">Tous les mois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Rétention des données (jours)</Label>
                  <Input
                    type="number"
                    value={dataRetention}
                    onChange={(e) => setDataRetention(parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

        {/* Modals */}
        <ChangePasswordModal
          open={changePasswordOpen}
          onOpenChange={setChangePasswordOpen}
        />
        <LogoutConfirmModal
          open={logoutOpen}
          onOpenChange={setLogoutOpen}
          onConfirm={confirmLogout}
        />
      </div>
    </AppLayout>
  );
}
