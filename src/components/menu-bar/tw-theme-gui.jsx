import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, defineMessages} from 'react-intl';
import {connect} from 'react-redux';

import check from './check.svg';
import dropdownCaret from './dropdown-caret.svg';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {GUI_DARK, GUI_LIGHT, GUI_OLED, Theme} from '../../lib/themes/index.js';
import {openGuiThemeMenu, guiThemeMenuOpen, closeSettingsMenu} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {persistTheme} from '../../lib/themes/themePersistance.js';
import lightModeIcon from './tw-sun.svg';
import darkModeIcon from './tw-moon.svg';
import oledModeIcon from './tw-oled.svg';
import styles from './settings-menu.css';

const options = defineMessages({
    [GUI_LIGHT]: {
        defaultMessage: 'Light',
        description: 'Name of the light GUI color scheme.',
        id: 'tw.gui.light'
    },
    [GUI_DARK]: {
        defaultMessage: 'Dark',
        description: 'Name of the dark GUI color scheme.',
        id: 'tw.gui.dark'
    },
    [GUI_OLED]: {
        defaultMessage: 'OLED',
        description: 'Name of the deep black GUI color scheme intended for OLED screens.',
        id: 'tw.gui.oled'
    }
});

const icons = {
    [GUI_LIGHT]: lightModeIcon,
    [GUI_DARK]: darkModeIcon,
    [GUI_OLED]: oledModeIcon
};

const GuiThemeIcon = ({id}) => (
    <img
        src={icons[id]}
        draggable={false}
        width={24}
    />
);

GuiThemeIcon.propTypes = {
    id: PropTypes.string
};

const GuiThemeMenuItem = ({id, isSelected, onClick}) => (
    <MenuItem onClick={onClick}>
        <div className={styles.option}>
            <img
                width={15}
                height={12}
                className={classNames(styles.check, {[styles.selected]: isSelected})}
                src={check}
                draggable={false}
            />
            <GuiThemeIcon id={id} />
            <FormattedMessage {...options[id]} />
        </div>
    </MenuItem>
);

GuiThemeMenuItem.propTypes = {
    id: PropTypes.string,
    isSelected: PropTypes.bool,
    onClick: PropTypes.func
};

const GuiThemeMenu = ({
    isOpen,
    isRtl,
    onChangeTheme,
    onOpenMenu,
    theme
}) => (
    <MenuItem expanded={isOpen}>
        <div
            className={styles.option}
            onClick={onOpenMenu}
        >
            <GuiThemeIcon id={theme.gui} />
            <span className={styles.submenuLabel}>
                <FormattedMessage
                    defaultMessage="Color Scheme"
                    description="Label for menu to choose the GUI color scheme (eg. light, dark, OLED)"
                    id="tw.menuBar.guiTheme"
                />
            </span>
            <img
                className={styles.expandCaret}
                src={dropdownCaret}
                draggable={false}
            />
        </div>
        <Submenu place={isRtl ? 'left' : 'right'}>
            {[GUI_LIGHT, GUI_DARK, GUI_OLED].map(i => (
                <GuiThemeMenuItem
                    key={i}
                    id={i}
                    isSelected={theme.gui === i}
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick={() => onChangeTheme(theme.set('gui', i))}
                />
            ))}
        </Submenu>
    </MenuItem>
);

GuiThemeMenu.propTypes = {
    isOpen: PropTypes.bool,
    isRtl: PropTypes.bool,
    onChangeTheme: PropTypes.func,
    onOpenMenu: PropTypes.func,
    theme: PropTypes.instanceOf(Theme)
};

const mapStateToProps = state => ({
    isOpen: guiThemeMenuOpen(state),
    isRtl: state.locales.isRtl,
    theme: state.scratchGui.theme.theme
});

const mapDispatchToProps = dispatch => ({
    onChangeTheme: theme => {
        dispatch(setTheme(theme));
        dispatch(closeSettingsMenu());
        persistTheme(theme);
    },
    onOpenMenu: () => dispatch(openGuiThemeMenu())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(GuiThemeMenu);
