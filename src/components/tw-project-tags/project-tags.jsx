import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import styles from './project-tags.css';

const ProjectTags = ({tags}) => (
    tags.length > 0 ? (
        <div className={styles.tags}>
            {tags.map(tag => (
                <a
                    key={tag}
                    className={styles.tag}
                    href={`/search?q=${encodeURIComponent(`#${tag}`)}`}
                >
                    {`#${tag}`}
                </a>
            ))}
        </div>
    ) : null
);

ProjectTags.propTypes = {
    tags: PropTypes.arrayOf(PropTypes.string).isRequired
};

const mapStateToProps = state => ({
    tags: state.scratchGui.tw.tags
});

export default connect(
    mapStateToProps,
    () => ({})
)(ProjectTags);
