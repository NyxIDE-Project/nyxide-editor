import React from 'react';
import {Redirect} from 'react-router-dom';

import {AuthContext} from '../../contexts/auth-context.jsx';
import {get} from '../../lib/api';
import AdminUsersTab from './admin-users-tab.jsx';
import AdminReportsTab from './admin-reports-tab.jsx';
import AdminFeaturedTab from './admin-featured-tab.jsx';
import AdminBroadcastTab from './admin-broadcast-tab.jsx';
import AdminEventsTab from './admin-events-tab.jsx';

import pageStyles from '../page.css';
import styles from './admin-page.css';

const TABS = ['reports', 'users', 'featured', 'events', 'broadcast'];

// nyxide: access here is checked automatically (logged in + admin/owner role + a recent-
// enough login per req.session.adminAuthenticatedAt on the server) - there's nothing to
// type in; a failed check just means "log out and back in" to refresh that server-side
// timestamp, e.g. right after being promoted to admin.
class AdminGate extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            checking: true,
            hasAccess: false,
            error: null,
            activeTab: 'reports'
        };
    }
    componentDidMount () {
        get('/api/admin/users', {page: 1})
            .then(() => this.setState({hasAccess: true, checking: false}))
            .catch(err => this.setState({hasAccess: false, checking: false, error: err.message}));
    }
    render () {
        if (this.state.checking) {
            return <div className={pageStyles.loading}>Loading…</div>;
        }
        if (!this.state.hasAccess) {
            return (
                <div>
                    <h1 className={pageStyles.heading}>Admin Access</h1>
                    <p>{this.state.error}</p>
                </div>
            );
        }
        return (
            <div>
                <h1 className={pageStyles.heading}>Admin</h1>
                <div className={styles.tabs}>
                    {TABS.map(tab => (
                        <div
                            key={tab}
                            className={this.state.activeTab === tab ? styles.tabActive : styles.tab}
                            onClick={() => this.setState({activeTab: tab})}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </div>
                    ))}
                </div>
                {this.state.activeTab === 'reports' && <AdminReportsTab />}
                {this.state.activeTab === 'users' && <AdminUsersTab />}
                {this.state.activeTab === 'featured' && <AdminFeaturedTab />}
                {this.state.activeTab === 'events' && <AdminEventsTab />}
                {this.state.activeTab === 'broadcast' && <AdminBroadcastTab />}
            </div>
        );
    }
}

const AdminPage = () => (
    <AuthContext.Consumer>
        {({user, loading}) => {
            if (loading) {
                return <div className={pageStyles.loading}>Loading…</div>;
            }
            if (!user) {
                return <Redirect to="/login" />;
            }
            if (user.role !== 'admin' && user.role !== 'owner') {
                return <div className={pageStyles.loading}>You don't have permission to view this page.</div>;
            }
            return <AdminGate />;
        }}
    </AuthContext.Consumer>
);

export default AdminPage;
