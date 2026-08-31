import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Analytics } from '@vercel/analytics/react'
import { AppShell } from './components/layout/AppShell'
import { AuthGuard } from './components/layout/AuthGuard'
import { ToastProvider } from './hooks/useToast'
import { Toaster } from './components/ui/Toaster'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { I18nProvider } from './i18n/I18nProvider'
import { ThemeProvider } from './theme/ThemeProvider'
import { BrandMark } from './components/ui/BrandMark'

// ── Eagerly loaded (small, always needed immediately) ───────────────────────
import { DashboardPage }       from './pages/DashboardPage'
import { ApplicationsPage }    from './pages/ApplicationsPage'
import { ApplicationBoardPage } from './pages/ApplicationBoardPage'
import { ApplicationDetailPage } from './pages/ApplicationDetailPage'
import { NewApplicationPage }  from './pages/NewApplicationPage'
import { CompaniesPage }       from './pages/CompaniesPage'
import { CompanyDetailPage }   from './pages/CompanyDetailPage'
import { NewCompanyPage }      from './pages/NewCompanyPage'
import { TasksPage }           from './pages/TasksPage'
import { ContactsPage }        from './pages/ContactsPage'
import { DocumentsPage }       from './pages/DocumentsPage'
import { PrepPage }            from './pages/PrepPage'
import { SettingsPage }        from './pages/SettingsPage'
import { LoginPage }           from './pages/LoginPage'
import { ForgotPasswordPage }  from './pages/ForgotPasswordPage'
import { ResetPasswordPage }   from './pages/ResetPasswordPage'

// ── Lazily loaded (heavy: AI SDK, calendar date-picker, cmdk panels) ────────
const CalendarPage = lazy(() => import('./pages/CalendarPage').then(m => ({ default: m.CalendarPage })))
const AIPage       = lazy(() => import('./pages/AIPage').then(m => ({ default: m.AIPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

/** Thin fallback shown while a lazy chunk loads */
function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <BrandMark size="md" className="opacity-90" />
      <div className="w-6 h-6 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Public */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Protected */}
                <Route element={<AuthGuard />}>
                  <Route element={<AppShell />}>
                    <Route path="/" element={
                      <ErrorBoundary label="Dashboard">
                        <DashboardPage />
                      </ErrorBoundary>
                    } />

                    <Route path="/applications" element={
                      <ErrorBoundary label="Applications">
                        <ApplicationsPage />
                      </ErrorBoundary>
                    } />
                    <Route path="/applications/new" element={
                      <ErrorBoundary>
                        <NewApplicationPage />
                      </ErrorBoundary>
                    } />
                    <Route path="/applications/archive" element={<ApplicationsPage mode="archive" />} />
                    <Route path="/applications/board" element={
                      <ErrorBoundary label="Board">
                        <ApplicationBoardPage />
                      </ErrorBoundary>
                    } />
                    <Route path="/applications/:id" element={
                      <ErrorBoundary label="Application detail">
                        <ApplicationDetailPage />
                      </ErrorBoundary>
                    } />

                    <Route path="/companies" element={
                      <ErrorBoundary label="Companies">
                        <CompaniesPage />
                      </ErrorBoundary>
                    } />
                    <Route path="/companies/new" element={<NewCompanyPage />} />
                    <Route path="/companies/:id" element={
                      <ErrorBoundary label="Company detail">
                        <CompanyDetailPage />
                      </ErrorBoundary>
                    } />

                    <Route path="/tasks" element={
                      <ErrorBoundary label="Tasks">
                        <TasksPage />
                      </ErrorBoundary>
                    } />

                    <Route path="/calendar" element={
                      <ErrorBoundary label="Calendar">
                        <Suspense fallback={<PageLoader />}>
                          <CalendarPage />
                        </Suspense>
                      </ErrorBoundary>
                    } />

                    <Route path="/contacts" element={
                      <ErrorBoundary label="Contacts">
                        <ContactsPage />
                      </ErrorBoundary>
                    } />
                    <Route path="/documents" element={
                      <ErrorBoundary label="Documents">
                        <DocumentsPage />
                      </ErrorBoundary>
                    } />
                    <Route path="/prep" element={
                      <ErrorBoundary label="Prep library">
                        <PrepPage />
                      </ErrorBoundary>
                    } />

                    <Route path="/ai" element={
                      <ErrorBoundary label="AI tools">
                        <Suspense fallback={<PageLoader />}>
                          <AIPage />
                        </Suspense>
                      </ErrorBoundary>
                    } />

                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                </Route>
              </Routes>
              <Toaster />
              {/* Vercel Analytics. Mounted inside BrowserRouter so client-side
                  navigations register as page views — outside it, a single-page
                  app reports one view per session and nothing else.

                  The import is /react, not /next: Vercel's setup page defaults
                  to the Next.js snippet, which does not apply to a Vite app. */}
              <Analytics />
            </BrowserRouter>
            <Analytics />
          </ToastProvider>
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
