import PropTypes from 'prop-types';
import React from 'react';
import {Redirect} from 'react-router-dom';

import {AuthContext} from '../../contexts/auth-context.jsx';

import styles from '../page.css';

class RegisterForm extends React.Component {
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
            await this.props.register(this.state.username, this.state.password);
        } catch (err) {
            this.setState({isSubmitting: false, error: err.message});
        }
    }
    render () {
        return (
            <div>
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
                        {this.state.isSubmitting ? 'Signing Up…' : 'Sign Up'}
                    </button>
                </form>
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
