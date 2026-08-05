import PropTypes from 'prop-types';
import React from 'react';

import styles from './tag-input.css';

const MAX_TAGS = 10;
const TAG_RE = /^[a-z0-9_-]{1,30}$/;

const cleanTag = raw => raw.trim()
    .toLowerCase()
    .replace(/^#/, '');

class TagInput extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            draft: '',
            error: null
        };
        this.handleDraftChange = this.handleDraftChange.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleAddClick = this.handleAddClick.bind(this);
        this.handleRemoveClick = this.handleRemoveClick.bind(this);
    }
    addDraft () {
        const tag = cleanTag(this.state.draft);
        if (!tag) {
            return;
        }
        if (this.props.tags.length >= MAX_TAGS) {
            this.setState({error: `You can only add up to ${MAX_TAGS} tags.`});
            return;
        }
        if (!TAG_RE.test(tag)) {
            this.setState({error: 'Tags can only contain lowercase letters, numbers, - and _.'});
            return;
        }
        if (this.props.tags.includes(tag)) {
            this.setState({draft: '', error: null});
            return;
        }
        this.props.onChange([...this.props.tags, tag]);
        this.setState({draft: '', error: null});
    }
    handleDraftChange (e) {
        this.setState({draft: e.target.value, error: null});
    }
    handleKeyDown (e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            this.addDraft();
        }
    }
    handleAddClick () {
        this.addDraft();
    }
    handleRemove (tag) {
        this.props.onChange(this.props.tags.filter(existing => existing !== tag));
    }
    handleRemoveClick (e) {
        this.handleRemove(e.currentTarget.dataset.tag);
    }
    render () {
        return (
            <div className={styles.container}>
                <div className={styles.chips}>
                    {this.props.tags.map(tag => (
                        <span
                            key={tag}
                            className={styles.chip}
                        >
                            {`#${tag}`}
                            <span
                                className={styles.chipRemove}
                                data-tag={tag}
                                onClick={this.handleRemoveClick}
                            >
                                {'×'}
                            </span>
                        </span>
                    ))}
                </div>
                {this.props.tags.length < MAX_TAGS && (
                    <div className={styles.addRow}>
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="Add a tag…"
                            value={this.state.draft}
                            onChange={this.handleDraftChange}
                            onKeyDown={this.handleKeyDown}
                        />
                        <button
                            className={styles.addButton}
                            type="button"
                            onClick={this.handleAddClick}
                        >
                            {'Add'}
                        </button>
                    </div>
                )}
                <div className={styles.hint}>{`${this.props.tags.length} / ${MAX_TAGS} tags`}</div>
                {this.state.error && (
                    <div className={styles.error}>{this.state.error}</div>
                )}
            </div>
        );
    }
}

TagInput.propTypes = {
    tags: PropTypes.arrayOf(PropTypes.string).isRequired,
    onChange: PropTypes.func.isRequired
};

export default TagInput;
