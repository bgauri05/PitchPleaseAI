import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { BusinessSetup } from "./pages/BusinessSetup";
import { AuthPage } from "./pages/AuthPage";
import { Dashboard } from "./pages/Dashboard";
import { ContentGenerator } from "./pages/ContentGenerator";
import { WeeklyPlanner } from "./pages/WeeklyPlanner";
import { FestivalIdeas } from "./pages/FestivalIdeas";
import { ContentLibrary } from "./pages/ContentLibrary";
import { ScheduledPosts } from "./pages/ScheduledPosts";
import { Settings } from "./pages/Settings";
import { DashboardLayout } from "./components/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

// WHAT: `/auth` was referenced by DashboardLayout.tsx and Settings.tsx
//       (both call `navigate('/auth')` on sign-out) and by AuthPage.tsx's
//       own post-login redirect logic, but no route ever rendered
//       AuthPage — so every one of those navigations was a dead link.
//       This wires the already-built login/signup page in for real.
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
    path: "/auth",
    Component: AuthPage,
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
        path: "scheduled",
        Component: ScheduledPosts,
      },
      {
        path: "settings",
        Component: Settings,
      },
    ],
  }],
  },
]);