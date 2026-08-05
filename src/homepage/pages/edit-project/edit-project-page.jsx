import React from 'react';
import {Redirect, withRouter} from 'react-router-dom';

import {AuthContext} from '../../contexts/auth-context.jsx';
import {get, putJson, putForm} from '../../lib/api';
import {MAX_UPLOAD_BYTES, resolveApiUrl} from '../../../lib/nyxide-constants';
import {formatBytes} from '../../../lib/tw-bytes-utils';
import TagInput from '../../components/tag-input/tag-input.jsx';

import pageStyles from '../page.css';
import uploadStyles from '../upload/upload-page.css';

class EditProjectForm extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            loading: true,
            notFound: false,
            forbidden: false,
            title: '',
            description: '',
            notesAndCredits: '',
            tags: [],
            currentFileSize: 0,
            newFile: null,
            thumbnailPreviewUrl: null,
            newThumbnail: null,
            isFileDragOver: false,
            isThumbnailDragOver: false,
            error: null,
            isSaving: false,
            redirectTo: null
        };
        this.fileInputRef = React.createRef();
        this.thumbnailInputRef = React.createRef();
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
        this.handleNotesChange = this.handleNotesChange.bind(this);
        this.handleTagsChange = this.handleTagsChange.bind(this);
        this.handleFileInputChange = this.handleFileInputChange.bind(this);
        this.handleThumbnailInputChange = this.handleThumbnailInputChange.bind(this);
        this.handleFileDrop = this.handleFileDrop.bind(this);
        this.handleThumbnailDrop = this.handleThumbnailDrop.bind(this);
        this.openFilePicker = this.openFilePicker.bind(this);
        this.openThumbnailPicker = this.openThumbnailPicker.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    componentDidMount () {
        const {id} = this.props.match.params;
        get(`/api/projects/${id}`)
            .then(project => {
                if (project.owner.username !== this.props.user.username) {
                    this.setState({loading: false, forbidden: true});
                    return;
                }
                this.setState({
                    loading: false,
                    title: project.title,
                    description: project.description,
                    notesAndCredits: project.notesAndCredits,
                    tags: project.tags || [],
                    currentFileSize: project.fileSize,
                    thumbnailPreviewUrl: resolveApiUrl(project.thumbnailUrl)
                });
            })
            .catch(() => this.setState({loading: false, notFound: true}));
    }
    componentWillUnmount () {
        if (this.state.newThumbnail && this.state.thumbnailPreviewUrl) {
            URL.revokeObjectURL(this.state.thumbnailPreviewUrl);
        }
    }
    openFilePicker () {
        this.fileInputRef.current.click();
    }
    openThumbnailPicker () {
        this.thumbnailInputRef.current.click();
    }
    setNewFile (file) {
        if (!file) return;
        if (file.size > MAX_UPLOAD_BYTES) {
            this.setState({error: 'That project file is larger than the 25MB upload limit.'});
            return;
        }
        this.setState({newFile: file, error: null});
    }
    setNewThumbnail (file) {
        if (!file) return;
        if (this.state.newThumbnail && this.state.thumbnailPreviewUrl) {
            URL.revokeObjectURL(this.state.thumbnailPreviewUrl);
        }
        this.setState({newThumbnail: file, thumbnailPreviewUrl: URL.createObjectURL(file)});
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
    handleTagsChange (tags) {
        this.setState({tags});
    }
    handleFileInputChange (e) {
        this.setNewFile(e.target.files[0]);
    }
    handleThumbnailInputChange (e) {
        this.setNewThumbnail(e.target.files[0]);
    }
    handleFileDrop (e) {
        e.preventDefault();
        this.setState({isFileDragOver: false});
        this.setNewFile(e.dataTransfer.files[0]);
    }
    handleThumbnailDrop (e) {
        e.preventDefault();
        this.setState({isThumbnailDragOver: false});
        this.setNewThumbnail(e.dataTransfer.files[0]);
    }
    async handleSubmit (e) {
        e.preventDefault();
        const {id} = this.props.match.params;
        this.setState({isSaving: true, error: null});
        try {
            await putJson(`/api/projects/${id}`, {
                title: this.state.title,
                description: this.state.description,
                notesAndCredits: this.state.notesAndCredits,
                tags: this.state.tags
            });
            if (this.state.newFile) {
                const formData = new FormData();
                formData.append('file', this.state.newFile);
                if (this.state.newThumbnail) {
                    formData.append('thumbnail', this.state.newThumbnail);
                }
                await putForm(`/api/projects/${id}/file`, formData);
            } else if (this.state.newThumbnail) {
                const formData = new FormData();
                formData.append('thumbnail', this.state.newThumbnail);
                await putForm(`/api/projects/${id}/thumbnail`, formData);
            }
            this.setState({redirectTo: `/player#${id}`});
        } catch (err) {
            this.setState({isSaving: false, error: err.message});
        }
    }
    render () {
        if (this.state.redirectTo) {
            window.location.href = this.state.redirectTo;
            return null;
        }
        if (this.state.loading) {
            return <div className={pageStyles.loading}>Loading…</div>;
        }
        if (this.state.notFound) {
            return <div className={pageStyles.loading}>Project not found.</div>;
        }
        if (this.state.forbidden) {
            return <div className={pageStyles.loading}>You don't own this project.</div>;
        }
        const {newFile, currentFileSize} = this.state;
        const displaySize = newFile ? newFile.size : currentFileSize;
        const percent = Math.min(100, (displaySize / MAX_UPLOAD_BYTES) * 100);
        const isOverLimit = displaySize > MAX_UPLOAD_BYTES;
        return (
            <div>
                <h1 className={pageStyles.heading}>Edit Project</h1>
                <form
                    className={uploadStyles.layout}
                    onSubmit={this.handleSubmit}
                >
                    <div className={uploadStyles.mediaColumn}>
                        <div className={uploadStyles.dropzoneWrapper}>
                            <div className={pageStyles.fieldLabel}>Project File</div>
                            <div
                                className={this.state.isFileDragOver ? uploadStyles.dropzoneActive : uploadStyles.dropzone}
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
                                    className={uploadStyles.hiddenInput}
                                    type="file"
                                    accept=".sb3"
                                    onChange={this.handleFileInputChange}
                                />
                                <div className={uploadStyles.fileSummary}>
                                    <div className={uploadStyles.fileName}>
                                        {newFile ? newFile.name : 'Current project file'}
                                    </div>
                                    <div className={uploadStyles.sizeBarTrack}>
                                        <div
                                            className={isOverLimit ? uploadStyles.sizeBarFillOver : uploadStyles.sizeBarFill}
                                            style={{width: `${percent}%`}}
                                        />
                                    </div>
                                    <div className={isOverLimit ? uploadStyles.sizeTextOver : uploadStyles.sizeText}>
                                        {`${formatBytes(displaySize)} / 25 MB`}
                                    </div>
                                    <div className={uploadStyles.dropzoneHint}>
                                        {'Click or drop a new .sb3 to replace it'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={uploadStyles.dropzoneWrapper}>
                            <div className={pageStyles.fieldLabel}>Thumbnail</div>
                            <div
                                className={
                                    this.state.isThumbnailDragOver ?
                                        uploadStyles.thumbnailDropzoneActive :
                                        uploadStyles.thumbnailDropzone
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
                                    className={uploadStyles.hiddenInput}
                                    type="file"
                                    accept="image/*"
                                    onChange={this.handleThumbnailInputChange}
                                />
                                {this.state.thumbnailPreviewUrl ? (
                                    <img
                                        className={uploadStyles.thumbnailPreview}
                                        src={this.state.thumbnailPreviewUrl}
                                        alt="Thumbnail preview"
                                    />
                                ) : (
                                    <div className={uploadStyles.dropzonePlaceholder}>
                                        <div className={uploadStyles.dropzoneIcon}>{'🖼️'}</div>
                                        <div>{'Click to choose an image, or drag one here'}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={uploadStyles.detailsColumn}>
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
                        <div className={pageStyles.fieldLabel}>
                            {'Tags'}
                            <TagInput
                                tags={this.state.tags}
                                onChange={this.handleTagsChange}
                            />
                        </div>
                        {this.state.error && (
                            <div className={pageStyles.error}>{this.state.error}</div>
                        )}
                        <button
                            className={pageStyles.submitButton}
                            type="submit"
                            disabled={this.state.isSaving}
                        >
                            {this.state.isSaving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }
}

const EditProjectPage = props => (
    <AuthContext.Consumer>
        {({user, loading}) => {
            if (loading) {
                return <div className={pageStyles.loading}>Loading…</div>;
            }
            if (!user) {
                return <Redirect to="/login" />;
            }
            return (
                <EditProjectForm
                    user={user}
                    match={props.match}
                />
            );
        }}
    </AuthContext.Consumer>
);

export default withRouter(EditProjectPage);
