import React from 'react';
import classNames from 'classnames';

import {get, postJson, del} from '../../lib/api';
import bellIcon from './bell-icon.svg';

// nyxide: reuse the editor's own menu-bar-item/hoverable classes so this trigger looks
// (square corners, same hover treatment) exactly like every other button in the bar.
import menuBarStyles from '../../../components/menu-bar/menu-bar.css';
import styles from './notification-bell.css';

const POLL_INTERVAL_MS = 30000;

// SQLite's datetime('now') returns "YYYY-MM-DD HH:MM:SS" (UTC, no separator/zone) - convert
// to a format every browser's Date parser accepts unambiguously as UTC.
const timeAgo = sqliteTimestamp => {
    const parsed = new Date(`${sqliteTimestamp.replace(' ', 'T')}Z`);
    const seconds = Math.floor((Date.now() - parsed.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

class NotificationBell extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            isOpen: false,
            unreadCount: 0,
            items: [],
            loading: false
        };
        this.handleToggle = this.handleToggle.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleMarkAllRead = this.handleMarkAllRead.bind(this);
        this.handleClearAll = this.handleClearAll.bind(this);
    }
    componentDidMount () {
        this.refreshUnreadCount();
        this.pollTimer = setInterval(() => this.refreshUnreadCount(), POLL_INTERVAL_MS);
    }
    componentWillUnmount () {
        clearInterval(this.pollTimer);
    }
    refreshUnreadCount () {
        get('/api/notifications/unread-count')
            .then(data => this.setState({unreadCount: data.unreadCount}))
            .catch(() => {});
    }
    handleToggle () {
        const willOpen = !this.state.isOpen;
        this.setState({isOpen: willOpen});
        if (willOpen) {
            this.setState({loading: true});
            get('/api/notifications', {page: 1})
                .then(data => this.setState({
                    items: data.items,
                    unreadCount: data.unreadCount,
                    loading: false
                }))
                .catch(() => this.setState({loading: false}));
        }
    }
    handleClose () {
        this.setState({isOpen: false});
    }
    handleMarkAllRead () {
        postJson('/api/notifications/read-all', {})
            .then(() => this.setState(state => ({
                unreadCount: 0,
                items: state.items.map(item => ({...item, isRead: true}))
            })))
            .catch(() => {});
    }
    handleDismiss (id, e) {
        e.stopPropagation();
        del(`/api/notifications/${id}`)
            .then(() => this.setState(state => {
                const removed = state.items.find(item => item.id === id);
                return {
                    items: state.items.filter(item => item.id !== id),
                    unreadCount: removed && !removed.isRead ?
                        Math.max(0, state.unreadCount - 1) : state.unreadCount
                };
            }))
            .catch(() => {});
    }
    handleClearAll () {
        del('/api/notifications')
            .then(() => this.setState({items: [], unreadCount: 0}))
            .catch(() => {});
    }
    render () {
        return (
            <div className={styles.wrapper}>
                <div
                    className={classNames(menuBarStyles.menuBarItem, menuBarStyles.hoverable, styles.trigger)}
                    onClick={this.handleToggle}
                >
                    <img
                        className={styles.icon}
                        src={bellIcon}
                        alt="Notifications"
                        draggable={false}
                    />
                    {this.state.unreadCount > 0 && (
                        <span className={styles.badge}>
                            {this.state.unreadCount > 99 ? '99+' : this.state.unreadCount}
                        </span>
                    )}
                </div>
                {this.state.isOpen && (
                    <React.Fragment>
                        <div
                            className={styles.overlay}
                            onClick={this.handleClose}
                        />
                        <div className={styles.popup}>
                            <div className={styles.popupHeader}>
                                <span>Notifications</span>
                                <div className={styles.headerActions}>
                                    {this.state.unreadCount > 0 && (
                                        <span
                                            className={styles.markAllRead}
                                            onClick={this.handleMarkAllRead}
                                        >
                                            Mark all read
                                        </span>
                                    )}
                                    {this.state.items.length > 0 && (
                                        <span
                                            className={styles.markAllRead}
                                            onClick={this.handleClearAll}
                                        >
                                            Clear all
                                        </span>
                                    )}
                                </div>
                            </div>
                            {this.state.loading ? (
                                <div className={styles.empty}>Loading…</div>
                            ) : this.state.items.length > 0 ? (
                                <div className={styles.list}>
                                    {this.state.items.map(item => (
                                        <div
                                            key={item.id}
                                            className={item.isRead ? styles.item : styles.itemUnread}
                                        >
                                            <div className={styles.itemHeader}>
                                                <div className={styles.itemTitle}>{item.title}</div>
                                                <span
                                                    className={styles.itemDismiss}
                                                    onClick={e => this.handleDismiss(item.id, e)}
                                                    title="Remove notification"
                                                >
                                                    {'✕'}
                                                </span>
                                            </div>
                                            {item.body && (
                                                <div className={styles.itemBody}>{item.body}</div>
                                            )}
                                            <div className={styles.itemTime}>{timeAgo(item.createdAt)}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.empty}>{"You're all caught up."}</div>
                            )}
                        </div>
                    </React.Fragment>
                )}
            </div>
        );
    }
}

export default NotificationBell;
