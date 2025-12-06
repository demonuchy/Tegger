SELECT 'CREATE DATABASE beregdonadb'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'beregdonadb')\gexec