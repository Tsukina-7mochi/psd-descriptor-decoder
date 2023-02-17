export interface Reference {
  nOfItems: number;
  items: ItemWithTypeKey[];
}

export interface Descriptor {
  name: string;
  classId: string;
  nOfItems: number;
  items: { key: string; item: ItemWithTypeKey }[];
}

export interface List {
  nOfItems: number;
  items: ItemWithTypeKey[];
}

export interface Double {
  value: number;
}

export interface UnitFloat {
  unit: '#Ang' | '#Rsl' | '#Rlt' | '#Nne' | '#Prc' | '#Pxl' | '#Pnt' | '#Mlm';
  value: number;
}

interface String_ {
  value: string;
}
export type { String_ as String };

export interface Enumerated {
  name: string;
  classId: string;
}

export interface Integer {
  value: number;
}

export interface LargeInteger {
  value: number;
}

interface Boolean_ {
  value: boolean;
}
export type { Boolean_ as Boolean };

export interface Class {
  name: string;
  classId: string;
}

export interface Alias {
  length: number;
  value: string;
}

export interface RawData {
  value: Uint8Array;
}

export interface Property {
  name: string;
  classId: string;
  keyId: string;
}

export type EnumeratedReference = unknown;

export interface Offset {
  name: string;
  classId: string;
  value: number;
}

export type Identifier = unknown;

export type Index = unknown;

export type Name = unknown;

export type OSTypeKeys =
  | 'obj '
  | 'Objc'
  | 'VlLs'
  | 'doub'
  | 'UntF'
  | 'TEXT'
  | 'enum'
  | 'long'
  | 'comp'
  | 'bool'
  | 'GlbO'
  | 'type'
  | 'GlbC'
  | 'alis'
  | 'tdta'
  | 'prop'
  | 'Clss'
  | 'Enmr'
  | 'rele'
  | 'Idnt'
  | 'indx'
  | 'name';

export interface WithTypeKey<T, KeyValue extends OSTypeKeys> {
  typeKey: KeyValue;
  value: T;
}

export type ReferenceWithTypeKey = WithTypeKey<Reference, 'obj '>;
export type DescriptorWithTypeKey =
  | WithTypeKey<Descriptor, 'Objc'>
  | WithTypeKey<Descriptor, 'GlbO'>;
export type ListWithTypeKey = WithTypeKey<List, 'VlLs'>;
export type DoubleWithTypeKey = WithTypeKey<Double, 'doub'>;
export type UnitFloatWithTypeKey = WithTypeKey<UnitFloat, 'UntF'>;
export type StringWithTypeKey = WithTypeKey<String_, 'TEXT'>;
export type EnumeratedWithTypeKey = WithTypeKey<Enumerated, 'enum'>;
export type IntegerWithTypeKey = WithTypeKey<Integer, 'long'>;
export type LargeIntegerWithTypeKey = WithTypeKey<LargeInteger, 'comp'>;
export type BooleanWithTypeKey = WithTypeKey<Boolean_, 'bool'>;
export type ClassWithTypeKey =
  | WithTypeKey<Class, 'type'>
  | WithTypeKey<Class, 'GlbC'>
  | WithTypeKey<Class, 'Clss'>;
export type AliasWithTypeKey = WithTypeKey<Alias, 'alis'>;
export type RawDataWithTypeKey = WithTypeKey<RawData, 'tdta'>;
export type PropertyWithTypeKey = WithTypeKey<Property, 'prop'>;
// deno-fmt-ignore
export type EnumeratedReferenceWithTypeKey = WithTypeKey<EnumeratedReference, 'Enmr'>;
export type OffsetWithTypeKey = WithTypeKey<Offset, 'rele'>;
export type IdentifierWithTypeKey = WithTypeKey<Identifier, 'Idnt'>;
export type IndexWithTypeKey = WithTypeKey<Index, 'indx'>;
export type NameWithTypeKey = WithTypeKey<Name, 'name'>;

export type ItemWithTypeKey =
  | ReferenceWithTypeKey
  | DescriptorWithTypeKey
  | ListWithTypeKey
  | DoubleWithTypeKey
  | UnitFloatWithTypeKey
  | StringWithTypeKey
  | EnumeratedWithTypeKey
  | IntegerWithTypeKey
  | LargeIntegerWithTypeKey
  | BooleanWithTypeKey
  | ClassWithTypeKey
  | AliasWithTypeKey
  | RawDataWithTypeKey
  | PropertyWithTypeKey
  | EnumeratedReferenceWithTypeKey
  | OffsetWithTypeKey
  | IdentifierWithTypeKey
  | IndexWithTypeKey
  | NameWithTypeKey;
