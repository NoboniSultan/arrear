const FlaggedItem = require('../models/flaggedItem');
const ollamaService = require('../services/ollamaService');

// Prompt template for turning one flagged item into a plain-language report
// a human reviewer can quickly act on. Kept deliberately narrow — the model
// is told not to invent facts, and its output is never auto-submitted
// anywhere; a person always reviews it first (see flaggedItemsController.review).
function buildPrompt(item) {
  return `You are a healthcare compliance analyst assistant. Write a short, plain-language report explaining a missed reporting/incentive opportunity so a human reviewer can quickly decide whether to approve it for submission.

Do not invent any facts beyond what is given below. If information seems incomplete, say so plainly instead of guessing.

Details:
- Program: ${item.program_name}
- Patient reference (synthetic ID, not a real patient identifier): ${item.patient_ref}
- Criteria matched: ${item.criteria_matched}
- Estimated dollar value: $${item.estimated_dollar_value}
- Current status: ${item.status}

Write 2-4 sentences summarizing why this item was flagged and what a reviewer should double-check before approving it for submission.`;
}

async function generateReport(req, res) {
  try {
    const { flaggedItemId } = req.params;
    const item = await FlaggedItem.getById(flaggedItemId);
    if (!item) return res.status(404).json({ error: 'Flagged item not found' });

    const prompt = buildPrompt(item);
    const reportText = await ollamaService.generateText(prompt);

    res.json({
      flaggedItemId: item.id,
      program: item.program_name,
      reportText,
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Failed to generate report from local LLM', details: err.message });
  }
}

module.exports = { generateReport };
