import React from 'react';

import {get, postJson, del} from '../../lib/api';
import ConfirmModal from '../../components/confirm-modal/confirm-modal.jsx';

import pageStyles from '../page.css';
import styles from './admin-page.css';

class AdminEventsTab extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            items: [],
            loading: true,
            title: '',
            content: '',
            isSaving: false,
            error: null,
            deleteTarget: null
        };
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleContentChange = this.handleContentChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    componentDidMount () {
        this.load();
    }
    load () {
        this.setState({loading: true});
        get('/api/admin/events')
            .then(data => this.setState({items: data.items, loading: false}))
            .catch(err => this.setState({loading: false, error: err.message}));
    }
    handleTitleChange (e) {
        this.setState({title: e.target.value});
    }
    handleContentChange (e) {
        this.setState({content: e.target.value});
    }
    handleSubmit (e) {
        e.preventDefault();
        this.setState({isSaving: true, error: null});
        postJson('/api/admin/events', {
            title: this.state.title,
            content: this.state.content
        })
            .then(() => {
                this.setState({title: '', content: '', isSaving: false});
                this.load();
            })
            .catch(err => this.setState({isSaving: false, error: err.message}));
    }
    deleteEvent (id) {
        del(`/api/admin/events/${id}`)
            .then(() => {
                this.setState({deleteTarget: null});
                this.load();
            })
            .catch(err => this.setState({error: err.message, deleteTarget: null}));
    }
    render () {
        return (
            <div>
                <p>
                    {'Events are shown in the "Current Events" box on the homepage for logged-in users, ' +
                        'newest first. Content supports Markdown.'}
                </p>
                <form
                    className={pageStyles.form}
                    onSubmit={this.handleSubmit}
                >
                    <label className={pageStyles.fieldLabel}>
                        Title
                        <input
                            className={pageStyles.textInput}
                            type="text"
                            value={this.state.title}
                            onChange={this.handleTitleChange}
                        />
                    </label>
                    <label className={pageStyles.fieldLabel}>
                        Content (Markdown)
                        <textarea
                            className={pageStyles.textArea}
                            rows={8}
                            value={this.state.content}
                            onChange={this.handleContentChange}
                        />
                    </label>
                    {this.state.error && (
                        <div className={pageStyles.error}>{this.state.error}</div>
                    )}
                    <button
                        className={pageStyles.submitButton}
                        type="submit"
                        disabled={this.state.isSaving || !this.state.title.trim() || !this.state.content.trim()}
                    >
                        {this.state.isSaving ? 'Publishing…' : 'Publish Event'}
                    </button>
                </form>

                <h2 className={pageStyles.heading}>Published Events</h2>
                {this.state.loading ? (
                    <p>Loading…</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Author</th>
                                <th>Published</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.items.map(event => (
                                <tr key={event.id}>
                                    <td>{event.title}</td>
                                    <td>{event.author ? `@${event.author.username}` : '—'}</td>
                                    <td>{new Date(event.createdAt.replace(' ', 'T') + 'Z').toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className={styles.smallButtonDanger}
                                            onClick={() => this.setState({deleteTarget: event})}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!this.state.loading && this.state.items.length === 0 && (
                    <p>No events published yet.</p>
                )}
                {this.state.deleteTarget && (
                    <ConfirmModal
                        title="Delete Event"
                        body={`Delete "${this.state.deleteTarget.title}"? This cannot be undone.`}
                        confirmLabel="Delete"
                        isDangerous
                        onCancel={() => this.setState({deleteTarget: null})}
                        onConfirm={() => this.deleteEvent(this.state.deleteTarget.id)}
                    />
                )}
            </div>
        );
    }
}

export default AdminEventsTab;
