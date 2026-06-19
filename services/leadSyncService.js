// =====================================================
// Lead Sync Service
// Handles syncing data from Leads to linked Orders
// =====================================================

const pool = require('../config/db');

/**
 * Sync custom fields from a Lead to all its linked Orders.
 * Called after a Lead is created or updated.
 *
 * @param {number} leadId - The ID of the Lead
 * @param {number} companyId - The Company ID
 */
const syncLeadToOrders = async (leadId, companyId) => {
  try {
    // 1. Get the latest lead data
    const [leads] = await pool.execute('SELECT custom_data FROM leads WHERE id = ? AND company_id = ?', [leadId, companyId]);
    if (leads.length === 0) return;
    const lead = leads[0];
    
    // Parse lead custom data (it might be stringified json or object)
    let leadCustomData = {};
    if (lead.custom_data) {
        leadCustomData = typeof lead.custom_data === 'string' ? JSON.parse(lead.custom_data) : lead.custom_data;
    }

    // 2. Find all orders linked to this lead
    const [orders] = await pool.execute('SELECT id, custom_data FROM orders WHERE lead_id = ? AND company_id = ?', [leadId, companyId]);
    if (orders.length === 0) return;

    // 3. Find shared section groups
    const [sharedGroups] = await pool.execute(
      `SELECT id FROM custom_section_groups WHERE company_id = ? AND entity_type = 'lead' AND JSON_CONTAINS(shared_with, '"order"')`,
      [companyId]
    );
    const sharedGroupIds = sharedGroups.map(sg => sg.id);

    // 4. Find all fields that belong to these shared groups OR have field-level sharing
    // Wait, let's just grab fields from shared groups for now.
    let sharedFields = [];
    if (sharedGroupIds.length > 0) {
      const placeholders = sharedGroupIds.map(() => '?').join(',');
      const [fields] = await pool.execute(
        `SELECT id, name FROM custom_fields WHERE company_id = ? AND module = 'Leads' AND section_id IN (${placeholders})`,
        [companyId, ...sharedGroupIds]
      );
      sharedFields = fields;
    }

    if (sharedFields.length === 0) return; // Nothing to sync

    // 5. Update each linked order
    for (const order of orders) {
      let orderCustomData = {};
      if (order.custom_data) {
          orderCustomData = typeof order.custom_data === 'string' ? JSON.parse(order.custom_data) : order.custom_data;
      }

      // Copy values for shared fields
      let hasChanges = false;
      for (const field of sharedFields) {
        const fieldKey = field.name; // assuming custom_data stores by field name or ID
        if (leadCustomData[fieldKey] !== undefined) {
          if (orderCustomData[fieldKey] !== leadCustomData[fieldKey]) {
            orderCustomData[fieldKey] = leadCustomData[fieldKey];
            hasChanges = true;
          }
        }
      }

      // Save order if changed
      if (hasChanges) {
        await pool.execute(
          'UPDATE orders SET custom_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [JSON.stringify(orderCustomData), order.id]
        );
      }
    }
    
    console.log(`[SyncService] Successfully synced Lead #${leadId} to ${orders.length} Order(s).`);

  } catch (error) {
    console.error(`[SyncService] Error syncing Lead #${leadId} to Orders:`, error);
  }
};

module.exports = {
  syncLeadToOrders
};
