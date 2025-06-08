import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, Calendar, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const { user, signOut, session, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Willkommen zurück, {user?.email}
          </h1>
          <p className="text-gray-600">
            Du bist erfolgreich bei PulseManager angemeldet.
          </p>
        </div>

        {/* User Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* User Info */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Benutzer</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user?.email}</div>
              <p className="text-xs text-muted-foreground">
                ID: {user?.id?.substring(0, 8)}...
              </p>
            </CardContent>
          </Card>

          {/* Registration Date */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registriert</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('de-DE') : 'Unbekannt'}
              </div>
              <p className="text-xs text-muted-foreground">
                Mitglied seit
              </p>
            </CardContent>
          </Card>

          {/* Email Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">E-Mail Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user?.email_confirmed_at ? (
                  <span className="text-green-600">Bestätigt</span>
                ) : (
                  <span className="text-yellow-600">Unbestätigt</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                E-Mail Verifizierung
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Session Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Session Informationen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Session ID</label>
                  <p className="text-sm text-gray-900 font-mono break-all">
                    {session?.access_token?.substring(0, 50)}...
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Gültig bis</label>
                  <p className="text-sm text-gray-900">
                    {session?.expires_at ? 
                      new Date(session.expires_at * 1000).toLocaleString('de-DE') : 
                      'Unbekannt'
                    }
                  </p>
                </div>
              </div>
              
              {/* User Metadata */}
              {user?.user_metadata && Object.keys(user.user_metadata).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Benutzer Metadaten</label>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(user.user_metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end">
          <Button 
            onClick={handleLogout}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 