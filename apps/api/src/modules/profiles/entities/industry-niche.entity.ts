import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('industry_niches')
export class IndustryNiche {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  name: string;
}
