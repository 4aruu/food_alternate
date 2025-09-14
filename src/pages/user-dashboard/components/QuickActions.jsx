import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActions = ({ 
  onNavigate,
  className = "" 
}) => {
  const quickActions = [
    {
      id: 'new-search',
      title: 'New Search',
      description: 'Find food alternatives',
      icon: 'Search',
      path: '/landing-page',
      variant: 'default',
      color: 'from-primary to-secondary'
    },
    {
      id: 'compare-foods',
      title: 'Compare Foods',
      description: 'Side-by-side analysis',
      icon: 'GitCompare',
      path: '/food-comparison-tool',
      variant: 'outline',
      color: 'from-accent to-primary'
    },
    {
      id: 'nutrition-explorer',
      title: 'Nutrition Explorer',
      description: 'Detailed nutrition data',
      icon: 'BarChart3',
      path: '/nutrition-explorer-modal',
      variant: 'secondary',
      color: 'from-secondary to-accent'
    },
    {
      id: 'account-settings',
      title: 'Account Settings',
      description: 'Manage your profile',
      icon: 'Settings',
      path: '/profile-settings',
      variant: 'ghost',
      color: 'from-muted to-muted-foreground'
    }
  ];

  const exportOptions = [
    {
      id: 'export-nutrition',
      title: 'Export Nutrition Data',
      icon: 'Download',
      format: 'CSV'
    },
    {
      id: 'export-favorites',
      title: 'Export Favorites',
      icon: 'Heart',
      format: 'JSON'
    },
    {
      id: 'export-history',
      title: 'Export Search History',
      icon: 'History',
      format: 'PDF'
    }
  ];

  const handleExport = (exportType) => {
    console.log(`Exporting ${exportType?.id}...`);
    // Mock export functionality
    const mockData = {
      timestamp: new Date()?.toISOString(),
      type: exportType?.id,
      format: exportType?.format
    };
    
    // Simulate download
    const blob = new Blob([JSON.stringify(mockData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportType?.id}-${Date.now()}.${exportType?.format?.toLowerCase()}`;
    document.body?.appendChild(a);
    a?.click();
    document.body?.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Primary Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
            <Icon name="Zap" size={20} className="text-accent-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Quick Actions</h3>
            <p className="text-sm text-muted-foreground">Jump to key features</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions?.map((action, index) => (
            <motion.div
              key={action?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Button
                variant={action?.variant}
                onClick={() => onNavigate(action?.path)}
                className="w-full h-auto p-4 justify-start"
              >
                <div className="flex items-center space-x-4 w-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action?.color} flex items-center justify-center`}>
                    <Icon name={action?.icon} size={20} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{action?.title}</p>
                    <p className="text-sm opacity-80">{action?.description}</p>
                  </div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>
      {/* Export Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
            <Icon name="Download" size={20} className="text-secondary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Data Export</h3>
            <p className="text-sm text-muted-foreground">Download your data for external use</p>
          </div>
        </div>

        <div className="space-y-3">
          {exportOptions?.map((option, index) => (
            <motion.div
              key={option?.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <Icon name={option?.icon} size={18} className="text-accent" />
                <span className="font-medium text-foreground">{option?.title}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 rounded-md bg-muted/30 text-muted-foreground text-xs font-medium">
                  {option?.format}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Download"
                  onClick={() => handleExport(option)}
                >
                  Export
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/20 border border-muted/30">
          <div className="flex items-start space-x-3">
            <Icon name="Info" size={16} className="text-accent mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Export Information</p>
              <p className="text-xs text-muted-foreground">
                Exported data includes your personal nutrition tracking information and can be used with external fitness and health applications. All exports are generated in real-time and include the latest data.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default QuickActions;