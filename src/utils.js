import * as Realm from "realm-web";
import bson from "bson";
import _ from "lodash";
import { parse } from "path";

export const oid = (id) => new bson.ObjectID(id);

export const cleanValue = (value) => {
  if (Array.isArray(value)) {
    return cleanArray(value);
  }

  if (
    value instanceof bson.ObjectID ||
    (value.id instanceof Uint8Array &&
      value._bsontype === "ObjectId")
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

export const cleanObj = (obj) => {
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

export const cleanArray = (array) =>
  array.map((value) => cleanValue(value));

export const preparseDocument = (
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

export const preparsePath = (obj, path, transformer) => {
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
