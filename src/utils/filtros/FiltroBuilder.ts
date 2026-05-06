import {
  FindOperator,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Equal,
  Not,
  In,
  IsNull,
  Like,
  Between,
  Raw,
} from 'typeorm';

type Operator =
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'isEmpty'
  | 'isNotEmpty'
  | 'isAnyOf'
  | 'is'
  | 'not'
  | 'after'
  | 'onOrAfter'
  | 'before'
  | 'onOrBefore'
  | 'contains'
  | 'equals'
  | 'caseSensitiveContains'
  | 'caseSensitiveEquals';

interface FilterParams {
  field?: string;
  operator?: string;
  value?: any;
}

const operatorMap: Record<Operator, (value: any) => FindOperator<any>> = {
  '=': Equal,
  '!=': Not,
  '>': MoreThan,
  '>=': MoreThanOrEqual,
  '<': LessThan,
  '<=': LessThanOrEqual,
  isEmpty: () => IsNull(),
  isNotEmpty: () => Not(IsNull()),
  isAnyOf: In,
  is: Equal,
  not: Not,
  after: MoreThan,
  onOrAfter: MoreThanOrEqual,
  before: LessThan,
  onOrBefore: LessThanOrEqual,
  contains: (value: string) =>
    Raw((alias) => `LOWER(${alias}) LIKE LOWER('%${value}%')`),
  equals: (value: string) =>
    Raw((alias) => `LOWER(${alias}) = LOWER('${value}')`),
  caseSensitiveContains: (value: string) => Like(`%${value}%`),
  caseSensitiveEquals: Equal,
};

export function buildWhereCondition<Entity>(
  filterParams: FilterParams,
): Partial<Record<keyof Entity, FindOperator<any>>> {
  const { field, operator, value } = filterParams;
  const where: Partial<Record<keyof Entity, FindOperator<any>>> = {};

  if (field && operator && value !== undefined) {
    const typeOrmOperator = operatorMap[operator];

    if (typeOrmOperator) {
      if (typeof value === 'string') {
        where[field as keyof Entity] = typeOrmOperator(value.toLowerCase());
      } else {
        where[field as keyof Entity] = typeOrmOperator(value);
      }
    }
  }

  return where;
}
