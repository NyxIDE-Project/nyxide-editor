const {BSON} = require('bson');
const pmpProtobuf = require('pmp-protobuf');
const {ARCHIVE_REPO, ARCHIVE_CACHE_MS, GITHUB_TOKEN} = require('../config');

const RAW_BASE = `https://raw.githubusercontent.com/${ARCHIVE_REPO}/main`;
const MONGO_DIR = 'backup/mongo/pm_apidata';
const MINIO_PROJECTS_DIR = 'backup/minio/projects';
const MINIO_ASSETS_DIR = 'backup/minio/project-assets';

const githubHeaders = () => {
    const headers = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'nyxide-server'
    };
    if (GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
    }
    return headers;
};

// The dump was written by MongoDB's `mongodump`: a flat file of back-to-back BSON documents,
// each one prefixed by its own byte length as an int32.
const parseBsonCollection = buffer => {
    const docs = [];
    let offset = 0;
    while (offset < buffer.length) {
        const size = buffer.readInt32LE(offset);
        docs.push(BSON.deserialize(buffer.subarray(offset, offset + size)));
        offset += size;
    }
    return docs;
};

const fetchRawFile = async relativePath => {
    const response = await fetch(`${RAW_BASE}/${relativePath}`);
    if (!response.ok) {
        throw new Error(`GitHub returned ${response.status} for ${relativePath}`);
    }
    return Buffer.from(await response.arrayBuffer());
};

// Recursive git tree listing, so we know which project ids have a MinIO object (and which
// asset filenames belong to them) without doing a directory listing per project.
const fetchArchiveTree = async () => {
    const response = await fetch(
        `https://api.github.com/repos/${ARCHIVE_REPO}/git/trees/main?recursive=1`,
        {headers: githubHeaders()}
    );
    if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
    }
    const data = await response.json();
    const projectIds = new Set();
    const assetsByProjectId = new Map();
    data.tree.forEach(entry => {
        if (entry.type !== 'blob') {
            return;
        }
        if (entry.path.startsWith(`${MINIO_PROJECTS_DIR}/`)) {
            projectIds.add(entry.path.slice(MINIO_PROJECTS_DIR.length + 1));
        } else if (entry.path.startsWith(`${MINIO_ASSETS_DIR}/`)) {
            const filename = entry.path.slice(MINIO_ASSETS_DIR.length + 1);
            const projectId = filename.split('_')[0];
            if (!assetsByProjectId.has(projectId)) {
                assetsByProjectId.set(projectId, []);
            }
            assetsByProjectId.get(projectId).push(filename);
        }
    });
    return {projectIds, assetsByProjectId};
};

const fetchProjectList = async tree => {
    const [projectsBuf, usersBuf] = await Promise.all([
        fetchRawFile(`${MONGO_DIR}/projects.bson`),
        fetchRawFile(`${MONGO_DIR}/users.bson`)
    ]);
    const projects = parseBsonCollection(projectsBuf);
    const users = parseBsonCollection(usersBuf);
    const usersById = new Map(users.map(user => [user.id, user]));

    return projects
        .filter(project => project.hardReject !== true && tree.projectIds.has(project.id))
        .sort((a, b) => (b.lastUpdate || 0) - (a.lastUpdate || 0))
        .map(project => {
            const author = usersById.get(project.author);
            return {
                id: project.id,
                title: project.title || 'Untitled',
                views: typeof project.views === 'number' ? project.views : 0,
                date: project.date || null,
                authorUsername: author ? author.username : null,
                assetCount: (tree.assetsByProjectId.get(project.id) || []).length
            };
        });
};

let treeCache = null;
let treeCacheExpiresAt = 0;

const getArchiveTree = async () => {
    if (!treeCache || Date.now() > treeCacheExpiresAt) {
        treeCache = await fetchArchiveTree();
        treeCacheExpiresAt = Date.now() + ARCHIVE_CACHE_MS;
    }
    return treeCache;
};

let cache = null;
let cacheExpiresAt = 0;

const getArchiveProjects = async () => {
    if (!cache || Date.now() > cacheExpiresAt) {
        cache = await fetchProjectList(await getArchiveTree());
        cacheExpiresAt = Date.now() + ARCHIVE_CACHE_MS;
    }
    return cache;
};

const safeFilename = (title, id) => {
    const cleaned = (title || '').replace(/[^a-z0-9 _-]/gi, '').trim();
    return cleaned || id;
};

// Rebuilds the original downloadable .arkide file: the project's raw protobuf plus every
// asset it references, the same way arkide-backup's own /download route did, just reading
// each MinIO object over HTTP (from the GitHub mirror) instead of off local disk.
const downloadArchiveProject = async id => {
    const [tree, projects] = await Promise.all([getArchiveTree(), getArchiveProjects()]);
    if (!tree.projectIds.has(id)) {
        return null;
    }
    const assetFilenames = tree.assetsByProjectId.get(id) || [];
    const [protobufBuffer, ...assetBuffers] = await Promise.all([
        fetchRawFile(`${MINIO_PROJECTS_DIR}/${id}`),
        ...assetFilenames.map(filename => fetchRawFile(`${MINIO_ASSETS_DIR}/${filename}`))
    ]);
    const assets = assetFilenames.map((filename, index) => ({
        // Stored as "<projectId>_<assetId>.<ext>" - strip the projectId prefix to get back
        // the asset id pmp-protobuf expects.
        id: filename.slice(id.length + 1),
        buffer: assetBuffers[index]
    }));
    const pmpArrayBuffer = await pmpProtobuf.protobufToPMP(protobufBuffer, assets);
    const project = projects.find(p => p.id === id);
    return {
        buffer: Buffer.from(pmpArrayBuffer),
        filename: `${safeFilename(project && project.title, id)}.arkide`
    };
};

module.exports = {
    getArchiveProjects,
    downloadArchiveProject
};
