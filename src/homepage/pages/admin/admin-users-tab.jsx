import React from 'react';

import ConfirmModal from '../../components/confirm-modal/confirm-modal.jsx';
import {get, postJson, putJson, del} from '../../lib/api';

import styles from './admin-page.css';

const PAGE_SIZE = 30;

class AdminUsersTab extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            items: [],
            total: 0,
            page: 1,
            search: '',
            loading: true,
            banFormUserId: null,
            banDays: '7',
            banReason: '',
            messageFormUserId: null,
            messageTitle: '',
            messageBody: '',
            messageSentUserId: null,
            deleteTargetUser: null,
            error: null
        };
        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.handleSearchSubmit = this.handleSearchSubmit.bind(this);
        this.handlePrev = this.handlePrev.bind(this);
        this.handleNext = this.handleNext.bind(this);
    }
    componentDidMount () {
        this.load(1);
    }
    load (page) {
        this.setState({loading: true});
        get('/api/admin/users', {page, q: this.state.search})
            .then(data => this.setState({
                items: data.items,
                total: data.total,
                page,
                loading: false
            }))
            .catch(err => this.setState({loading: false, error: err.message}));
    }
    handleSearchChange (e) {
        this.setState({search: e.target.value});
    }
    handleSearchSubmit (e) {
        e.preventDefault();
        this.load(1);
    }
    handlePrev () {
        if (this.state.page > 1) this.load(this.state.page - 1);
    }
    handleNext () {
        if (this.state.page * PAGE_SIZE < this.state.total) this.load(this.state.page + 1);
    }
    toggleRole (user) {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        putJson(`/api/admin/users/${user.id}/role`, {role: newRole})
            .then(() => this.load(this.state.page))
            .catch(err => this.setState({error: err.message}));
    }
    openBanForm (userId) {
        this.setState({banFormUserId: userId, banDays: '7', banReason: ''});
    }
    closeBanForm () {
        this.setState({banFormUserId: null});
    }
    submitBan (userId) {
        putJson(`/api/admin/users/${userId}/ban`, {
            days: Number(this.state.banDays),
            reason: this.state.banReason
        })
            .then(() => {
                this.setState({banFormUserId: null});
                this.load(this.state.page);
            })
            .catch(err => this.setState({error: err.message}));
    }
    unban (userId) {
        putJson(`/api/admin/users/${userId}/unban`, {})
            .then(() => this.load(this.state.page))
            .catch(err => this.setState({error: err.message}));
    }
    openMessageForm (userId) {
        this.setState({messageFormUserId: userId, messageTitle: '', messageBody: '', messageSentUserId: null});
    }
    closeMessageForm () {
        this.setState({messageFormUserId: null});
    }
    submitMessage (userId) {
        postJson(`/api/admin/users/${userId}/message`, {
            title: this.state.messageTitle,
            body: this.state.messageBody
        })
            .then(() => this.setState({messageFormUserId: null, messageSentUserId: userId}))
            .catch(err => this.setState({error: err.message}));
    }
    deleteUser (userId) {
        del(`/api/admin/users/${userId}`)
            .then(() => {
                this.setState({deleteTargetUser: null});
                this.load(this.state.page);
            })
            .catch(err => this.setState({error: err.message, deleteTargetUser: null}));
    }
    render () {
        return (
            <div>
                <form
                    className={styles.inlineForm}
                    onSubmit={this.handleSearchSubmit}
                >
                    <input
                        className={styles.inlineInput}
                        type="text"
                        placeholder="Search username…"
                        value={this.state.search}
                        onChange={this.handleSearchChange}
                    />
                    <button
                        className={styles.smallButton}
                        type="submit"
                    >
                        Search
                    </button>
                </form>
                {this.state.error && <p>{this.state.error}</p>}
                {this.state.loading ? <p>Loading…</p> : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.items.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <a
                                            href={`/users/${user.username}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {user.username}
                                        </a>
                                    </td>
                                    <td>
                                        <span
                                            className={
                                                user.role === 'admin' || user.role === 'owner' ?
                                                    styles.badgeAdmin : styles.badgeUser
                                            }
                                        >
                                            {user.role === 'owner' ? 'Owner' : user.role}
                                        </span>
                                    </td>
                                    <td>
                                        {user.isBanned ? (
                                            <span className={styles.badgeBanned}>
                                                {`Banned until ${new Date(user.bannedUntil).toLocaleDateString()}`}
                                            </span>
                                        ) : 'Active'}
                                    </td>
                                    <td>
                                        <div className={styles.rowActions}>
                                            <button
                                                className={styles.smallButton}
                                                onClick={() => this.toggleRole(user)}
                                            >
                                                {user.role === 'admin' ? 'Demote' : 'Make Admin'}
                                            </button>
                                            {user.isBanned ? (
                                                <button
                                                    className={styles.smallButton}
                                                    onClick={() => this.unban(user.id)}
                                                >
                                                    Unban
                                                </button>
                                            ) : (
                                                <button
                                                    className={styles.smallButton}
                                                    onClick={() => this.openBanForm(user.id)}
                                                >
                                                    Ban
                                                </button>
                                            )}
                                            <button
                                                className={styles.smallButton}
                                                onClick={() => this.openMessageForm(user.id)}
                                            >
                                                Message
                                            </button>
                                            <button
                                                className={styles.smallButtonDanger}
                                                onClick={() => this.setState({deleteTargetUser: user})}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                        {this.state.messageSentUserId === user.id && (
                                            <div>{'Message sent.'}</div>
                                        )}
                                        {this.state.messageFormUserId === user.id && (
                                            <div className={styles.inlineForm}>
                                                <input
                                                    className={styles.inlineInput}
                                                    type="text"
                                                    placeholder="Title"
                                                    value={this.state.messageTitle}
                                                    onChange={e => this.setState({messageTitle: e.target.value})}
                                                />
                                                <input
                                                    className={styles.inlineInput}
                                                    type="text"
                                                    placeholder="Message (optional)"
                                                    value={this.state.messageBody}
                                                    onChange={e => this.setState({messageBody: e.target.value})}
                                                />
                                                <button
                                                    className={styles.smallButton}
                                                    onClick={() => this.submitMessage(user.id)}
                                                    disabled={!this.state.messageTitle.trim()}
                                                >
                                                    Send
                                                </button>
                                                <button
                                                    className={styles.smallButton}
                                                    onClick={() => this.closeMessageForm()}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                        {this.state.banFormUserId === user.id && (
                                            <div className={styles.inlineForm}>
                                                <input
                                                    className={styles.inlineInput}
                                                    type="number"
                                                    min="1"
                                                    style={{width: '4rem'}}
                                                    value={this.state.banDays}
                                                    onChange={e => this.setState({banDays: e.target.value})}
                                                />
                                                <span>days -</span>
                                                <input
                                                    className={styles.inlineInput}
                                                    type="text"
                                                    placeholder="Reason"
                                                    value={this.state.banReason}
                                                    onChange={e => this.setState({banReason: e.target.value})}
                                                />
                                                <button
                                                    className={styles.smallButtonDanger}
                                                    onClick={() => this.submitBan(user.id)}
                                                >
                                                    Confirm Ban
                                                </button>
                                                <button
                                                    className={styles.smallButton}
                                                    onClick={() => this.closeBanForm()}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <div className={styles.pagination}>
                    <div
                        className={styles.paginationButton}
                        onClick={this.handlePrev}
                    >
                        Previous
                    </div>
                    <div
                        className={styles.paginationButton}
                        onClick={this.handleNext}
                    >
                        Next
                    </div>
                </div>
                {this.state.deleteTargetUser && (
                    <ConfirmModal
                        title="Delete Account"
                        body={
                            `Delete "${this.state.deleteTargetUser.username}"'s account and all of their ` +
                            'projects permanently? This cannot be undone.'
                        }
                        confirmLabel="Delete"
                        isDangerous
                        onCancel={() => this.setState({deleteTargetUser: null})}
                        onConfirm={() => this.deleteUser(this.state.deleteTargetUser.id)}
                    />
                )}
            </div>
        );
    }
}

export default AdminUsersTab;
