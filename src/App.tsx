import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { AppLayout } from '@app/components/layout';
import { Base64Tools } from '@app/features/base64';
import { JwtTools } from '@app/features/jwt';
import { QrTools } from '@app/features/qr';

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
              <Route path="qr" element={<QrTools />} />
            </Routes>
          </AppLayout>
        }
      />
    </Routes>
  </BrowserRouter>
);
