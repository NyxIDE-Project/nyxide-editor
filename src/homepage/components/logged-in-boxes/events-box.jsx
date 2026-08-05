import React from 'react';
import ReactMarkdown from 'react-markdown';

import {get} from '../../lib/api';

import styles from './logged-in-boxes.css';

class EventsBox extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            items: [],
            loading: true,
            error: null
        };
    }
    componentDidMount () {
        get('/api/events', {limit: 3})
            .then(data => this.setState({items: data.items, loading: false}))
            .catch(err => this.setState({loading: false, error: err.message}));
    }
    render () {
        return (
            <div className={styles.box}>
                <h2 className={styles.boxHeading}>{'Current Events'}</h2>
                <div className={styles.boxScroll}>
                    {this.state.loading ? (
                        <div className={styles.boxMessage}>{'Loading…'}</div>
                    ) : this.state.error ? (
                        <div className={styles.boxMessage}>{'Could not load events.'}</div>
                    ) : this.state.items.length === 0 ? (
                        <div className={styles.boxMessage}>{'Nothing going on right now - check back soon!'}</div>
                    ) : (
                        this.state.items.map(event => (
                            <div
                                key={event.id}
                                className={styles.eventItem}
                            >
                                <div className={styles.eventTitle}>{event.title}</div>
                                <div className={styles.markdown}>
                                    <ReactMarkdown>{event.content}</ReactMarkdown>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }
}

export default EventsBox;
