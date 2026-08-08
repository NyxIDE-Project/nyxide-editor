import React from 'react';

import MascotMessage from '../../components/mascot-message/mascot-message.jsx';

import pageStyles from '../page.css';

const NotFoundPage = () => (
    <div>
        <h1 className={pageStyles.heading}>{'Page Not Found'}</h1>
        <MascotMessage mascot="404">
            {"That page doesn't exist."}
        </MascotMessage>
    </div>
);

export default NotFoundPage;
