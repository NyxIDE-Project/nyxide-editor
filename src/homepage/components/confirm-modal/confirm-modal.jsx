import PropTypes from 'prop-types';
import React from 'react';

import Box from '../../../components/box/box.jsx';
import Modal from '../../../containers/modal.jsx';

import styles from './confirm-modal.css';

// nyxide: matches the styling of the app's real confirmation modals (e.g.
// remove-extension-modal.jsx) - same Modal container/header/close button, same
// cancel/confirm button layout - rather than a one-off dialog just for this page.
const ConfirmModal = ({title, body, confirmLabel, isDangerous, onCancel, onConfirm}) => (
    <Modal
        className={styles.modalContent}
        onRequestClose={onCancel}
        contentLabel={title}
        id="nyxConfirmModal"
    >
        <Box className={styles.body}>
            <p>{body}</p>
            <Box className={styles.buttons}>
                <button
                    className={styles.cancelButton}
                    onClick={onCancel}
                >
                    Cancel
                </button>
                <button
                    className={isDangerous ? styles.dangerButton : styles.confirmButton}
                    onClick={onConfirm}
                >
                    {confirmLabel}
                </button>
            </Box>
        </Box>
    </Modal>
);

ConfirmModal.propTypes = {
    body: PropTypes.node.isRequired,
    confirmLabel: PropTypes.string.isRequired,
    isDangerous: PropTypes.bool,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired
};

export default ConfirmModal;
