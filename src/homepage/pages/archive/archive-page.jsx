import React from 'react';

import {get} from '../../lib/api';
import {API_BASE_URL} from '../../../lib/nyxide-constants';
import Spinner from '../../../components/spinner/spinner.jsx';

import pageStyles from '../page.css';
import styles from './archive-page.css';

const formatViews = views => `${views.toLocaleString()} view${views === 1 ? '' : 's'}`;

class ArchivePage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            items: null,
            loading: true,
            error: null
        };
    }
    componentDidMount () {
        get('/api/archive/projects')
            .then(data => this.setState({items: data.items, loading: false}))
            .catch(err => this.setState({loading: false, error: err.message}));
    }
    render () {
        return (
            <div className={styles.page}>
                <h1 className={pageStyles.heading}>{'ArkIDE Project Recovery'}</h1>
                <p className={styles.intro}>
                    {'ArkIDE was an earlier, now-discontinued project of mine. When it shut down, its ' +
                        'project database and files were backed up rather than deleted. This page is a ' +
                        'recovery archive of everything that was saved.'}
                </p>
                <div className={styles.warning}>
                    <strong>{'Compatibility warning: '}</strong>
                    {'these are ArkIDE projects, not NyxIDE projects. They will only open in the old '}
                    <a
                        href="https://studio.arkide.site"
                        target="_blank"
                        rel="noreferrer"
                    >
                        {'ArkIDE Editor'}
                    </a>
                    {' or in '}
                    <a
                        href="https://studio.penguinmod.com"
                        target="_blank"
                        rel="noreferrer"
                    >
                        {'PenguinMod’s editor'}
                    </a>
                    {', they will not load in NyxIDE.'}
                </div>
                {this.state.loading && (
                    <div className={styles.loadingRow}>
                        <Spinner
                            large
                            level="primary"
                        />
                        <span>{'Loading archived projects…'}</span>
                    </div>
                )}
                {this.state.error && (
                    <div className={pageStyles.error}>{this.state.error}</div>
                )}
                {this.state.items && (
                    <React.Fragment>
                        <div className={styles.count}>
                            {`${this.state.items.length} project${this.state.items.length === 1 ? '' : 's'} recovered`}
                        </div>
                        <div className={styles.grid}>
                            {this.state.items.map(item => (
                                <div
                                    key={item.id}
                                    className={styles.card}
                                >
                                    <div className={styles.title}>{item.title}</div>
                                    <div className={styles.meta}>
                                        {item.authorUsername ?
                                            `by ${item.authorUsername}` :
                                            'Unknown creator'}
                                    </div>
                                    <div className={styles.meta}>{formatViews(item.views)}</div>
                                    <a
                                        className={styles.downloadButton}
                                        href={`${API_BASE_URL}/api/archive/projects/${item.id}/download`}
                                    >
                                        {'Download'}
                                    </a>
                                </div>
                            ))}
                        </div>
                    </React.Fragment>
                )}
            </div>
        );
    }
}

export default ArchivePage;
