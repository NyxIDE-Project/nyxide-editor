import React from 'react';

import pageStyles from '../page.css';
import styles from './legal.css';

const FaqPage = () => (
    <div className={styles.page}>
        <h1 className={pageStyles.heading}>{'FAQ'}</h1>

        <h2>{'Will there ever be comments?'}</h2>
        <p>{'Comments are not currently available, but we are considering adding them in the future once infrastructure and moderation is in place.'}</p>

        <h2>{'Will NyxIDE Ever be backwards compatible with ArkIDE?'}</h2>
        <p>{'No, in simple terms NyxIDE will probably never be compatible with ArkIDE unless I spend months of my life on it. For now if you want to work on ArkIDE Projects you can use the old editor or penguinmod.'}</p>

        <h2>{'What is the difference between NyxIDE and ArkIDE?'}</h2>
        <p>{'NyxIDE is a newer, more modern version of the editor with a cleaner interface and faster backend servers, while ArkIDE is the older version with more bugs, broken features, and a much, much slower server.'}</p>
    </div>
);

export default FaqPage;
