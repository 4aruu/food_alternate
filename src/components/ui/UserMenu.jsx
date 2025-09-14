import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';
import Image from '../AppImage';

const UserMenu = ({ user = null, onNavigate = () => {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const menuItems = user ? [
    {
      label: 'Dashboard',
      path: '/user-dashboard',
      icon: 'LayoutDashboard',
      description: 'View your nutrition insights'
    },
    {
      label: 'Profile Settings',
      path: '/profile-settings',
      icon: 'Settings',
      description: 'Manage your account'
    },
    {
      label: 'Dietary Preferences',
      path: '/dietary-preferences',
      icon: 'Heart',
      description: 'Update your dietary needs'
    },
    {
      label: 'Saved Alternatives',
      path: '/saved-alternatives',
      icon: 'Bookmark',
      description: 'Your bookmarked foods'
    },
    { type: 'divider' },
    {
      label: 'Help & Support',
      path: '/help',
      icon: 'HelpCircle',
      description: 'Get assistance'
    },
    {
      label: 'Sign Out',
      action: 'logout',
      icon: 'LogOut',
      description: 'Sign out of your account',
      variant: 'destructive'
    }
  ] : [
    {
      label: 'Sign In',
      path: '/sign-in',
      icon: 'LogIn',
      description: 'Access your account'
    },
    {
      label: 'Create Account',
      path: '/user-registration',
      icon: 'UserPlus',
      description: 'Join Smart Alternatives Finder',
      variant: 'accent'
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef?.current && !menuRef?.current?.contains(event?.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event?.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleMenuItemClick = (item) => {
    if (item?.action === 'logout') {
      // Handle logout logic here
      console.log('Logging out...');
    } else if (item?.path) {
      onNavigate(item?.path);
    }
    setIsOpen(false);
  };

  const handleKeyDown = (event, item) => {
    if (event?.key === 'Enter' || event?.key === ' ') {
      event?.preventDefault();
      handleMenuItemClick(item);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User Menu Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 p-2 rounded-xl transition-all duration-200 ${
          isOpen 
            ? 'bg-accent/20 text-accent shadow-neon' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
        aria-label={user ? 'User menu' : 'Sign in menu'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user ? (
          <>
            <div className="relative">
              <Image
                src={user?.avatar || '/assets/images/default-avatar.png'}
                alt={user?.name || 'User avatar'}
                className="w-8 h-8 rounded-full object-cover border-2 border-accent/30"
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background"></div>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-foreground">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Icon name="User" size={16} className="text-primary-foreground" />
            </div>
            <span className="hidden sm:inline text-sm font-medium">Sign In</span>
          </>
        )}
        <Icon 
          name="ChevronDown" 
          size={16} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 glass rounded-xl border border-glass-border shadow-glass-lg z-50 animate-slide-down">
          <div className="p-2">
            {user && (
              <div className="px-3 py-2 border-b border-glass-border mb-2">
                <div className="flex items-center space-x-3">
                  <Image
                    src={user?.avatar || '/assets/images/default-avatar.png'}
                    alt={user?.name || 'User avatar'}
                    className="w-10 h-10 rounded-full object-cover"
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

            {menuItems?.map((item, index) => {
              if (item?.type === 'divider') {
                return (
                  <div key={index} className="my-2 border-t border-glass-border"></div>
                );
              }

              return (
                <button
                  key={index}
                  onClick={() => handleMenuItemClick(item)}
                  onKeyDown={(e) => handleKeyDown(e, item)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 group ${
                    item?.variant === 'destructive' ?'text-error hover:bg-error/10 hover:text-error'
                      : item?.variant === 'accent' ?'text-accent hover:bg-accent/10 hover:text-accent' :'text-foreground hover:bg-muted/50 hover:text-accent'
                  }`}
                  role="menuitem"
                  tabIndex={0}
                >
                  <div className="flex items-center space-x-3">
                    <Icon 
                      name={item?.icon} 
                      size={18} 
                      className={`transition-colors duration-200 ${
                        item?.variant === 'destructive' ?'text-error'
                          : item?.variant === 'accent' ?'text-accent' :'text-muted-foreground group-hover:text-accent'
                      }`}
                    />
                    <div>
                      <p className="font-medium">{item?.label}</p>
                      {item?.description && (
                        <p className="text-xs text-muted-foreground">
                          {item?.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {!user && (
            <div className="border-t border-glass-border p-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  New to Smart Alternatives Finder?
                </p>
                <button
                  onClick={() => handleMenuItemClick({ path: '/user-registration' })}
                  className="text-xs text-accent hover:text-accent/80 font-medium transition-colors duration-200"
                >
                  Create your free account →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserMenu;