class MemoryDB {
  constructor() {
    this.db = {};
  }

  get(key) {
    return this.db[key];
  }

  set(key, value) {
    this.db[key] = value;
  }

  delete(key) {
    delete this.db[key];
  }

  getLength() {
    return Object.keys(this.db).length;
  }

  getKeys() {
    return Object.keys(this.db);
  }

  clear() {
    this.db = {};
  }
}
