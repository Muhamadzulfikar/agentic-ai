const Database = require('better-sqlite3');
const db = new Database('agentic-ai.db');

module.exports = (req, res, next) => {
    const { workspaceId } = req.params

    const { isValid } =  db.prepare('SELECT EXISTS(SELECT 1 FROM workspaces WHERE workspace_id = ?) AS isValid')
        .get(workspaceId);

    if (! Boolean(isValid)) {
        return res.status(400).json({
            message: 'Workspace id is not valid',
        });
    }

    next();
}