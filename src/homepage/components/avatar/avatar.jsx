import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import {resolveApiUrl} from '../../../lib/nyxide-constants';
import styles from './avatar.css';

const Avatar = ({avatarUrl, username, size, className}) => (
    avatarUrl ? (
        <img
            className={classNames(styles.avatar, className)}
            src={resolveApiUrl(avatarUrl)}
            alt={username || 'User avatar'}
            style={{width: size, height: size}}
        />
    ) : (
        <span
            className={classNames(styles.avatar, styles.placeholder, className)}
            style={{width: size, height: size, fontSize: size * 0.45}}
        >
            {username ? username.charAt(0).toUpperCase() : '?'}
        </span>
    )
);

Avatar.propTypes = {
    avatarUrl: PropTypes.string,
    className: PropTypes.string,
    size: PropTypes.number,
    username: PropTypes.string
};

Avatar.defaultProps = {
    size: 40
};

export default Avatar;
