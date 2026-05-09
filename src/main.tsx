import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { FirebaseProvider } from './contexts/FirebaseContext';
import './index.css';
import CVPage from './App';
import LoginPage from './pages/LoginPage';
import ContactPage from './pages/ContactPage';
import FirebasePage from './pages/FirebasePage';
import FilesPage from './pages/FilesPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <FirebaseProvider>
              <Routes>
                <Route path="/" element={<CVPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/firebase" element={<FirebasePage />} />
                <Route path="/files" element={<FilesPage />} />
              </Routes>
            </FirebaseProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
);
