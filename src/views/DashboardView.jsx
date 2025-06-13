import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PlusCircle, Wallet } from 'lucide-react';

const DashboardView = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex space-x-2">
          <Button variant="outline" className="bg-gray-800 hover:bg-gray-700">
            <Wallet className="w-4 h-4 mr-2" />
            Wallet hinzufügen
          </Button>
          <Button variant="outline" className="bg-gray-800 hover:bg-gray-700">
            <PlusCircle className="w-4 h-4 mr-2" />
            Manueller Eintrag
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Willkommen, {user?.email}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">
              Füge deine Wallets hinzu oder erstelle manuelle Einträge, um dein Portfolio zu verwalten.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardView; 