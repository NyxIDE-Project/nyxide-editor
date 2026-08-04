import PropTypes from 'prop-types';
import React from 'react';

import ProjectCard from '../project-card/project-card.jsx';

import styles from './project-grid.css';

const ProjectGrid = ({items, emptyMessage}) => (
    items.length > 0 ? (
        <div className={styles.grid}>
            {items.map(project => (
                <ProjectCard
                    key={project.id}
                    project={project}
                />
            ))}
        </div>
    ) : (
        <div className={styles.empty}>{emptyMessage}</div>
    )
);

ProjectGrid.propTypes = {
    emptyMessage: PropTypes.node,
    items: PropTypes.array.isRequired
};

ProjectGrid.defaultProps = {
    emptyMessage: 'No projects yet.'
};

export default ProjectGrid;
