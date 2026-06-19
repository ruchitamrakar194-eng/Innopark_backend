// =====================================================
// Custom Section Group Controller
// Handles section groups (shared sections) for Leads, Orders, Contacts, Companies
// =====================================================

const pool = require('../config/db');

/**
 * Get all custom section groups
 * GET /api/v1/custom-section-groups
 * Optional query param: entity (lead|order|contact|company)
 */
const getAll = async (req, res) => {
  try {
    const { entity } = req.query; // filter by entity type
    const companyId = req.companyId || req.query.company_id || req.body.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, error: req.t ? req.t('api_msg_e1be2bab') : 'company_id is required' });
    }
    let query = `SELECT * FROM custom_section_groups WHERE company_id = ?`;
    const params = [companyId];
    if (entity) {
      // Return groups where entity_type matches OR shared_with includes the entity
      query += ` AND (entity_type = ? OR JSON_CONTAINS(shared_with, '"${entity}"'))`;
      params.push(entity);
    }
    query += ' ORDER BY id ASC';
    const [groups] = await pool.execute(query, params);
    res.json({ success: true, data: groups });
  } catch (error) {
    console.error('Get custom section groups error:', error);
    res.status(500).json({ success: false, error: req.t ? req.t('api_msg_e43162da') : 'Failed to fetch custom section groups' });
  }
};

/**
 * Get custom section group by ID
 * GET /api/v1/custom-section-groups/:id
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId || req.query.company_id || req.body.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'company_id is required' });
    }
    const [rows] = await pool.execute('SELECT * FROM custom_section_groups WHERE id = ? AND company_id = ?', [id, companyId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Custom section group not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Get custom section group error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch custom section group' });
  }
};

/**
 * Create a new custom section group
 * POST /api/v1/custom-section-groups
 */
const create = async (req, res) => {
  try {
    const { title, entity_type, shared_with } = req.body; // shared_with should be an array e.g. ['order']
    const companyId = req.companyId || req.body.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'company_id is required' });
    }
    if (!title || !entity_type) {
      return res.status(400).json({ success: false, error: 'title and entity_type are required' });
    }
    const sharedJson = shared_with ? JSON.stringify(shared_with) : '[]';
    const [result] = await pool.execute(
      `INSERT INTO custom_section_groups (company_id, title, entity_type, shared_with) VALUES (?, ?, ?, ?)`,
      [companyId, title.trim(), entity_type, sharedJson]
    );
    res.status(201).json({
      success: true,
      data: { id: result.insertId, company_id: companyId, title: title.trim(), entity_type, shared_with: shared_with || [] },
      message: 'Custom section group created successfully'
    });
  } catch (error) {
    console.error('Create custom section group error:', error);
    res.status(500).json({ success: false, error: 'Failed to create custom section group' });
  }
};

/**
 * Update custom section group
 * PUT /api/v1/custom-section-groups/:id
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, entity_type, shared_with } = req.body;
    const companyId = req.companyId || req.body.company_id || req.query.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'company_id is required' });
    }
    const fields = [];
    const params = [];
    if (title) { fields.push('title = ?'); params.push(title.trim()); }
    if (entity_type) { fields.push('entity_type = ?'); params.push(entity_type); }
    if (shared_with !== undefined) { fields.push('shared_with = ?'); params.push(JSON.stringify(shared_with)); }
    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    const query = `UPDATE custom_section_groups SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`;
    params.push(id, companyId);
    const [result] = await pool.execute(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Custom section group not found or unauthorized' });
    }
    res.json({ success: true, message: 'Custom section group updated successfully' });
  } catch (error) {
    console.error('Update custom section group error:', error);
    res.status(500).json({ success: false, error: 'Failed to update custom section group' });
  }
};

/**
 * Delete custom section group
 * DELETE /api/v1/custom-section-groups/:id
 */
const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId || req.query.company_id || req.body.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'company_id is required' });
    }
    const [result] = await pool.execute('DELETE FROM custom_section_groups WHERE id = ? AND company_id = ?', [id, companyId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Custom section group not found or unauthorized' });
    }
    res.json({ success: true, message: 'Custom section group deleted successfully' });
  } catch (error) {
    console.error('Delete custom section group error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete custom section group' });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteGroup,
};
