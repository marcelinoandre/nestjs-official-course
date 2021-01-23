import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Event } from 'src/events/entities/event.entity';
import { Connection, Repository } from 'typeorm';
import { CreateCoffeesDto } from './dto/create-coffees.dto';
import { UpdateCoffeesDto } from './dto/update-create-coffees.dto';
import { Coffee } from './entities/coffee.entity';
import { FlavorEntity } from './entities/flavor.entity';

@Injectable()
export class CoffeesService {
  constructor(
    @InjectRepository(Coffee)
    private readonly coffeeRepository: Repository<Coffee>,
    @InjectRepository(FlavorEntity)
    private readonly flavorRepository: Repository<FlavorEntity>,
    private readonly connection: Connection,
  ) {}

  findAll(paginationQuery: PaginationQueryDto) {
    const { limit, offset } = paginationQuery;
    return this.coffeeRepository.find({
      relations: ['flavors'],
      skip: offset,
      take: limit,
    });
  }

  findOne(id: string) {
    const coffee = this.coffeeRepository.findOne(id, {
      relations: ['flavors'],
    });

    if (coffee) return coffee;

    throw new NotFoundException(`Coffe #${id} not found`);
  }

  async create(createCoffeeDto: CreateCoffeesDto) {
    const flavors = await Promise.all(
      createCoffeeDto.flavors.map((name) => this.preloadFlavorByName(name)),
    );

    const coffee = this.coffeeRepository.create({
      ...createCoffeeDto,
      flavors,
    });

    return this.coffeeRepository.save(coffee);
  }

  async update(id: string, updateCoffeeDto: UpdateCoffeesDto) {
    const flavors =
      updateCoffeeDto.flavors &&
      (await Promise.all(
        updateCoffeeDto.flavors.map((name) => this.preloadFlavorByName(name)),
      ));

    const coffee = await this.coffeeRepository.preload({
      id,
      ...updateCoffeeDto,
      flavors,
    });

    if (coffee) return this.coffeeRepository.save(coffee);

    throw new NotFoundException(`Coffee #${id} not found`);
  }

  remove(id: string) {
    this.coffeeRepository.delete(id);
  }

  async recommendCoffee(coffee: Coffee) {
    const queryRunnner = this.connection.createQueryRunner();

    await queryRunnner.connect();
    await queryRunnner.startTransaction();

    try {
      coffee.recomentations++;

      const recommendEvent = new Event();
      recommendEvent.name = 'recommend_coffee';
      recommendEvent.type = 'coffee';
      recommendEvent.payload = { coffeeId: coffee.id };

      await queryRunnner.manager.save(coffee);
      await queryRunnner.manager.save(recommendEvent);

      await queryRunnner.commitTransaction();
    } catch (error) {
      await queryRunnner.rollbackTransaction();
    } finally {
      await queryRunnner.release();
    }
  }

  private async preloadFlavorByName(name: string): Promise<FlavorEntity> {
    const existgFlavor = await this.flavorRepository.findOne({ name });

    return existgFlavor || this.flavorRepository.create({ name });
  }
}
