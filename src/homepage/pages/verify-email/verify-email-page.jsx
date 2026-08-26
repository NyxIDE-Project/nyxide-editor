import React from 'react';
import {Link} from 'react-router-dom';

import {postJson} from '../../lib/api';

import styles from '../page.css';

class VerifyEmailPage extends React.Component {
    constructor (props) {
        super(props);
        this.token = new URLSearchParams(window.location.search).get('token');
        this.state = this.token ?
            {status: 'pending', error: null} :
            {status: 'error', error: 'This verification link is missing its token.'};
    }
    componentDidMount () {
        if (!this.token) {
            return;
        }
        postJson('/api/auth/verify-email', {token: this.token})
            .then(() => this.setState({status: 'success'}))
            .catch(err => this.setState({status: 'error', error: err.message}));
    }
    render () {
        return (
            <div>
                <h1 className={styles.heading}>Email Verification</h1>
                {this.state.status === 'pending' && <p>Verifying…</p>}
                {this.state.status === 'success' && (
                    <p>Your email has been verified.</p>
                )}
                {this.state.status === 'error' && (
                    <div className={styles.error}>{this.state.error}</div>
                )}
                <Link to="/">Back to NyxIDE</Link>
            </div>
        );
    }
}

export default VerifyEmailPage;
