import { Entity, 
         PrimaryGeneratedColumn, 
         Unique, 
         Column } from 'typeorm';
import { MinLength, 
         IsNotEmpty, 
         IsEmail, 
         IsOptional} from 'class-validator';
import * as bcrypt from 'bcryptjs';

@Entity()
// @Unique(['username'])
@Unique(['email'])

export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  // @Column()
  // @MinLength(6)
  // @IsNotEmpty()
  // username: string;

  @Column()
  @IsNotEmpty()
  firstName: string;

  @Column()
  @IsNotEmpty()
  lastName: string;

  @Column()
  @MinLength(6)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Column()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @Column()
  @IsNotEmpty()
  role: string;

  @Column()
  whatsappNumber: string;

  @Column()
  @IsOptional()
  resetToken: string;

  @Column()
  @IsOptional()
  status: string;

  @Column()
  @IsOptional()
  confirmationCode: string;

  hashPassword(): void {
    const salt = bcrypt.genSaltSync(10);
    this.password = bcrypt.hashSync(this.password, salt);
  }

  checkPassword(password: string): boolean {
    return bcrypt.compareSync(password, this.password);
  }
}
