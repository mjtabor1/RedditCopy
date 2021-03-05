import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { MikroORM } from "@mikro-orm/core";
import path from 'path';
import { User } from "./entities/User";


export default {
  entities: [Post, User],
  migrations: {
    path: path.join(__dirname, './migrations'), // path to the folder with migrations
    pattern: /^[\w-]+\d+\.[tj]s$/, // regex pattern for the migration files
  },
  dbName: 'lireddit',
  debug: !__prod__,
  type: 'postgresql',
  user: 'postgres',
  password: 'password' 
} as Parameters<typeof MikroORM.init>[0]; //getting the type that MikroORM.init expects for its first parameter