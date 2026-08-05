import React from 'react';

import {APP_NAME} from '../../../lib/brand';
import pageStyles from '../page.css';
import styles from './legal.css';

const GuidelinesPage = () => (
    <div className={styles.page}>
        <h1 className={pageStyles.heading}>{'Uploading Guidelines'}</h1>
        <p className={styles.updated}>{'Last updated: August 5, 2026'}</p>

        <p>{`These are the rules for uploading projects to ${APP_NAME}. They exist to keep the site
        safe and enjoyable, so please read them before you upload.`}</p>

        <h2>{'File requirements'}</h2>
        <ul>
            <li>{'Projects must be a .ny file'}</li>
            <li>{'Max file size is 25 MB'}</li>
            <li>{'You can add an optional thumbnail image for your project'}</li>
        </ul>

        <h2>{'Content rules'}</h2>
        <ul>
            <li>{'No sexual, pornographic, or otherwise not safe for a general audience content'}</li>
            <li>{'No excessive violence or gore'}</li>
            <li>{'No hate speech or content targeting a person or group'}</li>
            <li>{'No content promoting self harm, drugs, or other dangerous behavior'}</li>
            <li>{'No swearing in project titles or descriptions'}</li>
            <li>{'No chatroom projects. Projects built only to let people chat with each other are not allowed'}</li>
            <li>
                {'No projects that are just a web browser or that exist mainly to load other '}
                {'websites through an iframe'}
            </li>
            <li>{"No malware, cryptominers, or scripts meant to harm someone's device or account"}</li>
            <li>{'No spam or low effort uploads meant to flood the site'}</li>
        </ul>

        <h2>{'Ownership'}</h2>
        <p>{'Only upload projects you made yourself or that you have permission to share. If your '}
            {"project remixes or is based on someone else's work, credit them in the description."}</p>

        <h2>{'Enforcement'}</h2>
        <p>{'Projects that break these guidelines may be removed without warning. Repeated '}
            {'violations can lead to a suspended or banned account. If you see a project that breaks '}
            {'these rules, please report it.'}</p>
    </div>
);

export default GuidelinesPage;
