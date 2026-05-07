import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/react";
import { dark } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider, useAppContext } from "@/contexts/AppContext";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

import HumanVerification from "@/pages/HumanVerification";
import Home from "@/pages/Home";
import Tournaments from "@/pages/Tournaments";
import TournamentDetail from "@/pages/TournamentDetail";
import Results from "@/pages/Results";
import Alerts from "@/pages/Alerts";
import Settings from "@/pages/Settings";
import HostSettings from "@/pages/HostSettings";
import Feedback from "@/pages/Feedback";
import EditTournament from "@/pages/EditTournament";
import UploadResults from "@/pages/UploadResults";
import LiveScoreboard from "@/pages/LiveScoreboard";
import PaymentVerification from "@/pages/PaymentVerification";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function AppInner() {
  const { humanVerified } = useAppContext();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  if (!humanVerified) {
    return <HumanVerification />;
  }

  return (
    <WouterRouter base={basePath}>
      <div
        className="min-h-dvh flex flex-col max-w-md mx-auto relative"
        style={{ background: "var(--th-bg)" }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto pt-14 pb-20">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/tournaments" component={Tournaments} />
            <Route path="/tournaments/:id/edit" component={EditTournament} />
            <Route path="/tournaments/:id/results" component={UploadResults} />
            <Route path="/tournaments/:id/scoreboard" component={LiveScoreboard} />
            <Route path="/tournaments/:id/payments" component={PaymentVerification} />
            <Route path="/tournaments/:id" component={TournamentDetail} />
            <Route path="/results" component={Results} />
            <Route path="/alerts" component={Alerts} />
            <Route path="/settings" component={Settings} />
            <Route path="/host-settings" component={HostSettings} />
            <Route path="/profile" component={Profile} />
            <Route path="/feedback" component={Feedback} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <BottomNav />
      </div>
    </WouterRouter>
  );
}

function App() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const proxyUrl = import.meta.env.PROD
    ? `${window.location.origin}${basePath}/api/__clerk`
    : undefined;

  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      proxyUrl={proxyUrl}
      appearance={{
        baseTheme: dark,
        cssLayerName: "clerk",
        variables: {
          colorPrimary: "#ff6b35",
          colorBackground: "#0a0e27",
          colorSurface: "#0f1530",
          colorText: "#f5f5f5",
          colorTextSecondary: "#a0a8c0",
          colorInputBackground: "#151a38",
          colorInputText: "#f5f5f5",
          borderRadius: "0.875rem",
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <AuthProvider>
            <AppInner />
            <Toaster />
          </AuthProvider>
        </AppProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
