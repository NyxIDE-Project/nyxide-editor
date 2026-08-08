import React, {useContext} from 'react';
import {useLocation} from 'react-router-dom';

import {AuthContext} from '../../contexts/auth-context.jsx';

import styles from './hero-banner.css';

// Only shown to logged-out visitors on the homepage, as a landing pitch for the site - once
// you have an account (or you're deeper in the site) there's nothing new for it to tell you.
// Rendered as a sibling of <main> (see app.jsx) rather than inside it, so it can span the
// full page width instead of being boxed in by .main's max-width/padding.
const HeroBanner = () => {
    const {user, loading} = useContext(AuthContext);
    const location = useLocation();
    if (loading || user || location.pathname !== '/') {
        return null;
    }
    return (
        <div className={styles.banner}>
            <div className={styles.inner}>
                <div className={styles.pitch}>
                    <h1 className={styles.headline}>{'Block-based coding with tons of capabilities'}</h1>
                    <p className={styles.subheadline}>
                        {'Built off of '}
                        <a
                            className={styles.pitchLink}
                            href="https://scratch.mit.edu"
                            target="_blank"
                            rel="noreferrer"
                        >
                            {'Scratch'}
                        </a>
                        {' and '}
                        <a
                            className={styles.pitchLink}
                            href="https://turbowarp.org"
                            target="_blank"
                            rel="noreferrer"
                        >
                            {'TurboWarp'}
                        </a>
                    </p>
                    <a
                        className={styles.tryButton}
                        href="/editor"
                    >
                        {'Try it out'}
                    </a>
                </div>
                <img
                    className={styles.mascotImage}
                    src="/mascot/default.svg"
                    alt="NyxIDE mascot"
                />
            </div>
        </div>
    );
};

export default HeroBanner;
