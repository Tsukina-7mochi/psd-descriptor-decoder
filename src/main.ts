import ActionStream from './actionStream.ts';

const asText = Deno.args.some((arg) => arg.startsWith('--text'));
const separator = await new Promise<string>((resolve) => {
  for (const arg in Deno.args) {
    if (arg.startsWith('--sep=')) {
      resolve(arg.slice(6));
    }
  }

  resolve(' ');
});

const binary = await (async () => {
  if (asText) {
    const decoder = new TextDecoder();
    const binaryNumArray: number[] = [];
    for await (const chunk of Deno.stdin.readable) {
      const text = decoder.decode(chunk);
      binaryNumArray.splice(-1, 0, ...text.trim().split(separator).map((v) => parseInt(v, 16)));
    }

    return Uint8Array.from(binaryNumArray);
  } else {
    Deno.stdin.setRaw(true, { cbreak: true });

    let array: number[] = [];
    for await (const chunk of Deno.stdin.readable) {
      array = [...array, ...chunk];
    }

    Deno.stdin.setRaw(false);

    return Uint8Array.from(array);
  }
})();

const stream = new ActionStream(binary);

console.log(JSON.stringify(stream.readDescriptor()));
