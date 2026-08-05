import React from 'react';

import {get, postJson, del} from '../../lib/api';
import {resolveApiUrl} from '../../../lib/nyxide-constants';

import styles from './admin-page.css';

class AdminFeaturedTab extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            items: [],
            loading: true,
            addProjectId: '',
            error: null
        };
        this.handleAddSubmit = this.handleAddSubmit.bind(this);
    }
    componentDidMount () {
        this.load();
    }
    load () {
        this.setState({loading: true});
        get('/api/admin/homepage-featured')
            .then(data => this.setState({items: data.items, loading: false}))
            .catch(err => this.setState({loading: false, error: err.message}));
    }
    handleAddSubmit (e) {
        e.preventDefault();
        const id = this.state.addProjectId.trim();
        if (!id) return;
        postJson(`/api/admin/homepage-featured/${id}`, {})
            .then(() => {
                this.setState({addProjectId: ''});
                this.load();
            })
            .catch(err => this.setState({error: err.message}));
    }
    unfeature (id) {
        del(`/api/admin/homepage-featured/${id}`)
            .then(() => this.load())
            .catch(err => this.setState({error: err.message}));
    }
    render () {
        return (
            <div>
                <p>
                    {'Projects with 100+ combined likes and favorites are featured here automatically for ' +
                        '5 days. You can also feature or unfeature any project manually - manual features ' +
                        "don't expire on their own."}
                </p>
                <form
                    className={styles.inlineForm}
                    onSubmit={this.handleAddSubmit}
                >
                    <input
                        className={styles.inlineInput}
                        type="text"
                        placeholder="Project ID"
                        value={this.state.addProjectId}
                        onChange={e => this.setState({addProjectId: e.target.value})}
                    />
                    <button
                        className={styles.smallButton}
                        type="submit"
                    >
                        Feature
                    </button>
                </form>
                {this.state.error && <p>{this.state.error}</p>}
                {this.state.loading ? <p>Loading…</p> : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Owner</th>
                                <th>Source</th>
                                <th>Featured</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.items.map(project => (
                                <tr key={project.id}>
                                    <td>
                                        <a
                                            className={styles.reportTarget}
                                            href={`/player#${project.id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {project.thumbnailUrl && (
                                                <img
                                                    className={styles.reportTargetThumb}
                                                    src={resolveApiUrl(project.thumbnailUrl)}
                                                    alt=""
                                                />
                                            )}
                                            {project.title}
                                        </a>
                                    </td>
                                    <td>{project.owner ? `@${project.owner.username}` : '—'}</td>
                                    <td>
                                        <span
                                            className={
                                                project.featuredSource === 'manual' ?
                                                    styles.badgeAdmin : styles.badgeUser
                                            }
                                        >
                                            {project.featuredSource}
                                        </span>
                                    </td>
                                    <td>{new Date(project.featuredAt).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className={styles.smallButtonDanger}
                                            onClick={() => this.unfeature(project.id)}
                                        >
                                            Unfeature
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!this.state.loading && this.state.items.length === 0 && (
                    <p>No projects are currently featured.</p>
                )}
            </div>
        );
    }
}

export default AdminFeaturedTab;
