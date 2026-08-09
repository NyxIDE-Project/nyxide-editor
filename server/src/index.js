const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SqliteSessionStore = require('./lib/sqlite-session-store');
const db = require('./db');
const {
    PORT, SESSION_SECRET, IS_PRODUCTION, ADMIN_USERNAMES, OWNER_USERNAME, TURNSTILE_SITE_KEY,
    CORS_ORIGINS
} = require('./config');
const {attachUser} = require('./middleware/auth');
const errorHandler = require('./middleware/error-handler');
const usersModel = require('./models/users');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const projectsRoutes = require('./routes/projects');
const reportsRoutes = require('./routes/reports');
const notificationsRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const eventsRoutes = require('./routes/events');
const githubRoutes = require('./routes/github');
const bannerRoutes = require('./routes/banner');

const app = express();
const sessionStore = new SqliteSessionStore(db);
setInterval(() => sessionStore.pruneExpired(), 15 * 60 * 1000).unref();

// Bootstrap: promote any configured usernames to admin on every startup, so there's a way
// to get the first admin account without touching the database directly.
ADMIN_USERNAMES.forEach(username => {
    const user = usersModel.getByUsername(username);
    if (user && user.role !== 'admin' && user.role !== 'owner') {
        usersModel.setRole(user.id, 'admin');
        // eslint-disable-next-line no-console
        console.log(`Promoted "${username}" to admin (via ADMIN_USERNAMES)`);
    }
});

if (OWNER_USERNAME) {
    const owner = usersModel.getByUsername(OWNER_USERNAME);
    if (owner && owner.role !== 'owner') {
        usersModel.setRole(owner.id, 'owner');
        // eslint-disable-next-line no-console
        console.log(`Set "${OWNER_USERNAME}" as owner`);
    }
}

app.use(cors({
    origin: CORS_ORIGINS,
    credentials: true
}));
app.use(express.json());
app.use(session({
    store: sessionStore,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        // cross-subdomain requires "none", which requires "secure"
        sameSite: IS_PRODUCTION ? 'none' : 'lax',
        secure: IS_PRODUCTION,
        maxAge: 30 * 24 * 60 * 60 * 1000
    }
}));
app.use(attachUser);

app.get('/api/config', (req, res) => {
    res.json({turnstileSiteKey: TURNSTILE_SITE_KEY});
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/banner', bannerRoutes);

if (IS_PRODUCTION) {
    const buildDir = path.resolve(__dirname, '..', '..', 'build');
    const staticPages = {
        '/player': 'player.html',
        '/editor': 'editor.html',
        '/fullscreen': 'fullscreen.html',
        '/embed': 'embed.html',
        '/addons': 'addons.html',
        '/credits': 'credits.html'
    };
    app.use(express.static(buildDir));
    Object.entries(staticPages).forEach(([route, file]) => {
        app.get(route, (req, res) => res.sendFile(path.join(buildDir, file)));
    });
    app.get('*', (req, res) => res.sendFile(path.join(buildDir, 'index.html')));
}

app.use(errorHandler);

app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`nyxide-server listening on http://localhost:${PORT}`);
});
