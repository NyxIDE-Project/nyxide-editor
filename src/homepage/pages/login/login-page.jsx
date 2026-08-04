import PropTypes from 'prop-types';
import React from 'react';
import {Redirect} from 'react-router-dom';

import {AuthContext} from '../../contexts/auth-context.jsx';

import styles from '../page.css';

class LoginForm extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            username: '',
            password: '',
            error: null,
            isSubmitting: false
        };
        this.handleUsernameChange = this.handleUsernameChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    handleUsernameChange (e) {
        this.setState({username: e.target.value});
    }
    handlePasswordChange (e) {
        this.setState({password: e.target.value});
    }
    async handleSubmit (e) {
        e.preventDefault();
        this.setState({isSubmitting: true, error: null});
        try {
            await this.props.login(this.state.username, this.state.password);
        } catch (err) {
            this.setState({isSubmitting: false, error: err.message});
        }
    }
    render () {
        return (
            <div>
                <h1 className={styles.heading}>Log In</h1>
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
                        disabled={this.state.isSubmitting}
                    >
                        {this.state.isSubmitting ? 'Logging In…' : 'Log In'}
                    </button>
                </form>
            </div>
        );
    }
}

LoginForm.propTypes = {
    login: PropTypes.func.isRequired
};

const LoginPage = () => (
    <AuthContext.Consumer>
        {({user, login}) => (
            user ? <Redirect to="/" /> : <LoginForm login={login} />
        )}
    </AuthContext.Consumer>
);

export default LoginPage;
