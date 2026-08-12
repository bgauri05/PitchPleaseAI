import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { BusinessSetup } from "./pages/BusinessSetup";
import { Dashboard } from "./pages/Dashboard";
import { ContentGenerator } from "./pages/ContentGenerator";
import { WeeklyPlanner } from "./pages/WeeklyPlanner";
import { FestivalIdeas } from "./pages/FestivalIdeas";
import { ContentLibrary } from "./pages/ContentLibrary";
import { Settings } from "./pages/Settings";
import { DashboardLayout } from "./components/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: BusinessSetup,
  },
  {
    path: "/landing",
    Component: LandingPage,
  },
  {
    path: "/setup",
    Component: BusinessSetup,
  },
  {
    path: "/business-setup",
    Component: BusinessSetup,
  },
  {
    path: "/app",
    Component: ProtectedRoute,
    children: [{
      Component: DashboardLayout,
    children: [
      {
        index: true,
        Component: Dashboard,
      },
      {
        path: "generate",
        Component: ContentGenerator,
      },
      {
        path: "planner",
        Component: WeeklyPlanner,
      },
      {
        path: "festivals",
        Component: FestivalIdeas,
      },
      {
        path: "library",
        Component: ContentLibrary,
      },
      {
        path: "settings",
        Component: Settings,
      },
    ],
  }],
  },
]);