import PropTypes from 'prop-types';
import React from 'react';

import {AuthContext} from '../../contexts/auth-context.jsx';
import {postJson, del} from '../../lib/api';

import styles from './follow-button.css';

class FollowButton extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            isFollowing: props.initialIsFollowing,
            isBusy: false
        };
        this.handleClick = this.handleClick.bind(this);
    }
    async handleClick () {
        if (this.state.isBusy) {
            return;
        }
        this.setState({isBusy: true});
        try {
            const result = this.state.isFollowing ?
                await del(`/api/users/${this.props.username}/follow`) :
                await postJson(`/api/users/${this.props.username}/follow`, {});
            this.setState({isFollowing: !this.state.isFollowing, isBusy: false});
            if (this.props.onFollowerCountChange) {
                this.props.onFollowerCountChange(result.followerCount);
            }
        } catch (err) {
            this.setState({isBusy: false});
        }
    }
    render () {
        return (
            <AuthContext.Consumer>
                {({user}) => (
                    user && user.username !== this.props.username ? (
                        <div
                            className={this.state.isFollowing ? styles.followingButton : styles.followButton}
                            onClick={this.handleClick}
                        >
                            {this.state.isFollowing ? 'Following' : 'Follow'}
                        </div>
                    ) : null
                )}
            </AuthContext.Consumer>
        );
    }
}

FollowButton.propTypes = {
    initialIsFollowing: PropTypes.bool,
    onFollowerCountChange: PropTypes.func,
    username: PropTypes.string.isRequired
};

FollowButton.defaultProps = {
    initialIsFollowing: false
};

export default FollowButton;
