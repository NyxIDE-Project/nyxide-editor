import React, {useEffect, useState} from 'react';
import {useLocation} from 'react-router-dom';

import ProjectGrid from '../../components/project-grid/project-grid.jsx';
import {get} from '../../lib/api';

import styles from '../page.css';

const useQueryParam = name => {
    const location = useLocation();
    return new URLSearchParams(location.search).get(name) || '';
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
            <h1 className={styles.heading}>{`Search results for "${query}"`}</h1>
            {loading ? (
                <div className={styles.loading}>Loading…</div>
            ) : (
                <ProjectGrid
                    items={items}
                    emptyMessage="No projects matched your search."
                />
            )}
        </div>
    );
};

export default SearchPage;
