const { MongoClient } = require('mongodb')

const uri = `mongodb://localhost:27017`
const client = new MongoClient(uri)
client.close()

const exec = (db, coll, func) => {
    try {
        const client = new MongoClient(uri)
        const database = client.db(db)
        const collection = database.collection(coll)

        return func(collection).then((result) => {
            return client.close().finally().then(() => {
                return result
            })
        })
    } catch (err) {
        return Promise.reject(err)
    }
}

const insertOne = (db, coll, doc, options) => {
    return exec(db, coll, (collection) => {
        return collection.insertOne(doc, options)
    })
}

const insertMany = (db, coll, docs, options) => {
    return exec(db, coll, (collection) => {
        return collection.insertMany(docs, options)
    })
}

const findOne = (db, coll, query, options) => {
    return exec(db, coll, (collection) => {
        return collection.findOne(query, options)
    })
}

const find = (db, coll, query, options) => {
    options ??= {}
    options.limit ??= 10
    options.skip ??= 0

    return exec(db, coll, (collection) => {
        return collection.find(query, options).toArray()
    })
}

const count = (db, coll, query, options) => {
    return exec(db, coll, (collection) => {
        return collection.countDocuments(query, options)
    })
}

const updateOne = (db, coll, query, update, options) => {
    return exec(db, coll, (collection) => {
        return collection.updateOne(query, update, options)
    })
}

const updateMany = (db, coll, query, update, options) => {
    return exec(db, coll, (collection) => {
        return collection.updateMany(query, update, options)
    })
}

const aggregate = (db, coll, pipeline, options) => {
    return exec(db, coll, (collection) => {
        return collection.aggregate(pipeline, options)
    })
}

const deleteOne = (db, coll, query, options) => {
    return exec(db, coll, (collection) => {
        return collection.deleteOne(query, options)
    })
}

const deleteMany = (db, coll, query, options) => {
    return exec(db, coll, (collection) => {
        return collection.deleteMany(query, options)
    })
}

module.exports = {
    insertOne,
    insertMany,
    findOne,
    find,
    count,
    updateOne,
    updateMany,
    aggregate,
    deleteOne,
    deleteMany,
}
