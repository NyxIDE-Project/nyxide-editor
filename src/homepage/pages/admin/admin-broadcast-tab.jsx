import React from 'react';

import {postJson} from '../../lib/api';

import pageStyles from '../page.css';

class AdminBroadcastTab extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            title: '',
            body: '',
            isSending: false,
            result: null,
            error: null
        };
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleBodyChange = this.handleBodyChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    handleTitleChange (e) {
        this.setState({title: e.target.value});
    }
    handleBodyChange (e) {
        this.setState({body: e.target.value});
    }
    handleSubmit (e) {
        e.preventDefault();
        this.setState({isSending: true, error: null, result: null});
        postJson('/api/admin/notifications/broadcast', {
            title: this.state.title,
            body: this.state.body
        })
            .then(data => this.setState({
                isSending: false,
                result: `Sent to ${data.sentTo} users.`,
                title: '',
                body: ''
            }))
            .catch(err => this.setState({isSending: false, error: err.message}));
    }
    render () {
        return (
            <div>
                <p>Send a notification to every registered user.</p>
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
                        Message
                        <textarea
                            className={pageStyles.textArea}
                            rows={5}
                            value={this.state.body}
                            onChange={this.handleBodyChange}
                        />
                    </label>
                    {this.state.error && (
                        <div className={pageStyles.error}>{this.state.error}</div>
                    )}
                    {this.state.result && <div>{this.state.result}</div>}
                    <button
                        className={pageStyles.submitButton}
                        type="submit"
                        disabled={this.state.isSending || !this.state.title.trim()}
                    >
                        {this.state.isSending ? 'Sending…' : 'Send to Everyone'}
                    </button>
                </form>
            </div>
        );
    }
}

export default AdminBroadcastTab;
