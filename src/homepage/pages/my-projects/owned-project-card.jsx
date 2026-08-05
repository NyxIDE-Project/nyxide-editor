import PropTypes from 'prop-types';
import React from 'react';

import ConfirmModal from '../../components/confirm-modal/confirm-modal.jsx';
import {del} from '../../lib/api';
import {resolveApiUrl} from '../../../lib/nyxide-constants';

import styles from './my-projects-page.css';

class OwnedProjectCard extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            isConfirmingDelete: false,
            isDeleting: false
        };
        this.handleDeleteClick = this.handleDeleteClick.bind(this);
        this.handleCancelDelete = this.handleCancelDelete.bind(this);
        this.handleConfirmDelete = this.handleConfirmDelete.bind(this);
    }
    handleDeleteClick () {
        this.setState({isConfirmingDelete: true});
    }
    handleCancelDelete () {
        this.setState({isConfirmingDelete: false});
    }
    handleConfirmDelete () {
        this.setState({isDeleting: true});
        del(`/api/projects/${this.props.project.id}`)
            .then(() => this.props.onDeleted(this.props.project.id))
            .catch(() => this.setState({isDeleting: false, isConfirmingDelete: false}));
    }
    render () {
        const {project} = this.props;
        return (
            <div className={styles.card}>
                <a
                    className={styles.thumbnailLink}
                    href={`/player#${project.id}`}
                >
                    {project.thumbnailUrl ? (
                        <img
                            className={styles.thumbnail}
                            src={resolveApiUrl(project.thumbnailUrl)}
                            alt={project.title}
                        />
                    ) : (
                        <div className={styles.thumbnailPlaceholder} />
                    )}
                    <div
                        className={this.props.isFeatured ? styles.featureStarActive : styles.featureStar}
                        onClick={e => {
                            e.preventDefault();
                            this.props.onToggleFeature(project.id);
                        }}
                        title={this.props.isFeatured ? 'Remove from featured' : 'Feature on profile'}
                    >
                        {'★'}
                    </div>
                </a>
                <div className={styles.title}>{project.title}</div>
                <div className={styles.cardButtons}>
                    <a
                        className={styles.editButton}
                        href={`/projects/${project.id}/edit`}
                    >
                        Edit
                    </a>
                    <div
                        className={styles.deleteButton}
                        onClick={this.handleDeleteClick}
                    >
                        Delete
                    </div>
                </div>
                {this.state.isConfirmingDelete && (
                    <ConfirmModal
                        title="Delete Project"
                        body={
                            `Are you sure you want to delete "${project.title}"? This cannot be undone.`
                        }
                        confirmLabel={this.state.isDeleting ? 'Deleting…' : 'Delete'}
                        isDangerous
                        onCancel={this.handleCancelDelete}
                        onConfirm={this.handleConfirmDelete}
                    />
                )}
            </div>
        );
    }
}

OwnedProjectCard.propTypes = {
    isFeatured: PropTypes.bool,
    onDeleted: PropTypes.func.isRequired,
    onToggleFeature: PropTypes.func.isRequired,
    project: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        title: PropTypes.string,
        thumbnailUrl: PropTypes.string
    }).isRequired
};

export default OwnedProjectCard;
