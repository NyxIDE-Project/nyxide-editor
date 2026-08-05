import classNames from 'classnames';
import React from 'react';

import {API_BASE_URL} from '../../lib/nyxide-constants';
import Avatar from '../../homepage/components/avatar/avatar.jsx';
import MenuLabel from './tw-menu-label.jsx';
import MenuBarMenu from './menu-bar-menu.jsx';
import {MenuSection} from '../menu/menu.jsx';
import MenuItemContainer from '../../containers/menu-item.jsx';
import dropdownCaret from './dropdown-caret.svg';

import menuBarStyles from './menu-bar.css';
import styles from './nyx-account-menu.css';

// nyxide: shows who's logged in on the editor/player pages (right side of the bar),
// reusing the app's actual MenuLabel/MenuBarMenu/MenuItem dropdown system - the same one
// Settings/File/Edit already use - rather than a bespoke dropdown implementation.
class NyxAccountMenu extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            user: null,
            loading: true,
            isOpen: false
        };
        this.handleOpen = this.handleOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
    }
    componentDidMount () {
        fetch(`${API_BASE_URL}/api/auth/me`, {credentials: 'include'})
            .then(res => res.json())
            .then(data => this.setState({user: data.user, loading: false}))
            .catch(() => this.setState({loading: false}));
    }
    handleOpen () {
        this.setState({isOpen: true});
    }
    handleClose () {
        this.setState({isOpen: false});
    }
    handleLogout () {
        fetch(`${API_BASE_URL}/api/auth/logout`, {method: 'POST', credentials: 'include'})
            .then(() => {
                window.location.href = '/';
            });
    }
    render () {
        if (this.state.loading) {
            return null;
        }
        if (!this.state.user) {
            return (
                <div className={styles.wrapper}>
                    <a
                        className={classNames(menuBarStyles.menuBarItem, menuBarStyles.hoverable)}
                        href="/login"
                    >
                        Log In
                    </a>
                    <a
                        className={classNames(menuBarStyles.menuBarItem, menuBarStyles.hoverable)}
                        href="/register"
                    >
                        Sign Up
                    </a>
                </div>
            );
        }
        const {user} = this.state;
        return (
            <div className={styles.wrapper}>
                <MenuLabel
                    open={this.state.isOpen}
                    onOpen={this.handleOpen}
                    onClose={this.handleClose}
                >
                    <Avatar
                        className={styles.avatar}
                        avatarUrl={user.avatarUrl}
                        username={user.username}
                        size={28}
                    />
                    <span className={styles.username}>
                        {user.username}
                    </span>
                    <img
                        src={dropdownCaret}
                        draggable={false}
                        width={8}
                        height={5}
                    />
                    <MenuBarMenu
                        className={menuBarStyles.menuBarMenu}
                        open={this.state.isOpen}
                        place="left"
                    >
                        <MenuSection>
                            <MenuItemContainer href={`/users/${user.username}`}>
                                My Profile
                            </MenuItemContainer>
                            <MenuItemContainer href="/my-projects">
                                My Projects
                            </MenuItemContainer>
                            <MenuItemContainer href="/upload">
                                Upload a Project
                            </MenuItemContainer>
                            <MenuItemContainer href="/settings">
                                Account Settings
                            </MenuItemContainer>
                            <MenuItemContainer onClick={this.handleLogout}>
                                Log Out
                            </MenuItemContainer>
                        </MenuSection>
                    </MenuBarMenu>
                </MenuLabel>
            </div>
        );
    }
}

export default NyxAccountMenu;
