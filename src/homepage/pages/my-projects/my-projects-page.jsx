import PropTypes from 'prop-types';
import React from 'react';
import {Redirect} from 'react-router-dom';

import {AuthContext} from '../../contexts/auth-context.jsx';
import {get, putJson} from '../../lib/api';
import OwnedProjectCard from './owned-project-card.jsx';

import pageStyles from '../page.css';
import styles from './my-projects-page.css';

const MAX_FEATURED = 6;

class MyProjectsList extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            items: [],
            featuredIds: [],
            loading: true,
            error: null
        };
        this.handleDeleted = this.handleDeleted.bind(this);
        this.handleToggleFeature = this.handleToggleFeature.bind(this);
    }
    componentDidMount () {
        Promise.all([
            get(`/api/users/${this.props.user.username}/projects`, {page: 1}),
            get(`/api/users/${this.props.user.username}`)
        ])
            .then(([projectsPage, profile]) => this.setState({
                items: projectsPage.items,
                featuredIds: profile.featuredProjects.map(project => project.id),
                loading: false
            }))
            .catch(() => this.setState({loading: false}));
    }
    handleDeleted (id) {
        this.setState(state => ({
            items: state.items.filter(item => item.id !== id),
            featuredIds: state.featuredIds.filter(featuredId => featuredId !== id)
        }));
    }
    handleToggleFeature (id) {
        const isFeatured = this.state.featuredIds.includes(id);
        const nextIds = isFeatured ?
            this.state.featuredIds.filter(featuredId => featuredId !== id) :
            [...this.state.featuredIds, id];
        if (!isFeatured && nextIds.length > MAX_FEATURED) {
            this.setState({error: `You can only feature up to ${MAX_FEATURED} projects.`});
            return;
        }
        const previousIds = this.state.featuredIds;
        this.setState({featuredIds: nextIds, error: null});
        putJson('/api/users/me/featured', {projectIds: nextIds})
            .catch(err => this.setState({featuredIds: previousIds, error: err.message}));
    }
    render () {
        if (this.state.loading) {
            return <div className={pageStyles.loading}>Loading…</div>;
        }
        return (
            <div>
                <h1 className={pageStyles.heading}>My Projects</h1>
                <p className={styles.featuredHint}>
                    {`Star up to ${MAX_FEATURED} projects to feature them at the top of your profile.`}
                </p>
                {this.state.error && <p className={pageStyles.error}>{this.state.error}</p>}
                {this.state.items.length > 0 ? (
                    <div className={styles.grid}>
                        {this.state.items.map(project => (
                            <OwnedProjectCard
                                key={project.id}
                                project={project}
                                onDeleted={this.handleDeleted}
                                isFeatured={this.state.featuredIds.includes(project.id)}
                                onToggleFeature={this.handleToggleFeature}
                            />
                        ))}
                    </div>
                ) : (
                    <div className={pageStyles.loading}>
                        {"You haven't uploaded any projects yet."}
                    </div>
                )}
            </div>
        );
    }
}

MyProjectsList.propTypes = {
    user: PropTypes.shape({
        username: PropTypes.string.isRequired
    }).isRequired
};

const MyProjectsPage = () => (
    <AuthContext.Consumer>
        {({user, loading}) => {
            if (loading) {
                return <div className={pageStyles.loading}>Loading…</div>;
            }
            if (!user) {
                return <Redirect to="/login" />;
            }
            return <MyProjectsList user={user} />;
        }}
    </AuthContext.Consumer>
);

export default MyProjectsPage;
