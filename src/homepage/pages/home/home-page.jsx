import React from 'react';
import {Link} from 'react-router-dom';

import {AuthContext} from '../../contexts/auth-context.jsx';
import ProjectGrid from '../../components/project-grid/project-grid.jsx';
import LoggedInBoxes from '../../components/logged-in-boxes/logged-in-boxes.jsx';
import PopularTags from '../../components/popular-tags/popular-tags.jsx';
import MascotMessage from '../../components/mascot-message/mascot-message.jsx';
import {get} from '../../lib/api';

import styles from '../page.css';

class HomePage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            featured: [],
            newProjects: [],
            loading: true,
            error: false
        };
    }
    componentDidMount () {
        Promise.all([
            get('/api/projects/featured'),
            get('/api/projects', {page: 1})
        ])
            .then(([featuredData, newData]) => this.setState({
                featured: featuredData.items,
                newProjects: newData.items,
                loading: false
            }))
            .catch(() => this.setState({loading: false, error: true}));
    }
    render () {
        if (this.state.loading) {
            return <div className={styles.loading}>Loading…</div>;
        }
        return (
            <div>
                <AuthContext.Consumer>
                    {({user, loading}) => (!loading && user ? <LoggedInBoxes user={user} /> : null)}
                </AuthContext.Consumer>
                {this.state.featured.length > 0 && (
                    <div className={styles.featuredSection}>
                        <div className={styles.sectionHeadingRow}>
                            <h2 className={styles.featuredHeading}>
                                <span className={styles.featuredStar}>{'★'}</span>
                                {'Featured Projects'}
                            </h2>
                            <Link
                                className={styles.showAllLink}
                                to="/search?q=%3Aisfeatured"
                            >
                                {'Show All'}
                            </Link>
                        </div>
                        <ProjectGrid items={this.state.featured} />
                    </div>
                )}
                <PopularTags />
                <div className={styles.featuredSection}>
                    <div className={styles.sectionHeadingRow}>
                        <h1 className={styles.heading}>New Projects</h1>
                        <Link
                            className={styles.showAllLink}
                            to="/search?q=%3Anewest"
                        >
                            {'Show All'}
                        </Link>
                    </div>
                    <ProjectGrid
                        items={this.state.newProjects}
                        emptyMessage={this.state.error ? (
                            <MascotMessage mascot="crash">
                                {'We are unable to access the servers right now, come back later.'}
                            </MascotMessage>
                        ) : 'No projects have been shared yet. Be the first!'}
                    />
                </div>
            </div>
        );
    }
}

export default HomePage;
