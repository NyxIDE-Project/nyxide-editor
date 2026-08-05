import PropTypes from 'prop-types';
import React from 'react';

import {USERNAME_CHANGE_COOLDOWN_MS} from '../../../lib/nyxide-constants';

import styles from '../page.css';

const formatDate = ms => new Date(ms).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'});

class UsernameForm extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            username: props.user.username,
            error: null,
            saved: false,
            isSaving: false
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    handleChange (e) {
        this.setState({username: e.target.value, saved: false, error: null});
    }
    async handleSubmit (e) {
        e.preventDefault();
        this.setState({isSaving: true, error: null});
        try {
            await this.props.updateUsername(this.state.username);
            this.setState({isSaving: false, saved: true});
        } catch (err) {
            this.setState({isSaving: false, error: err.message});
        }
    }
    render () {
        const {user} = this.props;
        const nextAllowedAt = user.usernameChangedAt ? user.usernameChangedAt + USERNAME_CHANGE_COOLDOWN_MS : null;
        const onCooldown = Boolean(nextAllowedAt && nextAllowedAt > Date.now());
        return (
            <form
                className={styles.form}
                onSubmit={this.handleSubmit}
            >
                <label className={styles.fieldLabel}>
                    {'Username'}
                    <input
                        className={styles.textInput}
                        type="text"
                        value={this.state.username}
                        onChange={this.handleChange}
                        disabled={onCooldown}
                    />
                </label>
                {onCooldown ? (
                    <div>{`You can change your username again on ${formatDate(nextAllowedAt)}.`}</div>
                ) : (
                    <div>{'Usernames can only be changed once every 12 days.'}</div>
                )}
                {this.state.error && (
                    <div className={styles.error}>{this.state.error}</div>
                )}
                {this.state.saved && !this.state.error && (
                    <div>{'Saved!'}</div>
                )}
                <button
                    className={styles.submitButton}
                    type="submit"
                    disabled={this.state.isSaving || onCooldown || this.state.username === user.username}
                >
                    {this.state.isSaving ? 'Saving…' : 'Change Username'}
                </button>
            </form>
        );
    }
}

UsernameForm.propTypes = {
    user: PropTypes.shape({
        username: PropTypes.string.isRequired,
        usernameChangedAt: PropTypes.number
    }).isRequired,
    updateUsername: PropTypes.func.isRequired
};

export default UsernameForm;
