import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import FoodComparisonTool from './pages/food-comparison-tool';
import LandingPage from './pages/landing-page';
import FoodSearchResults from './pages/food-search-results';
import UserDashboard from './pages/user-dashboard';
import NutritionExplorerModal from './pages/nutrition-explorer-modal';
import UserRegistration from './pages/user-registration';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<FoodComparisonTool />} />
        <Route path="/food-comparison-tool" element={<FoodComparisonTool />} />
        <Route path="/landing-page" element={<LandingPage />} />
        <Route path="/food-search-results" element={<FoodSearchResults />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/nutrition-explorer-modal" element={<NutritionExplorerModal />} />
        <Route path="/user-registration" element={<UserRegistration />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
