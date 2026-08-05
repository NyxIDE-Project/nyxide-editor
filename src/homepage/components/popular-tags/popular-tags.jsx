import React from 'react';
import {Link} from 'react-router-dom';

import ProjectGrid from '../project-grid/project-grid.jsx';
import {get} from '../../lib/api';

import styles from '../../pages/page.css';

// Picks one tag at random out of the top 3 most-used tags site-wide, and shows off projects
// tagged with it. Re-rolled on every mount (e.g. every homepage visit), not sticky.
class PopularTags extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            tag: null,
            items: [],
            loading: true
        };
    }
    componentDidMount () {
        get('/api/projects/tags/popular', {limit: 3})
            .then(data => {
                const tags = data.items;
                if (!tags || tags.length === 0) {
                    this.setState({loading: false});
                    return;
                }
                const chosen = tags[Math.floor(Math.random() * tags.length)].tag;
                return get('/api/projects', {tag: chosen, page: 1}).then(projectData => {
                    this.setState({tag: chosen, items: projectData.items, loading: false});
                });
            })
            .catch(() => this.setState({loading: false}));
    }
    render () {
        if (this.state.loading || !this.state.tag || this.state.items.length === 0) {
            return null;
        }
        const searchUrl = `/search?q=${encodeURIComponent(`#${this.state.tag}`)}`;
        return (
            <div className={styles.featuredSection}>
                <div className={styles.sectionHeadingRow}>
                    <h2 className={styles.featuredHeading}>{`#${this.state.tag}`}</h2>
                    <Link
                        className={styles.showAllLink}
                        to={searchUrl}
                    >
                        {'Show All'}
                    </Link>
                </div>
                <ProjectGrid items={this.state.items} />
            </div>
        );
    }
}

export default PopularTags;
