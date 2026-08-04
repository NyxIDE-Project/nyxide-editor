import React from 'react';

import SettingsMenu from '../../../components/menu-bar/settings-menu.jsx';

// nyxide: reuses the editor's real SettingsMenu (and, transitively, its actual
// TWGuiThemeMenu/TWAccentThemeMenu components) rather than building a new theme picker -
// only theme switching is enabled here (no language/desktop-settings items).
class ThemeSwitcher extends React.Component {
    constructor (props) {
        super(props);
        this.state = {isOpen: false};
        this.handleOpen = this.handleOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }
    handleOpen () {
        this.setState({isOpen: true});
    }
    handleClose () {
        this.setState({isOpen: false});
    }
    render () {
        return (
            <SettingsMenu
                canChangeTheme
                canChangeLanguage={false}
                isRtl={false}
                settingsMenuOpen={this.state.isOpen}
                onRequestOpen={this.handleOpen}
                onRequestClose={this.handleClose}
            />
        );
    }
}

export default ThemeSwitcher;
