import React from 'react';

import {get, putJson, del} from '../../lib/api';
import {resolveApiUrl} from '../../../lib/nyxide-constants';

import styles from './admin-page.css';

const PAGE_SIZE = 30;
const STATUSES = ['pending', 'resolved', 'dismissed', ''];

class AdminReportsTab extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            items: [],
            total: 0,
            page: 1,
            status: 'pending',
            loading: true,
            removeFormReportId: null,
            removeReason: '',
            error: null
        };
    }
    componentDidMount () {
        this.load(1, this.state.status);
    }
    load (page, status) {
        this.setState({loading: true});
        get('/api/admin/reports', {page, status})
            .then(data => this.setState({items: data.items, total: data.total, page, status, loading: false}))
            .catch(err => this.setState({loading: false, error: err.message}));
    }
    setStatus (status) {
        this.load(1, status);
    }
    dismiss (id) {
        putJson(`/api/admin/reports/${id}/dismiss`, {})
            .then(() => this.load(this.state.page, this.state.status))
            .catch(err => this.setState({error: err.message}));
    }
    resolve (id) {
        putJson(`/api/admin/reports/${id}/resolve`, {})
            .then(() => this.load(this.state.page, this.state.status))
            .catch(err => this.setState({error: err.message}));
    }
    openRemoveForm (reportId) {
        this.setState({removeFormReportId: reportId, removeReason: ''});
    }
    removeProject (report) {
        del(`/api/admin/projects/${report.targetId}`, {reason: this.state.removeReason})
            .then(() => {
                this.setState({removeFormReportId: null});
                return this.resolve(report.id);
            })
            .catch(err => this.setState({error: err.message}));
    }
    renderTarget (report) {
        if (!report.target) {
            return <em>Deleted</em>;
        }
        if (report.targetType === 'project') {
            return (
                <a
                    className={styles.reportTarget}
                    href={`/player#${report.target.id}`}
                    target="_blank"
                    rel="noreferrer"
                >
                    {report.target.thumbnailUrl && (
                        <img
                            className={styles.reportTargetThumb}
                            src={resolveApiUrl(report.target.thumbnailUrl)}
                            alt=""
                        />
                    )}
                    {report.target.title}
                </a>
            );
        }
        return (
            <a
                href={`/users/${report.target.username}`}
                target="_blank"
                rel="noreferrer"
            >
                {`@${report.target.username}`}
            </a>
        );
    }
    render () {
        return (
            <div>
                <div className={styles.inlineForm}>
                    {STATUSES.map(status => (
                        <button
                            key={status || 'all'}
                            className={styles.smallButton}
                            onClick={() => this.setStatus(status)}
                        >
                            {status || 'all'}
                        </button>
                    ))}
                </div>
                {this.state.error && <p>{this.state.error}</p>}
                {this.state.loading ? <p>Loading…</p> : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Target</th>
                                <th>Reporter</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.items.map(report => (
                                <tr key={report.id}>
                                    <td>{report.targetType}</td>
                                    <td>{this.renderTarget(report)}</td>
                                    <td>{report.reporter ? `@${report.reporter.username}` : '—'}</td>
                                    <td>{report.reason}</td>
                                    <td>{report.status}</td>
                                    <td>
                                        {report.status === 'pending' && (
                                            <div className={styles.rowActions}>
                                                <button
                                                    className={styles.smallButton}
                                                    onClick={() => this.dismiss(report.id)}
                                                >
                                                    Dismiss
                                                </button>
                                                <button
                                                    className={styles.smallButton}
                                                    onClick={() => this.resolve(report.id)}
                                                >
                                                    Mark Resolved
                                                </button>
                                                {report.targetType === 'project' && report.target && (
                                                    <button
                                                        className={styles.smallButtonDanger}
                                                        onClick={() => this.openRemoveForm(report.id)}
                                                    >
                                                        Remove Project
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {this.state.removeFormReportId === report.id && (
                                            <div className={styles.inlineForm}>
                                                <input
                                                    className={styles.inlineInput}
                                                    type="text"
                                                    placeholder="Reason for removal"
                                                    value={this.state.removeReason}
                                                    onChange={e => this.setState({removeReason: e.target.value})}
                                                />
                                                <button
                                                    className={styles.smallButtonDanger}
                                                    onClick={() => this.removeProject(report)}
                                                    disabled={!this.state.removeReason.trim()}
                                                >
                                                    Confirm Removal
                                                </button>
                                                <button
                                                    className={styles.smallButton}
                                                    onClick={() => this.setState({removeFormReportId: null})}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <div className={styles.pagination}>
                    <div
                        className={styles.paginationButton}
                        onClick={() => this.state.page > 1 && this.load(this.state.page - 1, this.state.status)}
                    >
                        Previous
                    </div>
                    <div
                        className={styles.paginationButton}
                        onClick={() => {
                            if (this.state.page * PAGE_SIZE < this.state.total) {
                                this.load(this.state.page + 1, this.state.status);
                            }
                        }}
                    >
                        Next
                    </div>
                </div>
            </div>
        );
    }
}

export default AdminReportsTab;
