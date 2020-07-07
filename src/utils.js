const bson = require("bson");
const get = require("lodash.get");
const set = require("lodash.set");
const unset = require("lodash.unset");

const _ = { get, set, unset };

const oid = (id) => new bson.ObjectID(id);
module.exports.oid = oid;

const cleanValue = (value) => {
  if (!value) {
    return value;
  }

  if (Array.isArray(value)) {
    return cleanArray(value);
  }

  if (
    value instanceof bson.ObjectID ||
    (!!value._bsontype &&
      value._bsontype === "ObjectId" &&
      !!value.id &&
      value.id instanceof Uint8Array)
  ) {
    return value.toString();
  }

  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === "object" &&
    Object.keys(value).length > 0
  ) {
    return cleanObj(value);
  }

  return value;
};
module.exports.cleanValue = cleanValue;

const cleanObj = (obj) => {
  return Object.entries(obj)
    .map(([key, value]) => {
      return [key, cleanValue(value)];
    })
    .reduce((all, [key, value]) => {
      return {
        ...all,
        [key]: value,
      };
    }, {});
};
module.exports.cleanObj = cleanObj;

const cleanArray = (array) =>
  array.map((value) => cleanValue(value));
module.exports.cleanArray = cleanArray;

const preparseDocument = (
  obj,
  fieldsToParse,
  pathParser = preparsePath
) => {
  let parsedObj = { ...obj };

  Object.entries(fieldsToParse).map(
    ([path, transformer]) => {
      parsedObj = pathParser(parsedObj, path, transformer);
    }
  );

  return parsedObj;
};
module.exports.preparseDocument = preparseDocument;

const preparsePath = (obj, path, transformer) => {
  let pathIsInArray = path.includes("$");
  let pathIsArrayElement = path.endsWith("$");

  if (!pathIsInArray) {
    if (transformer === false) {
      _.unset(obj, path);

      return obj;
    }

    const existing = _.get(obj, path);

    if (existing === undefined) {
      return obj;
    }

    return _.set(obj, path, transformer(existing));
  }

  if (pathIsArrayElement) {
    const realPath = path.substring(0, path.length - 2);

    const existing = _.get(obj, realPath);

    if (!Array.isArray(existing)) {
      return obj;
    }

    const transformed = existing.map((val) =>
      val ? transformer(val) : val
    );

    return _.set(obj, realPath, transformed);
  }

  if (pathIsInArray) {
    const [basePath, innerPath] = path.split(".$.");

    const existing = _.get(obj, basePath);

    if (!Array.isArray(existing)) {
      return obj;
    }

    return _.set(
      obj,
      basePath,
      existing.map((item) => {
        if (transformer === false) {
          _.unset(item, innerPath);

          return item;
        }

        const existing = _.get(item, innerPath);

        if (existing === undefined) {
          return item;
        }

        return _.set(
          item,
          innerPath,
          transformer(existing)
        );
      })
    );
  }
};
module.exports.preparsePath = preparsePath;
