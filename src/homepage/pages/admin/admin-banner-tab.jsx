import React from 'react';

import {get, putJson} from '../../lib/api';

import pageStyles from '../page.css';

class AdminBannerTab extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            loading: true,
            enabled: false,
            color: '#4cff8e',
            content: '',
            buttonText: '',
            buttonUrl: '',
            isSaving: false,
            saved: false,
            error: null
        };
        this.handleEnabledChange = this.handleEnabledChange.bind(this);
        this.handleColorChange = this.handleColorChange.bind(this);
        this.handleContentChange = this.handleContentChange.bind(this);
        this.handleButtonTextChange = this.handleButtonTextChange.bind(this);
        this.handleButtonUrlChange = this.handleButtonUrlChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    componentDidMount () {
        get('/api/admin/banner')
            .then(banner => this.setState({
                loading: false,
                enabled: banner.enabled,
                color: banner.color,
                content: banner.content,
                buttonText: banner.buttonText || '',
                buttonUrl: banner.buttonUrl || ''
            }))
            .catch(err => this.setState({loading: false, error: err.message}));
    }
    handleEnabledChange (e) {
        this.setState({enabled: e.target.checked, saved: false});
    }
    handleColorChange (e) {
        this.setState({color: e.target.value, saved: false});
    }
    handleContentChange (e) {
        this.setState({content: e.target.value, saved: false});
    }
    handleButtonTextChange (e) {
        this.setState({buttonText: e.target.value, saved: false});
    }
    handleButtonUrlChange (e) {
        this.setState({buttonUrl: e.target.value, saved: false});
    }
    handleSubmit (e) {
        e.preventDefault();
        this.setState({isSaving: true, error: null, saved: false});
        putJson('/api/admin/banner', {
            enabled: this.state.enabled,
            color: this.state.color,
            content: this.state.content,
            buttonText: this.state.buttonText,
            buttonUrl: this.state.buttonUrl
        })
            .then(banner => this.setState({
                isSaving: false,
                saved: true,
                enabled: banner.enabled,
                color: banner.color,
                content: banner.content,
                buttonText: banner.buttonText || '',
                buttonUrl: banner.buttonUrl || ''
            }))
            .catch(err => this.setState({isSaving: false, error: err.message}));
    }
    render () {
        if (this.state.loading) {
            return <div className={pageStyles.loading}>Loading…</div>;
        }
        return (
            <div>
                <p>
                    {'A bar shown under the topbar on the homepage and player page. Visitors can dismiss it, ' +
                        'but it comes back on their next page load.'}
                </p>
                <form
                    className={pageStyles.form}
                    onSubmit={this.handleSubmit}
                >
                    <label className={pageStyles.fieldLabel}>
                        <input
                            type="checkbox"
                            checked={this.state.enabled}
                            onChange={this.handleEnabledChange}
                        />
                        {' Enabled'}
                    </label>
                    <label className={pageStyles.fieldLabel}>
                        Color
                        <input
                            type="color"
                            value={this.state.color}
                            onChange={this.handleColorChange}
                        />
                    </label>
                    <label className={pageStyles.fieldLabel}>
                        Content
                        <textarea
                            className={pageStyles.textArea}
                            rows={3}
                            maxLength={300}
                            value={this.state.content}
                            onChange={this.handleContentChange}
                        />
                    </label>
                    <label className={pageStyles.fieldLabel}>
                        Button Text (optional)
                        <input
                            className={pageStyles.textInput}
                            type="text"
                            maxLength={40}
                            value={this.state.buttonText}
                            onChange={this.handleButtonTextChange}
                        />
                    </label>
                    <label className={pageStyles.fieldLabel}>
                        Button Link (optional)
                        <input
                            className={pageStyles.textInput}
                            type="text"
                            placeholder="https://... or /desktop"
                            value={this.state.buttonUrl}
                            onChange={this.handleButtonUrlChange}
                        />
                    </label>
                    {this.state.error && (
                        <div className={pageStyles.error}>{this.state.error}</div>
                    )}
                    {this.state.saved && !this.state.error && (
                        <div>Saved!</div>
                    )}
                    <button
                        className={pageStyles.submitButton}
                        type="submit"
                        disabled={this.state.isSaving}
                    >
                        {this.state.isSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                </form>
            </div>
        );
    }
}

export default AdminBannerTab;
