import {t as localeLabel,ui as localeText} from '@/lib/i18n';
import {LanguageSelector} from '@/components/language-selector';
import {t as translateUi,useLanguage} from '@/lib/i18n';
import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Shell } from '@/components/shell';
import { SpectrumDefs } from '@/components/spectrum';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { useStore } from '@/lib/store';
import NotFound from '@/pages/not-found';
import { Login, Mode, Register } from '@/pages/auth';
import Dashboard from '@/pages/dashboard';
import Pathway from '@/pages/pathway';
import Analysis from '@/pages/analysis';
import JobDetail, { JobsIndex } from '@/pages/job';
import PlanPage from '@/pages/plan';
import Progress from '@/pages/progress';
import Organization from '@/pages/organization';
import EvidencePage from '@/pages/evidence';
import ProfilePage from '@/pages/profile';
import { RecommendationProvider, useRecommendations } from '@/lib/recommendations';

const queryClient = new QueryClient();

function Router() {
  useLanguage();
  const [loc] = useLocation();
  const auth = useAuth();
  const ai = useRecommendations();
  const session = useStore((s) => s.session);
  if (auth.signingOut) return <div className="grid min-h-screen place-items-center" role="status">{translateUi("Saving changes and signing out…")}</div>;
  if (!auth.initialized || (auth.user && ['idle', 'loading'].includes(auth.syncStatus.phase))) return <div className="grid min-h-screen place-items-center" role="status">{translateUi("Restoring your account…")}</div>;
  if (auth.user && auth.syncStatus.phase === 'load-error') return <div className="mx-auto max-w-lg space-y-4 p-8"><h1 className="font-display text-3xl">{translateUi("Your profile could not be restored")}</h1><p role="alert">{localeText(auth.syncStatus.error)}</p><p>{translateUi("Editing is paused so an empty profile cannot overwrite your saved data.")}</p><button className="btn-ink" onClick={() => void auth.retry()}>{translateUi("Retry")}</button><button className="btn-ghost" onClick={() => void auth.signOut()}>{translateUi("Sign out")}</button>{auth.error && <p role="alert">{localeText(auth.error)}</p>}</div>;
  if (auth.user && !ai.ready) return <div className="mx-auto max-w-lg space-y-4 p-8"><p role={ai.error?'alert':'status'}>{localeText(ai.error || 'Loading your versioned catalogue and saved recommendations…')}</p>{ai.error && <><button className="btn-ink" onClick={() => void ai.reload()}>{translateUi("Retry setup")}</button><button className="btn-ghost" onClick={() => void auth.signOut()}>{translateUi("Sign out")}</button></>}</div>;
  if (loc === '/login'   || loc === '/register') {
    if (session) return <Redirect to="/" />;
    return <Switch><Route path="/login" component={Login} /><Route path="/register" component={Register} /></Switch>;
  }
  if (!session) return <Redirect to="/login" />;
  if (loc === '/mode') return <Mode />;
  return (
    <Shell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/pathway" component={Pathway} />
          <Route path="/analysis" component={Analysis} />
          <Route path="/jobs" component={JobsIndex} />
          <Route path="/jobs/:id" component={JobDetail} />
          <Route path="/plan" component={PlanPage} />
          <Route path="/progress" component={Progress} />
          <Route path="/organization" component={Organization} />
          <Route path="/evidence" component={EvidencePage} />
          <Route path="/profile" component={ProfilePage} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Shell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  useLanguage();
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{localeText(children)}</ErrorBoundary>;
}

function App() {
  useLanguage();
  return (
    <AuthProvider>
    <RecommendationProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SpectrumDefs />
        <LanguageSelector />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
    </RecommendationProvider>
    </AuthProvider>
  );
}

export default App;
