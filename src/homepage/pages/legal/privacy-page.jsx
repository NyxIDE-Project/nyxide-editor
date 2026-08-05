import React from 'react';

import {APP_NAME} from '../../../lib/brand';
import pageStyles from '../page.css';
import styles from './legal.css';

const PrivacyPage = () => (
    <div className={styles.page}>
        <h1 className={pageStyles.heading}>{'Privacy Policy'}</h1>
        <p className={styles.updated}>{'Last updated: August 5, 2026'}</p>

        <p>{`This page explains what information ${APP_NAME} collects and how it is used. We do not
        sell your data to anyone, and we do not run any analytics or telemetry on this site.`}</p>

        <h2>{'What we collect'}</h2>
        <p>{'When you create an account we store your username, email address, and a hashed '}
            {'version of your password. We never store your password in plain text. If you upload a '}
            {'profile picture, banner, bio, or projects, we store that content so it can be shown on '}
            {'the site.'}</p>
        <p>{'We use a captcha service (Cloudflare Turnstile) to help stop bots from creating '}
            {'accounts. When you complete a captcha, Cloudflare may see your IP address as part of '}
            {"that check. This is outside of our control and is covered by Cloudflare's own privacy "}
            {'policy.'}</p>
        <p>{'We may briefly log IP addresses to prevent abuse, such as spam or attempts to break '}
            {'into accounts. These logs are not used for tracking and are only kept as long as needed '}
            {'to deal with the abuse.'}</p>

        <h2>{'Cookies'}</h2>
        <p>{'We use a single cookie to keep you logged in. We do not use cookies for advertising '}
            {'or for tracking you across other sites.'}</p>

        <h2>{'What we do not do'}</h2>
        <ul>
            <li>{'We do not sell or rent your data to anyone'}</li>
            <li>{'We do not run analytics, telemetry, or tracking scripts'}</li>
            <li>{'We do not show ads'}</li>
            <li>{'We do not share your data with third parties except where required by law'}</li>
        </ul>

        <h2>{'Your content'}</h2>
        <p>{'Anything you choose to make public, such as your profile, projects, and comments, '}
            {'can be seen by anyone who visits the site. Keep that in mind when deciding what to '}
            {'share.'}</p>

        <h2>{'Deleting your data'}</h2>
        <p>{'If you want your account and data removed, contact us and we will take care of it.'}</p>

        <h2>{'Changes'}</h2>
        <p>{'We may update this policy from time to time. Continued use of the site after changes '}
            {'are posted means you accept the updated policy.'}</p>

        <h2>{'Contact'}</h2>
        <p>{'If you have questions about your data or this policy, reach out through our Discord '}
            {'server.'}</p>
    </div>
);

export default PrivacyPage;
