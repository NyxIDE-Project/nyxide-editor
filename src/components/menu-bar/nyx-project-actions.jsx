import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';

import ReportModal from '../../homepage/components/report-modal/report-modal.jsx';
import {API_BASE_URL} from '../../lib/nyxide-constants';

import styles from './nyx-project-actions.css';

const messages = defineMessages({
    like: {
        id: 'nyx.projectActions.like',
        defaultMessage: 'Like',
        description: 'Button to like a project'
    },
    favorite: {
        id: 'nyx.projectActions.favorite',
        defaultMessage: 'Favorite',
        description: 'Button to favorite a project'
    },
    views: {
        id: 'nyx.projectActions.views',
        defaultMessage: 'Views',
        description: 'Label for the view count of a project'
    },
    loginRequired: {
        id: 'nyx.projectActions.loginRequired',
        defaultMessage: 'Log in to NyxIDE to like or favorite projects',
        description: 'Tooltip shown when a logged-out user hovers the like/favorite buttons'
    },
    report: {
        id: 'nyx.projectActions.report',
        defaultMessage: 'Report',
        description: 'Button to report a project'
    }
});

class NyxProjectActions extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            isLoggedIn: null,
            likeCount: props.stats.likeCount,
            favoriteCount: props.stats.favoriteCount,
            isLikedByViewer: props.stats.isLikedByViewer,
            isFavoritedByViewer: props.stats.isFavoritedByViewer,
            isBusy: false,
            isReportOpen: false
        };
        this.handleToggleLike = this.handleToggleLike.bind(this);
        this.handleToggleFavorite = this.handleToggleFavorite.bind(this);
        this.handleOpenReport = this.handleOpenReport.bind(this);
        this.handleCloseReport = this.handleCloseReport.bind(this);
    }
    componentDidMount () {
        fetch(`${API_BASE_URL}/api/auth/me`, {credentials: 'include'})
            .then(res => res.json())
            .then(data => this.setState({isLoggedIn: Boolean(data.user)}))
            .catch(() => this.setState({isLoggedIn: false}));
    }
    componentDidUpdate (prevProps) {
        if (prevProps.projectId !== this.props.projectId || prevProps.stats !== this.props.stats) {
            this.setState({
                likeCount: this.props.stats.likeCount,
                favoriteCount: this.props.stats.favoriteCount,
                isLikedByViewer: this.props.stats.isLikedByViewer,
                isFavoritedByViewer: this.props.stats.isFavoritedByViewer
            });
        }
    }
    toggle (kind) {
        if (!this.state.isLoggedIn || this.state.isBusy) {
            return;
        }
        const countKey = kind === 'like' ? 'likeCount' : 'favoriteCount';
        const flagKey = kind === 'like' ? 'isLikedByViewer' : 'isFavoritedByViewer';
        const isActive = this.state[flagKey];
        this.setState({isBusy: true});
        fetch(`${API_BASE_URL}/api/projects/${this.props.projectId}/${kind}`, {
            method: isActive ? 'DELETE' : 'POST',
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => this.setState({
                likeCount: data.likeCount,
                favoriteCount: data.favoriteCount,
                isLikedByViewer: data.isLikedByViewer,
                isFavoritedByViewer: data.isFavoritedByViewer,
                isBusy: false
            }))
            .catch(() => this.setState({isBusy: false}));
        // optimistic update while the request is in flight
        this.setState({
            [countKey]: this.state[countKey] + (isActive ? -1 : 1),
            [flagKey]: !isActive
        });
    }
    handleToggleLike () {
        this.toggle('like');
    }
    handleToggleFavorite () {
        this.toggle('favorite');
    }
    handleOpenReport () {
        if (!this.state.isLoggedIn) {
            return;
        }
        this.setState({isReportOpen: true});
    }
    handleCloseReport () {
        this.setState({isReportOpen: false});
    }
    render () {
        const {intl} = this.props;
        const disabledTitle = this.state.isLoggedIn === false ? intl.formatMessage(messages.loginRequired) : null;
        return (
            <div className={styles.projectActions}>
                <div
                    className={this.state.isLikedByViewer ? styles.buttonActive : styles.button}
                    onClick={this.handleToggleLike}
                    title={disabledTitle}
                    data-disabled={!this.state.isLoggedIn}
                >
                    <span className={styles.icon}>{'♥'}</span>
                    <FormattedMessage {...messages.like} />
                    <span className={styles.count}>{this.state.likeCount}</span>
                </div>
                <div
                    className={this.state.isFavoritedByViewer ? styles.buttonActive : styles.button}
                    onClick={this.handleToggleFavorite}
                    title={disabledTitle}
                    data-disabled={!this.state.isLoggedIn}
                >
                    <span className={styles.icon}>{'★'}</span>
                    <FormattedMessage {...messages.favorite} />
                    <span className={styles.count}>{this.state.favoriteCount}</span>
                </div>
                <div className={styles.viewsOnly}>
                    <span className={styles.icon}>{'👁'}</span>
                    <FormattedMessage {...messages.views} />
                    <span className={styles.count}>{this.props.stats.viewCount}</span>
                </div>
                <div
                    className={styles.reportButton}
                    onClick={this.handleOpenReport}
                    title={disabledTitle}
                    data-disabled={!this.state.isLoggedIn}
                >
                    <FormattedMessage {...messages.report} />
                </div>
                {this.state.isReportOpen && (
                    <ReportModal
                        targetType="project"
                        targetId={this.props.projectId}
                        onClose={this.handleCloseReport}
                    />
                )}
            </div>
        );
    }
}

NyxProjectActions.propTypes = {
    intl: intlShape.isRequired,
    projectId: PropTypes.string,
    stats: PropTypes.shape({
        viewCount: PropTypes.number,
        likeCount: PropTypes.number,
        favoriteCount: PropTypes.number,
        isLikedByViewer: PropTypes.bool,
        isFavoritedByViewer: PropTypes.bool
    }).isRequired
};

const mapStateToProps = state => ({
    projectId: state.scratchGui.projectState.projectId,
    stats: state.scratchGui.tw.stats
});

export default injectIntl(connect(
    mapStateToProps,
    () => ({})
)(NyxProjectActions));
