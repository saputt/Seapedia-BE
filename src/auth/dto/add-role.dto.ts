import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class AddRoleDto {
  @ApiProperty({
    example: 'DRIVER',
    description:
      'Role to add. Must be one of: BUYER, SELLER, DRIVER, ADMIN',
    enum: RoleName,
  })
  @IsNotEmpty()
  @IsEnum(RoleName)
  role: RoleName;
}
