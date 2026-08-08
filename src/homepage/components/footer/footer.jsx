import React from 'react';
import {Link} from 'react-router-dom';

import {APP_NAME} from '../../../lib/brand';
import styles from './footer.css';

const Footer = () => (
    <footer className={styles.footer}>
        <div className={styles.inner}>
            <div className={styles.columns}>
                <div className={styles.column}>
                    <div className={styles.columnHeading}>{'Website'}</div>
                    <a
                        className={styles.link}
                        href="/editor"
                    >
                        {'Editor'}
                    </a>
                    <Link
                        className={styles.link}
                        to="/"
                    >
                        {'Homepage'}
                    </Link>
                    <a
                        className={styles.link}
                        href="/player"
                    >
                        {'Player'}
                    </a>
                    <Link
                        className={styles.link}
                        to="/desktop"
                    >
                        {'Desktop'}
                    </Link>
                </div>
                <div className={styles.column}>
                    <div className={styles.columnHeading}>{'Info'}</div>
                    <Link
                        className={styles.link}
                        to="/terms"
                    >
                        {'Terms of Service'}
                    </Link>
                    <Link
                        className={styles.link}
                        to="/privacy"
                    >
                        {'Privacy Policy'}
                    </Link>
                    <Link
                        className={styles.link}
                        to="/guidelines"
                    >
                        {'Uploading Guidelines'}
                    </Link>
                </div>
                <div className={styles.column}>
                    <div className={styles.columnHeading}>{'Community'}</div>
                    <a
                        className={styles.link}
                        href="https://discord.gg/mYdcjn6YMV"
                        target="_blank"
                        rel="noreferrer"
                    >
                        {'Discord'}
                    </a>
                </div>
            </div>
            <div className={styles.bottomRow}>
                {`${APP_NAME} is not affiliated with Turbowarp, the Scratch Team or MIT.`}
            </div>
        </div>
    </footer>
);

export default Footer;
