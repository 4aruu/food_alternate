import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ActionButtons = ({ 
  foodItem, 
  onSave = () => {}, 
  onShare = () => {}, 
  onAddToComparison = () => {},
  onClose = () => {},
  className = '' 
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaved(!isSaved);
      await onSave(foodItem, !isSaved);
      
      // Show feedback animation
      setTimeout(() => {
        // Animation complete
      }, 300);
    } catch (error) {
      console.error('Error saving item:', error);
      setIsSaved(false);
    }
  };

  const handleShare = async (platform = null) => {
    setIsSharing(true);
    try {
      if (platform) {
        const shareData = {
          title: `${foodItem?.name || 'Food Item'} - Nutrition Analysis`,
          text: `Check out the nutritional analysis for ${foodItem?.name || 'this food item'}! Calories: ${foodItem?.nutrition?.calories || 'N/A'}, Protein: ${foodItem?.nutrition?.protein || 'N/A'}g`,
          url: window.location?.href
        };

        switch (platform) {
          case 'native':
            if (navigator.share) {
              await navigator.share(shareData);
            } else {
              await navigator.clipboard?.writeText(shareData?.url);
              alert('Link copied to clipboard!');
            }
            break;
          case 'twitter':
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData?.text)}&url=${encodeURIComponent(shareData?.url)}`, '_blank');
            break;
          case 'facebook':
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData?.url)}`, '_blank');
            break;
          case 'linkedin':
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData?.url)}`, '_blank');
            break;
          case 'whatsapp':
            window.open(`https://wa.me/?text=${encodeURIComponent(shareData?.text + ' ' + shareData?.url)}`, '_blank');
            break;
          case 'copy':
            await navigator.clipboard?.writeText(shareData?.url);
            alert('Link copied to clipboard!');
            break;
        }
        setShowShareOptions(false);
      } else {
        setShowShareOptions(!showShareOptions);
      }
      
      await onShare(foodItem, platform);
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Unable to share at this time. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const shareOptions = [
    { id: 'native', label: 'Share', icon: 'Share', color: '#06FFA5' },
    { id: 'copy', label: 'Copy Link', icon: 'Copy', color: '#1E40AF' },
    { id: 'twitter', label: 'Twitter', icon: 'Twitter', color: '#1DA1F2' },
    { id: 'facebook', label: 'Facebook', icon: 'Facebook', color: '#1877F2' },
    { id: 'linkedin', label: 'LinkedIn', icon: 'Linkedin', color: '#0A66C2' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle', color: '#25D366' }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Primary Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="default"
          onClick={handleSave}
          iconName={isSaved ? "BookmarkCheck" : "Bookmark"}
          iconPosition="left"
          className={`transition-all duration-300 ${
            isSaved ? 'bg-success/20 text-success border-success/30 hover:bg-success/30' : ''
          }`}
        >
          {isSaved ? 'Saved' : 'Save to Favorites'}
        </Button>

        <div className="relative">
          <Button
            variant="outline"
            onClick={() => handleShare()}
            iconName="Share"
            iconPosition="left"
            loading={isSharing}
            disabled={isSharing}
          >
            Share Analysis
          </Button>

          {/* Share Options Dropdown */}
          {showShareOptions && (
            <div className="absolute top-full left-0 mt-2 w-48 glass rounded-xl border border-glass-border shadow-glass-lg z-50 animate-slide-down">
              <div className="p-2">
                {shareOptions?.map((option) => (
                  <button
                    key={option?.id}
                    onClick={() => handleShare(option?.id)}
                    className="w-full text-left px-3 py-2 rounded-lg transition-all duration-200 hover:bg-muted/50 group"
                    disabled={isSharing}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon 
                        name={option?.icon} 
                        size={18} 
                        className="transition-colors duration-200"
                        style={{ color: option?.color }}
                      />
                      <span className="font-medium text-foreground group-hover:text-accent">
                        {option?.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button
          variant="secondary"
          onClick={() => onAddToComparison(foodItem)}
          iconName="GitCompare"
          iconPosition="left"
        >
          Add to Compare
        </Button>
      </div>
      {/* Secondary Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="ghost"
          onClick={() => window.open(`/food-search-results?q=${encodeURIComponent(foodItem?.name || '')}`, '_blank')}
          iconName="Search"
          iconPosition="left"
          size="sm"
        >
          Find Similar
        </Button>

        <Button
          variant="ghost"
          onClick={() => {
            const nutritionData = {
              name: foodItem?.name || 'Unknown Food',
              nutrition: foodItem?.nutrition || {},
              timestamp: new Date()?.toISOString()
            };
            const dataStr = JSON.stringify(nutritionData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${foodItem?.name || 'nutrition-data'}.json`;
            link?.click();
            URL.revokeObjectURL(url);
          }}
          iconName="Download"
          iconPosition="left"
          size="sm"
        >
          Export Data
        </Button>

        <Button
          variant="ghost"
          onClick={() => window.print()}
          iconName="Printer"
          iconPosition="left"
          size="sm"
        >
          Print Report
        </Button>
      </div>
      {/* Quick Actions */}
      <div className="glass rounded-xl p-4 border border-glass-border">
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
          <Icon name="Zap" size={16} className="text-accent mr-2" />
          Quick Actions
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => window.open('/user-dashboard', '_blank')}
            className="flex flex-col items-center p-3 rounded-lg glass-subtle hover:shadow-neon transition-all duration-200 group"
          >
            <Icon name="LayoutDashboard" size={20} className="text-primary mb-2 group-hover:text-accent transition-colors duration-200" />
            <span className="text-xs font-medium text-foreground group-hover:text-accent transition-colors duration-200">
              Dashboard
            </span>
          </button>

          <button
            onClick={() => window.open('/food-comparison-tool', '_blank')}
            className="flex flex-col items-center p-3 rounded-lg glass-subtle hover:shadow-neon transition-all duration-200 group"
          >
            <Icon name="GitCompare" size={20} className="text-secondary mb-2 group-hover:text-accent transition-colors duration-200" />
            <span className="text-xs font-medium text-foreground group-hover:text-accent transition-colors duration-200">
              Compare
            </span>
          </button>

          <button
            onClick={() => window.open('/landing-page', '_blank')}
            className="flex flex-col items-center p-3 rounded-lg glass-subtle hover:shadow-neon transition-all duration-200 group"
          >
            <Icon name="Search" size={20} className="text-accent mb-2 group-hover:text-accent transition-colors duration-200" />
            <span className="text-xs font-medium text-foreground group-hover:text-accent transition-colors duration-200">
              Discover
            </span>
          </button>

          <button
            onClick={() => window.open('/user-registration', '_blank')}
            className="flex flex-col items-center p-3 rounded-lg glass-subtle hover:shadow-neon transition-all duration-200 group"
          >
            <Icon name="UserPlus" size={20} className="text-warning mb-2 group-hover:text-accent transition-colors duration-200" />
            <span className="text-xs font-medium text-foreground group-hover:text-accent transition-colors duration-200">
              Sign Up
            </span>
          </button>
        </div>
      </div>
      {/* Close Button */}
      <div className="flex justify-center pt-4 border-t border-glass-border">
        <Button
          variant="ghost"
          onClick={onClose}
          iconName="X"
          iconPosition="left"
          size="lg"
          className="text-muted-foreground hover:text-foreground"
        >
          Close Explorer
        </Button>
      </div>
      {/* Feedback Message */}
      {isSaved && (
        <div className="glass rounded-lg p-3 border border-success/30 bg-success/10 animate-slide-down">
          <div className="flex items-center space-x-2">
            <Icon name="CheckCircle" size={16} className="text-success" />
            <span className="text-sm font-medium text-success">
              Added to your favorites! View in your dashboard.
            </span>
          </div>
        </div>
      )}
      {/* Click outside to close share options */}
      {showShareOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowShareOptions(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default ActionButtons;