import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { AppProviders } from './context/AppProviders';
import Layout from './components/Layout';
import JournalListPage from './pages/JournalListPage';
import JournalDetailPage from './pages/JournalDetailPage';
import JournalFormPage from './pages/JournalFormPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import RequireAuth from './components/RequireAuth';

/** Eski /ai?journalId=..&action=.. bağlantılarını yeni detay sayfasına yönlendirir. */
const LegacyAiRedirect = () => {
    const [params] = useSearchParams();
    const journalId = params.get('journalId');
    if (!journalId) return <Navigate to="/" replace />;
    return <Navigate to={`/journals/${journalId}?tab=${params.get('action') || 'summary'}`} replace />;
};

function App() {
    return (
        <AppProviders>
            <BrowserRouter>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/login" element={<LoginPage />} />
                        <Route element={<RequireAuth />}>
                            <Route path="/" element={<JournalListPage />} />
                            <Route path="/new" element={<JournalFormPage />} />
                            <Route path="/edit/:id" element={<JournalFormPage />} />
                            <Route path="/journals/:id" element={<JournalDetailPage />} />
                            <Route path="/ai" element={<LegacyAiRedirect />} />
                        </Route>
                        <Route path="*" element={<NotFoundPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AppProviders>
    );
}

export default App;
