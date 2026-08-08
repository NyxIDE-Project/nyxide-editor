/**
 * Copyright (C) 2021 Thomas Weber
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import {getIsLoading} from '../reducers/project-state.js';
import AppStateHOC from '../lib/app-state-hoc.jsx';
import ErrorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import TWProjectMetaFetcherHOC from '../lib/tw-project-meta-fetcher-hoc.jsx';
import TWStateManagerHOC from '../lib/tw-state-manager-hoc.jsx';
import SBFileUploaderHOC from '../lib/sb-file-uploader-hoc.jsx';
import TWPackagerIntegrationHOC from '../lib/tw-packager-integration-hoc.jsx';
import SettingsStore from '../addons/settings-store-singleton';
import '../lib/tw-fix-history-api';
import GUI from './render-gui.jsx';
import MenuBar from '../components/menu-bar/menu-bar.jsx';
import ProjectInput from '../components/tw-project-input/project-input.jsx';
import NyxFeaturedProjects from '../components/tw-featured-projects/nyx-featured-projects.jsx';
import UntrustedExtensionsWarning from '../components/tw-untrusted-extensions/untrusted-extensions-warning.jsx';
import NyxProjectActions from '../components/menu-bar/nyx-project-actions.jsx';
import NyxProjectHeader from '../components/menu-bar/nyx-project-header.jsx';
import ProjectTags from '../components/tw-project-tags/project-tags.jsx';
import BrowserModal from '../components/browser-modal/browser-modal.jsx';
import CloudVariableBadge from '../containers/tw-cloud-variable-badge.jsx';
import TWWindchimeSubmitter from '../containers/tw-windchime-submitter.jsx';
import {isBrowserSupported} from '../lib/tw-environment-support-prober';
import AddonChannels from '../addons/channels';
import {loadServiceWorker} from './load-service-worker';
import runAddons from '../addons/entry';
import InvalidEmbed from '../components/tw-invalid-embed/invalid-embed.jsx';
import {APP_NAME} from '../lib/brand.js';

import styles from './interface.css';

const isInvalidEmbed = window.parent !== window;

const handleClickAddonSettings = addonId => {
    // addonId might be a string of the addon to focus on, undefined, or an event (treat like undefined)
    const path = process.env.ROUTING_STYLE === 'wildcard' ? 'addons' : 'addons.html';
    const url = `${process.env.ROOT}${path}${typeof addonId === 'string' ? `#${addonId}` : ''}`;
    window.open(url);
};

const messages = defineMessages({
    defaultTitle: {
        defaultMessage: 'Run Scratch projects faster',
        description: 'Title of homepage',
        id: 'tw.guiDefaultTitle'
    },
    projectDescriptionHeading: {
        defaultMessage: 'Description',
        description: "Heading above a project's description on the player page",
        id: 'nyx.player.descriptionHeading'
    },
    projectCreditsHeading: {
        defaultMessage: 'Notes and Credits',
        description: "Heading above a project's notes and credits on the player page",
        id: 'nyx.player.creditsHeading'
    }
});

const WrappedMenuBar = compose(
    SBFileUploaderHOC,
    TWPackagerIntegrationHOC
)(MenuBar);

if (AddonChannels.reloadChannel) {
    AddonChannels.reloadChannel.addEventListener('message', () => {
        location.reload();
    });
}

if (AddonChannels.changeChannel) {
    AddonChannels.changeChannel.addEventListener('message', e => {
        SettingsStore.setStoreWithVersionCheck(e.data);
    });
}

runAddons();

const Footer = () => (
    <footer className={styles.footer}>
        <div className={styles.footerContent}>
            <div className={styles.footerText}>
                <FormattedMessage
                    // eslint-disable-next-line max-len
                    defaultMessage="{APP_NAME} is not affiliated with Scratch, the Scratch Team, or the Scratch Foundation."
                    description="Disclaimer that TurboWarp is not connected to Scratch"
                    id="tw.footer.disclaimer"
                    values={{
                        APP_NAME
                    }}
                />
            </div>

            <div className={styles.footerText}>
                <FormattedMessage
                    // eslint-disable-next-line max-len
                    defaultMessage="Scratch is a project of the Scratch Foundation. It is available for free at {scratchDotOrg}."
                    description="A disclaimer that Scratch requires when referring to Scratch. {scratchDotOrg} is a link with text 'https://scratch.org/'"
                    id="tw.footer.scratchDisclaimer"
                    values={{
                        scratchDotOrg: (
                            <a
                                href="https://scratch.org/"
                                target="_blank"
                                rel="noreferrer"
                            >
                                {'https://scratch.org/'}
                            </a>
                        )
                    }}
                />
            </div>

            <div className={styles.footerColumns}>
                <div className={styles.footerSection}>
                    <div className={styles.footerSectionHeading}>
                        <FormattedMessage
                            defaultMessage="Website"
                            description="Heading for footer links to the editor, homepage, and player"
                            id="tw.footer.websiteHeading"
                        />
                    </div>
                    <a href="/editor">
                        <FormattedMessage
                            defaultMessage="Editor"
                            description="Link in footer to the project editor"
                            id="tw.footer.editor"
                        />
                    </a>
                    <a href="/">
                        <FormattedMessage
                            defaultMessage="Homepage"
                            description="Link in footer to the site homepage"
                            id="tw.footer.homepage"
                        />
                    </a>
                    <a href="/player">
                        <FormattedMessage
                            defaultMessage="Player"
                            description="Link in footer to the standalone project player"
                            id="tw.footer.player"
                        />
                    </a>
                    <a href="/desktop">
                        <FormattedMessage
                            defaultMessage="Desktop"
                            description="Link in footer to the desktop app download page"
                            id="tw.footer.desktop"
                        />
                    </a>
                </div>
                <div className={styles.footerSection}>
                    <div className={styles.footerSectionHeading}>
                        <FormattedMessage
                            defaultMessage="Info"
                            description="Heading for footer links to terms, privacy, and uploading guidelines"
                            id="tw.footer.infoHeading"
                        />
                    </div>
                    <a href="/terms">
                        <FormattedMessage
                            defaultMessage="Terms of Service"
                            description="Link to terms of service"
                            id="tw.footer.terms"
                        />
                    </a>
                    <a href="/privacy">
                        <FormattedMessage
                            defaultMessage="Privacy Policy"
                            description="Link to privacy policy"
                            id="tw.privacy"
                        />
                    </a>
                    <a href="/guidelines">
                        <FormattedMessage
                            defaultMessage="Uploading Guidelines"
                            description="Link to uploading guidelines"
                            id="tw.footer.guidelines"
                        />
                    </a>
                </div>
                <div className={styles.footerSection}>
                    <div className={styles.footerSectionHeading}>
                        <FormattedMessage
                            defaultMessage="Community"
                            description="Heading for footer links to community spaces such as Discord"
                            id="tw.footer.communityHeading"
                        />
                    </div>
                    <a
                        href="https://discord.gg/mYdcjn6YMV"
                        target="_blank"
                        rel="noreferrer"
                    >
                        {/* Do not translate */}
                        {'Discord'}
                    </a>
                </div>
            </div>
        </div>
    </footer>
);

class Interface extends React.Component {
    constructor (props) {
        super(props);
        this.handleUpdateProjectTitle = this.handleUpdateProjectTitle.bind(this);
    }
    componentDidUpdate (prevProps) {
        if (prevProps.isLoading && !this.props.isLoading) {
            loadServiceWorker();
        }
    }
    handleUpdateProjectTitle (title, isDefault) {
        if (isDefault || !title) {
            document.title = `${APP_NAME} - ${this.props.intl.formatMessage(messages.defaultTitle)}`;
        } else {
            document.title = `${title} - ${APP_NAME}`;
        }
    }
    render () {
        if (isInvalidEmbed) {
            return <InvalidEmbed />;
        }

        const {
            /* eslint-disable no-unused-vars */
            intl,
            hasCloudVariables,
            description,
            isFullScreen,
            isLoading,
            isPlayerOnly,
            isRtl,
            projectId,
            projectTitle,
            authorUsername,
            authorThumbnailUrl,
            vm,
            /* eslint-enable no-unused-vars */
            ...props
        } = this.props;
        const isHomepage = isPlayerOnly && !isFullScreen;
        const isEditor = !isPlayerOnly;
        return (
            <div
                className={classNames(styles.container, {
                    [styles.playerOnly]: isHomepage,
                    [styles.editor]: isEditor
                })}
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <TWWindchimeSubmitter />
                {isHomepage ? (
                    <div className={styles.menu}>
                        <WrappedMenuBar
                            canChangeLanguage
                            canManageFiles
                            canChangeTheme
                            enableSeeInside
                            showAuthorInfo={false}
                            onClickAddonSettings={handleClickAddonSettings}
                        />
                    </div>
                ) : null}
                <div
                    className={styles.center}
                    style={isPlayerOnly ? ({
                        // + 2 accounts for 1px border on each side of the stage
                        width: `${Math.max(480, props.customStageSize.width) + 2}px`
                    }) : null}
                >
                    {isHomepage && projectId !== '0' && (
                        <div className={styles.section}>
                            <NyxProjectHeader
                                title={projectTitle}
                                authorUsername={authorUsername}
                                authorThumbnailUrl={authorThumbnailUrl}
                            />
                        </div>
                    )}
                    <GUI
                        onClickAddonSettings={handleClickAddonSettings}
                        onUpdateProjectTitle={this.handleUpdateProjectTitle}
                        backpackVisible
                        backpackHost="_local_"
                        {...props}
                    />
                    {isHomepage ? (
                        <React.Fragment>
                            {isBrowserSupported() ? null : (
                                <BrowserModal isRtl={isRtl} />
                            )}
                            {projectId !== '0' && (
                                <div className={styles.section}>
                                    <UntrustedExtensionsWarning
                                        vm={vm}
                                        isLoading={isLoading}
                                        projectId={projectId}
                                    />
                                </div>
                            )}
                            <div className={styles.section}>
                                <ProjectInput />
                            </div>
                            {(
                                // eslint-disable-next-line max-len
                                description.instructions === 'unshared' || description.credits === 'unshared'
                            ) && (
                                <div className={classNames(styles.infobox, styles.unsharedUpdate)}>
                                    <p>
                                        <FormattedMessage
                                            defaultMessage="Unshared projects are no longer visible."
                                            description="Appears on unshared projects"
                                            id="tw.unshared2.1"
                                        />
                                    </p>
                                    <p>
                                        <FormattedMessage
                                            defaultMessage="For more information, visit: {link}"
                                            description="Appears on unshared projects"
                                            id="tw.unshared.2"
                                            values={{
                                                link: (
                                                    <a
                                                        href="https://docs.turbowarp.org/unshared-projects"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {'https://docs.turbowarp.org/unshared-projects'}
                                                    </a>
                                                )
                                            }}
                                        />
                                    </p>
                                    <p>
                                        <FormattedMessage
                                            // eslint-disable-next-line max-len
                                            defaultMessage="If the project was shared recently, this message may appear incorrectly for a few minutes."
                                            description="Appears on unshared projects"
                                            id="tw.unshared.cache"
                                        />
                                    </p>
                                    <p>
                                        <FormattedMessage
                                            // eslint-disable-next-line max-len
                                            defaultMessage="If this project is actually shared, please report a bug."
                                            description="Appears on unshared projects"
                                            id="tw.unshared.bug"
                                        />
                                    </p>
                                </div>
                            )}
                            {hasCloudVariables && projectId !== '0' && (
                                <div className={styles.section}>
                                    <CloudVariableBadge />
                                </div>
                            )}
                            {projectId !== '0' && (
                                <div className={styles.section}>
                                    <NyxProjectActions />
                                </div>
                            )}
                            {projectId !== '0' && description.instructions &&
                                description.instructions !== 'unshared' && (
                                <div className={classNames(styles.section, styles.projectInfoBox)}>
                                    <h3>{intl.formatMessage(messages.projectDescriptionHeading)}</h3>
                                    <p className={styles.projectText}>{description.instructions}</p>
                                </div>
                            )}
                            {projectId !== '0' && description.credits &&
                                description.credits !== 'unshared' && (
                                <div className={classNames(styles.section, styles.projectInfoBox)}>
                                    <h3>{intl.formatMessage(messages.projectCreditsHeading)}</h3>
                                    <p className={styles.projectText}>{description.credits}</p>
                                </div>
                            )}
                            {projectId !== '0' && (
                                <div className={styles.section}>
                                    <ProjectTags />
                                </div>
                            )}
                            {/* 
                            <div className={styles.section}>
                                <p>
                                    <FormattedMessage
                                        // eslint-disable-next-line max-len
                                        defaultMessage="{APP_NAME} is a TurboWarp mod that allows you to build and upload projects with custom extensions and features."
                                        description="Description of TurboWarp on the homepage"
                                        id="tw.home.description"
                                        values={{
                                            APP_NAME
                                        }}
                                    />
                                </p>
                            </div>
                            */}
                            <div className={styles.section}>
                                <NyxFeaturedProjects />
                            </div>
                        </React.Fragment>
                    ) : null}
                </div>
                {isHomepage && <Footer />}
            </div>
        );
    }
}

Interface.propTypes = {
    intl: intlShape,
    hasCloudVariables: PropTypes.bool,
    customStageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number
    }),
    description: PropTypes.shape({
        credits: PropTypes.string,
        instructions: PropTypes.string
    }),
    isFullScreen: PropTypes.bool,
    isLoading: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    isRtl: PropTypes.bool,
    projectId: PropTypes.string,
    projectTitle: PropTypes.string,
    authorUsername: PropTypes.string,
    authorThumbnailUrl: PropTypes.string,
    // eslint-disable-next-line react/forbid-prop-types
    vm: PropTypes.object
};

const mapStateToProps = state => ({
    hasCloudVariables: state.scratchGui.tw.hasCloudVariables,
    customStageSize: state.scratchGui.customStageSize,
    description: state.scratchGui.tw.description,
    isFullScreen: state.scratchGui.mode.isFullScreen,
    isLoading: getIsLoading(state.scratchGui.projectState.loadingState),
    isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
    isRtl: state.locales.isRtl,
    vm: state.scratchGui.vm,
    projectId: state.scratchGui.projectState.projectId,
    projectTitle: state.scratchGui.projectTitle,
    authorUsername: state.scratchGui.tw.author.username,
    authorThumbnailUrl: state.scratchGui.tw.author.thumbnail
});

const mapDispatchToProps = () => ({});

const ConnectedInterface = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(Interface));

const WrappedInterface = compose(
    AppStateHOC,
    ErrorBoundaryHOC('TW Interface'),
    TWProjectMetaFetcherHOC,
    TWStateManagerHOC,
    TWPackagerIntegrationHOC
)(ConnectedInterface);

export default WrappedInterface;
