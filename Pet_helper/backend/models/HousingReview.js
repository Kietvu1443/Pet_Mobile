const { pool } = require("../config/db");

const HousingReview = {
  async findByUserId(userId) {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM housing_reviews WHERE user_id = ? ORDER BY created_at DESC",
        [userId],
      );
      return rows;
    } catch (error) {
      console.error("Error finding housing reviews by user:", error);
      throw error;
    }
  },

  async findActiveByUserId(userId) {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM housing_reviews WHERE user_id = ? AND is_active = 1 LIMIT 1",
        [userId],
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error finding active housing review:", error);
      throw error;
    }
  },

  async findById(id) {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM housing_reviews WHERE id = ?",
        [id],
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error finding housing review by ID:", error);
      throw error;
    }
  },

  async create(userId, data) {
    try {
      const { house_type, own_or_rent, has_allergies, has_pets } = data;
      const [result] = await pool.execute(
        `INSERT INTO housing_reviews (user_id, house_type, own_or_rent, has_allergies, has_pets)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, house_type, own_or_rent, has_allergies ? 1 : 0, has_pets ? 1 : 0],
      );
      return { id: result.insertId, user_id: userId, ...data, status: "pending", is_active: 1 };
    } catch (error) {
      console.error("Error creating housing review:", error);
      throw error;
    }
  },

  async update(id, userId, data) {
    try {
      const fields = [];
      const params = [];
      if (data.house_type !== undefined) { fields.push("house_type = ?"); params.push(data.house_type); }
      if (data.own_or_rent !== undefined) { fields.push("own_or_rent = ?"); params.push(data.own_or_rent); }
      if (data.has_allergies !== undefined) { fields.push("has_allergies = ?"); params.push(data.has_allergies ? 1 : 0); }
      if (data.has_pets !== undefined) { fields.push("has_pets = ?"); params.push(data.has_pets ? 1 : 0); }
      if (fields.length === 0) return null;
      params.push(id, userId);
      const [result] = await pool.execute(
        `UPDATE housing_reviews SET ${fields.join(", ")} WHERE id = ? AND user_id = ? AND status = 'pending'`,
        params,
      );
      return result.affectedRows > 0 ? this.findById(id) : null;
    } catch (error) {
      console.error("Error updating housing review:", error);
      throw error;
    }
  },

  async deactivate(userId) {
    try {
      await pool.execute(
        "UPDATE housing_reviews SET is_active = 0 WHERE user_id = ? AND is_active = 1",
        [userId],
      );
    } catch (error) {
      console.error("Error deactivating housing reviews:", error);
      throw error;
    }
  },

  async delete(id, userId) {
    try {
      const [result] = await pool.execute(
        "DELETE FROM housing_reviews WHERE id = ? AND user_id = ? AND status = 'pending'",
        [id, userId],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting housing review:", error);
      throw error;
    }
  },

  async review(id, reviewerId, status, adminNotes) {
    try {
      const [result] = await pool.execute(
        "UPDATE housing_reviews SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
        [status, adminNotes || null, reviewerId, id],
      );
      return result.affectedRows > 0 ? this.findById(id) : null;
    } catch (error) {
      console.error("Error reviewing housing review:", error);
      throw error;
    }
  },

  async findAllPending() {
    try {
      const [rows] = await pool.execute(
        "SELECT hr.*, u.display_name, u.name, u.email FROM housing_reviews hr JOIN users u ON hr.user_id = u.id WHERE hr.status = 'pending' ORDER BY hr.created_at ASC",
      );
      return rows;
    } catch (error) {
      console.error("Error finding pending housing reviews:", error);
      throw error;
    }
  },
};

module.exports = HousingReview;
