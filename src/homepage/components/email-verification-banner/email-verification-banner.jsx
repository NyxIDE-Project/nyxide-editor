import React from 'react';
import {Link} from 'react-router-dom';

import {AuthContext} from '../../contexts/auth-context.jsx';

import styles from './email-verification-banner.css';

const EmailVerificationBanner = () => (
    <AuthContext.Consumer>
        {({user}) => {
            if (!user || user.emailVerified) {
                return null;
            }
            return (
                <div className={styles.banner}>
                    <div className={styles.content}>
                        {'Your email isn\'t verified yet - you can\'t upload, edit, or interact with ' +
                            'projects or your profile until it is.'}
                    </div>
                    <Link
                        className={styles.button}
                        to="/settings"
                    >
                        {'Verify Email'}
                    </Link>
                </div>
            );
        }}
    </AuthContext.Consumer>
);

export default EmailVerificationBanner;
