import PropTypes from 'prop-types';
import React from 'react';
import {Redirect} from 'react-router-dom';

import {AuthContext} from '../../contexts/auth-context.jsx';
import {putJson, postForm} from '../../lib/api';
import {MAX_BANNER_BYTES, MAX_AVATAR_BYTES, API_BASE_URL, resolveApiUrl} from '../../../lib/nyxide-constants';
import UsernameForm from './username-form.jsx';

import styles from '../page.css';

const GOOGLE_LINK_ERROR_MESSAGES = {
    google_state_mismatch: 'Linking with Google failed (session expired). Please try again.',
    google_denied: 'Linking with Google was cancelled.',
    google_token_failed: 'Linking with Google failed. Please try again.',
    google_profile_failed: 'Linking with Google failed. Please try again.',
    google_link_session: 'You were logged out before linking finished. Please log in and try again.',
    google_already_linked: 'That Google account is already linked to a different NyxIDE account.'
};

const googleLinkStatusFromUrl = () => {
    if (typeof window === 'undefined') {
        return {};
    }
    const params = new URLSearchParams(window.location.search);
    const code = params.get('error');
    return {
        googleLinkSuccess: params.get('linked') === 'google',
        googleLinkError: code && GOOGLE_LINK_ERROR_MESSAGES[code] ? GOOGLE_LINK_ERROR_MESSAGES[code] : null
    };
};

class SettingsForm extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            displayName: props.user.displayName || '',
            email: props.user.email || '',
            bio: props.user.bio || '',
            avatarFile: null,
            bannerFile: null,
            bannerPreviewUrl: resolveApiUrl(props.user.bannerUrl) || null,
            saved: false,
            error: null,
            isSaving: false,
            ...googleLinkStatusFromUrl()
        };
        this.handleDisplayNameChange = this.handleDisplayNameChange.bind(this);
        this.handleEmailChange = this.handleEmailChange.bind(this);
        this.handleBioChange = this.handleBioChange.bind(this);
        this.handleAvatarChange = this.handleAvatarChange.bind(this);
        this.handleBannerChange = this.handleBannerChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    handleDisplayNameChange (e) {
        this.setState({displayName: e.target.value, saved: false});
    }
    handleEmailChange (e) {
        this.setState({email: e.target.value, saved: false});
    }
    handleBioChange (e) {
        this.setState({bio: e.target.value, saved: false});
    }
    handleAvatarChange (e) {
        const file = e.target.files[0] || null;
        if (file && file.size > MAX_AVATAR_BYTES) {
            this.setState({error: 'That image is larger than the 1MB profile picture limit.'});
            return;
        }
        this.setState({avatarFile: file, saved: false, error: null});
    }
    handleBannerChange (e) {
        const file = e.target.files[0] || null;
        if (file && file.size > MAX_BANNER_BYTES) {
            this.setState({error: 'That image is larger than the 2MB banner limit.'});
            return;
        }
        this.setState({
            bannerFile: file,
            bannerPreviewUrl: file ? URL.createObjectURL(file) : this.state.bannerPreviewUrl,
            saved: false,
            error: null
        });
    }
    async handleSubmit (e) {
        e.preventDefault();
        this.setState({isSaving: true, error: null});
        try {
            await putJson('/api/users/me', {
                displayName: this.state.displayName,
                bio: this.state.bio
            });
            if (this.state.email !== (this.props.user.email || '')) {
                await this.props.updateEmail(this.state.email);
            }
            if (this.state.avatarFile) {
                const formData = new FormData();
                formData.append('avatar', this.state.avatarFile);
                await postForm('/api/users/me/avatar', formData);
            }
            if (this.state.bannerFile) {
                const formData = new FormData();
                formData.append('banner', this.state.bannerFile);
                await postForm('/api/users/me/banner', formData);
            }
            this.setState({isSaving: false, saved: true});
        } catch (err) {
            this.setState({isSaving: false, error: err.message});
        }
    }
    render () {
        return (
            <div>
                <h1 className={styles.heading}>Account Settings</h1>

                <h2 className={styles.heading}>Username</h2>
                <UsernameForm
                    user={this.props.user}
                    updateUsername={this.props.updateUsername}
                />

                <h2 className={styles.heading}>Profile</h2>
                <form
                    className={styles.form}
                    onSubmit={this.handleSubmit}
                >
                    <label className={styles.fieldLabel}>
                        Display Name
                        <input
                            className={styles.textInput}
                            type="text"
                            value={this.state.displayName}
                            onChange={this.handleDisplayNameChange}
                        />
                    </label>
                    <label className={styles.fieldLabel}>
                        Email
                        <input
                            className={styles.textInput}
                            type="email"
                            value={this.state.email}
                            onChange={this.handleEmailChange}
                        />
                    </label>
                    <label className={styles.fieldLabel}>
                        Bio
                        <textarea
                            className={styles.textArea}
                            value={this.state.bio}
                            onChange={this.handleBioChange}
                        />
                    </label>
                    <label className={styles.fieldLabel}>
                        Banner (max 2MB)
                        {this.state.bannerPreviewUrl && (
                            <img
                                className={styles.bannerPreview}
                                src={this.state.bannerPreviewUrl}
                                alt="Banner preview"
                            />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={this.handleBannerChange}
                        />
                    </label>
                    <label className={styles.fieldLabel}>
                        Profile Picture (max 1MB)
                        <input
                            type="file"
                            accept="image/*"
                            onChange={this.handleAvatarChange}
                        />
                    </label>
                    {this.state.error && (
                        <div className={styles.error}>{this.state.error}</div>
                    )}
                    {this.state.saved && !this.state.error && (
                        <div>Saved!</div>
                    )}
                    <button
                        className={styles.submitButton}
                        type="submit"
                        disabled={this.state.isSaving}
                    >
                        {this.state.isSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                </form>

                <div className={styles.settingsSection}>
                    <h2 className={styles.heading}>Linked Accounts</h2>
                    {this.state.googleLinkSuccess && (
                        <div>Your Google account is now linked.</div>
                    )}
                    {this.state.googleLinkError && (
                        <div className={styles.error}>{this.state.googleLinkError}</div>
                    )}
                    {this.props.user.googleLinked ? (
                        <div>Google account linked.</div>
                    ) : (
                        <a
                            className={styles.linkButton}
                            href={`${API_BASE_URL}/api/auth/google/link`}
                        >
                            Link Google Account
                        </a>
                    )}
                </div>
            </div>
        );
    }
}

SettingsForm.propTypes = {
    user: PropTypes.shape({
        username: PropTypes.string.isRequired,
        bio: PropTypes.string,
        displayName: PropTypes.string,
        email: PropTypes.string,
        bannerUrl: PropTypes.string,
        usernameChangedAt: PropTypes.number,
        googleLinked: PropTypes.bool
    }).isRequired,
    updateEmail: PropTypes.func.isRequired,
    updateUsername: PropTypes.func.isRequired
};

const SettingsPage = () => (
    <AuthContext.Consumer>
        {({user, loading, updateEmail, updateUsername}) => {
            if (loading) {
                return <div className={styles.loading}>Loading…</div>;
            }
            if (!user) {
                return <Redirect to="/login" />;
            }
            return (
                <SettingsForm
                    user={user}
                    updateEmail={updateEmail}
                    updateUsername={updateUsername}
                />
            );
        }}
    </AuthContext.Consumer>
);

export default SettingsPage;
