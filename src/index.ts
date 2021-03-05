import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import microConfig from './mikro-orm.config'
import express from 'express';
import {ApolloServer} from 'apollo-server-express';
import {buildSchema} from 'type-graphql';
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis'
import { MyContext } from "./types";

declare module 'express-session' {
  interface Session {
    userId: number;
  }
}

const main = async () => {
  
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up(); // runs the migrations

  const app = express(); // creates an instance of express

  const RedisStore = connectRedis(session); //connect to redis
  const redisClient = redis.createClient(); //instantiate a client

  //creates an express session with a cookie stored in Redis
  app.use(
    session({
      name: 'qid',
      store: new RedisStore({ client: redisClient, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 1, // 1 year
        httpOnly: true,
        sameSite: 'lax',
        secure: __prod__ // cookie only works in https
      },
      saveUninitialized: false,
      secret: 's;alkdjsopfuhyba;lskd',
      resave: false,
    })
  )
  
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false
    }),
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res })
  })

  apolloServer.applyMiddleware({ app }); //creating a graphql endpoint on express

  app.listen(4000, () => {
    console.log('server started on localhost: 4000');
  });
} 

main().catch((err) => {
  console.error(err);
});
