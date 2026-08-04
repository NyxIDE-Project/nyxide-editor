import React from 'react';

import ProjectGrid from '../../components/project-grid/project-grid.jsx';
import {get} from '../../lib/api';

import styles from '../page.css';

class HomePage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            featured: [],
            newProjects: [],
            loading: true
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
            .catch(() => this.setState({loading: false}));
    }
    render () {
        if (this.state.loading) {
            return <div className={styles.loading}>Loading…</div>;
        }
        return (
            <div>
                {this.state.featured.length > 0 && (
                    <div className={styles.featuredSection}>
                        <h2 className={styles.featuredHeading}>
                            <span className={styles.featuredStar}>{'★'}</span>
                            {'Featured Projects'}
                        </h2>
                        <ProjectGrid items={this.state.featured} />
                    </div>
                )}
                <div>
                    <h1 className={styles.heading}>New Projects</h1>
                    <ProjectGrid
                        items={this.state.newProjects}
                        emptyMessage="No projects have been shared yet. Be the first!"
                    />
                </div>
            </div>
        );
    }
}

export default HomePage;
