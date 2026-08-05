import React from 'react';

import {get} from '../../lib/api';

import styles from './logged-in-boxes.css';

class CommitsBox extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            items: [],
            loading: true,
            error: null
        };
    }
    componentDidMount () {
        get('/api/github/commits')
            .then(data => this.setState({items: data.items, loading: false}))
            .catch(err => this.setState({loading: false, error: err.message}));
    }
    render () {
        return (
            <div className={styles.box}>
                <h2 className={styles.boxHeading}>{'Recent Commits'}</h2>
                <div className={styles.boxScroll}>
                    {this.state.loading ? (
                        <div className={styles.boxMessage}>{'Loading…'}</div>
                    ) : this.state.error ? (
                        <div className={styles.boxMessage}>{this.state.error}</div>
                    ) : this.state.items.length === 0 ? (
                        <div className={styles.boxMessage}>{'No commits found.'}</div>
                    ) : (
                        this.state.items.map(commit => (
                            <a
                                key={commit.sha}
                                className={styles.commitItem}
                                href={commit.url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {commit.author.avatarUrl ? (
                                    <img
                                        className={styles.commitAvatar}
                                        src={commit.author.avatarUrl}
                                        alt={commit.author.username}
                                    />
                                ) : (
                                    <span className={styles.commitAvatarPlaceholder} />
                                )}
                                <div className={styles.commitInfo}>
                                    <div className={styles.commitAuthor}>{commit.author.username}</div>
                                    <div className={styles.commitMessage}>{commit.message}</div>
                                </div>
                            </a>
                        ))
                    )}
                </div>
            </div>
        );
    }
}

export default CommitsBox;
