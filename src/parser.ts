export class Parser {
  private buffer = '';
  private cursor = 0;
  private stack: string[] = [];
  private inString = false;
  private escaped = false;
  private started = false;
  private frames: any[] = [];

  parse(value: string) {
    this.buffer += value;
    while (this.cursor < this.buffer.length) {
      const string = this.buffer[this.cursor];

      if (!this.started) {
        if (/\s/.test(string)) {
          this.cursor++;
          continue;
        }
        if (string !== '{' && string !== '[') {
          throw new TypeError('Parse Error');
        }
        this.started = true;
        this.stack.push(string);
        this.cursor++;
        continue;
      }

      if (this.inString) {
        if (this.escaped) {
          this.escaped = false;
          this.cursor++;
          continue;
        }
        if (string === '\\') {
          this.escaped = true;
          this.cursor++;
          continue;
        }
        if (string === '"') {
          this.inString = false;
        }
        this.cursor++;
        continue;
      }

      if (string === '"') {
        this.inString = true;
        this.cursor++;
        continue;
      }

      if (string === '{' || string === '[') {
        this.stack.push(string);
        this.cursor++;
        continue;
      }

      if (string === '}' || string === ']') {
        const open = this.stack.pop();
        if ((string === '}' && open !== '{') || (string === ']' && open !== '[')) {
          throw new TypeError('Parse Error');
        }

        this.cursor++;

        if (!this.stack.length) {
          const jsonText = this.buffer.slice(0, this.cursor);

          this.buffer = this.buffer.slice(this.cursor);
          this.cursor = 0;
          this.started = false;
          this.inString = false;
          this.escaped = false;

          const json = JSON.parse(jsonText);
          this.frames.push(json);
          continue;
        }

        continue;
      }

      this.cursor++;
    }
  }

  drain() {
    const out = this.frames;
    this.frames = [];
    return out;
  }
}
