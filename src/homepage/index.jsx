import React from 'react';
import {Provider} from 'react-redux';
import {BrowserRouter} from 'react-router-dom';

import render from '../playground/app-target';
import TWThemeManagerHOC from '../containers/tw-theme-manager-hoc.jsx';
import store from './store';
import {AuthProvider} from './contexts/auth-context.jsx';
import App from './app.jsx';

import './homepage.css';

// nyxide: reuse the editor's own theme manager (applies the current theme's CSS custom
// properties on mount and reactively on change - same mechanism editor.html/player.html use).
const ThemedApp = TWThemeManagerHOC(App);

render((
    <Provider store={store}>
        <BrowserRouter>
            <AuthProvider>
                <ThemedApp />
            </AuthProvider>
        </BrowserRouter>
    </Provider>
));
