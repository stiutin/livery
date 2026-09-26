import {ToastProvider} from '@livery/ui';
import {Navigate, Route, Routes} from 'react-router';

import {AppLayout} from '../components/AppLayout/AppLayout';
import {ThemeBoot} from '../theme/ThemeBoot';
import BillingPage from './BillingPage/BillingPage';
import HomePage from './HomePage/HomePage';
import LoginPage from './LoginPage/LoginPage';
import ThemePreview from './ThemePreview/ThemePreview';

export default function App() {
  return (
    <ThemeBoot>
      <ToastProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/account/billing" element={<BillingPage />} />
            <Route path="/theme/preview" element={<ThemePreview />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </ThemeBoot>
  );
}
