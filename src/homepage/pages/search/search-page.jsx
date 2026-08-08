import React, {useEffect, useState} from 'react';
import {useLocation} from 'react-router-dom';

import ProjectGrid from '../../components/project-grid/project-grid.jsx';
import MascotMessage from '../../components/mascot-message/mascot-message.jsx';
import {get} from '../../lib/api';

import styles from '../page.css';

const useQueryParam = name => {
    const location = useLocation();
    return new URLSearchParams(location.search).get(name) || '';
};

// Gives the operator-only searches used by the homepage's "Show All" links (see
// home-page.jsx / popular-tags.jsx) a readable heading instead of literally quoting the
// operator back at the user.
const headingFor = query => {
    const trimmed = query.trim();
    if (trimmed.toLowerCase() === ':isfeatured') {
        return 'Featured Projects';
    }
    if (trimmed.toLowerCase() === ':newest') {
        return 'Newest Projects';
    }
    if (/^#[a-z0-9_-]+$/i.test(trimmed)) {
        return trimmed;
    }
    return `Search results for "${query}"`;
};

const SearchPage = () => {
    const query = useQueryParam('q');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        if (!query) {
            setItems([]);
            setLoading(false);
            return;
        }
        get('/api/projects', {q: query, page: 1})
            .then(data => {
                setItems(data.items);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [query]);

    return (
        <div>
            <h1 className={styles.heading}>{headingFor(query)}</h1>
            {loading ? (
                <div className={styles.loading}>Loading…</div>
            ) : (
                <ProjectGrid
                    items={items}
                    emptyMessage={(
                        <MascotMessage mascot="404">
                            {'No projects matched your search.'}
                        </MascotMessage>
                    )}
                />
            )}
        </div>
    );
};

export default SearchPage;
