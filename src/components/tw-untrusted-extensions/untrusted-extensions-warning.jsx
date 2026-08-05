import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {FormattedMessage} from 'react-intl';

import {isTrustedExtension, TRUSTED_EXTENSION_ORIGINS} from '../../containers/tw-security-manager.jsx';
import {APP_NAME} from '../../lib/brand.js';

import styles from './untrusted-extensions-warning.css';

const isOfficialOrigin = url => TRUSTED_EXTENSION_ORIGINS.some(origin => url.startsWith(origin));

// isTrustedExtension() is true for both official-repo extensions (always unsandboxed) and
// extensions the user manually approved with "Run without sandbox" - those manually-approved
// ones are exactly the dangerous combination this component warns about: not from a vetted
// origin, yet running with full page access instead of an iframe sandbox.
const getDangerousExtensions = vm => {
    if (!vm || !vm.extensionManager) {
        return [];
    }
    const urls = vm.extensionManager.getExtensionURLs();
    return Object.entries(urls)
        .filter(([, url]) => isTrustedExtension(url) && !isOfficialOrigin(url))
        .map(([id, url]) => ({id, url}));
};

class UntrustedExtensionsWarning extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'refreshExtensions',
            'handleItemClick'
        ]);
        this.state = {
            extensions: [],
            expanded: {},
            sources: {}
        };
    }
    componentDidMount () {
        this.refreshExtensions();
    }
    componentDidUpdate (prevProps) {
        if (
            (prevProps.isLoading && !this.props.isLoading) ||
            prevProps.projectId !== this.props.projectId
        ) {
            this.refreshExtensions();
        }
    }
    refreshExtensions () {
        this.setState({
            extensions: getDangerousExtensions(this.props.vm),
            expanded: {},
            sources: {}
        });
    }
    handleItemClick (e) {
        this.handleToggle(e.currentTarget.dataset.url);
    }
    handleToggle (url) {
        const wasExpanded = Boolean(this.state.expanded[url]);
        this.setState(state => ({
            expanded: {...state.expanded, [url]: !wasExpanded}
        }));
        if (!wasExpanded && !this.state.sources[url]) {
            this.setState(state => ({
                sources: {...state.sources, [url]: {loading: true}}
            }));
            fetch(url)
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`HTTP ${res.status}`);
                    }
                    return res.text();
                })
                .then(text => {
                    this.setState(state => ({
                        sources: {...state.sources, [url]: {loading: false, text}}
                    }));
                })
                .catch(err => {
                    this.setState(state => ({
                        sources: {...state.sources, [url]: {loading: false, error: err.message}}
                    }));
                });
        }
    }
    render () {
        if (this.state.extensions.length === 0) {
            return null;
        }
        return (
            <div className={styles.container}>
                <p className={styles.title}>
                    <FormattedMessage
                        // eslint-disable-next-line max-len
                        defaultMessage="This project uses custom extensions that are running without a security sandbox."
                        description="Title of warning about unsandboxed custom extensions"
                        id="tw.untrustedExtensions.title"
                    />
                </p>
                <p>
                    <FormattedMessage
                        // eslint-disable-next-line max-len
                        defaultMessage="Unsandboxed extensions from sources that {APP_NAME} doesn't control can do things like corrupt this project, read or modify your account, or phish for passwords. Only continue if you trust whoever shared this project. You can review each extension's code below before deciding."
                        description="Body of warning about unsandboxed custom extensions"
                        id="tw.untrustedExtensions.body"
                        values={{APP_NAME}}
                    />
                </p>
                <ul className={styles.list}>
                    {this.state.extensions.map(extension => {
                        const isExpanded = Boolean(this.state.expanded[extension.url]);
                        const source = this.state.sources[extension.url];
                        return (
                            <li
                                key={extension.url}
                                className={styles.item}
                            >
                                <div
                                    className={styles.itemHeader}
                                    data-url={extension.url}
                                    onClick={this.handleItemClick}
                                >
                                    <span className={styles.caret}>{isExpanded ? '▾' : '▸'}</span>
                                    <span className={styles.extensionId}>{extension.id}</span>
                                    <span className={styles.extensionUrl}>{extension.url}</span>
                                </div>
                                {isExpanded && (
                                    <div className={styles.sourceBox}>
                                        {!source || source.loading ? (
                                            <FormattedMessage
                                                defaultMessage="Loading source code…"
                                                description="Shown while fetching an extension's source code"
                                                id="tw.untrustedExtensions.loadingSource"
                                            />
                                        ) : source.error ? (
                                            <div className={styles.sourceError}>
                                                <FormattedMessage
                                                    // eslint-disable-next-line max-len
                                                    defaultMessage="Could not load the source code automatically ({error}). You can still view it directly:"
                                                    description="Shown when fetching an extension's source code fails"
                                                    id="tw.untrustedExtensions.sourceError"
                                                    values={{error: source.error}}
                                                />
                                                <a
                                                    href={extension.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {extension.url}
                                                </a>
                                            </div>
                                        ) : (
                                            <pre className={styles.sourceCode}>{source.text}</pre>
                                        )}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }
}

UntrustedExtensionsWarning.propTypes = {
    vm: PropTypes.shape({
        extensionManager: PropTypes.shape({
            getExtensionURLs: PropTypes.func
        })
    }),
    isLoading: PropTypes.bool,
    projectId: PropTypes.string
};

export default UntrustedExtensionsWarning;
