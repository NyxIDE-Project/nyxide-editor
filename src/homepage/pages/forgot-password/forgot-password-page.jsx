import React from 'react';
import {Link} from 'react-router-dom';

import {postJson} from '../../lib/api';
import TurnstileWidget from '../../components/turnstile-widget/turnstile-widget.jsx';

import styles from '../page.css';

class ForgotPasswordPage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            email: '',
            turnstileToken: null,
            error: null,
            isSubmitting: false,
            submitted: false
        };
        this.turnstileRef = React.createRef();
        this.handleEmailChange = this.handleEmailChange.bind(this);
        this.handleTurnstileVerify = this.handleTurnstileVerify.bind(this);
        this.handleTurnstileExpire = this.handleTurnstileExpire.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    handleEmailChange (e) {
        this.setState({email: e.target.value});
    }
    handleTurnstileVerify (token) {
        this.setState({turnstileToken: token});
    }
    handleTurnstileExpire () {
        this.setState({turnstileToken: null});
    }
    async handleSubmit (e) {
        e.preventDefault();
        if (!this.state.turnstileToken) {
            this.setState({error: 'Please complete the verification challenge'});
            return;
        }
        this.setState({isSubmitting: true, error: null});
        try {
            await postJson('/api/auth/forgot-password', {
                email: this.state.email,
                turnstileToken: this.state.turnstileToken
            });
            this.setState({isSubmitting: false, submitted: true});
        } catch (err) {
            if (this.turnstileRef.current) this.turnstileRef.current.reset();
            this.setState({isSubmitting: false, error: err.message, turnstileToken: null});
        }
    }
    render () {
        if (this.state.submitted) {
            return (
                <div>
                    <h1 className={styles.heading}>Check your email</h1>
                    <p>If that email is registered, we sent a password reset link to it.</p>
                </div>
            );
        }
        return (
            <div>
                <h1 className={styles.heading}>Forgot Password</h1>
                <form
                    className={styles.form}
                    onSubmit={this.handleSubmit}
                >
                    <label className={styles.fieldLabel}>
                        Email
                        <input
                            className={styles.textInput}
                            type="email"
                            value={this.state.email}
                            onChange={this.handleEmailChange}
                        />
                    </label>
                    <TurnstileWidget
                        ref={this.turnstileRef}
                        onVerify={this.handleTurnstileVerify}
                        onExpire={this.handleTurnstileExpire}
                    />
                    {this.state.error && (
                        <div className={styles.error}>{this.state.error}</div>
                    )}
                    <button
                        className={styles.submitButton}
                        type="submit"
                        disabled={this.state.isSubmitting || !this.state.turnstileToken}
                    >
                        {this.state.isSubmitting ? 'Sending…' : 'Send Reset Link'}
                    </button>
                </form>
                <Link to="/login">Back to log in</Link>
            </div>
        );
    }
}

export default ForgotPasswordPage;
