import PropTypes from 'prop-types';
import React from 'react';

import AccountCard from './account-card.jsx';
import EventsBox from './events-box.jsx';
import CommitsBox from './commits-box.jsx';

import styles from './logged-in-boxes.css';

// Replaces the logged-out HeroBanner with 3 boxes once you have an account: your own quick
// links, site announcements admins publish (see admin-events-tab.jsx), and recent activity
// on the project's GitHub repo.
const LoggedInBoxes = ({user}) => (
    <div className={styles.grid}>
        <AccountCard user={user} />
        <EventsBox />
        <CommitsBox />
    </div>
);

LoggedInBoxes.propTypes = {
    user: PropTypes.shape({
        username: PropTypes.string.isRequired
    }).isRequired
};

export default LoggedInBoxes;
