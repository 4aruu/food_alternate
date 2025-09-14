import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const ComparisonPreview = ({ 
  comparison, 
  onViewFull, 
  onRemove,
  className = "" 
}) => {
  const {
    id,
    foods,
    createdDate,
    winner,
    comparisonType
  } = comparison;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`glass rounded-xl p-4 hover:shadow-glass-lg transition-all duration-300 group ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-medium text-foreground mb-1">
            {comparisonType} Comparison
          </h4>
          <p className="text-sm text-muted-foreground">{createdDate}</p>
        </div>
        
        <button
          onClick={() => onRemove(id)}
          className="w-8 h-8 rounded-lg text-muted-foreground hover:text-error hover:bg-error/10 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
          aria-label="Remove comparison"
        >
          <Icon name="X" size={16} />
        </button>
      </div>
      <div className="flex items-center space-x-4 mb-4">
        {foods?.slice(0, 3)?.map((food, index) => (
          <React.Fragment key={food?.id}>
            <div className="flex flex-col items-center space-y-2">
              <div className="relative">
                <Image
                  src={food?.image}
                  alt={food?.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                {winner === food?.id && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center">
                    <Icon name="Crown" size={12} className="text-success-foreground" />
                  </div>
                )}
              </div>
              <p className="text-xs text-center text-muted-foreground max-w-16 truncate">
                {food?.name}
              </p>
            </div>
            
            {index < Math.min(foods?.length - 1, 2) && (
              <Icon name="ArrowRight" size={16} className="text-muted-foreground" />
            )}
          </React.Fragment>
        ))}
        
        {foods?.length > 3 && (
          <>
            <Icon name="MoreHorizontal" size={16} className="text-muted-foreground" />
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted/30">
              <span className="text-xs font-medium text-muted-foreground">
                +{foods?.length - 3}
              </span>
            </div>
          </>
        )}
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          iconName="Eye"
          iconPosition="left"
          onClick={() => onViewFull(comparison)}
          className="flex-1"
        >
          View Full
        </Button>
        <Button
          variant="secondary"
          size="sm"
          iconName="Copy"
          iconPosition="left"
          onClick={() => {
            // Handle duplicate comparison
            console.log('Duplicating comparison:', id);
          }}
        >
          Duplicate
        </Button>
      </div>
    </motion.div>
  );
};

export default ComparisonPreview;