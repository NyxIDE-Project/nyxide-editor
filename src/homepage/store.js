import {combineReducers, createStore} from 'redux';

import themeReducer from '../reducers/theme';
import menusReducer from '../reducers/menus';

// nyxide: a minimal store just so the homepage bundle can reuse the editor's actual
// theme-switcher components (TWGuiThemeMenu/TWAccentThemeMenu) verbatim - those are
// connected components that expect state.scratchGui.{theme,menus} and state.locales.isRtl.
// There's no VM/blocks/project state here, only what those components actually read.
const localesReducer = (state = {isRtl: false}) => state;

const scratchGuiReducer = combineReducers({
    theme: themeReducer,
    menus: menusReducer
});

const rootReducer = combineReducers({
    scratchGui: scratchGuiReducer,
    locales: localesReducer
});

const store = createStore(rootReducer);

export default store;
