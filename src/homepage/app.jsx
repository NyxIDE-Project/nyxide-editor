import React from 'react';
import {Route, Switch} from 'react-router-dom';

import Topbar from './components/topbar/topbar.jsx';
import HeroBanner from './components/hero-banner/hero-banner.jsx';
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

import styles from './app.css';

const App = () => (
    <React.Fragment>
        <Topbar />
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
            </Switch>
        </main>
    </React.Fragment>
);

export default App;
