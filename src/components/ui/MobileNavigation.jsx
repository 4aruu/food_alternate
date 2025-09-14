import React, { useEffect } from 'react';
import Icon from '../AppIcon';
import Image from '../AppImage';
import SearchBar from './SearchBar';

const MobileNavigation = ({ 
  isOpen = false, 
  onClose = () => {}, 
  navigationItems = [], 
  currentPath = '', 
  onNavigate = () => {},
  user = null,
  searchProps = {}
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleNavigation = (path) => {
    onNavigate(path);
    onClose();
  };

  const handleKeyDown = (event, action) => {
    if (event?.key === 'Enter' || event?.key === ' ') {
      event?.preventDefault();
      action();
    }
  };

  const isActivePath = (path) => {
    if (path === '/landing-page') {
      return currentPath === '/' || currentPath === '/landing-page';
    }
    return currentPath === path;
  };

  const userMenuItems = user ? [
    {
      label: 'Profile Settings',
      path: '/profile-settings',
      icon: 'Settings'
    },
    {
      label: 'Dietary Preferences',
      path: '/dietary-preferences',
      icon: 'Heart'
    },
    {
      label: 'Saved Alternatives',
      path: '/saved-alternatives',
      icon: 'Bookmark'
    },
    {
      label: 'Help & Support',
      path: '/help',
      icon: 'HelpCircle'
    }
  ] : [
    {
      label: 'Sign In',
      path: '/sign-in',
      icon: 'LogIn'
    },
    {
      label: 'Create Account',
      path: '/user-registration',
      icon: 'UserPlus'
    }
  ];

  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] glass border-l border-glass-border transform transition-transform duration-300 ease-in-out lg:hidden ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation menu"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-glass-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Icon name="Zap" size={18} className="text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Smart Alternatives</h2>
              <p className="text-xs text-muted-foreground">Finder</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
            aria-label="Close menu"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-glass-border">
          <SearchBar {...searchProps} className="w-full" />
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto">
          {/* User Section */}
          {user && (
            <div className="p-6 border-b border-glass-border">
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src={user?.avatar || '/assets/images/default-avatar.png'}
                  alt={user?.name || 'User avatar'}
                  className="w-12 h-12 rounded-full object-cover border-2 border-accent/30"
                />
                <div>
                  <p className="font-medium text-foreground">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Navigation */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Navigation
            </h3>
            <nav className="space-y-2" role="navigation">
              {navigationItems?.map((item) => (
                <button
                  key={item?.path}
                  onClick={() => handleNavigation(item?.path)}
                  onKeyDown={(e) => handleKeyDown(e, () => handleNavigation(item?.path))}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
                    isActivePath(item?.path)
                      ? 'bg-accent/20 text-accent border border-accent/30 shadow-neon'
                      : 'text-foreground hover:bg-muted/50 hover:text-accent'
                  }`}
                  role="menuitem"
                  tabIndex={0}
                >
                  <div className="flex items-center space-x-3">
                    <Icon 
                      name={item?.icon} 
                      size={20} 
                      className={`transition-colors duration-200 ${
                        isActivePath(item?.path) ? 'text-accent' : 'text-muted-foreground group-hover:text-accent'
                      }`}
                    />
                    <div>
                      <p className="font-medium">{item?.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {item?.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* User Menu Items */}
          <div className="p-6 border-t border-glass-border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              {user ? 'Account' : 'Get Started'}
            </h3>
            <nav className="space-y-2" role="navigation">
              {userMenuItems?.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigation(item?.path)}
                  onKeyDown={(e) => handleKeyDown(e, () => handleNavigation(item?.path))}
                  className="w-full text-left p-3 rounded-xl text-foreground hover:bg-muted/50 hover:text-accent transition-all duration-200 group"
                  role="menuitem"
                  tabIndex={0}
                >
                  <div className="flex items-center space-x-3">
                    <Icon 
                      name={item?.icon} 
                      size={18} 
                      className="text-muted-foreground group-hover:text-accent transition-colors duration-200"
                    />
                    <span className="font-medium">{item?.label}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Sign Out Button for authenticated users */}
          {user && (
            <div className="p-6 border-t border-glass-border">
              <button
                onClick={() => {
                  console.log('Logging out...');
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl text-error hover:bg-error/10 transition-all duration-200 group"
                role="menuitem"
                tabIndex={0}
              >
                <div className="flex items-center space-x-3">
                  <Icon 
                    name="LogOut" 
                    size={18} 
                    className="text-error"
                  />
                  <span className="font-medium">Sign Out</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-glass-border">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Smart Alternatives Finder
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Discover healthier food choices
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNavigation;