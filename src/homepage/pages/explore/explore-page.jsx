import React from 'react';

import ProjectGrid from '../../components/project-grid/project-grid.jsx';
import {get} from '../../lib/api';

import styles from '../page.css';

const PAGE_SIZE = 24;

class ExplorePage extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            items: [],
            total: 0,
            page: 1,
            loading: true
        };
        this.handlePrev = this.handlePrev.bind(this);
        this.handleNext = this.handleNext.bind(this);
    }
    componentDidMount () {
        this.load(1);
    }
    load (page) {
        this.setState({loading: true});
        get('/api/projects', {page})
            .then(data => this.setState({
                items: data.items,
                total: data.total,
                page,
                loading: false
            }))
            .catch(() => this.setState({loading: false}));
    }
    handlePrev () {
        if (this.state.page > 1) {
            this.load(this.state.page - 1);
        }
    }
    handleNext () {
        if (this.state.page * PAGE_SIZE < this.state.total) {
            this.load(this.state.page + 1);
        }
    }
    render () {
        return (
            <div>
                <h1 className={styles.heading}>Explore</h1>
                {this.state.loading ? (
                    <div className={styles.loading}>Loading…</div>
                ) : (
                    <React.Fragment>
                        <ProjectGrid items={this.state.items} />
                        <div className={styles.pagination}>
                            <div
                                className={styles.paginationButton}
                                onClick={this.handlePrev}
                            >
                                Previous
                            </div>
                            <div
                                className={styles.paginationButton}
                                onClick={this.handleNext}
                            >
                                Next
                            </div>
                        </div>
                    </React.Fragment>
                )}
            </div>
        );
    }
}

export default ExplorePage;
