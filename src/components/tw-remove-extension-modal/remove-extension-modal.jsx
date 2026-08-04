import {defineMessages, FormattedMessage, intlShape, injectIntl} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';
import styles from './remove-extension-modal.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'Remove Extension',
        description: 'Title of modal confirming removal of an extension and the blocks that use it',
        id: 'tw.removeExtension.title'
    }
});

const RemoveExtensionModal = props => (
    <Modal
        className={styles.modalContent}
        onRequestClose={props.onCancel}
        contentLabel={props.intl.formatMessage(messages.title)}
        id="removeExtensionModal"
    >
        <Box className={styles.body}>
            <p>
                <FormattedMessage
                    // eslint-disable-next-line max-len
                    defaultMessage="Removing the {name} extension will also delete {count, plural, one {# block} other {# blocks}} that use it, everywhere in the project. This cannot be undone."
                    description="Body of modal confirming removal of an extension that still has blocks in the project"
                    id="tw.removeExtension.body"
                    values={{
                        name: <strong>{props.name}</strong>,
                        count: props.blockCount
                    }}
                />
            </p>
            <Box className={styles.buttons}>
                <button
                    className={styles.cancelButton}
                    onClick={props.onCancel}
                >
                    <FormattedMessage
                        defaultMessage="Cancel"
                        description="Button to cancel removing an extension"
                        id="tw.removeExtension.cancel"
                    />
                </button>
                <button
                    className={styles.removeButton}
                    onClick={props.onConfirm}
                >
                    <FormattedMessage
                        defaultMessage="Delete Blocks & Remove"
                        description="Button to confirm removing an extension and deleting the blocks that use it"
                        id="tw.removeExtension.confirm"
                    />
                </button>
            </Box>
        </Box>
    </Modal>
);

RemoveExtensionModal.propTypes = {
    intl: intlShape,
    name: PropTypes.node.isRequired,
    blockCount: PropTypes.number.isRequired,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired
};

export default injectIntl(RemoveExtensionModal);
