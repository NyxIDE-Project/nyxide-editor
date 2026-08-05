import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import log from './log';
import {API_BASE_URL} from './nyxide-constants';

import {setProjectTitle} from '../reducers/project-title';
import {setAuthor, setDescription, setTags, setStats} from '../reducers/tw';

export const fetchProjectMeta = async projectId => {
    const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {credentials: 'include'});
    if (!res.ok) {
        if (res.status === 404) {
            throw new Error('Project not found');
        }
        throw new Error(`Unexpected status code: ${res.status}`);
    }
    return res.json();
};

const getNoIndexTag = () => document.querySelector('meta[name="robots"][content="noindex"]');
const setIndexable = indexable => {
    if (indexable) {
        const tag = getNoIndexTag();
        if (tag) {
            tag.remove();
        }
    } else if (!getNoIndexTag()) {
        const tag = document.createElement('meta');
        tag.name = 'robots';
        tag.content = 'noindex';
        document.head.appendChild(tag);
    }
};

const TWProjectMetaFetcherHOC = function (WrappedComponent) {
    class ProjectMetaFetcherComponent extends React.Component {
        componentDidUpdate (prevProps) {
            // project title resetting is handled in titled-hoc.jsx
            if (this.props.reduxProjectId !== prevProps.reduxProjectId) {
                this.props.onSetAuthor('', '');
                this.props.onSetDescription('', '');
                this.props.onSetTags([]);
                this.props.onSetStats({
                    viewCount: 0,
                    likeCount: 0,
                    favoriteCount: 0,
                    isLikedByViewer: false,
                    isFavoritedByViewer: false
                });
                const projectId = this.props.reduxProjectId;

                if (projectId === '0') {
                    // don't try to get metadata
                } else {
                    fetchProjectMeta(projectId).then(data => {
                        // If project ID changed, ignore the results.
                        if (this.props.reduxProjectId !== projectId) {
                            return;
                        }

                        const title = data.title;
                        if (title) {
                            this.props.onSetProjectTitle(title);
                        }
                        const authorName = data.owner ? data.owner.username : '';
                        const authorThumbnail = data.owner ? data.owner.avatarUrl : '';
                        this.props.onSetAuthor(authorName, authorThumbnail);
                        const instructions = data.description || '';
                        const credits = data.notesAndCredits || '';
                        if (instructions || credits) {
                            this.props.onSetDescription(instructions, credits);
                        }
                        this.props.onSetTags(Array.isArray(data.tags) ? data.tags : []);
                        this.props.onSetStats({
                            viewCount: data.viewCount || 0,
                            likeCount: data.likeCount || 0,
                            favoriteCount: data.favoriteCount || 0,
                            isLikedByViewer: Boolean(data.isLikedByViewer),
                            isFavoritedByViewer: Boolean(data.isFavoritedByViewer)
                        });
                        setIndexable(true);
                    })
                        .catch(err => {
                            setIndexable(false);
                            log.warn('cannot fetch project meta', err);
                        });
                }
            }
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                reduxProjectId,
                onSetAuthor,
                onSetDescription,
                onSetTags,
                onSetStats,
                onSetProjectTitle,
                /* eslint-enable no-unused-vars */
                ...props
            } = this.props;
            return (
                <WrappedComponent
                    {...props}
                />
            );
        }
    }
    ProjectMetaFetcherComponent.propTypes = {
        reduxProjectId: PropTypes.string,
        onSetAuthor: PropTypes.func,
        onSetDescription: PropTypes.func,
        onSetTags: PropTypes.func,
        onSetStats: PropTypes.func,
        onSetProjectTitle: PropTypes.func
    };
    const mapStateToProps = state => ({
        reduxProjectId: state.scratchGui.projectState.projectId
    });
    const mapDispatchToProps = dispatch => ({
        onSetAuthor: (username, thumbnail) => dispatch(setAuthor({
            username,
            thumbnail
        })),
        onSetDescription: (instructions, credits) => dispatch(setDescription({
            instructions,
            credits
        })),
        onSetTags: tags => dispatch(setTags(tags)),
        onSetStats: stats => dispatch(setStats(stats)),
        onSetProjectTitle: title => dispatch(setProjectTitle(title))
    });
    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(ProjectMetaFetcherComponent);
};

export {
    TWProjectMetaFetcherHOC as default
};
