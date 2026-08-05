import PropTypes from 'prop-types';
import React from 'react';
import {get, postJson, putJson, request} from '../lib/api';

const AuthContext = React.createContext({
    user: null,
    loading: true,
    login: () => Promise.reject(new Error('AuthContext not initialized')),
    register: () => Promise.reject(new Error('AuthContext not initialized')),
    logout: () => Promise.reject(new Error('AuthContext not initialized')),
    updateEmail: () => Promise.reject(new Error('AuthContext not initialized')),
    updateUsername: () => Promise.reject(new Error('AuthContext not initialized'))
});

class AuthProvider extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            user: null,
            loading: true
        };
        this.login = this.login.bind(this);
        this.register = this.register.bind(this);
        this.logout = this.logout.bind(this);
        this.updateEmail = this.updateEmail.bind(this);
        this.updateUsername = this.updateUsername.bind(this);
    }
    componentDidMount () {
        get('/api/auth/me')
            .then(data => this.setState({user: data.user, loading: false}))
            .catch(() => this.setState({user: null, loading: false}));
    }
    async login (identifier, password, turnstileToken) {
        const data = await postJson('/api/auth/login', {identifier, password, turnstileToken});
        this.setState({user: data.user});
        return data.user;
    }
    async register (username, email, password, turnstileToken) {
        const data = await postJson('/api/auth/register', {username, email, password, turnstileToken});
        this.setState({user: data.user});
        return data.user;
    }
    async updateEmail (email) {
        const data = await putJson('/api/users/me/email', {email});
        this.setState({user: data.user});
        return data.user;
    }
    async updateUsername (username) {
        const data = await putJson('/api/users/me/username', {username});
        this.setState({user: data.user});
        return data.user;
    }
    async logout () {
        await request('/api/auth/logout', {method: 'POST'});
        this.setState({user: null});
    }
    render () {
        return (
            <AuthContext.Provider
                value={{
                    user: this.state.user,
                    loading: this.state.loading,
                    login: this.login,
                    register: this.register,
                    logout: this.logout,
                    updateEmail: this.updateEmail,
                    updateUsername: this.updateUsername
                }}
            >
                {this.props.children}
            </AuthContext.Provider>
        );
    }
}

AuthProvider.propTypes = {
    children: PropTypes.node
};

export {AuthContext, AuthProvider};
