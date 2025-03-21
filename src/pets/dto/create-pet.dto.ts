import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreatePetDto {
  @IsString()
  name: string;

  @IsString()
  species: string;

  @IsString()
  breed: string;

  @IsDateString()
  birthDate: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
