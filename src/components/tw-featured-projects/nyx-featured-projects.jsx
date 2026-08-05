import React from 'react';
import {FormattedMessage} from 'react-intl';

// Cross-bundle import (established pattern elsewhere in this fork, e.g. Avatar/ReportModal
// in the menu bar): ProjectGrid/ProjectCard only depend on shared css/colors.css and plain
// <a href> navigation, no react-router, so they work fine outside the homepage bundle's
// BrowserRouter.
import ProjectGrid from '../../homepage/components/project-grid/project-grid.jsx';
import {APP_NAME} from '../../lib/brand.js';

import styles from './nyx-featured-projects.css';

// Replaces the old studio-based FeaturedProjects (which pulled from a Scratch studio) with
// projects featured on our own site (see server/src/routes/projects.js GET /featured).
class NyxFeaturedProjects extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            items: [],
            loading: true
        };
    }
    componentDidMount () {
        fetch('/api/projects/featured', {credentials: 'include'})
            .then(res => res.json())
            .then(data => this.setState({items: data.items || [], loading: false}))
            .catch(() => this.setState({loading: false}));
    }
    render () {
        return (
            <div className={styles.container}>
                {this.state.loading ? (
                    <div className={styles.loading}>
                        <FormattedMessage
                            defaultMessage="Loading featured projects…"
                            description="Shown while featured projects are loading"
                            id="tw.nyxFeaturedProjects.loading"
                        />
                    </div>
                ) : (
                    <ProjectGrid
                        items={this.state.items}
                        emptyMessage={
                            <FormattedMessage
                                defaultMessage="No projects are featured right now."
                                description="Shown when there are no featured projects"
                                id="tw.nyxFeaturedProjects.empty"
                            />
                        }
                    />
                )}
                <div className={styles.footer}>
                    <a href="/">
                        <FormattedMessage
                            defaultMessage="View more on {APP_NAME}."
                            description="Link to homepage from featured projects section"
                            id="tw.nyxFeaturedProjects.viewMore"
                            values={{APP_NAME}}
                        />
                    </a>
                </div>
            </div>
        );
    }
}

export default NyxFeaturedProjects;
