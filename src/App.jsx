import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import PlayersPage from './pages/PlayersPage.jsx';
import FixturesPage from './pages/FixturesPage.jsx';
import NewsPage from './pages/NewsPage.jsx';
import MyTeamPage from './pages/MyTeamPage.jsx';
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
        <Route path="/leagues" element={<Layout><div className="flex items-center justify-center min-h-[calc(100vh-80px)]"><h1 className="font-oswald text-4xl font-bold">Leagues — Coming Soon</h1></div></Layout>} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
