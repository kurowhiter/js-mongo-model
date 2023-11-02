const { ObjectId } = require('bson')
const { Field } = require('./field')

const {
    insertOne,
    updateOne,
    findOne,
    deleteOne,
    find,
    updateMany,
    deleteMany,
    insertMany,
} = require('./mongodb')

const { isObject } = require('../utils')

const DB_NAME = 'testdb'

class Model {
    /**
     * class Mtest extends Model {
     *     f1 = field({defaultValue: 1})
     *     f2 = Field.dynamic({defaultValue: 2})
     * 
     *     constructor (...args) {
     *         super()
     *         this.init(...args)
     *     }
     * }
     * 
     * const x = new Mtest()
     */

    // other resolve
    // static create (this, ...args) {
    //     const obj = new this()
    //     obj.init(...args)
    //     return obj
    // }

    #init = false
    _id = Field.objectidType()

    _db = DB_NAME
    _collection = ''

    static ObjectId (str) {
        return new ObjectId(str || '')
    }

    init (...args) {
        // collection name
        if (!this._collection) {
            this._collection = this.constructor.name
        }

        // model fields
        this.fields = []
        Object.entries(this).forEach(([k, field]) => {
            if (field instanceof Field) {
                this.fields.push({ name: k, type: field })
                this[k] = args[k] || field.defaultValue
            }
        })

        this.#init = true
    }

    checkField(value, field) {
        if (field.required && value === undefined) {
            throw Error(`Field ${field.name} is required`)
        }

        if (value === undefined) return field.defaultValue || value

        if (field.type === Field.ANY_TYPE) {
            return value === undefined ? field.defaultValue : value
        }

        if (field.type === Field.STRING_TYPE) {
            return value === undefined ? field.defaultValue : `${value}`
        }

        if (field.type === Field.NUMBER_TYPE) {
            const numValue = parseFloat(v)

            if (isNaN(v)) throw Error(`${value} is not number`)

            return Number.isInteger(numValue) ? parseInt(numValue) : numValue
        }

        if (field.type === Field.DATE_TYPE) {
            let dateValue = value

            if (!(value instanceof Date)) {
                dateValue = new Date(value)
            }

            if (isNaN(dateValue.getTime())) {
                throw Error(`${value} is not Date`)
            }

            return dateValue
        }

        if (field.type === Field.OBJECTID_TYPE) {
            let oid = value

            if (!(oid instanceof ObjectId)) {
                if (!Number.isInteger(value)
                    || (`${value}`.length !== 12 && `${value}`.length !== 24)
                ) {
                    throw Error(`${value} is not valid ObjectId`)
                }

                oid = new ObjectId(value)
            }

            return oid
        }

        if (field.type === Field.OBJECT_TYPE) {
            if (!isObject(value)) throw Error(`${value} is not valid Object`)
            return value
        }

        if (field.type === Field.ARRAY_TYPE) {
            if (!Array.isArray(value))
                throw Error(`${value} is not valid Array`)
            return value
        }

        if (field.type === Field.ENUM_TYPE) {
            const v = value ?? field.defaultValue

            if (!field.enums.includes(v)) {
                throw Error(`${value} is not valid in Enum`)
            }

            return v
        }

        return value
    }

    _checkInit() {
        if (!this.#init) {
            throw Error(`Model instance had not init`)
        }
    }

    _checkDbObj() {
        if (!this._id) {
            throw Error(`Require _id field`)
        }
    }

    _collectionName() {
        return this._collection || this.constructor.name
    }

    toObj() {
        return this.fields.reduce(
            (obj, { name, type: field }) => {
                const fieldValue = field.parse(this[name])
                if (fieldValue) {
                    obj[name] = fieldValue
                }

                return obj
            },
            {},
        )
    }

    save() {
        const docData = {}
        
        this._checkInit()

        this.fields.forEach(({ name, type: field}) => {
            const validValue = this.checkField(this[name], field)
            if (validValue) {
                docData[name] = validValue
            }
        })

        if (this._id) return updateOne(
            this._db,
            this._collectionName(),
            { _id: this._id },
            {
                $set: { ...docData },
            },
        )

        return insertOne(this._db, this._collectionName(), docData).then(
            (result) => {
                this._id = result.insertedId
                return result
            },
        )
    }

    update(updateFilter) {
        const setData = {}
        const unsetData = {}

        this._checkInit()
        this._checkDbObj()

        Object.entries(updateFilter).forEach(([key, value]) => {
            const field = this.fields.find(({ name }) => name === key)
            if (!field) {
                throw Error(`Field ${key} not exist in model`)
            }

            const validValue = this.checkField(value, field)

            if (!validValue) {
                unsetData[key] = 1
            } else {
                setData[key] = value
            }
        })

        return updateOne(
            this._db,
            this._collectionName(),
            { _id: this._id },
            {
                $set: setData,
                $unset: unsetData,
            }
        ).then((result) => {
            Object.keys(setData).forEach((key) => {
                this[key] = setData[key]
            })
            Object.keys(unsetData).forEach((key) => {
                this[key] = unsetData[key]
            })

            return result
        })
    }

    delete() {
        this._checkInit()
        this._checkDbObj()

        const field = this.fields.find(({ name }) => name === '_id')
                        || Field.objectidType()

        const _id = this.checkField(this._id, field)
        if (!_id) {
            throw Error(`_id ${_id} is invalid ObjectId`)
        }

        return deleteOne(this._db, this._collectionName(), { _id })
    }

    static _mapFieldToDoc(doc, docData) {
        if (!docData) return null

        doc.fields.forEach(({ name, type: field }) => {
            if (docData[name] !== undefined) {
                doc[name] = docData[name]
            } else {
                doc[name] = field.defaultValue
            }
        })
        return doc
    }

    static findById(_id) {
        const doc = new this()
        return findOne(
            doc._db,
            doc._collectionName(),
            { _id: new ObjectId(_id) },
        ).then((docData) => {
            if (!docData) return null
            return this._mapFieldToDoc(doc, docData)
        })
    }

    static findOne(query) {
        const doc = new this()
        return findOne(doc._db, doc._collectionName(), query).then((docData) => {
            if (!docData) return null
            return this._mapFieldToDoc(doc, docData)
        })
    }

    static find(query) {
        const _doc = new this()
        return find(_doc._db, _doc._collectionName(), query).then((docDatas) => {
            return docDatas.map((docData) => {
                const doc = new this()
                return this._mapFieldToDoc(doc, docData)
            })
        })
    }

    static updateOne(query, update) {
        const _doc = new this()
        return updateOne(
            _doc._db,
            _doc._collectionName(),
            query,
            update,
        )
    }

    static updateMany(query, update) {
        const _doc = new this()
        return updateMany(_doc._db, _doc._collectionName(), query, update)
    }

    static deleteOne(query) {
        const _doc = new this()
        return deleteOne(_doc._db, _doc._collectionName(), query)
    }

    static deleteMany(query) {
        const _doc = new this()
        return deleteMany(_doc._db, _doc._collectionName(), query)
    }

    static insertMany(docs) {
        const _doc = new this()

        const insertDocs = docs.map((doc) => {
            if (doc._id) {
                throw Error(`Document already have _id: ${doc._id}`)
            }

            const docData = {}
            doc.fields.forEach(({ name, type: field}) => {
                const validValue = doc.checkField(doc[name], field)
                if (validValue) {
                    docData[name] = validValue
                }
            })

            return docData
        })

        return insertMany(
            _doc._db,
            _doc._collectionName(),
            insertDocs,
        ).then((result) => {
            Object.entries(result.insertedIds).forEach(([index, _id]) => {
                docs[index]._id = _id
            })

            return docs
        })
    }

    static aggregate(pipeline) {
        // TODO: implement
    }
}

module.exports = {
    Model,
}
