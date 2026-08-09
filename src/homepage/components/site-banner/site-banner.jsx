import React from 'react';

import {get} from '../../lib/api';

import styles from './site-banner.css';

// Picks readable text (black or white) for an arbitrary admin-chosen background color.
const getTextColor = hex => {
    const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
    if (!match) {
        return '#000000';
    }
    const [r, g, b] = match.slice(1).map(part => parseInt(part, 16));
    const luminance = ((0.299 * r) + (0.587 * g) + (0.114 * b)) / 255;
    return luminance > 0.6 ? '#000000' : '#ffffff';
};

class SiteBanner extends React.Component {
    constructor (props) {
        super(props);
        this.state = {banner: null, dismissed: false};
        this.handleDismiss = this.handleDismiss.bind(this);
    }
    componentDidMount () {
        get('/api/banner')
            .then(banner => this.setState({banner}))
            .catch(() => {});
    }
    handleDismiss () {
        this.setState({dismissed: true});
    }
    render () {
        const {banner, dismissed} = this.state;
        if (!banner || !banner.enabled || !banner.content || dismissed) {
            return null;
        }
        const textColor = getTextColor(banner.color);
        return (
            <div
                className={styles.banner}
                style={{backgroundColor: banner.color, color: textColor}}
            >
                <div className={styles.content}>{banner.content}</div>
                {banner.buttonText && banner.buttonUrl && (
                    <a
                        className={styles.button}
                        href={banner.buttonUrl}
                        style={{color: textColor, borderColor: textColor}}
                        target={banner.buttonUrl.startsWith('/') ? null : '_blank'}
                        rel="noreferrer"
                    >
                        {banner.buttonText}
                    </a>
                )}
                <div
                    className={styles.close}
                    style={{color: textColor}}
                    onClick={this.handleDismiss}
                    title="Dismiss"
                >
                    {'✕'}
                </div>
            </div>
        );
    }
}

export default SiteBanner;
