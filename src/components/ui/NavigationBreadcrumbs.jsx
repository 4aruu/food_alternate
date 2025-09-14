import React from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const NavigationBreadcrumbs = ({ 
  customBreadcrumbs = null, 
  onNavigate = () => {},
  showHome = true 
}) => {
  const location = useLocation();

  const routeMap = {
    '/': { label: 'Home', icon: 'Home' },
    '/landing-page': { label: 'Discover', icon: 'Search' },
    '/food-search-results': { label: 'Search Results', icon: 'List' },
    '/nutrition-explorer-modal': { label: 'Nutrition Explorer', icon: 'BarChart3' },
    '/user-dashboard': { label: 'Dashboard', icon: 'LayoutDashboard' },
    '/food-comparison-tool': { label: 'Compare Foods', icon: 'GitCompare' },
    '/user-registration': { label: 'Sign Up', icon: 'UserPlus' },
    '/profile-settings': { label: 'Profile Settings', icon: 'Settings' },
    '/dietary-preferences': { label: 'Dietary Preferences', icon: 'Heart' },
    '/saved-alternatives': { label: 'Saved Alternatives', icon: 'Bookmark' },
    '/help': { label: 'Help & Support', icon: 'HelpCircle' },
    '/sign-in': { label: 'Sign In', icon: 'LogIn' }
  };

  const generateBreadcrumbs = () => {
    if (customBreadcrumbs) {
      return customBreadcrumbs;
    }

    const pathSegments = location?.pathname?.split('/')?.filter(segment => segment);
    const breadcrumbs = [];

    if (showHome && location?.pathname !== '/') {
      breadcrumbs?.push({
        label: 'Home',
        path: '/',
        icon: 'Home'
      });
    }

    let currentPath = '';
    pathSegments?.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const route = routeMap?.[currentPath];
      
      if (route) {
        breadcrumbs?.push({
          label: route?.label,
          path: currentPath,
          icon: route?.icon,
          isLast: index === pathSegments?.length - 1
        });
      } else {
        // Fallback for dynamic routes
        breadcrumbs?.push({
          label: segment?.charAt(0)?.toUpperCase() + segment?.slice(1)?.replace(/-/g, ' '),
          path: currentPath,
          icon: 'ChevronRight',
          isLast: index === pathSegments?.length - 1
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on home/landing page unless there are custom breadcrumbs
  if (!customBreadcrumbs && (location?.pathname === '/' || location?.pathname === '/landing-page')) {
    return null;
  }

  // Don't show if there's only one breadcrumb item
  if (breadcrumbs?.length <= 1) {
    return null;
  }

  const handleBreadcrumbClick = (path, isLast) => {
    if (!isLast) {
      onNavigate(path);
    }
  };

  const handleKeyDown = (event, path, isLast) => {
    if ((event?.key === 'Enter' || event?.key === ' ') && !isLast) {
      event?.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <nav 
      className="flex items-center space-x-2 text-sm mb-6"
      aria-label="Breadcrumb navigation"
      role="navigation"
    >
      <ol className="flex items-center space-x-2">
        {breadcrumbs?.map((breadcrumb, index) => (
          <li key={breadcrumb?.path} className="flex items-center">
            {index > 0 && (
              <Icon 
                name="ChevronRight" 
                size={16} 
                className="text-muted-foreground mx-2" 
                aria-hidden="true"
              />
            )}
            
            {breadcrumb?.isLast ? (
              <span 
                className="flex items-center space-x-2 text-foreground font-medium"
                aria-current="page"
              >
                <Icon 
                  name={breadcrumb?.icon} 
                  size={16} 
                  className="text-accent" 
                />
                <span>{breadcrumb?.label}</span>
              </span>
            ) : (
              <button
                onClick={() => handleBreadcrumbClick(breadcrumb?.path, breadcrumb?.isLast)}
                onKeyDown={(e) => handleKeyDown(e, breadcrumb?.path, breadcrumb?.isLast)}
                className="flex items-center space-x-2 text-muted-foreground hover:text-accent transition-colors duration-200 rounded-md px-2 py-1 hover:bg-muted/30"
                tabIndex={0}
                role="link"
              >
                <Icon 
                  name={breadcrumb?.icon} 
                  size={16} 
                  className="transition-colors duration-200" 
                />
                <span>{breadcrumb?.label}</span>
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default NavigationBreadcrumbs;