import React from 'react';

import {get} from '../../lib/api';
import {formatBytes} from '../../../lib/tw-bytes-utils';
import {APP_NAME} from '../../../lib/brand';
import Spinner from '../../../components/spinner/spinner.jsx';

import pageStyles from '../page.css';
import styles from './desktop-page.css';

const DESKTOP_REPO_URL = 'https://github.com/NyxIDE-Project/nyxide-desktop/';

// Android's user agent also contains "Linux", so it has to be ruled out first.
const detectPlatform = () => {
    if (typeof navigator === 'undefined') {
        return 'unknown';
    }
    const ua = navigator.userAgent || '';
    if (/android/i.test(ua)) {
        return 'unknown';
    }
    if (/windows/i.test(ua)) {
        return 'windows';
    }
    if (/mac os x|macintosh/i.test(ua)) {
        return 'mac';
    }
    if (/linux/i.test(ua)) {
        return 'linux';
    }
    return 'unknown';
};

const DownloadIcon = () => (
    <svg
        className={styles.downloadIcon}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
    >
        <path
            d="M12 3v12m0 0l-5-5m5 5l5-5M4 20h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

class DesktopPage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            release: null,
            loading: true,
            error: null,
            platform: detectPlatform()
        };
    }
    componentDidMount () {
        get('/api/github/desktop-release')
            .then(release => this.setState({release, loading: false}))
            .catch(err => this.setState({loading: false, error: err.message}));
    }
    renderAsset (asset, label) {
        if (!asset) {
            return null;
        }
        return (
            <a
                className={styles.downloadButton}
                href={asset.url}
            >
                <DownloadIcon />
                <span className={styles.downloadButtonText}>
                    <span className={styles.downloadLabel}>{label}</span>
                    <span className={styles.downloadSize}>{formatBytes(asset.size)}</span>
                </span>
            </a>
        );
    }
    renderDownload () {
        const {release, platform} = this.state;
        const assets = release.assets;
        if (platform === 'windows' && assets.windows) {
            return this.renderAsset(assets.windows, 'Download for Windows');
        }
        if (platform === 'linux' && assets.linux) {
            return this.renderAsset(assets.linux, 'Download for Linux (AppImage)');
        }
        if (platform === 'mac' && (assets.macArm64 || assets.macX64)) {
            return (
                <React.Fragment>
                    <div className={styles.macPrompt}>{'Which Mac do you have?'}</div>
                    <div className={styles.macChoices}>
                        {this.renderAsset(assets.macArm64, 'Apple Silicon (M1/M2/M3)')}
                        {this.renderAsset(assets.macX64, 'Intel')}
                    </div>
                </React.Fragment>
            );
        }
        return (
            <div className={styles.unknownPlatform}>
                {"We couldn't detect a downloadable build for your device."}
            </div>
        );
    }
    render () {
        return (
            <div className={styles.page}>
                <div className={styles.hero}>
                    <img
                        className={styles.heroIcon}
                        src="/logo-mini.png"
                        alt=""
                    />
                    <h1 className={pageStyles.heading}>{`${APP_NAME} Desktop`}</h1>
                    <p className={styles.tagline}>
                        {`Run ${APP_NAME} as a native app on your computer, no browser required.`}
                    </p>
                </div>
                <div className={styles.card}>
                    {this.state.loading ? (
                        <div className={styles.loadingRow}>
                            <Spinner
                                large
                                level="primary"
                            />
                            <span>{'Checking for the latest release…'}</span>
                        </div>
                    ) : this.state.error ? (
                        <div className={styles.errorBox}>
                            <div className={styles.errorTitle}>{'Could not load the latest release'}</div>
                            <div>{this.state.error}</div>
                        </div>
                    ) : (
                        <React.Fragment>
                            <div className={styles.downloadArea}>
                                {this.renderDownload()}
                            </div>
                            {this.state.release.version && (
                                <div className={styles.version}>{`Latest version: ${this.state.release.version}`}</div>
                            )}
                        </React.Fragment>
                    )}
                </div>
                <div className={styles.screenshots}>
                    <img
                        className={styles.screenshot}
                        src="/desktop-screenshots/i1.png"
                        alt="NyxIDE Desktop screenshot"
                    />
                    <img
                        className={styles.screenshot}
                        src="/desktop-screenshots/i2.png"
                        alt="NyxIDE Desktop screenshot"
                    />
                    <img
                        className={styles.screenshot}
                        src="/desktop-screenshots/i3.png"
                        alt="NyxIDE Desktop screenshot"
                    />
                </div>
                <a
                    className={styles.allDownloadsLink}
                    href={DESKTOP_REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                >
                    {'View all download options on GitHub'}
                </a>
            </div>
        );
    }
}

export default DesktopPage;
