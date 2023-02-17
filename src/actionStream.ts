import * as Types from './types.ts';

const byteArrayToFloat = function (data: Uint8Array): number {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);

  for (let i = 0; i < 8; i++) {
    view.setUint8(i, data[i]);
  }

  return view.getFloat64(0);
};

class ActionStream {
  data: Uint8Array;
  index = 0;

  constructor(data: Uint8Array) {
    this.data = new Uint8Array(data);
    this.index = 0;
  }

  #createError(message: string) {
    return Error(`Invalid format at ${this.index}: ${message}`);
  }

  readByte(): number {
    this.index += 1;

    return this.data[this.index - 1];
  }

  readNBytes(n: number): number {
    let value = 0;
    for (let i = 0; i < n; i++) {
      value = (value << 8) + this.data[i + this.index];
    }

    this.index += n;

    return value;
  }

  readNChars(n: number): string {
    const text = String.fromCharCode(
      ...this.data.slice(this.index, this.index + n),
    );

    this.index += n;

    return text;
  }

  readUnicodeString(): string {
    const length = this.readNBytes(4);
    const values = [];

    for (let i = 0; i < length; i++) {
      values.push(this.readNBytes(2));
    }

    const text = String.fromCodePoint(...values);

    return text;
  }

  readKey(): string {
    const length = this.readNBytes(4);

    return this.readNChars(length === 0 ? 4 : length);
  }

  readItemWithTypeKey(): Types.ItemWithTypeKey {
    const typeKey = this.readNChars(4);

    if (typeKey === 'obj ') {
      const value = this.readReference();
      return { typeKey, value };
    } else if (typeKey === 'Objc' || typeKey === 'GlbO') {
      const value = this.readDescriptor();
      return { typeKey, value };
    } else if (typeKey === 'VlLs') {
      const value = this.readList();
      return { typeKey, value };
    } else if (typeKey === 'doub') {
      const value = this.readDouble();
      return { typeKey, value };
    } else if (typeKey === 'UntF') {
      const value = this.readUnitFloat();
      return { typeKey, value };
    } else if (typeKey === 'TEXT') {
      const value = this.readString();
      return { typeKey, value };
    } else if (typeKey === 'enum') {
      const value = this.readEnumerated();
      return { typeKey, value };
    } else if (typeKey === 'long') {
      const value = this.readInteger();
      return { typeKey, value };
    } else if (typeKey === 'comp') {
      const value = this.readLargeInteger();
      return { typeKey, value };
    } else if (typeKey === 'bool') {
      const value = this.readBoolean();
      return { typeKey, value };
    } else if (typeKey == 'type' || typeKey === 'GlbC' || typeKey === 'Clss') {
      const value = this.readClass();
      return { typeKey, value };
    } else if (typeKey === 'alis') {
      const value = this.readAlias();
      return { typeKey, value };
    } else if (typeKey === 'tdta') {
      const value = this.readRawData();
      return { typeKey, value };
    } else if (typeKey === 'prop') {
      const value = this.readProperty();
      return { typeKey, value };
    } else if (typeKey === 'Enmr') {
      const value = this.readEnumeratedReference();
      return { typeKey, value };
    } else if (typeKey === 'rele') {
      const value = this.readOffset();
      return { typeKey, value };
    } else if (typeKey === 'Idnt') {
      const value = this.readIdentifier();
      return { typeKey, value };
    } else if (typeKey === 'indx') {
      const value = this.readIndex();
      return { typeKey, value };
    } else if (typeKey === 'name') {
      const value = this.readName();
      return { typeKey, value };
    }

    throw this.#createError(`${typeKey} is not a valid OSTypeKey.`);
  }

  readReference(): Types.Reference {
    const nOfItems = this.readNBytes(4);
    const items: Types.ItemWithTypeKey[] = [];

    for (let i = 0; i < nOfItems; i++) {
      items.push(this.readItemWithTypeKey());
    }

    return { nOfItems, items };
  }

  readDescriptor(): Types.Descriptor {
    const name = this.readUnicodeString();
    const classId = this.readKey();
    const nOfItems = this.readNBytes(4);
    const items: Types.Descriptor['items'] = [];

    for (let i = 0; i < nOfItems; i++) {
      const key = this.readKey();
      const item = this.readItemWithTypeKey();

      items.push({ key, item });
    }

    return {
      name,
      classId,
      nOfItems,
      items,
    };
  }

  readList(): Types.List {
    const nOfItems = this.readNBytes(4);
    const items: Types.List['items'] = [];

    for (let i = 0; i < nOfItems; i++) {
      items.push(this.readItemWithTypeKey());
    }

    return { nOfItems, items };
  }

  readDouble(): Types.Double {
    const value = byteArrayToFloat(this.data.slice(this.index, this.index + 8));
    this.index += 8;

    return { value };
  }

  readUnitFloat(): Types.UnitFloat {
    const unit = this.readNChars(4);
    if (
      unit != '#Ang' && unit != '#Rsl' && unit != '#Rlt' && unit != '#Nne' &&
      unit != '#Prc' && unit != '#Pxl' && unit != '#Pnt' && unit != '#Mlm'
    ) {
      throw this.#createError(`${unit} is not proper unit for Unit Float.`);
    }

    const value = this.readDouble().value;

    return { unit, value };
  }

  readString(): Types.String {
    const value = this.readUnicodeString();

    return { value };
  }

  readEnumerated(): Types.Enumerated {
    const name = this.readKey();
    const classId = this.readKey();

    return {
      name,
      classId,
    };
  }

  readInteger(): Types.Integer {
    const value = this.readNBytes(4);

    return { value };
  }

  readLargeInteger(): Types.LargeInteger {
    const value = this.readNBytes(8);

    return { value };
  }

  readBoolean(): Types.Boolean {
    const value = this.readByte();

    return {
      value: value != 0,
    };
  }

  readClass(): Types.Class {
    const name = this.readUnicodeString();
    const classId = this.readKey();

    return { name, classId };
  }

  readAlias(): Types.Alias {
    const length = this.readNBytes(4);
    const value = this.readNChars(length);

    return { length, value };
  }

  readRawData(): Types.RawData {
    throw this.#createError('Raw Data structure is not documented.');
  }

  readProperty(): Types.Property {
    const name = this.readUnicodeString();
    const classId = this.readKey();
    const keyId = this.readKey();

    return {
      name,
      classId,
      keyId,
    };
  }

  readEnumeratedReference(): Types.EnumeratedReference {
    throw this.#createError(
      'Enumerated Reference structure is not documented.',
    );
  }

  readOffset(): Types.Offset {
    const name = this.readUnicodeString();
    const classId = this.readKey();
    const value = this.readNBytes(4);

    return {
      name,
      classId,
      value,
    };
  }

  readIdentifier(): Types.Identifier {
    throw this.#createError('Identifier structure is not documented.');
  }

  readIndex(): Types.Index {
    throw this.#createError('Index structure is not documented.');
  }

  readName(): Types.Name {
    throw this.#createError('Name structure is not documented.');
  }
}

export default ActionStream;
