INSERT INTO admin (user_name, password) 
VALUES ('admin', 'D2i0m0a51966') 
ON CONFLICT (user_name) DO NOTHING;