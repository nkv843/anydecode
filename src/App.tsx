import { BrowserRouter, Route, Routes } from 'react-router';

import { I18nProvider } from '@app/features/translations';
import { AppErrorBoundary } from '@app/features/error-boundary';

export default () => (
  <AppErrorBoundary>
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<div />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  </AppErrorBoundary>
)
