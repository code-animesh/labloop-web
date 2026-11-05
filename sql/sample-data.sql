USE labloop;
INSERT INTO users(username,password,role,full_name) VALUES 
('student1','student123','STUDENT','Aarav Student'),('assistant1','assistant123','LAB_ASSISTANT','Riya Assistant');
INSERT INTO equipment(asset_code,name,category,status,condition_state,purchase_date,location,notes) VALUES 
('MIC-001','Compound Microscope','Optics','AVAILABLE','GOOD','2024-06-10','Cabinet A','Annual service due in June'),
('MTR-001','Digital Multimeter','Electronics','AVAILABLE','GOOD','2025-01-15','Shelf B','Fluke compatible leads');
