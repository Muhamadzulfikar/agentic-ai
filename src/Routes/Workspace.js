const express = require('express');
const crypto = require('crypto');
const machineMiddleware = require('../Middlewares/Machine');
const Database = require('better-sqlite3');
const db = new Database('agentic-ai.db');
const fs = require('fs');
const path = require('path');

const route = express.Router();

route.get('/', machineMiddleware, (req, res) => {
    const { hashedKey } = req

    const getWorkspaces = db.prepare('SELECT workspace_id, name FROM workspaces WHERE hashed_key = ?');
    const workspaces = getWorkspaces.all(hashedKey);

    return res.status(200).json({
        message: 'Workspaces retrieved successfully',
        workspaces: workspaces,
    });
});

route.post('/', machineMiddleware, (req, res) => {
    const { hashedKey } = req
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({
            message: 'Name is required'
        })
    }

    const workspaceId = crypto.randomUUID();

    const createWorkspace = db.prepare('INSERT INTO workspaces (workspace_id, name, hashed_key) VALUES (?, ?, ?)');
    createWorkspace.run(workspaceId, name, hashedKey);

    const targetFolder = path.join(process.cwd(), 'Storage', workspaceId);
    fs.mkdirSync(targetFolder, { recursive: true });

    return res.status(200).json({
        message: 'Workspace created successfully',
        workspaceId: workspaceId,
        name: name,
        targetFolder: targetFolder,
    });
});

route.delete('/', machineMiddleware, (req, res) => {
    const { hashedKey } = req
    const { workspaceId } = req.body;

    if (!workspaceId) {
        return res.status(400).json({
            message: 'Workspace ID is required'
        })
    }

    const deleteWorkspace = db.prepare('DELETE FROM workspaces WHERE workspace_id = ? AND hashed_key = ?');
    deleteWorkspace.run(workspaceId, hashedKey);

    const targetFolder = path.join(process.cwd(), 'Storage', workspaceId);
    fs.rmdirSync(targetFolder, { recursive: true });

    return res.status(200).json({
        message: 'Workspace deleted successfully',
    });
});

module.exports = route;