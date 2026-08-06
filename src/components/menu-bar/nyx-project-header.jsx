import PropTypes from 'prop-types';
import React from 'react';

import Avatar from '../../homepage/components/avatar/avatar.jsx';

import styles from './nyx-project-header.css';

const TITLE_TRUNCATE_LENGTH = 30;

class NyxProjectHeader extends React.Component {
    constructor (props) {
        super(props);
        this.state = {expanded: false};
        this.handleToggleTitle = this.handleToggleTitle.bind(this);
    }
    handleToggleTitle () {
        this.setState(state => ({expanded: !state.expanded}));
    }
    render () {
        const {title, authorUsername, authorThumbnailUrl} = this.props;
        if (!title) {
            return null;
        }
        const isTruncatable = title.length > TITLE_TRUNCATE_LENGTH;
        const displayTitle = isTruncatable && !this.state.expanded ?
            `${title.slice(0, TITLE_TRUNCATE_LENGTH)}…` : title;
        return (
            <div className={styles.container}>
                <Avatar
                    avatarUrl={authorThumbnailUrl}
                    username={authorUsername}
                    size={48}
                />
                <div className={styles.info}>
                    <div
                        className={isTruncatable ? styles.titleTruncatable : styles.title}
                        onClick={isTruncatable ? this.handleToggleTitle : null}
                    >
                        {displayTitle}
                    </div>
                    {authorUsername && (
                        <a
                            className={styles.author}
                            href={`/users/${authorUsername}`}
                        >
                            {`By: ${authorUsername}`}
                        </a>
                    )}
                </div>
            </div>
        );
    }
}

NyxProjectHeader.propTypes = {
    title: PropTypes.string,
    authorUsername: PropTypes.string,
    authorThumbnailUrl: PropTypes.string
};

export default NyxProjectHeader;
