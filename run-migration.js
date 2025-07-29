const { execSync } = require('child_process');

try {
  console.log('Running database migration...');
  
  // First, reset the database to apply the migration
  execSync('npx prisma migrate reset --force', { stdio: 'inherit', cwd: __dirname });
  
  console.log('Migration completed successfully!');
  
  // Generate the Prisma client after migration
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: __dirname });
  
  console.log('Setup completed successfully!');
} catch (error) {
  console.error('Error during migration:', error);
  
  // If reset fails, try deploy instead
  try {
    console.log('Trying alternative migration approach...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: __dirname });
    console.log('Migration deployed successfully!');
  } catch (deployError) {
    console.error('Migration failed:', deployError);
    process.exit(1);
  }
}