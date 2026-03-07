
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { PermissionProvider } from '@/contexts/PermissionContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DarkModeProvider } from '@/contexts/DarkModeContext';
import { PluginProvider } from '@/contexts/PluginContext';
import { Toaster } from '@/components/ui/toaster';
import MainRouter from '@/components/MainRouter';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import GlobalErrorBoundary from '@/components/ui/GlobalErrorBoundary';

import { TenantProvider } from '@/contexts/TenantContext';

import { useTenantTheme } from '@/hooks/useTenantTheme';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

// Wrapper to apply tenant theme
const ThemeWrapper = ({ children }) => {
  useTenantTheme();
  return children;
};

function App() {


  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <GlobalErrorBoundary>
          <DarkModeProvider>
            <TenantProvider>
              <AuthProvider>
                <PermissionProvider>
                  <ThemeProvider>
                    <PluginProvider>
                      <Helmet>
                        <title>CMS & Public Portal</title>
                        <meta name="description" content="Content Management System and Public Portal" />
                      </Helmet>
                      <ThemeWrapper>
                        <MainRouter />
                        <Toaster />
                      </ThemeWrapper>
                    </PluginProvider>
                  </ThemeProvider>
                </PermissionProvider>
              </AuthProvider>
            </TenantProvider>
          </DarkModeProvider>
        </GlobalErrorBoundary>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
