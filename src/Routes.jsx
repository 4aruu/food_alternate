import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";

// Correct paths
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";

// Pages
import FoodComparisonTool from "./pages/food-comparison-tool";
import LandingPage from "./pages/landing-page";
import FoodSearchResults from "./pages/food-search-results";
import UserDashboard from "./pages/dashboard";
import NutritionExplorerModal from "./pages/nutrition-explorer-modal";
import UserRegistration from "./pages/user-registration";
import NotFound from "./pages/NotFound";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />

        <RouterRoutes>
          <Route path="/" element={<FoodComparisonTool />} />
          <Route path="/food-comparison-tool" element={<FoodComparisonTool />} />
          <Route path="/landing-page" element={<LandingPage />} />
          <Route path="/food-search-results" element={<FoodSearchResults />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/nutrition-explorer-modal" element={<NutritionExplorerModal />} />
          <Route path="/user-registration" element={<UserRegistration />} />
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
