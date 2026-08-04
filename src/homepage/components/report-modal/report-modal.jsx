import PropTypes from 'prop-types';
import React from 'react';

import Box from '../../../components/box/box.jsx';
import Modal from '../../../containers/modal.jsx';
import {postJson} from '../../lib/api';

import styles from './report-modal.css';

// nyxide: usable from either bundle (homepage profile pages, editor project pages) - only
// depends on the shared Box/Modal components and the homepage api client.
class ReportModal extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            reason: '',
            isSubmitting: false,
            isSubmitted: false,
            error: null
        };
        this.handleReasonChange = this.handleReasonChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    handleReasonChange (e) {
        this.setState({reason: e.target.value});
    }
    handleSubmit () {
        if (!this.state.reason.trim() || this.state.isSubmitting) {
            return;
        }
        this.setState({isSubmitting: true, error: null});
        postJson('/api/reports', {
            targetType: this.props.targetType,
            targetId: this.props.targetId,
            reason: this.state.reason.trim()
        })
            .then(() => this.setState({isSubmitting: false, isSubmitted: true}))
            .catch(err => this.setState({isSubmitting: false, error: err.message}));
    }
    render () {
        return (
            <Modal
                className={styles.modalContent}
                onRequestClose={this.props.onClose}
                contentLabel={`Report ${this.props.targetType === 'project' ? 'Project' : 'User'}`}
                id="nyxReportModal"
            >
                <Box className={styles.body}>
                    {this.state.isSubmitted ? (
                        <React.Fragment>
                            <p>{"Thanks - this has been reported to the moderators."}</p>
                            <button
                                className={styles.doneButton}
                                onClick={this.props.onClose}
                            >
                                Done
                            </button>
                        </React.Fragment>
                    ) : (
                        <React.Fragment>
                            <p>
                                {this.props.targetType === 'project' ?
                                    'Why are you reporting this project?' :
                                    'Why are you reporting this user?'}
                            </p>
                            <textarea
                                className={styles.textArea}
                                value={this.state.reason}
                                onChange={this.handleReasonChange}
                                placeholder="Describe the issue…"
                                rows={4}
                            />
                            {this.state.error && (
                                <div className={styles.error}>{this.state.error}</div>
                            )}
                            <Box className={styles.buttons}>
                                <button
                                    className={styles.cancelButton}
                                    onClick={this.props.onClose}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={styles.submitButton}
                                    onClick={this.handleSubmit}
                                    disabled={this.state.isSubmitting || !this.state.reason.trim()}
                                >
                                    {this.state.isSubmitting ? 'Sending…' : 'Submit Report'}
                                </button>
                            </Box>
                        </React.Fragment>
                    )}
                </Box>
            </Modal>
        );
    }
}

ReportModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    targetId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    targetType: PropTypes.oneOf(['project', 'user']).isRequired
};

export default ReportModal;
