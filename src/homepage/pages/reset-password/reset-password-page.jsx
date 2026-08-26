import React from 'react';
import {Link} from 'react-router-dom';

import {postJson} from '../../lib/api';

import styles from '../page.css';

const getToken = () => (
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('token')
);

class ResetPasswordPage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            password: '',
            confirmPassword: '',
            error: null,
            isSubmitting: false,
            done: false
        };
        this.token = getToken();
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleConfirmChange = this.handleConfirmChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    handlePasswordChange (e) {
        this.setState({password: e.target.value});
    }
    handleConfirmChange (e) {
        this.setState({confirmPassword: e.target.value});
    }
    async handleSubmit (e) {
        e.preventDefault();
        if (this.state.password !== this.state.confirmPassword) {
            this.setState({error: 'Passwords do not match'});
            return;
        }
        this.setState({isSubmitting: true, error: null});
        try {
            await postJson('/api/auth/reset-password', {token: this.token, password: this.state.password});
            this.setState({isSubmitting: false, done: true});
        } catch (err) {
            this.setState({isSubmitting: false, error: err.message});
        }
    }
    render () {
        if (!this.token) {
            return (
                <div>
                    <h1 className={styles.heading}>Reset Password</h1>
                    <div className={styles.error}>This reset link is missing its token.</div>
                </div>
            );
        }
        if (this.state.done) {
            return (
                <div>
                    <h1 className={styles.heading}>Password reset</h1>
                    <p>Your password has been changed. You can now log in with it.</p>
                    <Link to="/login">Go to log in</Link>
                </div>
            );
        }
        return (
            <div>
                <h1 className={styles.heading}>Reset Password</h1>
                <form
                    className={styles.form}
                    onSubmit={this.handleSubmit}
                >
                    <label className={styles.fieldLabel}>
                        New Password
                        <input
                            className={styles.textInput}
                            type="password"
                            value={this.state.password}
                            onChange={this.handlePasswordChange}
                        />
                    </label>
                    <label className={styles.fieldLabel}>
                        Confirm New Password
                        <input
                            className={styles.textInput}
                            type="password"
                            value={this.state.confirmPassword}
                            onChange={this.handleConfirmChange}
                        />
                    </label>
                    {this.state.error && (
                        <div className={styles.error}>{this.state.error}</div>
                    )}
                    <button
                        className={styles.submitButton}
                        type="submit"
                        disabled={this.state.isSubmitting}
                    >
                        {this.state.isSubmitting ? 'Resetting…' : 'Reset Password'}
                    </button>
                </form>
            </div>
        );
    }
}

export default ResetPasswordPage;
