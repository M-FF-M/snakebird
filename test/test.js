
function assertEqual(objA, objB) {
  if (objA != objB) {
    throw new Error("Assertion error: " + JSON.stringify(objA) + " is not equal to " + JSON.stringify(objB));
  }
}

function assertStrictEqual(objA, objB) {
  if (objA !== objB) {
    throw new Error("Assertion error: " + JSON.stringify(objA) + " is not strictly equal to " + JSON.stringify(objB));
  }
}

function assertNotEqual(objA, objB) {
  if (objA == objB) {
    throw new Error("Assertion error: " + JSON.stringify(objA) + " is equal to " + JSON.stringify(objB));
  }
}

function assertNotStrictEqual(objA, objB) {
  if (objA === objB) {
    throw new Error("Assertion error: " + JSON.stringify(objA) + " is strictly equal to " + JSON.stringify(objB));
  }
}

function assertArrayCmp(arrA, arrB, cmpFct) {
  if (!(arrA instanceof Array)) throw new Error("Assertion error: " + JSON.stringify(arrA) + " is not an array.");
  if (!(arrB instanceof Array)) throw new Error("Assertion error: " + JSON.stringify(arrB) + " is not an array.");
  assertStrictEqual(arrA.length, arrB.length);
  for (let i=0; i<arrA.length; i++) {
    cmpFct(arrA[i], arrB[i]);
  }
}
