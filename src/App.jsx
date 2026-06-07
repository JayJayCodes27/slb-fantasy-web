// App.jsx — Main application router with all page routes
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import DevToolbar from './components/DevToolbar.jsx';
import LandingPage from './pages/LandingPage.jsx';
import PlayersPage from './pages/PlayersPage.jsx';
import FixturesPage from './pages/FixturesPage.jsx';
import NewsPage from './pages/NewsPage.jsx';
import LeagueDetailPage from './pages/LeagueDetailPage.jsx';
import FantasyPage from './pages/FantasyPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import SquadSelectionPage from './pages/SquadSelectionPage.jsx';
import TransfersPage from './pages/TransfersPage.jsx';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout><LandingPage /></Layout>} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/fantasy" element={<Layout><FantasyPage /></Layout>} />
        <Route path="/transfers" element={<Layout><TransfersPage /></Layout>} />
        <Route path="/players" element={<Layout><PlayersPage /></Layout>} />
        <Route path="/fixtures" element={<Layout><FixturesPage /></Layout>} />
        <Route path="/news" element={<Layout><NewsPage /></Layout>} />
        <Route path="/leagues/:id" element={<Layout><LeagueDetailPage /></Layout>} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/squad-selection" element={<Layout><SquadSelectionPage /></Layout>} />
        <Route path="/privacy" element={<Layout><PrivacyPolicyPage /></Layout>} />
      </Routes>
      <DevToolbar />
    </AuthProvider>
  );
}

export default App;
