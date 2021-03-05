import { Query, Resolver } from "type-graphql";

@Resolver()
export class HelloResolver {
  @Query(() => String) //declare what our query returns
  hello() {
    return "hello world"
  }
}