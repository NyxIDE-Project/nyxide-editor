import PropTypes from 'prop-types';
import React from 'react';
import {Redirect} from 'react-router-dom';

import {AuthContext} from '../../contexts/auth-context.jsx';
import TurnstileWidget from '../../components/turnstile-widget/turnstile-widget.jsx';
import {API_BASE_URL} from '../../../lib/nyxide-constants';

import styles from '../page.css';
import registerStyles from './register-page.css';

const GOOGLE_ERROR_MESSAGES = {
    google_not_configured: 'Google login is not available right now.',
    google_state_mismatch: 'Google login failed (session expired). Please try again.',
    google_denied: 'Google login was cancelled.',
    google_token_failed: 'Google login failed. Please try again.',
    google_profile_failed: 'Google login failed. Please try again.',
    google_email_registered: 'An account with this email already exists. Log in with your ' +
        'username and password, then link Google from Settings.'
};

const googleErrorFromUrl = () => {
    if (typeof window === 'undefined') {
        return null;
    }
    const code = new URLSearchParams(window.location.search).get('error');
    return code && GOOGLE_ERROR_MESSAGES[code] ? GOOGLE_ERROR_MESSAGES[code] : null;
};

class RegisterForm extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            username: '',
            email: '',
            password: '',
            turnstileToken: null,
            error: googleErrorFromUrl(),
            isSubmitting: false
        };
        this.turnstileRef = React.createRef();
        this.handleUsernameChange = this.handleUsernameChange.bind(this);
        this.handleEmailChange = this.handleEmailChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleTurnstileVerify = this.handleTurnstileVerify.bind(this);
        this.handleTurnstileExpire = this.handleTurnstileExpire.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    handleUsernameChange (e) {
        this.setState({username: e.target.value});
    }
    handleEmailChange (e) {
        this.setState({email: e.target.value});
    }
    handlePasswordChange (e) {
        this.setState({password: e.target.value});
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
            await this.props.register(
                this.state.username, this.state.email, this.state.password, this.state.turnstileToken
            );
        } catch (err) {
            if (this.turnstileRef.current) this.turnstileRef.current.reset();
            this.setState({isSubmitting: false, error: err.message, turnstileToken: null});
        }
    }
    render () {
        return (
            <div>
                <img
                    className={registerStyles.mascot}
                    src="/mascot/default-cropped.svg"
                    alt=""
                />
                <h1 className={styles.heading}>Sign Up</h1>
                <form
                    className={styles.form}
                    onSubmit={this.handleSubmit}
                >
                    <label className={styles.fieldLabel}>
                        Username
                        <input
                            className={styles.textInput}
                            type="text"
                            value={this.state.username}
                            onChange={this.handleUsernameChange}
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
                        Password
                        <input
                            className={styles.textInput}
                            type="password"
                            value={this.state.password}
                            onChange={this.handlePasswordChange}
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
                        {this.state.isSubmitting ? 'Signing Up…' : 'Sign Up'}
                    </button>
                </form>
                <div className={registerStyles.divider}>or</div>
                <a
                    className={registerStyles.googleButton}
                    href={`${API_BASE_URL}/api/auth/google`}
                >
                    Continue with Google
                </a>
            </div>
        );
    }
}

RegisterForm.propTypes = {
    register: PropTypes.func.isRequired
};

const RegisterPage = () => (
    <AuthContext.Consumer>
        {({user, register}) => (
            user ? <Redirect to="/" /> : <RegisterForm register={register} />
        )}
    </AuthContext.Consumer>
);

export default RegisterPage;
