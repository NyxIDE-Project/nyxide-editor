import {API_BASE_URL} from '../../lib/nyxide-constants';

class ApiError extends Error {
    constructor (message, status) {
        super(message);
        this.status = status;
    }
}

const parseResponse = async res => {
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const body = isJson ? await res.json().catch(() => ({})) : null;
    if (!res.ok) {
        throw new ApiError((body && body.error) || res.statusText, res.status);
    }
    return body;
};

const request = (path, options = {}) => fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options
}).then(parseResponse);

const get = (path, params) => {
    const query = params ?
        `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null))}` :
        '';
    return request(`${path}${query}`);
};

const postJson = (path, body) => request(path, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
});

const putJson = (path, body) => request(path, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
});

const postForm = (path, formData) => request(path, {
    method: 'POST',
    body: formData
});

const putForm = (path, formData) => request(path, {
    method: 'PUT',
    body: formData
});

const del = (path, body) => request(path, body ? {
    method: 'DELETE',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
} : {method: 'DELETE'});

export {
    ApiError,
    request,
    get,
    postJson,
    putJson,
    postForm,
    putForm,
    del
};
