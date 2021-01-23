module.exports = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'SenhaSqlDev#',
  database: 'nest_official',
  entities: ['dist/**/*.entity.ts'],
  migrations: ['dist/migrations/*.ts'],
  cli: {
    migrationsDir: 'src/migrations',
  },
};
