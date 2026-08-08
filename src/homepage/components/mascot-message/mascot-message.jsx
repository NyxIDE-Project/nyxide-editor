import PropTypes from 'prop-types';
import React from 'react';

import styles from './mascot-message.css';

const MascotMessage = ({mascot, children}) => (
    <div className={styles.container}>
        <img
            className={styles.mascot}
            src={`/mascot/${mascot}.svg`}
            alt=""
        />
        <div className={styles.text}>{children}</div>
    </div>
);

MascotMessage.propTypes = {
    mascot: PropTypes.oneOf(['404', 'crash', 'default']).isRequired,
    children: PropTypes.node.isRequired
};

export default MascotMessage;
