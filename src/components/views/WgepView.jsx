// 🖨️ WGEP VIEW - Einfacher leerer Container
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer } from 'lucide-react';

const WgepView = () => {
  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center mb-6">
          <Printer className="h-8 w-8 mr-3 text-green-400" />
          <div>
            <h1 className="text-3xl font-bold pulse-title">WGEP Token</h1>
            <p className="pulse-text-secondary">Wrapped Green Energy Certificate</p>
          </div>
        </div>

        {/* Empty Content */}
        <Card className="pulse-card">
          <CardHeader>
            <CardTitle className="pulse-text">WGEP Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="pulse-text-secondary">
              Hier wird zukünftig WGEP-Content angezeigt.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default WgepView;
