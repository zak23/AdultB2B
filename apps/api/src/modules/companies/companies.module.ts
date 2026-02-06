import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompanyMember } from './entities/company-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, CompanyMember])],
  exports: [TypeOrmModule],
})
export class CompaniesModule {}
