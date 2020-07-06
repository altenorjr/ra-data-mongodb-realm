import { ObjectId } from "bson";

import { cleanObj, cleanValue } from "./utils";

export default ({
  app,
  service,
  db,
  preparseDocument = (resource, data) => data,
}) => {
  const Service = app.services.mongodb(service);

  const Db = Service.db(db);

  return {
    getList: (resource, { filter, sort, pagination }) => {
      const { page, perPage } = pagination;
      const { field, order } = sort;

      const collection = Db.collection(resource);

      const filterQuery = {
        $match: filter,
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
          data.map(({ _id: id, ...rest }) => {
            return cleanObj({ id, ...rest });
          })
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
      // return httpClient(`${apiUrl}/${resource}/${params.id}`).then(
      //   ({ json }) => ({
      //     data: json,
      //   })
      // );

      const collection = Db.collection(resource);

      return collection
        .findOne({ _id: new ObjectId(params.id) })
        .then((result) => {
          if (!result) {
            console.log("RESULT NOT FOUND!!!");
            return { data: null };
          }

          const { _id: id, ...rest } = result;

          return { data: cleanValue({ id, ...rest }) };
        });

      // return Promise.resolve({ data: {} });
    },

    getMany: (resource, params) => {
      // const query = {
      //   filter: JSON.stringify({ id: params.ids }),
      // };
      // const url = `${apiUrl}/${resource}?${stringify(query)}`;
      // return httpClient(url).then(({ json }) => ({ data: json }));

      const collection = Db.collection(resource);

      return collection
        .find({
          _id: {
            $in: params.ids.map((id) => new ObjectId(id)),
          },
        })
        .then((data) => ({
          data: data.map(({ _id: id, ...rest }) => {
            return cleanObj({ id, ...rest });
          }),
        }));
    },

    getManyReference: (
      resource,
      { pagination, sort, filter, target, id }
    ) => {
      // const { page, perPage } = params.pagination;
      // const { field, order } = params.sort;
      // const query = {
      //   sort: JSON.stringify([field, order]),
      //   range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
      //   filter: JSON.stringify({
      //     ...params.filter,
      //     [params.target]: params.id,
      //   }),
      // };
      // const url = `${apiUrl}/${resource}?${stringify(query)}`;

      const { page, perPage } = pagination;
      const { field, order } = sort;

      const collection = Db.collection(resource);

      const filterQuery = {
        $match: {
          ...filter,
          [target]: new Object(id),
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

    update: (resource, { id, data }) => {
      // return httpClient(`${apiUrl}/${resource}/${params.id}`, {
      //   method: "PUT",
      //   body: JSON.stringify(params.data),
      // }).then(({ json }) => ({ data: json }));

      const collection = Db.collection(resource);

      const parsed = preparseDocument(resource, data);

      return collection
        .updateOne(
          { _id: new ObjectId(id) },
          { $set: parsed }
        )
        .then((data) => ({ data }));

      // return Promise.resolve({ data: {} });
    },

    updateMany: (resource, { ids, data }) => {
      const collection = Db.collection(resource);

      const parsed = preparseDocument(resource, data);

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
      const collection = Db.collection(resource);

      const parsed = preparseDocument(resource, data);

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

    delete: (resource, { id }) => {
      const collection = Db.collection(resource);

      return collection
        .deleteOne({ _id: new ObjectId(id) })
        .then((data) => ({ data }));
    },

    deleteMany: (resource, { ids }) => {
      const collection = Db.collection(resource);

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