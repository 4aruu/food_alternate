import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActions = ({ 
  selectedCount = 0,
  onCompareSelected = () => {},
  onExportResults = () => {},
  onShareResults = () => {},
  onClearSelection = () => {},
  onSaveSearch = () => {},
  isVisible = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      id: 'compare',
      label: `Compare Selected (${selectedCount})`,
      icon: 'GitCompare',
      onClick: onCompareSelected,
      variant: 'default',
      disabled: selectedCount < 2,
      tooltip: selectedCount < 2 ? 'Select at least 2 items to compare' : 'Compare selected alternatives'
    },
    {
      id: 'export',
      label: 'Export Results',
      icon: 'Download',
      onClick: onExportResults,
      variant: 'outline',
      tooltip: 'Download results as PDF or CSV'
    },
    {
      id: 'share',
      label: 'Share Search',
      icon: 'Share2',
      onClick: onShareResults,
      variant: 'outline',
      tooltip: 'Share this search with others'
    },
    {
      id: 'save',
      label: 'Save Search',
      icon: 'Bookmark',
      onClick: onSaveSearch,
      variant: 'outline',
      tooltip: 'Save this search for later'
    },
    {
      id: 'clear',
      label: 'Clear Selection',
      icon: 'X',
      onClick: onClearSelection,
      variant: 'ghost',
      disabled: selectedCount === 0,
      tooltip: 'Clear all selected items'
    }
  ];

  if (!isVisible && selectedCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40"
      >
        <div className="glass rounded-xl border border-glass-border shadow-glass-lg p-4">
          <div className="flex items-center space-x-3">
            {/* Primary Action - Compare */}
            <Button
              variant={actions?.[0]?.disabled ? 'outline' : 'default'}
              onClick={actions?.[0]?.onClick}
              disabled={actions?.[0]?.disabled}
              iconName={actions?.[0]?.icon}
              iconPosition="left"
              size="sm"
              className="relative group"
            >
              {actions?.[0]?.label}
              {actions?.[0]?.disabled && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-background border border-glass-border rounded text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  {actions?.[0]?.tooltip}
                </div>
              )}
            </Button>

            {/* Divider */}
            <div className="w-px h-6 bg-glass-border"></div>

            {/* Secondary Actions */}
            <div className="flex items-center space-x-2">
              {/* Mobile: Show expand button */}
              <div className="sm:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  iconName={isExpanded ? "ChevronUp" : "MoreHorizontal"}
                />
              </div>

              {/* Desktop: Show all actions */}
              <div className="hidden sm:flex items-center space-x-2">
                {actions?.slice(1)?.map((action) => (
                  <Button
                    key={action?.id}
                    variant={action?.variant}
                    onClick={action?.onClick}
                    disabled={action?.disabled}
                    iconName={action?.icon}
                    size="sm"
                    className="relative group"
                  >
                    <span className="sr-only sm:not-sr-only">{action?.label}</span>
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-background border border-glass-border rounded text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      {action?.tooltip}
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Selection Counter */}
            {selectedCount > 0 && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-accent/20 text-accent rounded-lg">
                <Icon name="Check" size={14} />
                <span className="text-sm font-medium">{selectedCount} selected</span>
              </div>
            )}
          </div>

          {/* Mobile Expanded Actions */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="sm:hidden mt-3 pt-3 border-t border-glass-border"
              >
                <div className="grid grid-cols-2 gap-2">
                  {actions?.slice(1)?.map((action) => (
                    <Button
                      key={action?.id}
                      variant={action?.variant}
                      onClick={action?.onClick}
                      disabled={action?.disabled}
                      iconName={action?.icon}
                      iconPosition="left"
                      size="sm"
                      fullWidth
                    >
                      {action?.label}
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickActions;