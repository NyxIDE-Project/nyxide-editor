import React from 'react';
import {Route, Switch, useLocation} from 'react-router-dom';

import Topbar from './components/topbar/topbar.jsx';
import HeroBanner from './components/hero-banner/hero-banner.jsx';
import Footer from './components/footer/footer.jsx';
import SiteBanner from './components/site-banner/site-banner.jsx';
import HomePage from './pages/home/home-page.jsx';
import ExplorePage from './pages/explore/explore-page.jsx';
import SearchPage from './pages/search/search-page.jsx';
import ProfilePage from './pages/profile/profile-page.jsx';
import UploadPage from './pages/upload/upload-page.jsx';
import MyProjectsPage from './pages/my-projects/my-projects-page.jsx';
import EditProjectPage from './pages/edit-project/edit-project-page.jsx';
import SettingsPage from './pages/settings/settings-page.jsx';
import LoginPage from './pages/login/login-page.jsx';
import RegisterPage from './pages/register/register-page.jsx';
import AdminPage from './pages/admin/admin-page.jsx';
import TermsPage from './pages/legal/terms-page.jsx';
import PrivacyPage from './pages/legal/privacy-page.jsx';
import GuidelinesPage from './pages/legal/guidelines-page.jsx';
import DesktopPage from './pages/desktop/desktop-page.jsx';
import ArchivePage from './pages/archive/archive-page.jsx';
import NotFoundPage from './pages/not-found/not-found-page.jsx';

import styles from './app.css';

const App = () => {
    const location = useLocation();
    return (
        <React.Fragment>
            <Topbar />
            <SiteBanner key={location.pathname} />
            <HeroBanner />
            <main className={styles.main}>
                <Switch>
                    <Route
                        exact
                        path="/"
                        component={HomePage}
                    />
                    <Route
                        exact
                        path="/explore"
                        component={ExplorePage}
                    />
                    <Route
                        exact
                        path="/search"
                        component={SearchPage}
                    />
                    <Route
                        exact
                        path="/upload"
                        component={UploadPage}
                    />
                    <Route
                        exact
                        path="/my-projects"
                        component={MyProjectsPage}
                    />
                    <Route
                        exact
                        path="/projects/:id/edit"
                        component={EditProjectPage}
                    />
                    <Route
                        exact
                        path="/settings"
                        component={SettingsPage}
                    />
                    <Route
                        exact
                        path="/login"
                        component={LoginPage}
                    />
                    <Route
                        exact
                        path="/register"
                        component={RegisterPage}
                    />
                    <Route
                        exact
                        path="/admin"
                        component={AdminPage}
                    />
                    <Route
                        exact
                        path="/users/:username"
                        component={ProfilePage}
                    />
                    <Route
                        exact
                        path="/terms"
                        component={TermsPage}
                    />
                    <Route
                        exact
                        path="/privacy"
                        component={PrivacyPage}
                    />
                    <Route
                        exact
                        path="/guidelines"
                        component={GuidelinesPage}
                    />
                    <Route
                        exact
                        path="/desktop"
                        component={DesktopPage}
                    />
                    <Route
                        exact
                        path="/archived-projects"
                        component={ArchivePage}
                    />
                    <Route component={NotFoundPage} />
                </Switch>
            </main>
            <Footer />
        </React.Fragment>
    );
};

export default App;
