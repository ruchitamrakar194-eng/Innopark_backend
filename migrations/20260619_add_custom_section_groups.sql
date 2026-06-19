-- Create custom_section_groups table
CREATE TABLE IF NOT EXISTS custom_section_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  entity_type VARCHAR(20) NOT NULL,   -- 'lead' | 'order' | 'contact' | 'company'
  shared_with JSON DEFAULT ('[]'), -- e.g. ['order']
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
