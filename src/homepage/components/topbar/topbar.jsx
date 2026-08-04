import React, {useContext, useState} from 'react';
import {Link, useHistory, useLocation} from 'react-router-dom';
import classNames from 'classnames';

import {AuthContext} from '../../contexts/auth-context.jsx';
import Avatar from '../avatar/avatar.jsx';
import ThemeSwitcher from './theme-switcher.jsx';
import NotificationBell from '../notification-bell/notification-bell.jsx';
import {APP_NAME} from '../../../lib/brand';

// nyxide: reuse the editor's actual menu-bar stylesheet AND dropdown components (same
// MenuLabel/MenuBarMenu/MenuItem system the editor's account menu uses) for shared chrome,
// instead of a separate hand-rolled topbar/dropdown look.
import MenuLabel from '../../../components/menu-bar/tw-menu-label.jsx';
import MenuBarMenu from '../../../components/menu-bar/menu-bar-menu.jsx';
import {MenuItem, MenuSection} from '../../../components/menu/menu.jsx';
import menuBarStyles from '../../../components/menu-bar/menu-bar.css';
import styles from './topbar.css';

const Topbar = () => {
    const {user, loading, logout} = useContext(AuthContext);
    const history = useHistory();
    const location = useLocation();
    const [query, setQuery] = useState('');
    const [isAccountMenuOpen, setAccountMenuOpen] = useState(false);

    const handleSearchSubmit = e => {
        e.preventDefault();
        if (query.trim()) {
            history.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    const handleLogout = () => {
        setAccountMenuOpen(false);
        logout();
    };

    const goTo = path => {
        setAccountMenuOpen(false);
        history.push(path);
    };

    const navItemClass = path => classNames(menuBarStyles.menuBarItem, menuBarStyles.hoverable, {
        [styles.navLinkActive]: location.pathname === path
    });

    return (
        <div className={styles.topbar}>
            <div className={classNames(menuBarStyles.menuBar, styles.topbarInner)}>
                <div className={menuBarStyles.mainMenu}>
                    <div className={menuBarStyles.fileGroup}>
                        <Link to="/">
                            <img
                                className={menuBarStyles.scratchLogo}
                                src="/logo.png"
                                alt={APP_NAME}
                                draggable={false}
                            />
                        </Link>
                        <Link
                            className={navItemClass('/')}
                            to="/"
                        >
                            Home
                        </Link>
                        <Link
                            className={navItemClass('/explore')}
                            to="/explore"
                        >
                            Explore
                        </Link>
                    </div>
                    <form
                        className={styles.searchForm}
                        onSubmit={handleSearchSubmit}
                    >
                        <input
                            className={styles.searchInput}
                            type="text"
                            placeholder="Search projects"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                    </form>
                </div>
                <div className={menuBarStyles.accountInfoGroup}>
                    <a
                        className={classNames(menuBarStyles.menuBarItem, menuBarStyles.hoverable)}
                        href="/editor"
                    >
                        Create
                    </a>
                    {!loading && user && (
                        <Link
                            className={classNames(menuBarStyles.menuBarItem, menuBarStyles.hoverable)}
                            to="/my-projects"
                        >
                            My Projects
                        </Link>
                    )}
                    <ThemeSwitcher />
                    {loading ? null : user ? (
                        <div className={styles.accountMenuWrapper}>
                            <NotificationBell />
                            <MenuLabel
                                open={isAccountMenuOpen}
                                onOpen={() => setAccountMenuOpen(true)}
                                onClose={() => setAccountMenuOpen(false)}
                            >
                                <Avatar
                                    avatarUrl={user.avatarUrl}
                                    username={user.username}
                                    size={28}
                                />
                                <MenuBarMenu
                                    className={menuBarStyles.menuBarMenu}
                                    open={isAccountMenuOpen}
                                    place="left"
                                >
                                    <MenuSection>
                                        <MenuItem onClick={() => goTo(`/users/${user.username}`)}>
                                            My Profile
                                        </MenuItem>
                                        <MenuItem onClick={() => goTo('/upload')}>
                                            Upload a Project
                                        </MenuItem>
                                        <MenuItem onClick={() => goTo('/settings')}>
                                            Account Settings
                                        </MenuItem>
                                        {(user.role === 'admin' || user.role === 'owner') && (
                                            <MenuItem onClick={() => goTo('/admin')}>
                                                Admin
                                            </MenuItem>
                                        )}
                                        <MenuItem onClick={handleLogout}>
                                            Log Out
                                        </MenuItem>
                                    </MenuSection>
                                </MenuBarMenu>
                            </MenuLabel>
                        </div>
                    ) : (
                        <React.Fragment>
                            <Link
                                className={classNames(menuBarStyles.menuBarItem, menuBarStyles.hoverable)}
                                to="/login"
                            >
                                Log In
                            </Link>
                            <Link
                                className={classNames(menuBarStyles.menuBarItem, menuBarStyles.hoverable)}
                                to="/register"
                            >
                                Sign Up
                            </Link>
                        </React.Fragment>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Topbar;
