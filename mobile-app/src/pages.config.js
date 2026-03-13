import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import NewExpense from "./pages/NewExpense";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import Layout from "./Layout.jsx";

export const PAGES = {
  Dashboard: Dashboard,
  History: History,
  NewExpense: NewExpense,
  Settings: Settings,
  Analytics: Analytics,
};

export const pagesConfig = {
  mainPage: "Dashboard",
  Pages: PAGES,
  Layout: Layout,
};
