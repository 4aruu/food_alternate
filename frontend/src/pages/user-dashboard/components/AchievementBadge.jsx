import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const AchievementBadge = ({ 
  achievement, 
  isUnlocked = false,
  progress = 0,
  className = "" 
}) => {
  const {
    id,
    title,
    description,
    icon,
    category,
    target,
    reward
  } = achievement;

  const progressPercentage = Math.min((progress / target) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative glass rounded-xl p-4 transition-all duration-300 ${
        isUnlocked 
          ? 'hover:shadow-glass-lg border border-accent/30' 
          : 'opacity-75 hover:opacity-90'
      } ${className}`}
    >
      {isUnlocked && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-success flex items-center justify-center">
          <Icon name="Check" size={14} className="text-success-foreground" />
        </div>
      )}
      <div className="flex items-start space-x-3 mb-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isUnlocked 
            ? 'bg-gradient-to-br from-accent to-secondary' :'bg-muted/30'
        }`}>
          <Icon 
            name={icon} 
            size={24} 
            className={isUnlocked ? 'text-accent-foreground' : 'text-muted-foreground'} 
          />
        </div>
        
        <div className="flex-1">
          <h4 className={`font-medium mb-1 ${
            isUnlocked ? 'text-foreground' : 'text-muted-foreground'
          }`}>
            {title}
          </h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {!isUnlocked && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{progress}/{target}</span>
          </div>
          <div className="w-full bg-muted/30 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-to-r from-accent to-secondary h-2 rounded-full"
            />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
          category === 'nutrition' ? 'bg-success/20 text-success' :
          category === 'sustainability' ? 'bg-primary/20 text-primary' :
          category === 'exploration'? 'bg-secondary/20 text-secondary' : 'bg-muted/20 text-muted-foreground'
        }`}>
          {category}
        </span>
        
        {reward && (
          <div className="flex items-center space-x-1 text-xs text-accent">
            <Icon name="Gift" size={12} />
            <span>{reward}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AchievementBadge;