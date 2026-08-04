import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import VM from 'scratch-vm';

import dataURItoBlob from '../../lib/data-uri-to-blob';
import {formatBytes} from '../../lib/tw-bytes-utils';
import {MAX_UPLOAD_BYTES} from '../../lib/nyxide-constants';
import {setProjectId} from '../../reducers/project-state';

import styles from './nyx-save-button.css';

const messages = defineMessages({
    save: {
        id: 'nyx.saveButton.save',
        defaultMessage: 'Save to NyxIDE',
        description: 'Menu bar button to save the current project to the nyxide homepage'
    },
    update: {
        id: 'nyx.saveButton.update',
        defaultMessage: 'Update on NyxIDE',
        description: 'Menu bar button to save changes back to an already-uploaded project'
    },
    saving: {
        id: 'nyx.saveButton.saving',
        defaultMessage: 'Saving…',
        description: 'Menu bar button label shown while a save is in progress'
    },
    loginRequired: {
        id: 'nyx.saveButton.loginRequired',
        defaultMessage: 'Log in to NyxIDE to save projects',
        description: 'Tooltip shown when a logged-out user hovers the save button'
    },
    titleLabel: {
        id: 'nyx.saveButton.titleLabel',
        defaultMessage: 'Title',
        description: 'Label for the project title field in the first-save dialog'
    },
    descriptionLabel: {
        id: 'nyx.saveButton.descriptionLabel',
        defaultMessage: 'Description',
        description: 'Label for the project description field in the first-save dialog'
    },
    notesLabel: {
        id: 'nyx.saveButton.notesLabel',
        defaultMessage: 'Notes and Credits',
        description: 'Label for the notes and credits field in the first-save dialog'
    },
    thumbnailLabel: {
        id: 'nyx.saveButton.thumbnailLabel',
        defaultMessage: 'Thumbnail',
        description: 'Label for the thumbnail field in the first-save dialog'
    },
    thumbnailHint: {
        id: 'nyx.saveButton.thumbnailHint',
        defaultMessage: 'Auto-captured from the stage. Click to use your own image instead.',
        description: 'Hint text under the auto-captured thumbnail preview'
    },
    cancel: {
        id: 'nyx.saveButton.cancel',
        defaultMessage: 'Cancel',
        description: 'Cancel button in the first-save dialog'
    },
    confirm: {
        id: 'nyx.saveButton.confirm',
        defaultMessage: 'Share Project',
        description: 'Confirm button in the first-save dialog'
    },
    preparing: {
        id: 'nyx.saveButton.preparing',
        defaultMessage: 'Preparing project…',
        description: 'Shown while the project file and thumbnail are being prepared'
    }
});

class NyxSaveButton extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClick',
            'handleModalCancel',
            'handleModalSubmit',
            'handleTitleChange',
            'handleDescriptionChange',
            'handleNotesChange',
            'handleThumbnailClick',
            'handleThumbnailChange',
            'handleThumbnailDrop'
        ]);
        this.thumbnailInputRef = React.createRef();
        this.preparedFileBlob = null;
        this.autoThumbnailBlob = null;
        this.state = {
            isLoggedIn: null,
            isSaving: false,
            isModalOpen: false,
            isPreparing: false,
            error: null,
            title: '',
            description: '',
            notesAndCredits: '',
            thumbnailPreviewUrl: null,
            customThumbnailFile: null,
            fileSize: 0
        };
    }
    componentDidMount () {
        fetch('/api/auth/me', {credentials: 'include'})
            .then(res => res.json())
            .then(data => this.setState({isLoggedIn: Boolean(data.user)}))
            .catch(() => this.setState({isLoggedIn: false}));
    }
    captureThumbnail () {
        const vm = this.props.vm;
        return new Promise(resolve => {
            vm.postIOData('video', {forceTransparentPreview: true});
            vm.renderer.requestSnapshot(dataURI => {
                vm.postIOData('video', {forceTransparentPreview: false});
                resolve(dataURItoBlob(dataURI));
            });
            vm.renderer.draw();
        });
    }
    async handleClick () {
        if (!this.state.isLoggedIn || this.state.isSaving) {
            return;
        }
        if (this.props.projectId === '0') {
            this.setState({
                isModalOpen: true,
                isPreparing: true,
                title: this.props.projectTitle || '',
                description: '',
                notesAndCredits: '',
                customThumbnailFile: null,
                thumbnailPreviewUrl: null,
                error: null
            });
            try {
                // sequential, not Promise.all: capturing a renderer snapshot forces a draw
                // while saveProjectSb3() is mid-serialization, which produced 0-byte results
                const fileBlob = await this.props.vm.saveProjectSb3();
                if (!fileBlob || !fileBlob.size) {
                    throw new Error('Could not read the project - got an empty file. Please try again.');
                }
                const thumbnailBlob = await this.captureThumbnail();
                this.preparedFileBlob = fileBlob;
                this.autoThumbnailBlob = thumbnailBlob;
                this.setState({
                    isPreparing: false,
                    fileSize: fileBlob.size,
                    thumbnailPreviewUrl: URL.createObjectURL(thumbnailBlob)
                });
            } catch (err) {
                this.setState({isPreparing: false, error: err.message});
            }
        } else {
            this.saveExisting();
        }
    }
    async saveExisting () {
        this.setState({isSaving: true, error: null});
        try {
            const fileBlob = await this.props.vm.saveProjectSb3();
            if (!fileBlob || !fileBlob.size) {
                throw new Error('Could not read the project - got an empty file. Please try again.');
            }
            const thumbnailBlob = await this.captureThumbnail();
            if (fileBlob.size > MAX_UPLOAD_BYTES) {
                throw new Error('This project is larger than the 25MB upload limit');
            }
            const formData = new FormData();
            formData.append('file', fileBlob, 'project.sb3');
            formData.append('thumbnail', thumbnailBlob, 'thumbnail.png');
            const res = await fetch(`/api/projects/${this.props.projectId}/file`, {
                method: 'PUT',
                credentials: 'include',
                body: formData
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Could not save project');
            }
        } catch (err) {
            this.setState({error: err.message});
        } finally {
            this.setState({isSaving: false});
        }
    }
    handleModalCancel () {
        this.setState({isModalOpen: false});
    }
    handleTitleChange (e) {
        this.setState({title: e.target.value});
    }
    handleDescriptionChange (e) {
        this.setState({description: e.target.value});
    }
    handleNotesChange (e) {
        this.setState({notesAndCredits: e.target.value});
    }
    handleThumbnailClick () {
        this.thumbnailInputRef.current.click();
    }
    setCustomThumbnail (file) {
        if (!file) return;
        this.setState({
            customThumbnailFile: file,
            thumbnailPreviewUrl: URL.createObjectURL(file)
        });
    }
    handleThumbnailChange (e) {
        this.setCustomThumbnail(e.target.files[0]);
    }
    handleThumbnailDrop (e) {
        e.preventDefault();
        this.setCustomThumbnail(e.dataTransfer.files[0]);
    }
    async handleModalSubmit () {
        if (this.state.isPreparing || !this.preparedFileBlob) {
            return;
        }
        this.setState({isSaving: true, error: null});
        try {
            if (this.preparedFileBlob.size > MAX_UPLOAD_BYTES) {
                throw new Error('This project is larger than the 25MB upload limit');
            }
            const thumbnailBlob = this.state.customThumbnailFile || this.autoThumbnailBlob;
            const formData = new FormData();
            formData.append('file', this.preparedFileBlob, 'project.sb3');
            formData.append('thumbnail', thumbnailBlob, 'thumbnail.png');
            formData.append('title', this.state.title || this.props.projectTitle || 'Untitled');
            formData.append('description', this.state.description);
            formData.append('notesAndCredits', this.state.notesAndCredits);
            const res = await fetch('/api/projects', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Could not save project');
            }
            const project = await res.json();
            this.props.onSetProjectId(String(project.id));
            this.setState({isModalOpen: false, isSaving: false});
        } catch (err) {
            this.setState({error: err.message, isSaving: false});
        }
    }
    render () {
        const {intl, projectId} = this.props;
        const label = this.state.isSaving ?
            messages.saving :
            (projectId === '0' ? messages.save : messages.update);
        const isOverLimit = this.state.fileSize > MAX_UPLOAD_BYTES;
        const sizePercent = Math.min(100, (this.state.fileSize / MAX_UPLOAD_BYTES) * 100);
        return (
            <React.Fragment>
                <div
                    className={styles.saveButton}
                    onClick={this.handleClick}
                    title={this.state.isLoggedIn === false ? intl.formatMessage(messages.loginRequired) : null}
                    data-disabled={!this.state.isLoggedIn || this.state.isSaving}
                >
                    <FormattedMessage {...label} />
                </div>
                {this.state.isModalOpen && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modal}>
                            {this.state.isPreparing ? (
                                <div className={styles.preparing}>
                                    {intl.formatMessage(messages.preparing)}
                                </div>
                            ) : (
                                <React.Fragment>
                                    <label className={styles.fieldLabel}>
                                        {intl.formatMessage(messages.thumbnailLabel)}
                                        <div
                                            className={styles.thumbnailDropzone}
                                            onClick={this.handleThumbnailClick}
                                            onDragOver={e => e.preventDefault()}
                                            onDrop={this.handleThumbnailDrop}
                                        >
                                            <input
                                                ref={this.thumbnailInputRef}
                                                className={styles.hiddenInput}
                                                type="file"
                                                accept="image/*"
                                                onChange={this.handleThumbnailChange}
                                            />
                                            {this.state.thumbnailPreviewUrl && (
                                                <img
                                                    className={styles.thumbnailPreview}
                                                    src={this.state.thumbnailPreviewUrl}
                                                    alt="Thumbnail preview"
                                                />
                                            )}
                                        </div>
                                        <div className={styles.thumbnailHint}>
                                            {intl.formatMessage(messages.thumbnailHint)}
                                        </div>
                                    </label>
                                    <div className={styles.fieldLabel}>
                                        {'Project Size'}
                                        <div className={styles.sizeBarTrack}>
                                            <div
                                                className={isOverLimit ? styles.sizeBarFillOver : styles.sizeBarFill}
                                                style={{width: `${sizePercent}%`}}
                                            />
                                        </div>
                                        <div className={isOverLimit ? styles.sizeTextOver : styles.sizeText}>
                                            {`${formatBytes(this.state.fileSize)} / 25 MB`}
                                        </div>
                                    </div>
                                    <label className={styles.fieldLabel}>
                                        {intl.formatMessage(messages.titleLabel)}
                                        <input
                                            className={styles.textInput}
                                            type="text"
                                            value={this.state.title}
                                            onChange={this.handleTitleChange}
                                        />
                                    </label>
                                    <label className={styles.fieldLabel}>
                                        {intl.formatMessage(messages.descriptionLabel)}
                                        <textarea
                                            className={styles.textArea}
                                            value={this.state.description}
                                            onChange={this.handleDescriptionChange}
                                        />
                                    </label>
                                    <label className={styles.fieldLabel}>
                                        {intl.formatMessage(messages.notesLabel)}
                                        <textarea
                                            className={styles.textArea}
                                            value={this.state.notesAndCredits}
                                            onChange={this.handleNotesChange}
                                        />
                                    </label>
                                </React.Fragment>
                            )}
                            {this.state.error && (
                                <div className={styles.error}>{this.state.error}</div>
                            )}
                            <div className={styles.modalButtons}>
                                <div
                                    className={styles.secondaryButton}
                                    onClick={this.handleModalCancel}
                                >
                                    {intl.formatMessage(messages.cancel)}
                                </div>
                                <div
                                    className={styles.primaryButton}
                                    onClick={
                                        (this.state.isSaving || this.state.isPreparing) ?
                                            null : this.handleModalSubmit
                                    }
                                >
                                    {this.state.isSaving ?
                                        intl.formatMessage(messages.saving) :
                                        intl.formatMessage(messages.confirm)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </React.Fragment>
        );
    }
}

NyxSaveButton.propTypes = {
    intl: intlShape.isRequired,
    onSetProjectId: PropTypes.func.isRequired,
    projectId: PropTypes.string,
    projectTitle: PropTypes.string,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    projectId: state.scratchGui.projectState.projectId,
    projectTitle: state.scratchGui.projectTitle,
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onSetProjectId: id => dispatch(setProjectId(id))
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(NyxSaveButton));
