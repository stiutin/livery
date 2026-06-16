import { Navigate, Route, Routes } from "react-router-dom";
import { ThemeBoot } from "../theme/ThemeBoot";
import { AppLayout } from "../components/AppLayout/AppLayout";
import HomePage from "./HomePage/HomePage";
import LoginPage from "./LoginPage/LoginPage";
import BillingPage from "./BillingPage/BillingPage";
import ThemePreview from "./ThemePreview/ThemePreview";

export default function App() {
  return (
    <ThemeBoot>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/account/billing" element={<BillingPage />} />
          <Route path="/theme/preview" element={<ThemePreview />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeBoot>
  );
}
