import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import DevToolbar from './components/DevToolbar.jsx';
import LandingPage from './pages/LandingPage.jsx';
import PlayersPage from './pages/PlayersPage.jsx';
import FixturesPage from './pages/FixturesPage.jsx';
import NewsPage from './pages/NewsPage.jsx';
import MyTeamPage from './pages/MyTeamPage.jsx';
import LeaguesPage from './pages/LeaguesPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout><LandingPage /></Layout>} />
        <Route path="/my-team" element={<Layout><MyTeamPage /></Layout>} />
        <Route path="/players" element={<Layout><PlayersPage /></Layout>} />
        <Route path="/fixtures" element={<Layout><FixturesPage /></Layout>} />
        <Route path="/news" element={<Layout><NewsPage /></Layout>} />
        <Route path="/leagues" element={<Layout><LeaguesPage /></Layout>} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
      <DevToolbar />
    </AuthProvider>
  );
}

export default App;
