import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">PulseManager</h3>
            <p className="text-muted-foreground">
              Ihr vertrauenswürdiger Partner für die Verwaltung und Analyse von PulseChain-Assets.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/wallet" className="text-muted-foreground hover:text-foreground">
                  Wallet
                </Link>
              </li>
              <li>
                <Link to="/roi" className="text-muted-foreground hover:text-foreground">
                  ROI Tracker
                </Link>
              </li>
              <li>
                <Link to="/tax" className="text-muted-foreground hover:text-foreground">
                  Steuerbericht
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Rechtliches</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground">
                  AGB
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
                  Datenschutz
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PulseManager. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
}