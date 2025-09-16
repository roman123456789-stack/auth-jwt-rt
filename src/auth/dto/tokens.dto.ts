import { Exclude, Expose } from "class-transformer";

@Exclude()
export class TokensDto {
  @Expose()
  access_token: string;
}
