import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { AppLayout } from '@app/components/layout';
import { Base64Tools } from '@app/features/base64';
import { JwtTools } from '@app/features/jwt';

export default () => (
  <BrowserRouter>
    <Routes>
      <Route
        path="/*"
        element={
          <AppLayout>
            <Routes>
              <Route index element={<Navigate to="/base64" replace />} />
              <Route path="base64" element={<Base64Tools />} />
              <Route path="jwt" element={<JwtTools />} />
            </Routes>
          </AppLayout>
        }
      />
    </Routes>
  </BrowserRouter>
);
