import { Op } from 'sequelize';

// Helper to translate MongoDB query operators to Sequelize
export function translateQuery(query, model) {
  if (!query || typeof query !== 'object') return query;

  const sequelizeQuery = {};
  for (const [key, val] of Object.entries(query)) {
    // Map _id query keys to id
    let targetKey = key === '_id' ? 'id' : key;

    // Check if the model has an association that matches this key
    if (model && model.associations && model.associations[targetKey]) {
      targetKey = model.associations[targetKey].foreignKey;
    }

    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      const opObj = {};
      let hasOp = false;

      if (val.$regex !== undefined) {
        hasOp = true;
        let pattern = val.$regex;
        if (typeof pattern === 'string') {
          // Remove leading ^ and trailing $ regex anchors if present
          pattern = pattern.replace(/^\^/, '').replace(/\$$/, '');
          pattern = `%${pattern}%`;
        }
        opObj[Op.like] = pattern;
      }
      if (val.$gte !== undefined) {
        hasOp = true;
        opObj[Op.gte] = val.$gte;
      }
      if (val.$lte !== undefined) {
        hasOp = true;
        opObj[Op.lte] = val.$lte;
      }
      if (val.$gt !== undefined) {
        hasOp = true;
        opObj[Op.gt] = val.$gt;
      }
      if (val.$lt !== undefined) {
        hasOp = true;
        opObj[Op.lt] = val.$lt;
      }
      if (val.$ne !== undefined) {
        hasOp = true;
        // Map _id in $ne
        let neVal = val.$ne;
        if (neVal === '_id') {
          neVal = 'id';
        } else if (model && model.associations && model.associations[neVal]) {
          neVal = model.associations[neVal].foreignKey;
        }
        opObj[Op.ne] = neVal;
      }
      if (val.$in !== undefined) {
        hasOp = true;
        opObj[Op.in] = val.$in;
      }
      if (val.$nin !== undefined) {
        hasOp = true;
        opObj[Op.notIn] = val.$nin;
      }

      if (hasOp) {
        sequelizeQuery[targetKey] = opObj;
      } else {
        // Query nested properties or sub-fields
        sequelizeQuery[targetKey] = val;
      }
    } else if (key === '$and' && Array.isArray(val)) {
      sequelizeQuery[Op.and] = val.map(q => translateQuery(q, model));
    } else if (key === '$or' && Array.isArray(val)) {
      sequelizeQuery[Op.or] = val.map(q => translateQuery(q, model));
    } else {
      sequelizeQuery[targetKey] = val;
    }
  }
  return sequelizeQuery;
}

// Translate Mongoose-style input data to match Sequelize database schema keys
export function translateInputData(data, model) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(item => translateInputData(item, model));
  }

  const clean = { ...data };
  if (model && model.associations) {
    for (const [assocName, assoc] of Object.entries(model.associations)) {
      if (clean[assocName] !== undefined) {
        clean[assoc.foreignKey] = clean[assocName];
        delete clean[assocName];
      }
    }
  }
  if (clean._id !== undefined) {
    clean.id = clean._id;
    delete clean._id;
  }
  return clean;
}

// Intercept dot filters (like 'documents.status': 'Pending')
export function omitDotFilters(query) {
  const clean = {};
  for (const [key, val] of Object.entries(query)) {
    if (!key.includes('.')) {
      clean[key] = val;
    }
  }
  return clean;
}

export function getDotFilters(query) {
  const dotFilters = {};
  for (const [key, val] of Object.entries(query)) {
    if (key.includes('.')) {
      dotFilters[key] = val;
    }
  }
  return dotFilters;
}

// In-memory JavaScript matching for nested documents array queries
export function matchInJS(instance, dotFilters) {
  const raw = instance.toJSON ? instance.toJSON() : instance;
  
  // Auto-parse JSON columns returned as strings
  const rawAttributes = instance.constructor && instance.constructor.rawAttributes;
  if (rawAttributes) {
    for (const [key, attr] of Object.entries(rawAttributes)) {
      if (attr.type && (attr.type.constructor.name === 'JSON' || attr.type.key === 'JSON')) {
        if (typeof raw[key] === 'string') {
          try {
            raw[key] = JSON.parse(raw[key]);
          } catch (e) {
            // Ignore
          }
        }
      }
    }
  }

  for (const [key, expected] of Object.entries(dotFilters)) {
    const parts = key.split('.');
    const actual = getNestedValue(raw, parts);
    if (!compareValues(actual, expected)) {
      return false;
    }
  }
  return true;
}

function getNestedValue(obj, parts) {
  let current = obj;
  for (let i = 0; i < parts.length; i++) {
    if (current === undefined || current === null) return undefined;
    const part = parts[i];
    if (Array.isArray(current)) {
      // Check if the part is a numeric index (like documents.0)
      const isIndex = !isNaN(part) && Number.isInteger(parseFloat(part));
      if (isIndex) {
        current = current[parseInt(part)];
      } else {
        // Map the property access across all elements
        if (i === parts.length - 1) {
          return current.map(item => item && item[part]);
        } else {
          current = current.map(item => item && item[part]);
        }
      }
    } else {
      current = current[part];
    }
  }
  return current;
}

function compareValues(actual, expected) {
  if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
    if (expected.$exists !== undefined) {
      const exists = actual !== undefined;
      return exists === expected.$exists;
    }
    if (expected.$in !== undefined) {
      const inList = expected.$in;
      if (Array.isArray(actual)) {
        return actual.some(a => inList.includes(a));
      }
      return inList.includes(actual);
    }
  }
  if (Array.isArray(actual)) {
    return actual.includes(expected);
  }
  return actual === expected;
}

// ES6 Proxy Wrapper for Sequelize Instance
export function wrapInstance(instance) {
  if (!instance) return null;
  if (instance._isMongooseWrapped) return instance;

  const handler = {
    get(target, prop, receiver) {
      if (prop === '_id') {
        return target.id;
      }
      if (prop === '_isMongooseWrapped') {
        return true;
      }
      if (prop === '_sequelizeInstance') {
        return target;
      }

      // Auto-parse any JSON properties that are currently stored/returned as strings
      const rawAttributes = target.constructor.rawAttributes;
      if (rawAttributes && rawAttributes[prop] && (rawAttributes[prop].type && (rawAttributes[prop].type.constructor.name === 'JSON' || rawAttributes[prop].type.key === 'JSON'))) {
        let val = target.getDataValue(prop);
        if (typeof val === 'string') {
          try {
            val = JSON.parse(val);
            target.setDataValue(prop, val);
          } catch (e) {
            // Keep original
          }
        }
        return val;
      }

      if (prop === 'save') {
        return async function() {
          // Explicitly flag all JSON properties as changed so Sequelize updates them
          const rawAttributes = target.constructor.rawAttributes;
          if (rawAttributes) {
            for (const [key, attr] of Object.entries(rawAttributes)) {
              if (attr.type && (attr.type.constructor.name === 'JSON' || attr.type.key === 'JSON')) {
                const currentVal = receiver[key];
                target.setDataValue(key, currentVal);
                target.changed(key, true);
              }
            }
          }
          await target.save();
          return receiver;
        };
      }
      if (prop === 'toObject' || prop === 'toJSON') {
        return function() {
          const json = target.toJSON();
          
          // Auto-parse JSON columns returned as strings
          const rawAttributes = target.constructor.rawAttributes;
          if (rawAttributes) {
            for (const [key, attr] of Object.entries(rawAttributes)) {
              if (attr.type && (attr.type.constructor.name === 'JSON' || attr.type.key === 'JSON')) {
                if (typeof json[key] === 'string') {
                  try {
                    json[key] = JSON.parse(json[key]);
                  } catch (e) {
                    // Ignore
                  }
                }
              }
            }
          }

          // Helper to recursively map all nested id fields to _id
          const mapIdToUnderscoreId = (obj) => {
            if (!obj || typeof obj !== 'object') return obj;
            if (Array.isArray(obj)) {
              return obj.map(mapIdToUnderscoreId);
            }
            if (obj.id !== undefined && obj._id === undefined) {
              obj._id = obj.id;
            }
            for (const [k, v] of Object.entries(obj)) {
              if (v && typeof v === 'object') {
                obj[k] = mapIdToUnderscoreId(v);
              }
            }
            return obj;
          };
          
          mapIdToUnderscoreId(json);

          // Map foreign key IDs to match MongoDB property names if not populated
          if (target.constructor.associations) {
            for (const [assocName, assoc] of Object.entries(target.constructor.associations)) {
              if (json[assoc.foreignKey] !== undefined) {
                const currentVal = json[assocName];
                if (!currentVal || typeof currentVal !== 'object') {
                  json[assocName] = json[assoc.foreignKey];
                }
              }
            }
          }
          return json;
        };
      }

      // Dynamic check for associations to map Mongoose-style population/FK checks
      const assoc = target.constructor.associations && target.constructor.associations[prop];
      if (assoc) {
        if (target[prop] !== undefined && target[prop] !== null) {
          return wrapInstance(target[prop]);
        }
        return target[assoc.foreignKey];
      }

      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return val.bind(target);
      }
      return val;
    },
    set(target, prop, value, receiver) {
      if (prop === '_id') {
        target.id = value;
        return true;
      }
      // Dynamic check for associations to map sets to foreign keys
      const assoc = target.constructor.associations && target.constructor.associations[prop];
      if (assoc) {
        target[assoc.foreignKey] = value;
        return true;
      }
      return Reflect.set(target, prop, value, receiver);
    }
  };

  return new Proxy(instance, handler);
}

// Chainable Find query builder mimicking Mongoose
class MongooseQuery {
  constructor(model, options = {}) {
    this.model = model;
    this.where = options.where || {};
    this.include = options.include || [];
    this.limitVal = null;
    this.skipVal = null;
    this.orderVal = null;
    this.attributesVal = null;
  }

  limit(n) {
    this.limitVal = parseInt(n);
    return this;
  }

  skip(n) {
    this.skipVal = parseInt(n);
    return this;
  }

  sort(sortObj) {
    if (typeof sortObj === 'string') {
      const isDesc = sortObj.startsWith('-');
      const field = isDesc ? sortObj.substring(1) : sortObj;
      this.orderVal = [[field === '_id' ? 'id' : field, isDesc ? 'DESC' : 'ASC']];
    } else if (sortObj && typeof sortObj === 'object') {
      this.orderVal = Object.entries(sortObj).map(([key, val]) => {
        const field = key === '_id' ? 'id' : key;
        const dir = val === -1 || val === 'desc' || val === 'DESC' ? 'DESC' : 'ASC';
        return [field, dir];
      });
    }
    return this;
  }

  select(selectStr) {
    if (typeof selectStr === 'string') {
      const parts = selectStr.split(/\s+/).filter(Boolean);
      const excludes = parts.filter(p => p.startsWith('-')).map(p => p.substring(1));
      if (excludes.length > 0) {
        this.attributesVal = { exclude: excludes.map(e => e === '_id' ? 'id' : e) };
      } else {
        const standardIncludes = parts.filter(p => !p.startsWith('-') && !p.startsWith('+')).map(p => p === '_id' ? 'id' : p);
        const plusIncludes = parts.filter(p => p.startsWith('+')).map(p => p.substring(1));
        if (standardIncludes.length > 0) {
          this.attributesVal = [...standardIncludes, ...plusIncludes.map(p => p === '_id' ? 'id' : p)];
        } else {
          this.attributesVal = null;
        }
      }
    }
    return this;
  }

  populate(fields) {
    const array = Array.isArray(fields) ? fields : (typeof fields === 'string' ? fields.split(/\s+/) : []);
    for (const f of array) {
      if (f) {
        const assoc = this.model.associations[f];
        if (assoc) {
          this.include.push({ model: assoc.target, as: f });
        }
      }
    }
    return this;
  }

  async exec() {
    const hasDotFilters = Object.keys(this.where).some(k => k.includes('.'));
    const queryOptions = {
      where: translateQuery(hasDotFilters ? omitDotFilters(this.where) : this.where, this.model),
      include: this.include,
    };

    if (!hasDotFilters) {
      if (this.limitVal !== null) queryOptions.limit = this.limitVal;
      if (this.skipVal !== null) queryOptions.offset = this.skipVal;
    }
    if (this.orderVal !== null) queryOptions.order = this.orderVal;
    if (this.attributesVal !== null) queryOptions.attributes = this.attributesVal;

    let results = await this.model.findAll(queryOptions);

    if (hasDotFilters) {
      const dotFilters = getDotFilters(this.where);
      results = results.filter(item => matchInJS(item, dotFilters));
      const start = this.skipVal || 0;
      const end = this.limitVal !== null ? start + this.limitVal : undefined;
      results = results.slice(start, end);
    }

    return results.map(wrapInstance);
  }

  then(onFulfilled, onRejected) {
    return this.exec().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.exec().catch(onRejected);
  }
}

// Chainable FindOne query builder mimicking Mongoose
class MongooseFindOneQuery {
  constructor(model, options = {}) {
    this.model = model;
    this.where = options.where || {};
    this.include = options.include || [];
    this.attributesVal = null;
  }

  select(selectStr) {
    if (typeof selectStr === 'string') {
      const parts = selectStr.split(/\s+/).filter(Boolean);
      const excludes = parts.filter(p => p.startsWith('-')).map(p => p.substring(1));
      if (excludes.length > 0) {
        this.attributesVal = { exclude: excludes.map(e => e === '_id' ? 'id' : e) };
      } else {
        const standardIncludes = parts.filter(p => !p.startsWith('-') && !p.startsWith('+')).map(p => p === '_id' ? 'id' : p);
        const plusIncludes = parts.filter(p => p.startsWith('+')).map(p => p.substring(1));
        if (standardIncludes.length > 0) {
          this.attributesVal = [...standardIncludes, ...plusIncludes.map(p => p === '_id' ? 'id' : p)];
        } else {
          this.attributesVal = null;
        }
      }
    }
    return this;
  }

  populate(fields) {
    const array = Array.isArray(fields) ? fields : (typeof fields === 'string' ? fields.split(/\s+/) : []);
    for (const f of array) {
      if (f) {
        const assoc = this.model.associations[f];
        if (assoc) {
          this.include.push({ model: assoc.target, as: f });
        }
      }
    }
    return this;
  }

  async exec() {
    const hasDotFilters = Object.keys(this.where).some(k => k.includes('.'));
    if (hasDotFilters) {
      const queryOptions = {
        where: translateQuery(omitDotFilters(this.where), this.model),
        include: this.include,
      };
      if (this.attributesVal !== null) queryOptions.attributes = this.attributesVal;
      let results = await this.model.findAll(queryOptions);
      const dotFilters = getDotFilters(this.where);
      results = results.filter(item => matchInJS(item, dotFilters));
      return results.length > 0 ? wrapInstance(results[0]) : null;
    } else {
      const queryOptions = {
        where: translateQuery(this.where, this.model),
        include: this.include,
      };
      if (this.attributesVal !== null) queryOptions.attributes = this.attributesVal;
      const result = await this.model.findOne(queryOptions);
      return result ? wrapInstance(result) : null;
    }
  }

  then(onFulfilled, onRejected) {
    return this.exec().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.exec().catch(onRejected);
  }
}

// Aggregate raw query mapper
async function runAggregateQuery(sequelize, modelName, pipeline) {
  const firstStage = pipeline[0] || {};
  const match = firstStage.$match || {};

  if (modelName === 'Payment') {
    const groupStage = pipeline[1] || {};
    const group = groupStage.$group || {};

    if (group._id && group._id.year && group._id.month) {
      const paymentDateFilter = match.paymentDate && match.paymentDate.$gte;
      const sql = `
        SELECT YEAR(paymentDate) AS year, MONTH(paymentDate) AS month, SUM(amount) AS revenue
        FROM Payments
        WHERE paymentDate >= :paymentDateFilter AND paymentStatus = 'Completed'
        GROUP BY YEAR(paymentDate), MONTH(paymentDate)
        ORDER BY year ASC, month ASC
      `;
      const results = await sequelize.query(sql, {
        replacements: { paymentDateFilter: paymentDateFilter instanceof Date ? paymentDateFilter.toISOString() : (paymentDateFilter || '1970-01-01') },
        type: sequelize.QueryTypes.SELECT
      });
      return results.map(r => ({
        _id: { year: r.year, month: r.month },
        revenue: parseFloat(r.revenue || 0)
      }));
    }

    if (group._id === '$customer') {
      const limitStage = pipeline.find(s => s.$limit) || { $limit: 5 };
      const limit = limitStage.$limit;
      const sql = `
        SELECT c.id AS customerId, c.name, c.email, c.phone, p.totalSpent, p.bookingsCount
        FROM (
          SELECT customerId, SUM(amount) AS totalSpent, COUNT(*) AS bookingsCount
          FROM Payments
          WHERE paymentStatus = 'Completed'
          GROUP BY customerId
          ORDER BY totalSpent DESC
          LIMIT :limit
        ) p
        JOIN Customers c ON p.customerId = c.id
      `;
      const results = await sequelize.query(sql, {
        replacements: { limit },
        type: sequelize.QueryTypes.SELECT
      });
      return results.map(r => {
        const info = { name: r.name, email: r.email, phone: r.phone };
        return {
          _id: r.customerId,
          totalSpent: parseFloat(r.totalSpent || 0),
          bookingsCount: parseInt(r.bookingsCount || 0),
          visitCount: parseInt(r.bookingsCount || 0),
          customerInfo: info,
          customerDetails: info
        };
      });
    }

    if (group._id && group._id.$dateToString) {
      const limitStage = pipeline.find(s => s.$limit) || { $limit: 30 };
      const limit = limitStage.$limit;
      const sql = `
        SELECT DATE_FORMAT(paymentDate, '%Y-%m-%d') AS dateStr, SUM(amount) AS dailyRevenue, COUNT(*) AS transactionCount
        FROM Payments
        WHERE paymentStatus = 'Completed'
        GROUP BY DATE_FORMAT(paymentDate, '%Y-%m-%d')
        ORDER BY dateStr DESC
        LIMIT :limit
      `;
      const results = await sequelize.query(sql, {
        replacements: { limit },
        type: sequelize.QueryTypes.SELECT
      });
      return results.map(r => ({
        _id: r.dateStr,
        dailyRevenue: parseFloat(r.dailyRevenue || 0),
        transactionCount: parseInt(r.transactionCount || 0)
      }));
    }
  }

  if (modelName === 'Booking') {
    const groupStage = pipeline.find(s => s.$group) || {};
    const group = groupStage.$group || {};

    if (group._id === '$roomInfo.roomType') {
      const sql = `
        SELECT r.roomType, COUNT(*) AS count
        FROM Bookings b
        JOIN Rooms r ON b.roomId = r.id
        WHERE b.bookingStatus != 'Cancelled'
        GROUP BY r.roomType
      `;
      const results = await sequelize.query(sql, {
        type: sequelize.QueryTypes.SELECT
      });
      return results.map(r => ({
        _id: r.roomType,
        count: parseInt(r.count || 0)
      }));
    }

    if (group._id === '$room') {
      const limitStage = pipeline.find(s => s.$limit) || { $limit: 5 };
      const limit = limitStage.$limit;
      const sql = `
        SELECT r.id AS roomId, r.roomNumber, r.roomType, b.bookingsCount
        FROM (
          SELECT roomId, COUNT(*) AS bookingsCount
          FROM Bookings
          WHERE bookingStatus != 'Cancelled'
          GROUP BY roomId
          ORDER BY bookingsCount DESC
          LIMIT :limit
        ) b
        JOIN Rooms r ON b.roomId = r.id
      `;
      const results = await sequelize.query(sql, {
        replacements: { limit },
        type: sequelize.QueryTypes.SELECT
      });
      return results.map(r => ({
        _id: r.roomId,
        bookingsCount: parseInt(r.bookingsCount || 0),
        roomInfo: {
          roomNumber: r.roomNumber,
          roomType: r.roomType
        }
      }));
    }
  }

  return [];
}

// Wrapper for the Sequelize Model itself
export class MongooseModelWrapper {
  constructor(SequelizeModel, modelName) {
    this.SequelizeModel = SequelizeModel;
    this.modelName = modelName;
  }

  find(query = {}) {
    return new MongooseQuery(this.SequelizeModel, { where: query });
  }

  findOne(query = {}) {
    return new MongooseFindOneQuery(this.SequelizeModel, { where: query });
  }

  findById(id) {
    if (!id) {
      return {
        populate() { return this; },
        select() { return this; },
        then(onFulfilled) { return Promise.resolve(null).then(onFulfilled); },
        catch(onRejected) { return Promise.resolve(null).catch(onRejected); }
      };
    }
    return new MongooseFindOneQuery(this.SequelizeModel, { where: { id } });
  }

  async create(data) {
    const cleanData = translateInputData(data, this.SequelizeModel);
    if (Array.isArray(cleanData)) {
      const instances = await this.SequelizeModel.bulkCreate(cleanData, { individualHooks: true });
      return instances.map(wrapInstance);
    }
    const instance = await this.SequelizeModel.create(cleanData);
    return wrapInstance(instance);
  }

  async insertMany(records) {
    const cleanRecords = translateInputData(records, this.SequelizeModel);
    const instances = await this.SequelizeModel.bulkCreate(cleanRecords, { individualHooks: true });
    return instances.map(wrapInstance);
  }

  async countDocuments(query = {}) {
    const hasDotFilters = Object.keys(query).some(k => k.includes('.'));
    if (hasDotFilters) {
      const queryOptions = {
        where: translateQuery(omitDotFilters(query), this.SequelizeModel),
      };
      let results = await this.SequelizeModel.findAll(queryOptions);
      const dotFilters = getDotFilters(query);
      results = results.filter(item => matchInJS(item, dotFilters));
      return results.length;
    } else {
      const count = await this.SequelizeModel.count({
        where: translateQuery(query, this.SequelizeModel),
      });
      return count;
    }
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    if (!id) return null;
    const instance = await this.SequelizeModel.findByPk(id);
    if (!instance) return null;
    await instance.update(translateInputData(updateData, this.SequelizeModel));
    return wrapInstance(instance);
  }

  async findByIdAndDelete(id) {
    if (!id) return null;
    const instance = await this.SequelizeModel.findByPk(id);
    if (!instance) return null;
    await instance.destroy();
    return wrapInstance(instance);
  }

  async findOneAndDelete(query) {
    const q = new MongooseFindOneQuery(this.SequelizeModel, { where: query });
    const instance = await q.exec();
    if (!instance) return null;
    const rawInstance = instance._sequelizeInstance || instance;
    await rawInstance.destroy();
    return instance;
  }

  async deleteMany(query = {}) {
    const count = await this.SequelizeModel.destroy({
      where: translateQuery(query, this.SequelizeModel),
    });
    return { deletedCount: count };
  }

  async updateMany(query = {}, updateData = {}) {
    const cleanData = translateInputData(updateData, this.SequelizeModel);
    const [affectedCount] = await this.SequelizeModel.update(cleanData, {
      where: translateQuery(query, this.SequelizeModel),
    });
    return { modifiedCount: affectedCount };
  }

  async deleteOne(query = {}) {
    const count = await this.SequelizeModel.destroy({
      where: translateQuery(query, this.SequelizeModel),
      limit: 1
    });
    return { deletedCount: count };
  }

  async aggregate(pipeline) {
    return await runAggregateQuery(this.SequelizeModel.sequelize, this.modelName, pipeline);
  }
}
