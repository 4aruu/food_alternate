import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Pages
import LandingPage from './pages/landing-page';
import FoodSearchResults from './pages/food-search-results';
import FoodComparisonTool from './pages/food-comparison-tool';
import NutritionExplorerModal from './pages/nutrition-explorer-modal';
import NotFound from './pages/NotFound';

//  1. IMPORT YOUR NEW DASHBOARD COMPONENT
import UserDashboard from './pages/user-dashboard';
import UserRegistration from './pages/user-registration';

// Import Components
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';

const App = () => {
  return (
    <Router>
      <ErrorBoundary>
        <ScrollToTop />
        <Routes>
          {/* 1. Landing Page (Home) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing-page" element={<Navigate to="/" replace />} />

          {/* 2. The Search Grid */}
          <Route path="/food-search-results" element={<FoodSearchResults />} />

          {/* 3. The Comparison Tool */}
          <Route path="/food-comparison-tool" element={<FoodComparisonTool />} />

          {/* 4. The Nutrition Detail Modal */}
          <Route path="/nutrition-explorer-modal" element={<NutritionExplorerModal />} />

          {/*  5. THE DASHBOARD ROUTE */}
          <Route path="/dashboard" element={<UserDashboard />} />

          {/* 6. User Registration */}
          <Route path="/user-registration" element={<UserRegistration />} />

          {/* 7. 404 Fallback (Must be last) */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
};

export default App;