const Program = require('../models/program');

async function list(req, res) {
  try {
    const programs = await Program.getAll();
    res.json(programs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
}

async function create(req, res) {
  try {
    const { name, fullName, description, rulesVersion } = req.body;
    if (!name || !fullName) {
      return res.status(400).json({ error: 'name and fullName are required' });
    }
    const program = await Program.create({ name, fullName, description, rulesVersion });
    res.status(201).json(program);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create program' });
  }
}

// Backs the Programs page's status toggle ("Activate"/pause), the three
// detection-setting switches, and the min value / lookback / schedule inputs.
async function updateSettings(req, res) {
  try {
    const program = await Program.getById(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found' });

    const updated = await Program.updateSettings(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update program' });
  }
}

// Backs GET /api/summary (mounted directly in server.js, not under
// /api/programs, since it reports across programs for the Overview page).
async function overview(req, res) {
  try {
    const data = await Program.getOverviewData();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recovery summary' });
  }
}

module.exports = { list, create, updateSettings, overview };
