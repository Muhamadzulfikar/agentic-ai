const express = require('express');
const machineMiddleware = require('../Middlewares/Machine');
const Database = require('better-sqlite3');
const db = new Database('agentic-ai.db');
const path = require('path');
const fs = require('fs');
const workspaceMiddleware = require('../Middlewares/Workspace')

const route = express.Router();

route.get('/:workspaceId', machineMiddleware, workspaceMiddleware, (req, res) => {
    try {
        const { workspaceId } = req.params;

        const documents = db.prepare('SELECT name, filepath FROM documents WHERE workspace_id = ?').all(workspaceId);

        if (documents.length === 0) {
            return res.status(200).json({
                message: 'Sucessfully',
                documents: []
            })
        }

        const workspace = path.join(process.cwd(), 'Storages', workspaceId);
        let localFiles = [];
        let s3Files = [];

        if (fs.existsSync(workspace)) {
            localFiles = fs.readdirSync(workspace);
        }

        documents.forEach(document => {
            s3Files = [...s3Files, document.filepath.split('/')[1]];
        });

        const files = [...new Set([...localFiles, ...s3Files])];

        const data = files.map((file) => {
            const inLocalFile = localFiles.includes(file);
            const inS3File = s3Files.includes(file);
            const name = file.split('-')[0];
            let status = 'unsync';

            if (inLocalFile && inS3File) {
                status = 'sync';
            }

            return {
                name: name,
                status: status,
                filepath: `${workspaceId}/${file}`
            };
        });

        return res.status(200).json({
            message: 'Successfully',
            documents: data,
        });
    } catch (error) {
        console.error('Cannot get all documents:', error.message);
    }
});

route.put('/:workspaceId/preview', machineMiddleware, workspaceMiddleware, async (req, res) => {
    try {
        const { filepath } = req.body

        const storage = req.app.get('storage');

        const temporaryUrl = await storage.presignedGetObject(process.env.S3_BUCKET, filepath, 3600);

        return res.status(200).json({
            message: 'Sucessfully',
            temporaryUrl: temporaryUrl
        })
    } catch (error) {
        console.error('Cannot create temporary url', temporaryUrl);
    }
})

route.post('/', machineMiddleware, (req, res) => {
    const { name, type, content, workspaceId } = req.body;

    if (!name) {
        return res.status(400).json({
            message: 'Name is required',
        });
    }

    if (!type) {
        return res.status(400).json({
            message: 'Type is required',
        });
    }

    const allowedType = ['md', 'txt', 'json']

    if (!allowedType.includes(type)) {
        return res.status(400).json({
            message: 'Allowed type is md, text, json'
        })
    }

    if (!content) {
        return res.status(400).json({
            message: 'Content is required',
        });
    }

    if (!workspaceId) {
        return res.status(400).json({
            message: 'Workspace ID is required',
        });
    }

    const filepath = `${workspaceId}/${name}-${crypto.randomUUID()}.${type}`;

    const channel = req.app.get('channel');

    channel.sendToQueue(
        'document',
        Buffer.from(JSON.stringify({ name: name, filepath: filepath, content: content, workspaceId: workspaceId })),
        { persistent: true }
    );

    channel.sendToQueue(
        'destroyLocalFileWait',
        Buffer.from(JSON.stringify({ filepath: filepath }))
    )

    return res.status(200).json({
        message: 'File creation task has been queued up.',
    });
});

route.get('/:workspaceId/sync', machineMiddleware, workspaceMiddleware, async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const storage = req.app.get('storage');

        const documents = db.prepare('SELECT filepath FROM documents WHERE workspace_id = ?').pluck().all(workspaceId);

        const workspace = path.join(process.cwd(), 'Storages', workspaceId);

        const localFiles = fs.readdirSync(workspace);
        const pulledFiles = [];

        documents.forEach(async (document) => {
            const name = document.split('/')[1];

            const target = path.join(workspace, fileName);

            if (!localFiles.includes(name)) {
                await storage.fGetObject(process.env.S3_BUCKET, document, target);
                pulledFiles.push(fileName);
            }
        });

        return res.status(200).json({
            message: 'Successfully synced documents',
            pulledFiles: pulledFiles,
            totalPulled: pulledFiles.length
        });
    } catch (error) {
        console.error('Cannot sync documents:', error.message);
    }
});

route.delete('/:workspaceId', machineMiddleware, workspaceMiddleware, async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { filepath } = req.body;

        if (!filepath) {
            return res.status(400).json({
                message: 'Filepath is required'
            });
        }

        const { valid } = db.prepare('SELECT EXIST(SELECT 1 FROM documents WHERE workspace = ? AND filepath =  ?) as valid')
            .get(filepath);

        if (!Boolean(valid)) {
            return res.status(404).json({
                message: 'Document not found'
            });
        }

        db.prepare('DELETE FROM documents WHERE filepath = ? AND workspace_id = ?').run(filepath, workspaceId);

        const storage = req.app.get('storage');
        await storage.removeObject(process.env.S3_BUCKET, document.filepath);

        const target = path.join(process.cwd(), 'Storages', document.filepath);

        if (fs.existsSync(target)) {
            fs.unlinkSync(target);
        }

        return res.status(200).json({
            message: `Successfully deleted document ${filepath}`
        });
    } catch (error) {
        console.error('Cannot Delete Document', error.message);
    }
});

module.exports = route;
