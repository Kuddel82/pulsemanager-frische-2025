// 🚀 ENTERPRISE FEATURE PANEL
// Zeigt den Status und die Daten der neuen Enterprise APIs an
// Datum: 2025-01-11 - UI für Advanced Features

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Crown, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Activity, 
  BarChart3,
  Coins,
  PieChart,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import ProIntegrationService from '@/services/EnterpriseIntegrationService';

const EnterpriseFeaturePanel = ({ portfolioData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  if (!portfolioData) {
    return null;
  }
  
  const featureSummary = ProIntegrationService.getEnterpriseFeatureSummary(portfolioData);
  const performanceReport = ProIntegrationService.generatePerformanceReport(portfolioData);
  
  const isEnterpriseActive = featureSummary.status === 'enterprise';
  const enhancementCount = featureSummary.features?.length || 0;
  
  return (
    <Card className={`${isEnterpriseActive ? 'border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50' : 'border-gray-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isEnterpriseActive ? 'bg-amber-100' : 'bg-gray-100'}`}>
              <Crown className={`h-5 w-5 ${isEnterpriseActive ? 'text-amber-600' : 'text-gray-500'}`} />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Enterprise Features
                <Badge variant={isEnterpriseActive ? 'default' : 'secondary'} className={isEnterpriseActive ? 'bg-amber-100 text-amber-800' : ''}>
                  {isEnterpriseActive ? 'ACTIVE' : 'STANDARD'}
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-600">{featureSummary.message}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isEnterpriseActive && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {enhancementCount}/5 Features
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Portfolio Value Enhancement */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Portfolio Value</span>
              </div>
              <div className="text-xl font-bold text-blue-900">
                {formatCurrency(performanceReport.totalValue)}
              </div>
              {isEnterpriseActive && performanceReport.enterpriseFeatures?.nativeValue > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  +{formatCurrency(performanceReport.enterpriseFeatures.nativeValue)} native
                </div>
              )}
            </div>
            
            {/* API Coverage */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">API Coverage</span>
              </div>
              <div className="text-xl font-bold text-green-900">
                {isEnterpriseActive ? `${Math.round(featureSummary.coverage || 0)}%` : '60%'}
              </div>
              <div className="text-xs text-green-600 mt-1">
                {isEnterpriseActive ? 'Enterprise APIs' : 'Standard APIs'}
              </div>
            </div>
            
            {/* Data Sources */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Data Quality</span>
              </div>
              <div className="text-xl font-bold text-purple-900">
                {isEnterpriseActive ? 'Premium' : 'Standard'}
              </div>
              <div className="text-xs text-purple-600 mt-1">
                {isEnterpriseActive ? 'Enhanced accuracy' : 'Basic accuracy'}
              </div>
            </div>
            
            {/* Enhanced Features */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Features</span>
              </div>
              <div className="text-xl font-bold text-amber-900">
                {enhancementCount + 3}/8
              </div>
              <div className="text-xs text-amber-600 mt-1">
                {isEnterpriseActive ? 'Enterprise active' : 'Standard features'}
              </div>
            </div>
          </div>
          
          {/* Feature List */}
          {isEnterpriseActive && featureSummary.features?.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-gray-900">Active Enterprise Features</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {featureSummary.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                    <span className="text-lg">{feature.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">{feature.name}</div>
                      <div className="text-xs text-gray-600">{feature.value}</div>
                    </div>
                    <Badge variant="success" className="bg-green-100 text-green-800 text-xs">
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Performance Comparison */}
          {isEnterpriseActive && showDetails && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <PieChart className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-gray-900">Performance Report</h4>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Standard Portfolio:</span>
                    <span className="font-medium ml-2">
                      {formatCurrency(performanceReport.valueComparison?.standardValue || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Enhanced Portfolio:</span>
                    <span className="font-medium ml-2 text-green-600">
                      {formatCurrency(performanceReport.valueComparison?.enterpriseValue || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Native Enhancement:</span>
                    <span className="font-medium ml-2 text-blue-600">
                      +{formatCurrency(performanceReport.valueComparison?.enhancement || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Data Accuracy:</span>
                    <span className="font-medium ml-2 text-purple-600">
                      {performanceReport.valueComparison?.accuracy || 'standard'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2"
            >
              {showDetails ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
            
            {!isEnterpriseActive && (
              <Badge variant="secondary" className="ml-auto">
                <AlertCircle className="h-3 w-3 mr-1" />
                Standard API Mode
              </Badge>
            )}
          </div>
          
          {/* Help Text */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Enterprise Features:</strong> Advanced Moralis APIs providing enhanced transaction analysis,
              native balance tracking, DeFi position monitoring, and improved ROI detection for maximum portfolio accuracy.
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default EnterpriseFeaturePanel; 