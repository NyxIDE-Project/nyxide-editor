import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';

import {AuthContext} from '../../contexts/auth-context.jsx';
import {postJson} from '../../lib/api';

import styles from '../page.css';

const getToken = () => (
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('token')
);

class DeleteAccountForm extends React.Component {
    constructor (props) {
        super(props);
        this.state = {password: '', error: null, isSubmitting: false, done: false};
        this.token = getToken();
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    handlePasswordChange (e) {
        this.setState({password: e.target.value});
    }
    async handleSubmit (e) {
        e.preventDefault();
        this.setState({isSubmitting: true, error: null});
        try {
            await postJson('/api/auth/confirm-account-deletion', {token: this.token, password: this.state.password});
            this.props.onDeleted().catch(() => {});
            this.setState({isSubmitting: false, done: true});
        } catch (err) {
            this.setState({isSubmitting: false, error: err.message});
        }
    }
    render () {
        if (!this.token) {
            return (
                <div>
                    <h1 className={styles.heading}>Delete Account</h1>
                    <div className={styles.error}>This link is missing its token.</div>
                </div>
            );
        }
        if (this.state.done) {
            return (
                <div>
                    <h1 className={styles.heading}>Account deleted</h1>
                    <p>Your account and all of its projects have been permanently deleted.</p>
                    <Link to="/">Back to NyxIDE</Link>
                </div>
            );
        }
        return (
            <div>
                <h1 className={styles.heading}>Delete Account</h1>
                <p>This is the last step. Enter your password to permanently delete your account and every
                    project on it. This cannot be undone.</p>
                <form
                    className={styles.form}
                    onSubmit={this.handleSubmit}
                >
                    <label className={styles.fieldLabel}>
                        Password
                        <input
                            className={styles.textInput}
                            type="password"
                            value={this.state.password}
                            onChange={this.handlePasswordChange}
                        />
                    </label>
                    {this.state.error && (
                        <div className={styles.error}>{this.state.error}</div>
                    )}
                    <button
                        className={styles.submitButton}
                        type="submit"
                        disabled={this.state.isSubmitting || !this.state.password}
                    >
                        {this.state.isSubmitting ? 'Deleting…' : 'Permanently Delete My Account'}
                    </button>
                </form>
            </div>
        );
    }
}

DeleteAccountForm.propTypes = {
    onDeleted: PropTypes.func.isRequired
};

const DeleteAccountPage = () => (
    <AuthContext.Consumer>
        {({logout}) => <DeleteAccountForm onDeleted={logout} />}
    </AuthContext.Consumer>
);

export default DeleteAccountPage;
