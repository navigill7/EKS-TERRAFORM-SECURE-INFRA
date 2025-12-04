// client/src/App.js (UPDATED)
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import HomePage from "scenes/homePage";
import LoginPage from "scenes/loginPage";
import AlumniPage from "scenes/alumniPage";
import ProfilePage from "scenes/profilePage";
import AuthCallback from "scenes/authCallback";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { NotificationProvider } from "context/NotificationContext"; // 🆕 NEW IMPORT
import NotificationToast from "components/NotificationToast"; // 🆕 NEW IMPORT

function App() {
  const mode = useSelector((state) => state.mode);
  const isAuth = Boolean(useSelector((state) => state.token));

  useEffect(() => {
    // Apply dark mode class to html element
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  return (
    <div className={`App min-h-screen ${mode === 'dark' ? 'bg-grey-900 text-grey-100' : 'bg-grey-10 text-grey-700'} transition-colors duration-300`}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {/* 🆕 WRAP WITH NOTIFICATION PROVIDER */}
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/home" element={isAuth ? <HomePage /> : <Navigate to="/" />} />
            <Route path="/profile/:userId" element={isAuth ? <ProfilePage /> : <Navigate to="/" />} />
            <Route path="/home/alumniPage" element={isAuth ? <AlumniPage /> : <Navigate to="/" />} />
          </Routes>
          
          {/* 🆕 NOTIFICATION TOAST (shows on all pages when logged in) */}
          {isAuth && <NotificationToast />}
        </NotificationProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;