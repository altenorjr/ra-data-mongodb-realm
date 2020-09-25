const { ObjectId } = require("bson");

const { cleanObj, cleanValue } = require("./utils");

module.exports = ({
  app,
  service,
  db,
  overrideResourceName = (resource, operation) => resource,
  preparseDocument = (resource, data) => data,
  createListQuery = (resource, defaultQuery) => ({
    query: defaultQuery,
  }),
}) => {
  const Service = app.services.mongodb(service);

  const Db = Service.db(db);

  return {
    getList: (
      resource,
      { filter, sort = {}, pagination = {} }
    ) => {
      const { page = 1, perPage = 10 } = pagination || {};
      const { field = "_id", order = "ASC" } = sort || {};

      const overriddenResourceName = overrideResourceName(
        resource,
        "getList"
      );

      const collection = Db.collection(
        overriddenResourceName
      );

      const {
        query: filterQuery,
        autoPagination = true,
        autoSorting = true,
        autoCount = true,
      } = createListQuery(resource, [
        {
          $match: filter,
        },
      ]);

      const dataPipeline = [
        ...filterQuery,
        ...(autoSorting
          ? [
              {
                $sort: {
                  [field === "id" ? "_id" : field]:
                    order === "DESC" ? -1 : 1,
                },
              },
            ]
          : []),
        ...(autoPagination
          ? [
              {
                $skip: (page - 1) * perPage,
              },
              {
                $limit: perPage,
              },
            ]
          : []),
      ];

      const dataQuery = collection
        .aggregate(dataPipeline)
        .then((data) =>
          data.map(({ _id: id, ...rest }) => {
            return cleanObj({ id, ...rest });
          })
        );

      const countPipeline = [
        ...filterQuery,
        ...(autoCount
          ? [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                },
              },
            ]
          : []),
      ];

      const countQuery = collection
        .aggregate(countPipeline)
        .then(([data]) => {
          return (data || {}).total || 0;
        });

      return Promise.all([dataQuery, countQuery]).then(
        ([data, total] = [[], 0]) => {
          console.log({ data, total });

          return {
            data,
            total,
          };
        }
      );
    },
    getOne: (resource, params) => {
      const overriddenResourceName = overrideResourceName(
        resource,
        "getOne"
      );

      const collection = Db.collection(
        overriddenResourceName
      );

      const id =
        params.id.lenth !== 24
          ? params.id
          : new ObjectId(params.id);

      return collection
        .findOne({ _id: id })
        .then((result) => {
          if (!result) {
            console.log("RESULT NOT FOUND!!!");

            return { data: null };
          }

          const { _id: id, ...rest } = result;

          return { data: cleanValue({ id, ...rest }) };
        });
    },
    getMany: (resource, params) => {
      // const query = {
      //   filter: JSON.stringify({ id: params.ids }),
      // };
      // const url = `${apiUrl}/${resource}?${stringify(query)}`;
      // return httpClient(url).then(({ json }) => ({ data: json }));

      const overriddenResourceName = overrideResourceName(
        resource,
        "getMany"
      );

      const collection = Db.collection(
        overriddenResourceName
      );

      return collection
        .find({
          _id: {
            $in: params.ids.map((id) => new ObjectId(id)),
          },
        })
        .then((data) => {
          data = data.map(({ _id: id, ...rest }) => {
            return cleanObj({ id, ...rest });
          });

          return {
            data,
          };
        });
    },
    getManyReference: (
      resource,
      { pagination, sort, filter, target, id }
    ) => {
      const { page, perPage } = pagination;
      const { field, order } = sort;

      const overriddenResourceName = overrideResourceName(
        resource,
        "getManyReference"
      );

      const collection = Db.collection(
        overriddenResourceName
      );

      const filterQuery = {
        $match: {
          ...filter,
          [target]: { $oid: id },
        },
      };

      const dataQuery = collection
        .aggregate([
          filterQuery,
          {
            $sort: {
              [field]: order === "DESC" ? -1 : 1,
            },
          },
          {
            $skip: (page - 1) * perPage,
          },
          {
            $limit: perPage,
          },
        ])
        .then((data) =>
          data.map(({ _id, ...rest }) =>
            cleanObj({ id: _id, ...rest })
          )
        );

      const countQuery = collection
        .aggregate([
          filterQuery,
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
            },
          },
        ])
        .then(([data]) => {
          return (data || {}).total || 0;
        });

      return Promise.all([dataQuery, countQuery]).then(
        ([data, total] = [[], 0]) => ({
          data: data.map(({ _id: id, ...rest }) =>
            cleanObj({ id, ...rest })
          ),
          total,
        })
      );

      // return httpClient(url).then(({ headers, json }) => ({
      //   data: json,
      //   total: parseInt(headers.get("content-range").split("/").pop(), 10),
      // }));

      // Promise.resolve({ data: [], total: 0 });
    },
    update: (resource, { id, data, ...options }) => {
      const parsed = preparseDocument(resource, data);

      const overriddenResourceName = overrideResourceName(
        resource,
        "update"
      );

      const collection = Db.collection(
        overriddenResourceName
      );

      return collection
        .updateOne(
          { _id: new ObjectId(id) },
          { $set: parsed },
          options
        )
        .then((data) => ({ data }));

      // return Promise.resolve({ data: {} });
    },
    updateMany: (resource, { ids, data }) => {
      const parsed = preparseDocument(resource, data);

      const overriddenResourceName = overrideResourceName(
        resource,
        "updateMany"
      );

      const collection = Db.collection(
        overriddenResourceName
      );

      collection
        .updateMany(
          {
            _id: { $in: ids.map((id) => new ObjectId(id)) },
          },
          { $set: parsed }
        )
        .then((data) => ({ data }));

      return Promise.resolve({ data: [] });
    },
    create: (resource, { data }) => {
      const parsed = preparseDocument(resource, data);

      const overriddenResourceName = overrideResourceName(
        resource,
        "create"
      );

      const collection = Db.collection(
        overriddenResourceName
      );

      return collection
        .insertOne(parsed)
        .then(({ insertedId }) => {
          return {
            data: {
              id: insertedId.toString(),
              ...data,
            },
          };
        });
    },
    createMany: (resource, { data }) => {
      const parsed = preparseDocument(resource, data);

      const overriddenResourceName = overrideResourceName(
        resource,
        "create"
      );

      const collection = Db.collection(
        overriddenResourceName
      );

      return collection
        .insertMany(parsed)
        .then(({ insertedIds }) => {
          return {
            data: {
              ids: insertedIds.map((id) => id.toString()),
              ...data,
            },
          };
        });
    },
    delete: (resource, { id }) => {
      const overriddenResourceName = overrideResourceName(
        resource,
        "delete"
      );

      const collection = Db.collection(
        overriddenResourceName
      );

      return collection
        .deleteOne({ _id: new ObjectId(id) })
        .then((data) => ({ data }));
    },
    deleteMany: (resource, { ids }) => {
      const overriddenResourceName = overrideResourceName(
        resource,
        "deleteMany"
      );

      const collection = Db.collection(
        overriddenResourceName
      );

      return collection
        .deleteMany({
          _id: { $in: ids.map((id) => new Object(id)) },
        })
        .then((data) => ({
          data: data.map(({ _id, ...rest }) => {
            return {
              id: _id.toString(),
              ...rest,
            };
          }),
        }));
    },
  };
};
