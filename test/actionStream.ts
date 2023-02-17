import * as assert from 'https://deno.land/std@0.65.0/testing/asserts.ts';
import ActionStream from '../src/actionStream.ts';

const nByteValue = function (value: number, n: number): number[] {
  const arr = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    arr[n - i - 1] = value & 0xFF;
    value = value >> 8;
  }

  return arr;
};

const stringToBytes = function (str: string): number[] {
  return [...str].map((_, i) => str.charCodeAt(i));
};

const toUnicodeString = function (str: string): number[] {
  const codePoints = [...str].map((_, i) => str.codePointAt(i) ?? 0);
  const bytes = codePoints.map((v) => [v >> 8, v & 0xFF]).flat();

  return [...nByteValue(str.length + 1, 4), ...bytes, 0, 0];
};

Deno.test('readByte', () => {
  const stream = new ActionStream(new Uint8Array([0x00, 0x7F, 0xFF]));

  const value1 = stream.readByte();
  const value2 = stream.readByte();
  const value3 = stream.readByte();

  assert.assertEquals(value1, 0x00);
  assert.assertEquals(value2, 0x7F);
  assert.assertEquals(value3, 0xFF);
  assert.assertEquals(stream.index, 3);
});

Deno.test('readNBytes #1', () => {
  const stream = new ActionStream(
    new Uint8Array([
      ...[0x00, 100],
      ...nByteValue(200, 2),
      ...nByteValue(300, 4),
    ]),
  );

  const value1 = stream.readNBytes(2);
  const value2 = stream.readNBytes(2);
  const value3 = stream.readNBytes(4);

  assert.assertEquals(value1, 100);
  assert.assertEquals(value2, 200);
  assert.assertEquals(value3, 300);
  assert.assertEquals(stream.index, 8);
});

Deno.test('readNChars #1', () => {
  const stream = new ActionStream(
    new Uint8Array([
      ...[0x41, 0x42, 0x43, 0x44],
      ...stringToBytes('EFGH'),
    ]),
  );

  const str1 = stream.readNChars(4);
  const str2 = stream.readNChars(4);

  assert.assertEquals(str1, 'ABCD');
  assert.assertEquals(str2, 'EFGH');
  assert.assertEquals(stream.index, 8);
});

Deno.test('readNChars #2', () => {
  const stream = new ActionStream(
    new Uint8Array([
      ...stringToBytes('ABCDEFGH'),
    ]),
  );

  const str1 = stream.readNChars(1);
  const str2 = stream.readNChars(2);
  const str3 = stream.readNChars(3);

  assert.assertEquals(str1, 'A');
  assert.assertEquals(str2, 'BC');
  assert.assertEquals(str3, 'DEF');
  assert.assertEquals(stream.index, 6);
});

Deno.test('readUnicodeString #1', () => {
  const stream = new ActionStream(
    new Uint8Array([
      ...[
        0x00,
        0x00,
        0x00,
        0x04,
        0x00,
        0x41,
        0x00,
        0x42,
        0x00,
        0x43,
        0x00,
        0x00,
      ],
      ...toUnicodeString('ABCDEFG'),
    ]),
  );

  const str1 = stream.readUnicodeString();
  const str2 = stream.readUnicodeString();

  assert.assertEquals(str1, 'ABC\0');
  assert.assertEquals(str2, 'ABCDEFG\0');
  assert.assertEquals(stream.index, 32);
});

Deno.test('readUnicodeString #2', () => {
  const stream = new ActionStream(
    new Uint8Array([
      ...toUnicodeString('あいうえお'),
    ]),
  );

  const str = stream.readUnicodeString();

  assert.assertEquals(str, 'あいうえお\0');
  assert.assertEquals(stream.index, 16);
});

Deno.test('readKey #1', () => {
  const stream = new ActionStream(
    new Uint8Array([
      0x00,
      0x00,
      0x00,
      0x06,
      ...stringToBytes('abcdef'),
    ]),
  );

  const key = stream.readKey();

  assert.assertEquals(key, 'abcdef');
  assert.assertEquals(stream.index, 10);
});

Deno.test('readKey #2', () => {
  const stream = new ActionStream(
    new Uint8Array([
      0x00,
      0x00,
      0x00,
      0x00,
      ...stringToBytes('abcd'),
    ]),
  );

  const key = stream.readKey();

  assert.assertEquals(key, 'abcd');
  assert.assertEquals(stream.index, 8);
});

Deno.test(`readReference #1`, () => {
  const stream = new ActionStream(
    new Uint8Array([
      ...nByteValue(0, 4),
    ]),
  );

  const reference = stream.readReference();

  assert.assertEquals(reference, {
    nOfItems: 0,
    items: [],
  });
  assert.assertEquals(stream.index, 4);
});

Deno.test(`readReference #2`, () => {
  const stream = new ActionStream(
    new Uint8Array([
      ...nByteValue(2, 4),
      ...[...stringToBytes('obj '), ...nByteValue(0, 4)],
      ...[...stringToBytes('obj '), ...nByteValue(0, 4)],
    ]),
  );

  const reference = stream.readReference();

  assert.assertEquals(reference, {
    nOfItems: 2,
    items: [
      {
        typeKey: 'obj ',
        value: {
          nOfItems: 0,
          items: [],
        },
      },
      {
        typeKey: 'obj ',
        value: {
          nOfItems: 0,
          items: [],
        },
      },
    ],
  });
  assert.assertEquals(stream.index, 20);
});

Deno.test('readDescriptor #1', () => {
  const stream = new ActionStream(
    new Uint8Array([
      ...toUnicodeString('Descriptor'),
      ...[0x00, 0x00, 0x00, 0x06, ...stringToBytes('abcdef')],
      ...nByteValue(0, 4),
    ]),
  );

  const descriptor = stream.readDescriptor();

  assert.assertEquals(descriptor, {
    name: 'Descriptor\0',
    classId: 'abcdef',
    nOfItems: 0,
    items: [],
  });
  assert.assertEquals(stream.index, 40);
});

Deno.test('readDescriptor #2', () => {
  const stream = new ActionStream(
    new Uint8Array([
      ...toUnicodeString('Descriptor'),
      ...[...nByteValue(6, 4), ...stringToBytes('nested')],
      ...nByteValue(2, 4),
      ...[
        ...[...nByteValue(10, 4), ...stringToBytes('reference1')],
        ...[...stringToBytes('obj '), ...nByteValue(0, 4)],
        ...[...nByteValue(10, 4), ...stringToBytes('reference2')],
        ...[...stringToBytes('obj '), ...nByteValue(0, 4)],
      ],
    ]),
  );

  const descriptor = stream.readDescriptor();

  assert.assertEquals(descriptor, {
    name: 'Descriptor\0',
    classId: 'nested',
    nOfItems: 2,
    items: [
      {
        key: 'reference1',
        item: {
          typeKey: 'obj ',
          value: {
            nOfItems: 0,
            items: [],
          },
        },
      },
      {
        key: 'reference2',
        item: {
          typeKey: 'obj ',
          value: {
            nOfItems: 0,
            items: [],
          },
        },
      },
    ],
  });
  assert.assertEquals(stream.index, 84);
});

Deno.test('readList #1', () => {
  const stream = new ActionStream(
    new Uint8Array([
      ...nByteValue(0, 4),
    ]),
  );

  const list = stream.readList();

  assert.assertEquals(list, {
    nOfItems: 0,
    items: [],
  });
  assert.assertEquals(stream.index, 4);
});

Deno.test('readList #2', () => {
  const stream = new ActionStream(
    new Uint8Array([
      ...nByteValue(2, 4),
      ...[
        ...[...stringToBytes('obj '), ...nByteValue(0, 4)],
        ...[...stringToBytes('obj '), ...nByteValue(0, 4)],
      ],
    ]),
  );

  const list = stream.readList();

  assert.assertEquals(list, {
    nOfItems: 2,
    items: [
      {
        typeKey: 'obj ',
        value: {
          nOfItems: 0,
          items: [],
        },
      },
      {
        typeKey: 'obj ',
        value: {
          nOfItems: 0,
          items: [],
        },
      },
    ],
  });
  assert.assertEquals(stream.index, 20);
});

Deno.test('readDouble #1', () => {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, Math.E);
  const byteArray = new Array(8).fill(0).map((_, i) => view.getUint8(i));
  const stream = new ActionStream(new Uint8Array(byteArray));

  const double = stream.readDouble();

  assert.assertEquals(double, {
    value: Math.E,
  });
  assert.assertEquals(stream.index, 8);
});

Deno.test('readUnitFloat #1', () => {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, Math.E);
  const byteArray = new Array(8).fill(0).map((_, i) => view.getUint8(i));
  const stream = new ActionStream(
    new Uint8Array([
      ...stringToBytes('#Ang'),
      ...byteArray,
    ]),
  );

  const unitFloat = stream.readUnitFloat();

  assert.assertEquals(unitFloat, {
    unit: '#Ang',
    value: Math.E,
  });
  assert.assertEquals(stream.index, 12);
});

Deno.test('readUnitFloat #2 (invalid unit)', () => {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, Math.E);
  const byteArray = new Array(8).fill(0).map((_, i) => view.getUint8(i));
  const stream = new ActionStream(
    new Uint8Array([
      ...stringToBytes('#___'),
      ...byteArray,
    ]),
  );

  assert.assertThrows(() => {
    stream.readUnitFloat();
  });
});

Deno.test('readString #1', () => {
  const stream = new ActionStream(new Uint8Array(toUnicodeString('ABCDEFG')));

  const str = stream.readString();

  assert.assertEquals(str, {
    value: 'ABCDEFG\0',
  });
  assert.assertEquals(stream.index, 20);
});

Deno.test('readEnumerated #1', () => {
  const stream = new ActionStream(
    new Uint8Array([
      ...[...nByteValue(10, 4), ...stringToBytes('Enumerated')],
      ...[...nByteValue(8, 4), ...stringToBytes('Class ID')],
      ...[...nByteValue(7, 4), ...stringToBytes('Type ID')],
      ...[...nByteValue(0, 4), ...stringToBytes('Enum')],
    ]),
  );

  const enumerated = stream.readEnumerated();

  assert.assertEquals(enumerated, {
    name: 'Enumerated',
    classId: 'Class ID',
    typeId: 'Type ID',
    value: 'Enum',
  });
  assert.assertEquals(stream.index, 45);
});

Deno.test('readInteger #1', () => {
  const stream = new ActionStream(new Uint8Array(nByteValue(12345678, 4)));

  const integer = stream.readInteger();

  assert.assertEquals(integer, {
    value: 12345678,
  });
  assert.assertEquals(stream.index, 4);
});

Deno.test('readLargeInteger #1', () => {
  const stream = new ActionStream(new Uint8Array(nByteValue(12345678, 8)));

  const largeInteger = stream.readLargeInteger();

  assert.assertEquals(largeInteger, {
    value: 12345678,
  });
  assert.assertEquals(stream.index, 8);
});

Deno.test('readBoolean #1', () => {
  const stream = new ActionStream(new Uint8Array([0, 1]));

  const boolean1 = stream.readBoolean();
  const boolean2 = stream.readBoolean();

  assert.assertEquals(boolean1, {
    value: false,
  });
  assert.assertEquals(boolean2, {
    value: true,
  });
  assert.assertEquals(stream.index, 2);
});

Deno.test('readClass #1', () => {
  const stream = new ActionStream(
    new Uint8Array([
      ...toUnicodeString('Class'),
      ...[...nByteValue(8, 4), ...stringToBytes('Class ID')],
    ]),
  );

  const class_ = stream.readClass();

  assert.assertEquals(class_, {
    name: 'Class\0',
    classId: 'Class ID',
  });
  assert.assertEquals(stream.index, 28);
});

Deno.test('readAlias #1', () => {
  const stream = new ActionStream(
    new Uint8Array([
      ...nByteValue(9, 4),
      ...stringToBytes('Some data'),
    ]),
  );

  const alias_ = stream.readAlias();

  assert.assertEquals(alias_, {
    length: 9,
    value: 'Some data',
  });
  assert.assertEquals(stream.index, 13);
});

Deno.test('readProperty #1', () => {
  const stream = new ActionStream(
    new Uint8Array([
      ...toUnicodeString('Property'),
      ...[...nByteValue(8, 4), ...stringToBytes('Class ID')],
      ...[...nByteValue(6, 4), ...stringToBytes('Key ID')],
    ]),
  );

  const property = stream.readProperty();

  assert.assertEquals(property, {
    name: 'Property\0',
    classId: 'Class ID',
    keyId: 'Key ID',
  });
  assert.assertEquals(stream.index, 44);
});

Deno.test('readOffset #1', () => {
  const stream = new ActionStream(
    new Uint8Array([
      ...toUnicodeString('Offset'),
      ...[...nByteValue(8, 4), ...stringToBytes('Class ID')],
      ...nByteValue(100, 4),
    ]),
  );

  const offset = stream.readOffset();

  assert.assertEquals(offset, {
    name: 'Offset\0',
    classId: 'Class ID',
    value: 100,
  });
  assert.assertEquals(stream.index, 34);
});
