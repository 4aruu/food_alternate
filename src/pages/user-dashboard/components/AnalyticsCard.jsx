import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const AnalyticsCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon, 
  description,
  trend = [],
  className = "" 
}) => {
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`glass rounded-xl p-6 hover:shadow-glass-lg transition-all duration-300 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Icon name={icon} size={24} className="text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        </div>
        
        {change && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${
            isPositive ? 'bg-success/20 text-success' : isNegative ?'bg-error/20 text-error': 'bg-muted/20 text-muted-foreground'
          }`}>
            <Icon 
              name={isPositive ? "TrendingUp" : isNegative ? "TrendingDown" : "Minus"} 
              size={14} 
            />
            <span className="text-sm font-medium">{change}</span>
          </div>
        )}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      {trend?.length > 0 && (
        <div className="flex items-end space-x-1 h-8">
          {trend?.map((value, index) => (
            <div
              key={index}
              className="bg-accent/30 rounded-sm flex-1 transition-all duration-300 hover:bg-accent/50"
              style={{ height: `${(value / Math.max(...trend)) * 100}%` }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AnalyticsCard;