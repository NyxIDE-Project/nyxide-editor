import PropTypes from 'prop-types';
import React from 'react';

import {get} from '../../lib/api';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

// Shared across every widget instance on the page so the script is only ever injected once.
let scriptPromise = null;
const loadTurnstileScript = () => {
    if (window.turnstile) {
        return Promise.resolve();
    }
    if (!scriptPromise) {
        scriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = SCRIPT_SRC;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Turnstile'));
            document.head.appendChild(script);
        });
    }
    return scriptPromise;
};

// Renders a Cloudflare Turnstile challenge and reports a verification token up via onVerify.
// The site key itself isn't hardcoded here - it's fetched from GET /api/config so it can be
// changed server-side (env var) without a frontend rebuild.
class TurnstileWidget extends React.Component {
    constructor (props) {
        super(props);
        this.containerRef = React.createRef();
        this.widgetId = null;
        this.mounted = false;
        this.state = {siteKey: null};
    }
    componentDidMount () {
        this.mounted = true;
        get('/api/config')
            .then(data => {
                if (!this.mounted) return;
                this.setState({siteKey: data.turnstileSiteKey}, () => this.renderWidget());
            })
            .catch(() => {
                if (this.mounted && this.props.onError) this.props.onError();
            });
    }
    componentWillUnmount () {
        this.mounted = false;
        if (window.turnstile && this.widgetId !== null) {
            window.turnstile.remove(this.widgetId);
        }
    }
    renderWidget () {
        if (!this.state.siteKey || !this.containerRef.current) return;
        loadTurnstileScript()
            .then(() => {
                if (!this.mounted || !this.containerRef.current) return;
                this.widgetId = window.turnstile.render(this.containerRef.current, {
                    'sitekey': this.state.siteKey,
                    'theme': this.props.theme,
                    'callback': this.props.onVerify,
                    'expired-callback': () => {
                        if (this.props.onExpire) this.props.onExpire();
                    },
                    'error-callback': () => {
                        if (this.props.onError) this.props.onError();
                    }
                });
            })
            .catch(() => {
                if (this.props.onError) this.props.onError();
            });
    }
    reset () {
        if (window.turnstile && this.widgetId !== null) {
            window.turnstile.reset(this.widgetId);
        }
    }
    render () {
        return <div ref={this.containerRef} />;
    }
}

TurnstileWidget.propTypes = {
    onVerify: PropTypes.func.isRequired,
    onExpire: PropTypes.func,
    onError: PropTypes.func,
    theme: PropTypes.oneOf(['light', 'dark', 'auto'])
};

TurnstileWidget.defaultProps = {
    theme: 'auto'
};

export default TurnstileWidget;
