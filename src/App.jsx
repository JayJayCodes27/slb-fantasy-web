import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import PlayersPage from './pages/PlayersPage.jsx';
import FixturesPage from './pages/FixturesPage.jsx';
import NewsPage from './pages/NewsPage.jsx';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/fixtures" element={<FixturesPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/leagues" element={<div className="flex items-center justify-center min-h-[calc(100vh-80px)]"><h1 className="font-oswald text-4xl font-bold">Leagues — Coming Soon</h1></div>} />
        <Route path="/signin" element={<div className="flex items-center justify-center min-h-[calc(100vh-80px)]"><h1 className="font-oswald text-4xl font-bold">Sign In — Coming Soon</h1></div>} />
      </Routes>
    </Layout>
  );
}

export default App;
