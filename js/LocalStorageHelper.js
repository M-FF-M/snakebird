
/**
 * Default values for the variables to be saved in local storage
 * @type {any[][]}
 */
const DEFAULT_VARS = [
  ['noCyclicAni', false],
  ['noAni', false]
];

/**
 * Check whether to objects are equal
 * @param {any} objA the first object
 * @param {any} objB the second object
 * @return {boolean} true, if the objects are equal
 */
function checkEqual(objA, objB) {
  if ((typeof objA) !== (typeof objB)) return false;
  if (typeof objA === 'object') {
    if (objA === null || objB === null) {
      if (!(objA === null) || !(objB === null)) return false;
      return true;
    }
    if ((objA instanceof Array) || (objB instanceof Array)) {
      if (!(objA instanceof Array) || !(objB instanceof Array)) return false;
      if (objA.length === objB.length) {
        for (let i=0; i<objA.length; i++)
          if (!checkEqual(objA[i], objB[i]))
            return false;
        return true;
      } else return false;
    }
    for (const prop in objA) {
      if (objA.hasOwnProperty(prop)) {
        if (!objB.hasOwnProperty(prop)) return false;
        if (!checkEqual(objA[prop], objB[prop])) return false;
      }
    }
    for (const prop in objB) {
      if (objB.hasOwnProperty(prop))
        if (!objA.hasOwnProperty(prop)) return false;
    }
    return true;
  } else return objA === objB;
}

/**
 * Simplifies dealing with local storage (in particular, with variable default values)
 */
class LocalStorageHelper {
  /**
   * Create a new LocalStorageHelper
   */
  constructor() {
    /**
     * Contains the default values for variables saved in local storage
     * @type {Map<string, any>}
     */
    this.defaultMap = new Map();
    for (let i=0; i<DEFAULT_VARS.length; i++)
      this.defaultMap.set(DEFAULT_VARS[i][0], DEFAULT_VARS[i][1]);
    /**
     * Contains the window.localStorage object
     * @type {Storage}
     */
    this.store = window.localStorage;
  }

  /**
   * Get the value of a variable
   * @param {string} varname the name of the variable
   * @return {any} its value (undefined, if the value is not set)
   */
  get(varname) {
    const inStore = this.store.getItem(varname);
    if (inStore) return JSON.parse(inStore);
    if (this.defaultMap.has(varname)) return this.defaultMap.get(varname);
    return undefined;
  }

  /**
   * Set the value of a variable
   * @param {string} varname the name of the variable
   * @param {any} value the new value
   */
  set(varname, value) {
    if (this.defaultMap.has(varname)) {
      if (checkEqual(value, this.defaultMap.get(varname))) {
        this.store.removeItem(varname);
        return;
      }
    }
    this.store.setItem(varname, JSON.stringify(value));
  }

  /**
   * Delete a variable
   * @param {string} varname the name of the variable
   */
  remove(varname) {
    this.store.removeItem(varname);
  }
}

/**
 * Global variable to be used to access local storage
 * @type {LocalStorageHelper}
 */
const STORAGE = new LocalStorageHelper();
