import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export default function HelpView() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Hilfe & Support</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Hilfe-Seite wird geladen...</p>
        </CardContent>
      </Card>
    </div>
  );
} 