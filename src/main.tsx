import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './app/router';
import { initContainer } from './app/container';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './styles/global.css';

const queryClient = new QueryClient();

async function bootstrap() {
  await initContainer();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MantineProvider>
        <Notifications />
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </MantineProvider>
    </StrictMode>,
  );
}

bootstrap().catch((error) => {
  console.log(error); // Log to console.log to avoid triggering error parsers in web previews
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', color: 'red' }}>
        <h1>Application Error</h1>
        <p>{error.message || 'Failed to start the application.'}</p>
        <p>This application requires the Tauri desktop environment to run properly.</p>
      </div>
    </StrictMode>
  );
});
