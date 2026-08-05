import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';

import Avatar from '../avatar/avatar.jsx';

import styles from './logged-in-boxes.css';

const AccountCard = ({user}) => (
    <div className={styles.box}>
        <div className={styles.accountHeader}>
            <Avatar
                avatarUrl={user.avatarUrl}
                username={user.username}
                size={56}
            />
            <div>
                <div className={styles.accountName}>{user.displayName || user.username}</div>
                <div className={styles.accountUsername}>{`@${user.username}`}</div>
            </div>
        </div>
        <div className={styles.accountActions}>
            <a
                className={styles.accountButton}
                href="/editor"
            >
                {'Create a Project'}
            </a>
            <Link
                className={styles.accountButton}
                to={`/users/${user.username}`}
            >
                {'View Profile'}
            </Link>
            <Link
                className={styles.accountButton}
                to="/my-projects"
            >
                {'My Projects'}
            </Link>
        </div>
    </div>
);

AccountCard.propTypes = {
    user: PropTypes.shape({
        username: PropTypes.string.isRequired,
        displayName: PropTypes.string,
        avatarUrl: PropTypes.string
    }).isRequired
};

export default AccountCard;
