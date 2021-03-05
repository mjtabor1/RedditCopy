import { User } from "../entities/User";
import { MyContext } from "src/types";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from "type-graphql";
import * as argon2 from 'argon2';

//Decorator for input type fields
@InputType()
class UsernamePasswordInput {
  @Field()
  username: string
  @Field()
  password: string
}

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

//Decorator to define an object that will be returned. Either errors or a user
@ObjectType() 
class UserResponse {
  @Field(() => [FieldError], {nullable: true}) 
  errors?: FieldError[]

  @Field(() => User, {nullable: true})
  user?: User
}

//Resolver to deal with users db
@Resolver()
export class UserResolver {

  //Mutation: to register new users into the db
  @Mutation(() => UserResponse) //declare what our query returns
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() {em}: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return {
        errors: [{
          field: 'username',
          message: "length must be greater than 2"
        }]
      }
    }
    if (options.password.length <= 2) {
      return {
        errors: [{
          field: 'password',
          message: "length must be greater than 2"
        }]
      }
    }
    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword
    });
    try {
      await em.persistAndFlush(user);
    } catch(err) {

      //duplicate usernmae error
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "Username already taken"
            },
          ],
        };
      }
    }
    
    return {user};
  }

  //Mutation: to login
  @Mutation(() => UserResponse) //declare what our query returns
  async login(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() {em}: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, {username: options.username});
    if (!user) {
      return {
        errors: [{
          field: 'username',
          message: "that username doesn't exist",
         },
        ],
      };
    }

    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [{
          field: 'password',
          message: "incorrect password",
         },
        ],
      };
    }
    return {user};
  }
}