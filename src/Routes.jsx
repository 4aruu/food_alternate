import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";

import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";

import LandingPage from "./pages/landing-page";
import FoodSearchResults from "./pages/food-search-results";
import FoodComparisonTool from "./pages/food-comparison-tool";
import NutritionExplorerModal from "./pages/nutrition-explorer-modal";
import UserDashboard from "./pages/user-dashboard";
import UserRegistration from "./pages/user-registration";
import NotFound from "pages/NotFound";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>

          {/*  Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/*  Search */}
          <Route path="/food-search-results" element={<FoodSearchResults />} />

          {/*  Comparison Tool */}
          <Route path="/food-comparison-tool" element={<FoodComparisonTool />} />

          {/*  Nutrition Explorer (modal-like route) */}
          <Route
            path="/nutrition-explorer-modal"
            element={<NutritionExplorerModal />}
          />

          {/*  User System */}
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/user-registration" element={<UserRegistration />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />

        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
