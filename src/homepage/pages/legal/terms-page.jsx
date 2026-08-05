import React from 'react';

import {APP_NAME} from '../../../lib/brand';
import pageStyles from '../page.css';
import styles from './legal.css';

const TermsPage = () => (
    <div className={styles.page}>
        <h1 className={pageStyles.heading}>{'Terms of Service'}</h1>
        <p className={styles.updated}>{'Last updated: August 5, 2026'}</p>

        <p>{`Welcome to ${APP_NAME}. These terms explain what you can expect from us and what we
        expect from you when you use this site. By creating an account or using ${APP_NAME}, you
        agree to these terms.`}</p>

        <h2>{'Accounts'}</h2>
        <p>{`You need to be at least 13 years old to create an account, the same rule Scratch uses.
        You are responsible for what happens on your account, so keep your password to yourself
        and do not share your login with anyone else. Do not create an account for someone else
        or pretend to be someone you are not. One account per person, please.`}</p>

        <h2>{'Acceptable Use'}</h2>
        <p>{`${APP_NAME} is meant to be a place where people can build, share, and play Scratch
        projects. To keep it that way, do not:`}</p>
        <ul>
            <li>{'Post anything sexual, pornographic, or otherwise not safe for a general audience'}</li>
            <li>{'Post content that is violent, gory, or intended to shock or disturb people'}</li>
            <li>{'Harass, bully, threaten, or target another user'}</li>
            <li>
                {'Post hate speech or content that attacks people based on race, religion, '}
                {'gender, sexuality, disability, or anything like that'}
            </li>
            <li>{'Post content that promotes self harm, drugs, or other dangerous behavior'}</li>
            <li>{'Impersonate another person, project, or organization'}</li>
            <li>{'Spam the site with repeated posts, comments, or projects'}</li>
            <li>{"Upload malware, viruses, or scripts meant to damage someone's device or account"}</li>
            <li>{"Try to hack, exploit, or disrupt the site or other users' accounts"}</li>
        </ul>
        <p>{'This is not a complete list. Use common sense. If something feels like it does not '}
            {'belong on a platform like this, it probably does not.'}</p>

        <h2>{'Your Content'}</h2>
        <p>{'You keep ownership of anything you upload, including projects, images, and comments. '}
            {'By uploading content you give us permission to host it and display it to other users so '}
            {'the site can function. Only upload projects you made yourself or that you have '}
            {"permission to share. If you remix someone else's work, give them credit."}</p>

        <h2>{'Moderation'}</h2>
        <p>{'We may remove content, issue warnings, or suspend or ban accounts that break these '}
            {'terms. Reports are reviewed by our moderators. Decisions about moderation are '}
            {'ultimately up to us.'}</p>

        <h2>{'Termination'}</h2>
        <p>{'You can delete your account at any time. We may suspend or terminate accounts that '}
            {'violate these terms or that we believe are harmful to the community.'}</p>

        <h2>{'Changes'}</h2>
        <p>{'We may update these terms from time to time. If we make significant changes we will '}
            {'try to let users know. Continuing to use the site after changes take effect means you '}
            {'accept the updated terms.'}</p>

        <h2>{'Disclaimer'}</h2>
        <p>{`${APP_NAME} is provided as is, without warranties of any kind. We are not affiliated
        with the Scratch Team or MIT. Scratch is a project of the Scratch Foundation.`}</p>

        <h2>{'Contact'}</h2>
        <p>{'Questions about these terms can be sent to us through our Discord server.'}</p>
    </div>
);

export default TermsPage;
