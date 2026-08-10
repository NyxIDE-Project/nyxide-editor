import React from 'react';

import ProjectCard from '../project-card/project-card.jsx';
import {get} from '../../lib/api';

import pageStyles from '../../pages/page.css';
import styles from './near-featured.css';

class NearFeatured extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            items: [],
            threshold: 0,
            loading: true
        };
    }
    componentDidMount () {
        get('/api/projects/near-featured')
            .then(data => this.setState({
                items: data.items,
                threshold: data.threshold,
                loading: false
            }))
            .catch(() => this.setState({loading: false}));
    }
    render () {
        if (this.state.loading || this.state.items.length === 0) {
            return null;
        }
        return (
            <div className={pageStyles.featuredSection}>
                <h2 className={pageStyles.featuredHeading}>{'People Who Want to Be Featured'}</h2>
                <p className={styles.subtitle}>
                    {'These projects are close to earning enough likes and favorites to be featured.'}
                </p>
                <div className={styles.grid}>
                    {this.state.items.map(project => {
                        const engagement = project.likeCount + project.favoriteCount;
                        const percent = Math.min(100, Math.round((engagement / this.state.threshold) * 100));
                        return (
                            <div
                                key={project.id}
                                className={styles.item}
                            >
                                <ProjectCard project={project} />
                                <div className={styles.progressTrack}>
                                    <div
                                        className={styles.progressFill}
                                        style={{width: `${percent}%`}}
                                    />
                                </div>
                                <div className={styles.progressLabel}>
                                    {`${engagement} / ${this.state.threshold} to featured`}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}

export default NearFeatured;
