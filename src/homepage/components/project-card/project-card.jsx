import PropTypes from 'prop-types';
import React from 'react';

import styles from './project-card.css';

const ProjectCard = ({project}) => (
    <a
        className={styles.card}
        href={`/player#${project.id}`}
    >
        <div className={styles.thumbnailWrapper}>
            {project.thumbnailUrl ? (
                <img
                    className={styles.thumbnail}
                    src={project.thumbnailUrl}
                    alt={project.title}
                />
            ) : (
                <div className={styles.thumbnailPlaceholder} />
            )}
        </div>
        <div className={styles.info}>
            <div className={styles.title}>{project.title}</div>
            {project.owner && (
                <div className={styles.owner}>{project.owner.username}</div>
            )}
        </div>
    </a>
);

ProjectCard.propTypes = {
    project: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        title: PropTypes.string,
        thumbnailUrl: PropTypes.string,
        owner: PropTypes.shape({
            username: PropTypes.string
        })
    }).isRequired
};

export default ProjectCard;
