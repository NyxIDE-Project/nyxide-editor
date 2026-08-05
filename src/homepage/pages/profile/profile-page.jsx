import React from 'react';
import {withRouter} from 'react-router-dom';

import {AuthContext} from '../../contexts/auth-context.jsx';
import Avatar from '../../components/avatar/avatar.jsx';
import FollowButton from '../../components/follow-button/follow-button.jsx';
import ProjectGrid from '../../components/project-grid/project-grid.jsx';
import ReportModal from '../../components/report-modal/report-modal.jsx';
import {get} from '../../lib/api';
import {resolveApiUrl} from '../../../lib/nyxide-constants';

import pageStyles from '../page.css';
import styles from './profile-page.css';

const formatJoinDate = isoString => {
    const parsed = new Date(`${isoString.replace(' ', 'T')}Z`);
    return parsed.toLocaleDateString(undefined, {month: 'long', year: 'numeric'});
};

class ProfilePage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            profile: null,
            projects: [],
            loading: true,
            notFound: false,
            isReportOpen: false
        };
        this.handleFollowerCountChange = this.handleFollowerCountChange.bind(this);
        this.handleOpenReport = this.handleOpenReport.bind(this);
        this.handleCloseReport = this.handleCloseReport.bind(this);
    }
    componentDidMount () {
        this.load();
    }
    componentDidUpdate (prevProps) {
        if (prevProps.match.params.username !== this.props.match.params.username) {
            this.load();
        }
    }
    load () {
        const {username} = this.props.match.params;
        this.setState({loading: true, notFound: false});
        Promise.all([
            get(`/api/users/${username}`),
            get(`/api/users/${username}/projects`, {page: 1})
        ])
            .then(([profile, projectsPage]) => {
                this.setState({
                    profile,
                    projects: projectsPage.items,
                    loading: false
                });
            })
            .catch(() => this.setState({loading: false, notFound: true}));
    }
    handleFollowerCountChange (count) {
        this.setState(state => ({profile: {...state.profile, followerCount: count}}));
    }
    handleOpenReport () {
        this.setState({isReportOpen: true});
    }
    handleCloseReport () {
        this.setState({isReportOpen: false});
    }
    render () {
        if (this.state.loading) {
            return <div className={pageStyles.loading}>Loading…</div>;
        }
        if (this.state.notFound || !this.state.profile) {
            return <div className={pageStyles.loading}>User not found.</div>;
        }
        const {profile} = this.state;
        return (
            <div>
                <div
                    className={styles.banner}
                    style={profile.bannerUrl ? {backgroundImage: `url(${resolveApiUrl(profile.bannerUrl)})`} : null}
                />

                <div className={styles.header}>
                    <Avatar
                        avatarUrl={profile.avatarUrl}
                        username={profile.username}
                        size={96}
                    />
                    <div className={styles.headerInfo}>
                        <h1 className={styles.displayName}>{profile.displayName || profile.username}</h1>
                        <div className={styles.username}>{`@${profile.username}`}</div>
                        {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
                        <div className={styles.stats}>
                            <span className={styles.statPill}>
                                <strong>{profile.followerCount}</strong>{' Followers'}
                            </span>
                            <span className={styles.statPill}>
                                <strong>{profile.followingCount}</strong>{' Following'}
                            </span>
                            <span className={styles.statPill}>
                                <strong>{profile.projectCount}</strong>{' Projects'}
                            </span>
                            <span className={styles.joined}>{`Joined ${formatJoinDate(profile.createdAt)}`}</span>
                        </div>
                    </div>
                    <AuthContext.Consumer>
                        {({user}) => (
                            user && user.username === profile.username ? null : (
                                <div className={styles.headerActions}>
                                    <FollowButton
                                        username={profile.username}
                                        initialIsFollowing={profile.isFollowedByViewer}
                                        onFollowerCountChange={this.handleFollowerCountChange}
                                    />
                                    {user && (
                                        <div
                                            className={styles.reportLink}
                                            onClick={this.handleOpenReport}
                                        >
                                            Report
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                    </AuthContext.Consumer>
                </div>
                {this.state.isReportOpen && (
                    <ReportModal
                        targetType="user"
                        targetId={profile.id}
                        onClose={this.handleCloseReport}
                    />
                )}

                {profile.featuredProjects && profile.featuredProjects.length > 0 && (
                    <div className={pageStyles.featuredSection}>
                        <h2 className={pageStyles.featuredHeading}>
                            <span className={pageStyles.featuredStar}>{'★'}</span>
                            {'Featured Projects'}
                        </h2>
                        <ProjectGrid items={profile.featuredProjects} />
                    </div>
                )}

                <div className={styles.section}>
                    <h2 className={pageStyles.heading}>Projects</h2>
                    <ProjectGrid
                        items={this.state.projects}
                        emptyMessage="This user hasn't shared any projects yet."
                    />
                </div>
            </div>
        );
    }
}

export default withRouter(ProfilePage);
