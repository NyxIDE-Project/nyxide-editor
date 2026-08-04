import React from 'react';
import {Redirect} from 'react-router-dom';

import {AuthContext} from '../../contexts/auth-context.jsx';
import {postForm} from '../../lib/api';
import {MAX_UPLOAD_BYTES} from '../../../lib/nyxide-constants';
import {formatBytes} from '../../../lib/tw-bytes-utils';

import pageStyles from '../page.css';
import styles from './upload-page.css';

class UploadPage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            title: '',
            description: '',
            notesAndCredits: '',
            file: null,
            thumbnail: null,
            thumbnailPreviewUrl: null,
            error: null,
            isSubmitting: false,
            redirectTo: null,
            isFileDragOver: false,
            isThumbnailDragOver: false
        };
        this.fileInputRef = React.createRef();
        this.thumbnailInputRef = React.createRef();
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
        this.handleNotesChange = this.handleNotesChange.bind(this);
        this.handleFileInputChange = this.handleFileInputChange.bind(this);
        this.handleThumbnailInputChange = this.handleThumbnailInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleFileDrop = this.handleFileDrop.bind(this);
        this.handleThumbnailDrop = this.handleThumbnailDrop.bind(this);
        this.openFilePicker = this.openFilePicker.bind(this);
        this.openThumbnailPicker = this.openThumbnailPicker.bind(this);
    }
    componentWillUnmount () {
        if (this.state.thumbnailPreviewUrl) {
            URL.revokeObjectURL(this.state.thumbnailPreviewUrl);
        }
    }
    setFile (file) {
        if (!file) return;
        if (file.size > MAX_UPLOAD_BYTES) {
            this.setState({error: 'That project file is larger than the 25MB upload limit.'});
            return;
        }
        this.setState({file, error: null});
    }
    setThumbnail (file) {
        if (!file) return;
        if (this.state.thumbnailPreviewUrl) {
            URL.revokeObjectURL(this.state.thumbnailPreviewUrl);
        }
        this.setState({thumbnail: file, thumbnailPreviewUrl: URL.createObjectURL(file)});
    }
    openFilePicker () {
        this.fileInputRef.current.click();
    }
    openThumbnailPicker () {
        this.thumbnailInputRef.current.click();
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
    handleFileInputChange (e) {
        this.setFile(e.target.files[0]);
    }
    handleThumbnailInputChange (e) {
        this.setThumbnail(e.target.files[0]);
    }
    handleFileDrop (e) {
        e.preventDefault();
        this.setState({isFileDragOver: false});
        this.setFile(e.dataTransfer.files[0]);
    }
    handleThumbnailDrop (e) {
        e.preventDefault();
        this.setState({isThumbnailDragOver: false});
        this.setThumbnail(e.dataTransfer.files[0]);
    }
    handleSubmit (e) {
        e.preventDefault();
        if (!this.state.file) {
            this.setState({error: 'Please choose a project file to upload.'});
            return;
        }
        if (this.state.file.size > MAX_UPLOAD_BYTES) {
            this.setState({error: 'That project file is larger than the 25MB upload limit.'});
            return;
        }
        this.setState({isSubmitting: true, error: null});
        const formData = new FormData();
        formData.append('file', this.state.file);
        if (this.state.thumbnail) {
            formData.append('thumbnail', this.state.thumbnail);
        }
        formData.append('title', this.state.title || 'Untitled');
        formData.append('description', this.state.description);
        formData.append('notesAndCredits', this.state.notesAndCredits);
        postForm('/api/projects', formData)
            .then(project => this.setState({redirectTo: `/player#${project.id}`}))
            .catch(err => this.setState({isSubmitting: false, error: err.message}));
    }
    renderFileDropzone () {
        const {file, isFileDragOver} = this.state;
        const percent = file ? Math.min(100, (file.size / MAX_UPLOAD_BYTES) * 100) : 0;
        const isOverLimit = file && file.size > MAX_UPLOAD_BYTES;
        return (
            <div
                className={styles.dropzoneWrapper}
            >
                <div className={pageStyles.fieldLabel}>{'Project File'}</div>
                <div
                    className={isFileDragOver ? styles.dropzoneActive : styles.dropzone}
                    onClick={this.openFilePicker}
                    onDragOver={e => {
                        e.preventDefault();
                        this.setState({isFileDragOver: true});
                    }}
                    onDragLeave={() => this.setState({isFileDragOver: false})}
                    onDrop={this.handleFileDrop}
                >
                    <input
                        ref={this.fileInputRef}
                        className={styles.hiddenInput}
                        type="file"
                        accept=".sb3"
                        onChange={this.handleFileInputChange}
                    />
                    {file ? (
                        <div className={styles.fileSummary}>
                            <div className={styles.fileName}>{file.name}</div>
                            <div className={styles.sizeBarTrack}>
                                <div
                                    className={isOverLimit ? styles.sizeBarFillOver : styles.sizeBarFill}
                                    style={{width: `${percent}%`}}
                                />
                            </div>
                            <div className={isOverLimit ? styles.sizeTextOver : styles.sizeText}>
                                {`${formatBytes(file.size)} / 25 MB`}
                            </div>
                            <div className={styles.dropzoneHint}>{'Click or drop to replace'}</div>
                        </div>
                    ) : (
                        <div className={styles.dropzonePlaceholder}>
                            <div className={styles.dropzoneIcon}>{'📁'}</div>
                            <div>{'Click to choose a .sb3 file, or drag one here'}</div>
                            <div className={styles.dropzoneHint}>{'Max 25MB'}</div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    renderThumbnailDropzone () {
        const {thumbnailPreviewUrl, isThumbnailDragOver} = this.state;
        return (
            <div className={styles.dropzoneWrapper}>
                <div className={pageStyles.fieldLabel}>{'Thumbnail'}</div>
                <div
                    className={
                        isThumbnailDragOver ? styles.thumbnailDropzoneActive : styles.thumbnailDropzone
                    }
                    onClick={this.openThumbnailPicker}
                    onDragOver={e => {
                        e.preventDefault();
                        this.setState({isThumbnailDragOver: true});
                    }}
                    onDragLeave={() => this.setState({isThumbnailDragOver: false})}
                    onDrop={this.handleThumbnailDrop}
                >
                    <input
                        ref={this.thumbnailInputRef}
                        className={styles.hiddenInput}
                        type="file"
                        accept="image/*"
                        onChange={this.handleThumbnailInputChange}
                    />
                    {thumbnailPreviewUrl ? (
                        <img
                            className={styles.thumbnailPreview}
                            src={thumbnailPreviewUrl}
                            alt="Thumbnail preview"
                        />
                    ) : (
                        <div className={styles.dropzonePlaceholder}>
                            <div className={styles.dropzoneIcon}>{'🖼️'}</div>
                            <div>{'Click to choose an image, or drag one here'}</div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    render () {
        if (this.state.redirectTo) {
            window.location.href = this.state.redirectTo;
            return null;
        }
        return (
            <AuthContext.Consumer>
                {({user, loading}) => {
                    if (loading) {
                        return <div className={pageStyles.loading}>Loading…</div>;
                    }
                    if (!user) {
                        return <Redirect to="/login" />;
                    }
                    return (
                        <div>
                            <h1 className={pageStyles.heading}>Upload a Project</h1>
                            <form
                                className={styles.layout}
                                onSubmit={this.handleSubmit}
                            >
                                <div className={styles.mediaColumn}>
                                    {this.renderFileDropzone()}
                                    {this.renderThumbnailDropzone()}
                                </div>
                                <div className={styles.detailsColumn}>
                                    <label className={pageStyles.fieldLabel}>
                                        Title
                                        <input
                                            className={pageStyles.textInput}
                                            type="text"
                                            value={this.state.title}
                                            onChange={this.handleTitleChange}
                                        />
                                    </label>
                                    <label className={pageStyles.fieldLabel}>
                                        Description
                                        <textarea
                                            className={pageStyles.textArea}
                                            rows={4}
                                            value={this.state.description}
                                            onChange={this.handleDescriptionChange}
                                        />
                                    </label>
                                    <label className={pageStyles.fieldLabel}>
                                        Notes and Credits
                                        <textarea
                                            className={pageStyles.textArea}
                                            rows={4}
                                            value={this.state.notesAndCredits}
                                            onChange={this.handleNotesChange}
                                        />
                                    </label>
                                    {this.state.error && (
                                        <div className={pageStyles.error}>{this.state.error}</div>
                                    )}
                                    <button
                                        className={pageStyles.submitButton}
                                        type="submit"
                                        disabled={this.state.isSubmitting}
                                    >
                                        {this.state.isSubmitting ? 'Uploading…' : 'Upload'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    );
                }}
            </AuthContext.Consumer>
        );
    }
}

export default UploadPage;
